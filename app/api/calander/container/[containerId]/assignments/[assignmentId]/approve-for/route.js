import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/session";
import { addCommit } from "@/lib/commits";

export const runtime = "nodejs";

function isDateKey(s) {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}
function ymdLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function ensureContainerByDate({ db, session, date, mode }) {
  const key = { date, mode };
  const now = new Date();

  await db.collection("calendarContainers").updateOne(
    key,
    {
      $setOnInsert: {
        date,
        mode,
        limit: 20,
        createdByUserId: session.userId,
        createdAt: now,
      },
      $set: { updatedAt: now },
    },
    { upsert: true }
  );

  return db.collection("calendarContainers").findOne(key);
}

async function countReservedForContainerExcluding(db, dikshaContainerId, excludeAssignmentIds) {
  return db.collection("calendarAssignments").countDocuments({
    occupiedContainerId: dikshaContainerId,
    meetingDecision: "PENDING",
    status: "IN_CONTAINER",
    _id: { $nin: excludeAssignmentIds || [] },
  });
}

export async function POST(req, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { containerId, assignmentId } = await params;
  const body = await req.json().catch(() => ({}));
  const { toDate, toMode, note, commitMessage, occupyDate } = body || {};

  if (!commitMessage) return NextResponse.json({ error: "Commit required" }, { status: 400 });
  if (!isDateKey(toDate)) return NextResponse.json({ error: "Invalid toDate (YYYY-MM-DD)" }, { status: 400 });
  if (!["DIKSHA", "MEETING"].includes(toMode)) return NextResponse.json({ error: "Invalid toMode" }, { status: 400 });

  // ✅ If shifting to MEETING => occupyDate REQUIRED (same flow as calendar meeting push)
  if (toMode === "MEETING") {
    if (!isDateKey(occupyDate)) return NextResponse.json({ error: "OCCUPY_REQUIRED" }, { status: 400 });

    const todayKey = ymdLocal(new Date());
    if (occupyDate <= todayKey) {
      return NextResponse.json({ error: "occupyDate must be future date" }, { status: 400 });
    }
  }

  const db = await getDb();
  const fromContainerId = new ObjectId(containerId);
  const asgId = new ObjectId(assignmentId);
  const now = new Date();
  const actorLabel = `${session.role}:${session.username}`;

  const fromContainer = await db.collection("calendarContainers").findOne({ _id: fromContainerId });
  if (!fromContainer) return NextResponse.json({ error: "Container not found" }, { status: 404 });

  if (fromContainer.mode !== "MEETING") {
    return NextResponse.json({ error: "Approve-For only valid from MEETING container" }, { status: 400 });
  }

  const base = await db.collection("calendarAssignments").findOne({
    _id: asgId,
    containerId: fromContainerId,
    status: "IN_CONTAINER",
  });
  if (!base) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });

  const isGroup = (base.kind === "COUPLE" || base.kind === "FAMILY") && base.pairId;
  const group = isGroup
    ? await db.collection("calendarAssignments").find({
        containerId: fromContainerId,
        status: "IN_CONTAINER",
        pairId: base.pairId,
      }).toArray()
    : [base];

  const groupAssignmentIds = group.map((x) => x._id);
  const groupCustomerIds = group.map((x) => x.customerId);

  // ✅ If shifting to DIKSHA => eligible test
  if (toMode === "DIKSHA") {
    const bad = await db.collection("sittingCustomers").find({
      _id: { $in: groupCustomerIds },
      dikshaEligible: { $ne: true },
    }).project({ name: 1 }).toArray();

    if (bad.length) {
      return NextResponse.json(
        { error: "NOT_ELIGIBLE_FOR_DIKSHA", names: bad.map((x) => x?.name || "—") },
        { status: 409 }
      );
    }
  }

  // ensure target container exists
  const targetContainer = await ensureContainerByDate({ db, session, date: toDate, mode: toMode });
  if (!targetContainer?._id) return NextResponse.json({ error: "Target container create failed" }, { status: 500 });
  const targetId = targetContainer._id;

  // capacity check for target container
  const inCount = await db.collection("calendarAssignments").countDocuments({
    containerId: targetId,
    status: "IN_CONTAINER",
  });

  let reservedCount = 0;
  if (targetContainer.mode === "DIKSHA") {
    reservedCount = await countReservedForContainerExcluding(db, targetId, groupAssignmentIds);
  }

  const used = inCount + reservedCount;
  const limit = targetContainer.limit || 20;

  if (used + group.length > limit) {
    return NextResponse.json({ error: "HOUSEFULL" }, { status: 409 });
  }

  // ✅ If shifting to MEETING, we also need to reserve DIKSHA capacity for occupyDate
  let occupiedContainerId = null;
  let occupiedDateFinal = null;
  let occupiedMode = null;
  let meetingDecision = null;

  if (toMode === "MEETING") {
    const dikshaContainer = await ensureContainerByDate({ db, session, date: occupyDate, mode: "DIKSHA" });
    if (!dikshaContainer?._id) return NextResponse.json({ error: "Diksha container create failed" }, { status: 500 });

    const dikshaIn = await db.collection("calendarAssignments").countDocuments({
      containerId: dikshaContainer._id,
      status: "IN_CONTAINER",
    });

    const dikshaReserved = await countReservedForContainerExcluding(db, dikshaContainer._id, groupAssignmentIds);
    const dikshaUsed = dikshaIn + dikshaReserved;

    if (dikshaUsed + group.length > (dikshaContainer.limit || 20)) {
      return NextResponse.json({ error: "HOUSEFULL" }, { status: 409 });
    }

    occupiedContainerId = dikshaContainer._id;
    occupiedDateFinal = occupyDate;
    occupiedMode = "DIKSHA";
    meetingDecision = "PENDING";
  }

  // move assignments (same docs) to target container
  await db.collection("calendarAssignments").updateMany(
    { _id: { $in: groupAssignmentIds } },
    {
      $set: {
        containerId: targetId,
        updatedAt: now,
        note: String(note || base.note || "").trim(),

        // occupy fields depend on toMode
        occupiedMode,
        occupiedDate: occupiedDateFinal,
        occupiedContainerId,

        // meetingDecision:
        // - toMode=MEETING => PENDING (reserved)
        // - toMode=DIKSHA => APPROVED_FOR (no reservation)
        meetingDecision: toMode === "MEETING" ? "PENDING" : "APPROVED_FOR",

        approvedForDate: toDate,
        approvedForMode: toMode,
        approvedForAt: now,
        approvedForByUserId: session.userId,
      },
    }
  );

  await db.collection("sittingCustomers").updateMany(
    { _id: { $in: groupCustomerIds } },
    { $set: { activeContainerId: targetId, status: "IN_EVENT" } }
  );

  for (const cid of groupCustomerIds) {
    await addCommit({
      customerId: cid,
      userId: session.userId,
      actorLabel,
      message: commitMessage,
      action: "MEETING_APPROVE_FOR_SHIFT",
      meta: {
        fromMeetingContainerId: String(fromContainerId),
        toContainerId: String(targetId),
        toDate,
        toMode,
        occupyDate: toMode === "MEETING" ? occupyDate : null,
        kind: base.kind,
        pairId: base.pairId ? String(base.pairId) : null,
        groupSize: group.length,
      },
    });
  }

  return NextResponse.json({ ok: true, moved: group.length, toContainerId: String(targetId) });
}
