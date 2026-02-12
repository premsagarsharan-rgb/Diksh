import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/session";
import { addCommit } from "@/lib/commits";

export const runtime = "nodejs";

function isUnlockedNow(container, now) {
  if (!container?.unlockExpiresAt) return false;
  const t = new Date(container.unlockExpiresAt).getTime();
  return Number.isFinite(t) && t > now.getTime();
}

async function countReservedForContainer(db, dikshaContainerId) {
  return db.collection("calendarAssignments").countDocuments({
    occupiedContainerId: dikshaContainerId,
    meetingDecision: "PENDING",
    status: "IN_CONTAINER",
  });
}

export async function POST(req, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { containerId, assignmentId } = await params;
  const body = await req.json().catch(() => ({}));
  const { commitMessage } = body || {};
  if (!commitMessage) return NextResponse.json({ error: "Commit required" }, { status: 400 });

  const db = await getDb();
  const ctnId = new ObjectId(containerId);
  const asgId = new ObjectId(assignmentId);
  const now = new Date();
  const actorLabel = `${session.role}:${session.username}`;

  const container = await db.collection("calendarContainers").findOne({ _id: ctnId });
  if (!container) return NextResponse.json({ error: "Container not found" }, { status: 404 });

  // Done only meaningful in DIKSHA container
  if (container.mode !== "DIKSHA") {
    return NextResponse.json({ error: "DONE_ONLY_FOR_DIKSHA" }, { status: 400 });
  }

  // ✅ SERVER-SIDE LOCK ENFORCE (DIKSHA uses reserved+in)
  const inCount = await db.collection("calendarAssignments").countDocuments({
    containerId: ctnId,
    status: "IN_CONTAINER",
  });
  const reservedCount = await countReservedForContainer(db, ctnId);
  const used = inCount + reservedCount;
  const limit = container.limit || 20;

  if (used >= limit && !isUnlockedNow(container, now)) {
    return NextResponse.json(
      { error: "CONTAINER_LOCKED", message: `Container is locked at ${used}/${limit}. Admin must unlock to mark Done.` },
      { status: 423 }
    );
  }

  const base = await db.collection("calendarAssignments").findOne({
    _id: asgId,
    containerId: ctnId,
    status: "IN_CONTAINER",
  });
  if (!base) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });

  // group handling
  const isGroup = (base.kind === "COUPLE" || base.kind === "FAMILY") && base.pairId;
  const group = isGroup
    ? await db.collection("calendarAssignments").find({
        containerId: ctnId,
        status: "IN_CONTAINER",
        pairId: base.pairId,
      }).toArray()
    : [base];

  // already qualified?
  if (group.some((g) => g?.cardStatus === "QUALIFIED")) {
    return NextResponse.json({ ok: true, already: true });
  }

  const ids = group.map((x) => x._id);
  const custIds = group.map((x) => x.customerId);

  // lock card(s)
  await db.collection("calendarAssignments").updateMany(
    { _id: { $in: ids } },
    {
      $set: {
        cardStatus: "QUALIFIED",
        qualifiedAt: now,
        qualifiedByUserId: session.userId,
        updatedAt: now,
      },
    }
  );

  // optional: mark customer as qualified (safe flag)
  await db.collection("sittingCustomers").updateMany(
    { _id: { $in: custIds } },
    { $set: { dikshaQualified: true, dikshaQualifiedAt: now } }
  );

  for (const cid of custIds) {
    await addCommit({
      customerId: cid,
      userId: session.userId,
      actorLabel,
      message: commitMessage,
      action: "DIKSHA_DONE_QUALIFIED",
      meta: {
        containerId: String(ctnId),
        assignmentId: String(asgId),
        kind: base.kind,
        pairId: base.pairId ? String(base.pairId) : null,
      },
    });
  }

  return NextResponse.json({ ok: true, qualified: custIds.length });
}
