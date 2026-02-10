import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/session";
import { addCommit } from "@/lib/commits";
import { buildWhatsAppTo, sendWhatsAppText } from "@/lib/whatsappTwilio";

export const runtime = "nodejs";

async function unwrapParams(params) {
  // Next.js: params may be a Promise
  if (params && typeof params.then === "function") return await params;
  return params || {};
}

function cleanStr(x) {
  return String(x ?? "").trim();
}
function cleanDigits(x) {
  return String(x ?? "").replace(/\D/g, "");
}
function cleanUpper(x) {
  return String(x ?? "").trim().toUpperCase();
}

export async function POST(req, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const p = await unwrapParams(params);
  const id = p?.id;

  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const { updates, commitMessage } = body || {};

  if (!commitMessage) return NextResponse.json({ error: "Commit required" }, { status: 400 });

  const db = await getDb();
  const _id = new ObjectId(id);
  const now = new Date();

  const today = await db.collection("todayCustomers").findOne({ _id });
  if (!today) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Prevent double-finalize
  const already = await db.collection("sittingCustomers").findOne({ _id });
  if (already) {
    return NextResponse.json({ error: "ALREADY_FINALIZED" }, { status: 409 });
  }

  // Merge updates (final form data)
  const merged = { ...today, ...(updates || {}) };

  // Protect roll fields
  merged.rollNo = today.rollNo;
  merged.rollSeq = today.rollSeq;

  // basic sanitize
  merged.name = cleanStr(merged.name);
  merged.age = cleanStr(merged.age);
  merged.address = cleanStr(merged.address);
  merged.pincode = cleanStr(merged.pincode);

  merged.country = cleanStr(merged.country);
  merged.state = cleanStr(merged.state);
  merged.city = cleanStr(merged.city);

  // 2nd form sanitize
  merged.guardianRelation = cleanStr(merged.guardianRelation);
  merged.guardianName = cleanStr(merged.guardianName);

  merged.phoneCountryCode = cleanStr(merged.phoneCountryCode || "+91");
  merged.phoneNumber = cleanDigits(merged.phoneNumber);

  merged.whatsappCountryCode = cleanStr(merged.whatsappCountryCode || "+91");
  merged.whatsappNumber = cleanDigits(merged.whatsappNumber);

  merged.idType = cleanStr(merged.idType || "aadhaar").toLowerCase();
  if (!["aadhaar", "passport", "other"].includes(merged.idType)) merged.idType = "aadhaar";

  merged.idTypeName = cleanStr(merged.idTypeName);
  merged.idValue = merged.idType === "passport" ? cleanUpper(merged.idValue) : cleanStr(merged.idValue);

  if (merged.idType === "other" && !merged.idTypeName) merged.idTypeName = "OTHER";

  // =========================
  // ✅ WhatsApp send (Option 2): fail finalize if WA fails
  // + Idempotency: if already sent earlier, don't resend on retry
  // =========================
  const waTo = buildWhatsAppTo(merged);
  if (!waTo) {
    return NextResponse.json({ error: "WHATSAPP_NUMBER_INVALID" }, { status: 400 });
  }

  const waBody = "Hello happy";

  let waSid = today?.whatsappWelcomeSid || null;
  let waSentAt = today?.whatsappWelcomeSentAt || null;

  if (!waSid) {
    try {
      const r = await sendWhatsAppText({ to: waTo, body: waBody });
      waSid = r.sid;
      waSentAt = now;

      // Save on TODAY first so retry doesn't spam WhatsApp
      await db.collection("todayCustomers").updateOne(
        { _id },
        {
          $set: {
            whatsappWelcomeSid: waSid,
            whatsappWelcomeSentAt: waSentAt,
            whatsappWelcomeTo: waTo,
            whatsappWelcomeBody: waBody,
            whatsappWelcomeByUserId: session.userId,
          },
        }
      );
    } catch (e) {
      return NextResponse.json(
        { error: "WHATSAPP_SEND_FAILED", detail: String(e?.message || e) },
        { status: 502 }
      );
    }
  }

  // =========================
  // ✅ Move to sitting
  // =========================
  try {
    await db.collection("sittingCustomers").insertOne({
      ...merged,
      _id,

      status: "ACTIVE",
      activeContainerId: null,
      verifiedByUserId: session.userId,
      verifiedAt: now,
      finalizedAt: now,

      whatsappWelcomeSid: waSid,
      whatsappWelcomeSentAt: waSentAt,
      whatsappWelcomeTo: waTo,
      whatsappWelcomeBody: waBody,
    });
  } catch {
    // WhatsApp already sent; keep WA SID in todayCustomers for safe retry
    return NextResponse.json({ error: "SITTING_INSERT_FAILED" }, { status: 500 });
  }

  await db.collection("todayCustomers").deleteOne({ _id });

  const actorLabel = `${session.role}:${session.username}`;

  await addCommit({
    customerId: _id,
    userId: session.userId,
    actorLabel,
    message: commitMessage,
    action: "FINALIZE_TO_SITTING",
    meta: {
      rollNo: merged.rollNo || null,
      rollSeq: merged.rollSeq || null,
      whatsappWelcomeSid: waSid || null,
      whatsappWelcomeTo: waTo,
    },
  });

  return NextResponse.json({
    ok: true,
    rollNo: merged.rollNo || null,
    whatsappSid: waSid || null,
  });
}
