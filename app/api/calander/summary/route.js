// app/api/calander/summary/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(req) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const mode = searchParams.get("mode");

  if (!from || !to || !mode) {
    return NextResponse.json({ error: "Missing from/to/mode" }, { status: 400 });
  }

  const db = await getDb();

  const pipeline = [
    { $match: { date: { $gte: from, $lte: to }, mode } },

    // Count IN_CONTAINER genders (actual assignments inside this container)
    {
      $lookup: {
        from: "calendarAssignments",
        let: { cid: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ["$containerId", "$$cid"] }, { $eq: ["$status", "IN_CONTAINER"] }],
              },
            },
          },
          {
            $lookup: {
              from: "sittingCustomers",
              localField: "customerId",
              foreignField: "_id",
              as: "cust",
            },
          },
          // preserve if customer missing (avoid dropping assignment)
          { $unwind: { path: "$cust", preserveNullAndEmptyArrays: true } },
          { $project: { gender: { $ifNull: ["$cust.gender", "OTHER"] } } },
        ],
        as: "genders",
      },
    },
  ];

  // ✅ Only for DIKSHA: reserved/occupied holds from MEETING containers
  if (mode === "DIKSHA") {
    pipeline.push({
      $lookup: {
        from: "calendarAssignments",
        let: { cid: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$occupiedContainerId", "$$cid"] },
                  { $eq: ["$meetingDecision", "PENDING"] },
                  { $eq: ["$status", "IN_CONTAINER"] },
                ],
              },
            },
          },
          { $count: "count" },
        ],
        as: "reservedCount",
      },
    });
  }

  // ✅ Only for MEETING: history count
  if (mode === "MEETING") {
    pipeline.push({
      $lookup: {
        from: "calendarAssignmentHistory",
        let: { cid: "$_id" },
        pipeline: [{ $match: { $expr: { $eq: ["$containerId", "$$cid"] } } }, { $count: "count" }],
        as: "historyCount",
      },
    });
  }

  // ✅ Final project (IMPORTANT: use $literal:0 to avoid exclusion projection error)
  pipeline.push({
    $project: {
      date: 1,
      mode: 1,
      genders: 1,

      reserved:
        mode === "DIKSHA"
          ? { $ifNull: [{ $arrayElemAt: ["$reservedCount.count", 0] }, 0] }
          : { $literal: 0 },

      history:
        mode === "MEETING"
          ? { $ifNull: [{ $arrayElemAt: ["$historyCount.count", 0] }, 0] }
          : { $literal: 0 },
    },
  });

  const rows = await db.collection("calendarContainers").aggregate(pipeline).toArray();

  const map = {};
  for (const r of rows) {
    const male = (r.genders || []).filter((x) => x?.gender === "MALE").length;
    const female = (r.genders || []).filter((x) => x?.gender === "FEMALE").length;
    const other = Math.max(0, (r.genders || []).length - male - female);

    const total = male + female + other;

    map[r.date] = {
      total,
      male,
      female,
      other,
      history: r.history || 0,
      reserved: r.reserved || 0,
    };
  }

  return NextResponse.json({ map });
}
