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

  if (!from || !to || !mode) return NextResponse.json({ error: "Missing from/to/mode" }, { status: 400 });

  const db = await getDb();

  const rows = await db.collection("calendarContainers").aggregate([
    { $match: { date: { $gte: from, $lte: to }, mode } },
    {
      $lookup: {
        from: "calendarAssignments",
        let: { cid: "$_id" },
        pipeline: [
          { $match: { $expr: { $and: [{ $eq: ["$containerId", "$$cid"] }, { $eq: ["$status", "IN_CONTAINER"] }] } } },
          {
            $lookup: {
              from: "sittingCustomers",
              localField: "customerId",
              foreignField: "_id",
              as: "cust",
            }
          },
          { $unwind: "$cust" },
          {
            $project: {
              gender: "$cust.gender",
            }
          }
        ],
        as: "genders"
      }
    },
    // ✅ TASK 2: Also count history records for MEETING containers
    {
      $lookup: {
        from: "calendarAssignmentHistory",
        let: { cid: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$containerId", "$$cid"] } } },
          { $count: "count" },
        ],
        as: "historyCount"
      }
    },
    {
      $project: {
        date: 1,
        mode: 1,
        genders: 1,
        historyCount: { $ifNull: [{ $arrayElemAt: ["$historyCount.count", 0] }, 0] },
      }
    }
  ]).toArray();

  const map = {};
  for (const r of rows) {
    const male = r.genders.filter(x => x.gender === "MALE").length;
    const female = r.genders.filter(x => x.gender === "FEMALE").length;
    const other = r.genders.filter(x => x.gender === "OTHER").length;
    const total = male + female + other;
    map[r.date] = {
      total, male, female, other,
      // ✅ History count for meeting containers
      history: r.historyCount || 0,
    };
  }

  return NextResponse.json({ map });
}
