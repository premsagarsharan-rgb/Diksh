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
  const commitMessage = body?.commitMessage;

  if (!commitMessage) return NextResponse.json({ error: "Commit required" }, { status: 400 });

  const db = await getDb();
  const ctnIdFromUrl = containerId ? new ObjectId(containerId) : null;
  const aId = new ObjectId(assignmentId);
  const now = new Date();
  const actorLabel = `${session.role}:${session.username}`;

  const assignment = await db.collection("calendarAssignments").findOne({ _id: aId });
  if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Strong consistency: if containerId is passed, enforce match
  if (ctnIdFromUrl && String(assignment.containerId) !== String(ctnIdFromUrl)) {
    return NextResponse.json({ error: "CONTAINER_MISMATCH" }, { status: 400 });
  }

  const container = await db.collection("calendarContainers").findOne({ _id: assignment.containerId });
  if (!container) return NextResponse.json({ error: "Container not found" }, { status: 404 });

  // ✅ SERVER-SIDE LOCK ENFORCE (MEETING & DIKSHA)
  const inCount = await db.collection("calendarAssignments").countDocuments({
    containerId: assignment.containerId,
    status: "IN_CONTAINER",
  });

  let used = inCount;
  const limit = container.limit || 20;

  if (container.mode === "DIKSHA") {
    const reservedCount = await countReservedForContainer(db, assignment.containerId);
    used = inCount + reservedCount;
  }

  if (used >= limit && !isUnlockedNow(container, now)) {
    return NextResponse.json(
      { error: "CONTAINER_LOCKED", message: `Container is locked at ${used}/${limit}. Admin must unlock to OUT.` },
      { status: 423 }
    );
  }

  // ✅ LOCK: If card already QUALIFIED (Done), block OUT
  if (assignment.cardStatus === "QUALIFIED") {
    return NextResponse.json({ error: "LOCKED_QUALIFIED" }, { status: 409 });
  }

  // GROUP OUT: COUPLE or FAMILY (pairId based)
  if ((assignment.kind === "COUPLE" || assignment.kind === "FAMILY") && assignment.pairId) {
    const pairId = assignment.pairId;

    const groupAssignments = await db.collection("calendarAssignments")
      .find({ pairId, status: "IN_CONTAINER" })
      .toArray();

    // ✅ LOCK group if ANY member qualified
    if (groupAssignments.some((g) => g?.cardStatus === "QUALIFIED")) {
      return NextResponse.json({ error: "LOCKED_QUALIFIED" }, { status: 409 });
    }

    const custIds = groupAssignments.map((x) => x.customerId);

    await db.collection("calendarAssignments").updateMany(
      { pairId, status: "IN_CONTAINER" },
      { $set: { status: "OUT", updatedAt: now } }
    );

    await db.collection("sittingCustomers").updateMany(
      { _id: { $in: custIds } },
      { $set: { status: "ACTIVE", activeContainerId: null } }
    );

    const action = assignment.kind === "FAMILY" ? "OUT_FAMILY" : "OUT_COUPLE";
    const meta = {
      pairId: String(pairId),
      containerId: String(assignment.containerId),
      count: custIds.length,
      kind: assignment.kind,
    };

    for (const cid of custIds) {
      await addCommit({
        customerId: cid,
        userId: session.userId,
        actorLabel,
        message: commitMessage,
        action,
        meta,
      });
    }

    return NextResponse.json({ ok: true, kind: assignment.kind });
  }

  // SINGLE
  const fresh = await db.collection("calendarAssignments").findOne({ _id: aId });
  if (fresh?.cardStatus === "QUALIFIED") {
    return NextResponse.json({ error: "LOCKED_QUALIFIED" }, { status: 409 });
  }

  await db.collection("calendarAssignments").updateOne(
    { _id: aId, status: "IN_CONTAINER" },
    { $set: { status: "OUT", updatedAt: now } }
  );

  await db.collection("sittingCustomers").updateOne(
    { _id: assignment.customerId },
    { $set: { status: "ACTIVE", activeContainerId: null } }
  );

  await addCommit({
    customerId: assignment.customerId,
    userId: session.userId,
    actorLabel,
    message: commitMessage,
    action: "OUT_SINGLE",
    meta: { containerId: String(assignment.containerId), mode: container.mode },
  });

  return NextResponse.json({ ok: true, kind: "SINGLE" });
}
