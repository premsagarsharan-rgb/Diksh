import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/session";
import { addCommit } from "@/lib/commits";

export const runtime = "nodejs";

async function unwrapParams(params) {
  // Next.js 16: params may be a Promise
  if (params && typeof params.then === "function") return await params;
  return params || {};
}

export async function GET(req, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const p = await unwrapParams(params);
  const id = p?.id;

  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const db = await getDb();
  const _id = new ObjectId(id);

  const customer = await db.collection("todayCustomers").findOne({ _id });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true, customer });
}

export async function PATCH(req, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const p = await unwrapParams(params);
  const id = p?.id;

  const body = await req.json().catch(() => ({}));
  const commitMessage = body?.commitMessage;

  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  if (!commitMessage) return NextResponse.json({ error: "Commit required" }, { status: 400 });

  const allowed = [
    "name",
    "age",
    "address",
    "followYears",
    "clubVisitsBefore",
    "monthYear",
    "onionGarlic",
    "hasPet",
    "hadTeacherBefore",
    "familyPermission",
    "gender",
    "country",
    "state",
    "city",
    "pincode",

    // 2nd form fields
    "guardianRelation",
    "guardianName",
    "phoneCountryCode",
    "phoneNumber",
    "whatsappCountryCode",
    "whatsappNumber",
    "idType",
    "idTypeName",
    "idValue",

    // (safe extras if present)
    "occupation",
    "note",
    "approver",
    "maritalStatus",
    "remarks",
    "remarksBy",
    "familyPermissionRelation",
    "familyPermissionOther",
    "dikshaYear",
    "vrindavanVisits",
    "firstDikshaYear",
    "nasha",
    // ...
     "idType",
     "idTypeName",
     "idValue",

+    "familyMemberName",
+    "familyMemberRelation",
+    "familyMemberRelationOther",
+    "familyMemberMobile",

     // ...
  ];

  const $set = { updatedAt: new Date() };
  for (const k of allowed) {
    if (body?.[k] !== undefined) {
      $set[k] = typeof body[k] === "string" ? body[k].trim() : body[k];
    }
  }

  if ($set.gender && !["MALE", "FEMALE", "OTHER"].includes($set.gender)) {
    return NextResponse.json({ error: "Invalid gender" }, { status: 400 });
  }

  const db = await getDb();
  const _id = new ObjectId(id);

  const r = await db.collection("todayCustomers").updateOne({ _id }, { $set });
  if (!r.matchedCount) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await addCommit({
    customerId: _id,
    userId: session.userId,
    message: commitMessage,
    action: "EDIT_PROFILE",
    meta: { fields: Object.keys($set).filter((k) => k !== "updatedAt") },
  });

  return NextResponse.json({ ok: true });
}
