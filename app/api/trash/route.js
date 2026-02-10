// app/api/trash/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();

  const items = await db
    .collection("calendarAssignments")
    .aggregate([
      {
        $match: {
          status: "REJECTED",
          cardStatus: "REJECTED",
        },
      },
      { $sort: { trashedAt: -1, rejectedAt: -1 } },
      {
        $lookup: {
          from: "sittingCustomers",
          localField: "customerId",
          foreignField: "_id",
          as: "customerData",
        },
      },
      {
        $lookup: {
          from: "calendarContainers",
          localField: "containerId",
          foreignField: "_id",
          as: "containerData",
        },
      },
      {
        $addFields: {
          customer: { $arrayElemAt: ["$customerData", 0] },
          container: { $arrayElemAt: ["$containerData", 0] },
        },
      },
      {
        $project: {
          customerData: 0,
          containerData: 0,
        },
      },
    ])
    .toArray();

  return NextResponse.json({ ok: true, items, count: items.length });
}
