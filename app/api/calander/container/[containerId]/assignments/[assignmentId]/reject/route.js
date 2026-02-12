// app/api/calander/container/[containerId]/assignments/[assignmentId]/reject/route.js
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

export async function POST(req, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { containerId, assignmentId } = await params;
  const body = await req.json().catch(() => ({}));
  const { commitMessage, rejectAction } = body || {};
  if (!commitMessage) return NextResponse.json({ error: "Commit required" }, { status: 400 });

  // rejectAction must be "TRASH" or "PUSH_PENDING"
  const action = rejectAction === "TRASH" ? "TRASH" : "PUSH_PENDING";

  const db = await getDb();
  const ctnId = new ObjectId(containerId);
  const asgId = new ObjectId(assignmentId);
  const now = new Date();
  const actorLabel = `${session.role}:${session.username}`;

  const container = await db.collection("calendarContainers").findOne({ _id: ctnId });
  if (!container) return NextResponse.json({ error: "Container not found" }, { status: 404 });
  if (container.mode !== "MEETING") return NextResponse.json({ error: "Reject only valid for MEETING" }, { status: 400 });

  // ✅ SERVER-SIDE LOCK ENFORCE (MEETING)
  const inCount = await db.collection("calendarAssignments").countDocuments({
    containerId: ctnId,
    status: "IN_CONTAINER",
  });
  const limit = container.limit || 20;
  if (inCount >= limit && !isUnlockedNow(container, now)) {
    return NextResponse.json(
      { error: "CONTAINER_LOCKED", message: `Container is locked at ${inCount}/${limit}. Admin must unlock to reject.` },
      { status: 423 }
    );
  }

  const base = await db.collection("calendarAssignments").findOne({
    _id: asgId,
    containerId: ctnId,
    status: "IN_CONTAINER",
  });
  if (!base) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });

  const isGroup = (base.kind === "COUPLE" || base.kind === "FAMILY") && base.pairId;
  const group = isGroup
    ? await db.collection("calendarAssignments")
        .find({ containerId: ctnId, status: "IN_CONTAINER", pairId: base.pairId })
        .toArray()
    : [base];

  const ids = group.map((x) => x._id);
  const custIds = group.map((x) => x.customerId);

  // ───────────────────────────────────────────────
  // ACTION: TRASH — card stays in assignments with REJECTED status
  // ───────────────────────────────────────────────
  if (action === "TRASH") {
    await db.collection("calendarAssignments").updateMany(
      { _id: { $in: ids } },
      {
        $set: {
          status: "REJECTED",
          cardStatus: "REJECTED",
          updatedAt: now,
          meetingDecision: "REJECTED",
          rejectedAt: now,
          rejectedByUserId: session.userId,
          rejectAction: "TRASH",
          trashedAt: now,
          trashedByUserId: session.userId,
        },
      }
    );

    for (const cid of custIds) {
      await addCommit({
        customerId: cid,
        userId: session.userId,
        actorLabel,
        message: commitMessage,
        action: "MEETING_REJECT_TO_TRASH",
        meta: {
          fromMeetingContainerId: String(ctnId),
          containerDate: container.date || null,
          kind: base.kind,
          pairId: base.pairId ? String(base.pairId) : null,
          cardStatus: "REJECTED",
        },
      });
    }

    return NextResponse.json({ ok: true, trashed: custIds.length, action: "TRASH" });
  }

  // ───────────────────────────────────────────────
  // ACTION: PUSH_PENDING — original flow (unchanged)
  // ───────────────────────────────────────────────
  const customers = await db.collection("sittingCustomers").find({ _id: { $in: custIds } }).toArray();
  if (customers.length !== custIds.length) {
    return NextResponse.json({ error: "Some customers missing in sittingCustomers" }, { status: 409 });
  }

  const pendingDocs = customers.map((c) => ({
    ...c,
    _id: c._id,
    status: "ELIGIBLE",
    dikshaEligible: true,
    dikshaEligibleAt: now,
    dikshaEligibleSource: "MEETING_REJECT",
    activeContainerId: null,
    pausedAt: now,
    pausedByUserId: session.userId,
    pausedFromContainerId: ctnId,
    updatedAt: now,
  }));

  try {
    await db.collection("pendingCustomers").insertMany(pendingDocs, { ordered: true });
  } catch (e) {
    if (String(e?.code) === "11000") {
      return NextResponse.json({ error: "One customer already exists in pendingCustomers" }, { status: 409 });
    }
    return NextResponse.json({ error: "Push to pending failed" }, { status: 500 });
  }

  await db.collection("sittingCustomers").deleteMany({ _id: { $in: custIds } });

  await db.collection("calendarAssignments").updateMany(
    { _id: { $in: ids } },
    {
      $set: {
        status: "OUT",
        updatedAt: now,
        meetingDecision: "REJECTED",
        rejectedAt: now,
        rejectedByUserId: session.userId,
        rejectAction: "PUSH_PENDING",
        pushedToPendingAt: now,
        pushedToPendingByUserId: session.userId,
      },
    }
  );

  for (const cid of custIds) {
    await addCommit({
      customerId: cid,
      userId: session.userId,
      actorLabel,
      message: commitMessage,
      action: "MEETING_REJECT_TO_PENDING",
      meta: {
        fromMeetingContainerId: String(ctnId),
        kind: base.kind,
        pairId: base.pairId ? String(base.pairId) : null,
        pendingStatus: "ELIGIBLE",
        dikshaEligible: true,
      },
    });
  }

  return NextResponse.json({ ok: true, movedToPending: custIds.length, action: "PUSH_PENDING" });
}
