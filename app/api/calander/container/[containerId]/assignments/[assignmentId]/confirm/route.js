// app/api/calander/container/[containerId]/assignments/[assignmentId]/confirm/route.js
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/session";
import { addCommit } from "@/lib/commits";
import { buildWhatsAppTo, sendWhatsAppText } from "@/lib/whatsappTwilio";

export const runtime = "nodejs";

function normalizeWhatsAppTo(raw) {
  const s = String(raw || "").trim();
  if (!s) return null;

  if (s.startsWith("whatsapp:")) {
    const tail = s.slice("whatsapp:".length).trim();
    if (!tail.startsWith("+")) return null;
    return `whatsapp:${tail.replace(/\s+/g, "")}`;
  }

  if (s.startsWith("+")) return `whatsapp:${s.replace(/\s+/g, "")}`;

  const digits = s.replace(/[^\d]/g, "");
  if (!digits) return null;
  return `whatsapp:+${digits}`;
}

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
  const { commitMessage } = body || {};
  if (!commitMessage) return NextResponse.json({ error: "Commit required" }, { status: 400 });

  const db = await getDb();
  const ctnId = new ObjectId(containerId);
  const asgId = new ObjectId(assignmentId);
  const now = new Date();
  const actorLabel = `${session.role}:${session.username}`;

  const container = await db.collection("calendarContainers").findOne({ _id: ctnId });
  if (!container) return NextResponse.json({ error: "Container not found" }, { status: 404 });
  if (container.mode !== "MEETING") return NextResponse.json({ error: "Confirm only valid for MEETING" }, { status: 400 });

  // ✅ SERVER-SIDE LOCK ENFORCE (Meeting container full => locked unless unlocked)
  const inCount = await db.collection("calendarAssignments").countDocuments({
    containerId: ctnId,
    status: "IN_CONTAINER",
  });
  const limit = container.limit || 20;
  const unlocked = isUnlockedNow(container, now);
  if (inCount >= limit && !unlocked) {
    return NextResponse.json(
      { error: "CONTAINER_LOCKED", message: `Container is locked at ${inCount}/${limit}. Admin must unlock to perform actions.` },
      { status: 423 }
    );
  }

  const base = await db.collection("calendarAssignments").findOne({
    _id: asgId,
    containerId: ctnId,
    status: "IN_CONTAINER",
  });
  if (!base) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });

  const bypassFlag = base?.bypass === true || base?.meetingDecision === "BYPASS";

  const isGroup = (base.kind === "COUPLE" || base.kind === "FAMILY") && base.pairId;
  const group = isGroup
    ? await db.collection("calendarAssignments").find({
        containerId: ctnId,
        status: "IN_CONTAINER",
        pairId: base.pairId,
      }).toArray()
    : [base];

  const ids = group.map((x) => x._id);
  const custIds = group.map((x) => x.customerId);

  // ✅ LOCK to prevent double confirm / duplicate processing
  const expectedDecision = bypassFlag ? "BYPASS" : "PENDING";
  const lockRes = await db.collection("calendarAssignments").updateMany(
    { _id: { $in: ids }, containerId: ctnId, status: "IN_CONTAINER", meetingDecision: expectedDecision },
    { $set: { meetingDecision: "PROCESSING", processingAt: now, processingByUserId: session.userId, updatedAt: now } }
  );

  if (lockRes.modifiedCount !== ids.length && bypassFlag) {
    const lockRes2 = await db.collection("calendarAssignments").updateMany(
      { _id: { $in: ids }, containerId: ctnId, status: "IN_CONTAINER", meetingDecision: { $in: [null, undefined, "BYPASS"] } },
      { $set: { meetingDecision: "PROCESSING", processingAt: now, processingByUserId: session.userId, updatedAt: now } }
    );
    if (lockRes2.modifiedCount !== ids.length) {
      return NextResponse.json({ error: "Already processing / already confirmed" }, { status: 409 });
    }
  } else {
    if (lockRes.modifiedCount !== ids.length) {
      return NextResponse.json({ error: "Already processing / already confirmed" }, { status: 409 });
    }
  }

  // load customers
  const customers = await db.collection("sittingCustomers")
    .find({ _id: { $in: custIds } })
    .project({
      name: 1,
      rollNo: 1,
      whatsappWelcomeTo: 1,
      whatsappCountryCode: 1,
      whatsappNumber: 1,
      phoneCountryCode: 1,
      phoneNumber: 1,
      gender: 1,
      address: 1,
      age: 1,
    })
    .toArray();

  if (customers.length !== custIds.length) {
    await db.collection("calendarAssignments").updateMany(
      { _id: { $in: ids }, meetingDecision: "PROCESSING" },
      { $set: { meetingDecision: bypassFlag ? "BYPASS" : "PENDING", updatedAt: new Date() }, $unset: { processingAt: "", processingByUserId: "" } }
    );
    return NextResponse.json({ error: "Customer record missing" }, { status: 404 });
  }

  const customerById = new Map(customers.map((c) => [String(c._id), c]));

  /* ──────────────────────────────────────────────
     ✅ BYPASS BRANCH: Confirm → Pending (no whatsapp)
     ────────────────────────────────────────────── */
  if (bypassFlag) {
    try {
      // History snapshots
      const historyDocs = group.map((a) => {
        const cust = customerById.get(String(a.customerId));
        return {
          originalAssignmentId: a._id,
          containerId: ctnId,
          customerId: a.customerId,
          status: "BYPASS_TO_PENDING",

          customerSnapshot: {
            name: cust?.name || "",
            gender: cust?.gender || "OTHER",
            age: cust?.age || "",
            address: cust?.address || "",
            rollNo: cust?.rollNo || "",
          },

          kind: a.kind || "SINGLE",
          pairId: a.pairId || null,
          roleInPair: a.roleInPair || null,

          occupiedDate: null,
          occupiedContainerId: null,
          meetingDecision: "BYPASS_CONFIRMED",
          confirmedAt: now,
          confirmedByUserId: session.userId,
          confirmedByLabel: actorLabel,

          whatsappConfirmSid: null,
          whatsappConfirmTo: null,

          originalCreatedAt: a.createdAt,
          createdAt: now,
          updatedAt: now,
        };
      });

      if (historyDocs.length > 0) {
        await db.collection("calendarAssignmentHistory").insertMany(historyDocs);
      }

      // Move customers to pendingCustomers (ELIGIBLE)
      const pendingBulk = custIds.map((cid) => {
        const cust = customerById.get(String(cid)) || {};
        return {
          updateOne: {
            filter: { _id: cid },
            update: {
              $set: {
                ...cust,
                _id: cid,
                status: "ELIGIBLE",
                dikshaEligible: true,
                dikshaEligibleAt: now,
                activeContainerId: null,

                bypassedFromMeetingContainerId: ctnId,
                bypassedFromMeetingDate: container.date || null,
                bypassedAt: now,
                bypassedByUserId: session.userId,
                bypassedByLabel: actorLabel,

                updatedAt: now,
              },
            },
            upsert: true,
          },
        };
      });

      if (pendingBulk.length > 0) {
        await db.collection("pendingCustomers").bulkWrite(pendingBulk, { ordered: false });
      }

      // Remove from sittingCustomers
      await db.collection("sittingCustomers").deleteMany({ _id: { $in: custIds } });

      // Remove assignments from calendarAssignments
      await db.collection("calendarAssignments").deleteMany({ _id: { $in: ids } });

      for (const cid of custIds) {
        await addCommit({
          customerId: cid,
          userId: session.userId,
          actorLabel,
          message: commitMessage,
          action: "MEETING_CONFIRM_BYPASS_TO_PENDING",
          meta: {
            fromMeetingContainerId: String(ctnId),
            meetingDate: container.date || null,
            kind: base.kind,
            pairId: base.pairId ? String(base.pairId) : null,
            bypass: true,
            historyRecordCreated: true,
          },
        });
      }

      return NextResponse.json({ ok: true, bypass: true, movedToPending: custIds.length, historyCreated: historyDocs.length });
    } catch (e) {
      await db.collection("calendarAssignments").updateMany(
        { _id: { $in: ids }, meetingDecision: "PROCESSING" },
        { $set: { meetingDecision: "BYPASS", updatedAt: new Date() }, $unset: { processingAt: "", processingByUserId: "" } }
      );
      return NextResponse.json({ error: "BYPASS_CONFIRM_FAILED", detail: String(e?.message || e) }, { status: 500 });
    }
  }

  /* ──────────────────────────────────────────────
     NORMAL BRANCH: Confirm → Diksha (existing)
     ────────────────────────────────────────────── */
  if (!base.occupiedContainerId || !base.occupiedDate) {
    await db.collection("calendarAssignments").updateMany(
      { _id: { $in: ids }, meetingDecision: "PROCESSING" },
      { $set: { meetingDecision: "PENDING", updatedAt: new Date() }, $unset: { processingAt: "", processingByUserId: "" } }
    );
    return NextResponse.json({ error: "This card is not occupied / not pending" }, { status: 409 });
  }

  const targetId = new ObjectId(base.occupiedContainerId);

  // WhatsApp first
  const sentMap = new Map();
  try {
    for (const cid of custIds) {
      const c = customerById.get(String(cid));
      const fromWelcome = normalizeWhatsAppTo(c?.whatsappWelcomeTo);
      const fallback = buildWhatsAppTo(c);
      const to = fromWelcome || fallback;
      if (!to) throw new Error(`WHATSAPP_NUMBER_INVALID for ${c?.name || String(cid)}`);

      const msg =
        `Namaste ${c?.name || ""}\n` +
        `Aapki Diksha Date CONFIRM ho gayi hai: ${base.occupiedDate}\n` +
        `Roll No: ${c?.rollNo || "-"}\n`;

      const r = await sendWhatsAppText({ to, body: msg });
      sentMap.set(String(cid), { sid: r.sid, to, body: msg });
    }
  } catch (e) {
    await db.collection("calendarAssignments").updateMany(
      { _id: { $in: ids }, meetingDecision: "PROCESSING" },
      {
        $set: {
          meetingDecision: "PENDING",
          whatsappConfirmError: String(e?.message || e),
          whatsappConfirmFailedAt: new Date(),
          updatedAt: new Date(),
        },
        $unset: { processingAt: "", processingByUserId: "" },
      }
    );
    return NextResponse.json({ error: "WHATSAPP_SEND_FAILED", detail: String(e?.message || e) }, { status: 502 });
  }

  // History snapshots
  const historyDocs = group.map((a) => {
    const cust = customerById.get(String(a.customerId));
    const meta = sentMap.get(String(a.customerId));
    return {
      originalAssignmentId: a._id,
      containerId: ctnId,
      customerId: a.customerId,
      status: "CONFIRMED_OUT",

      customerSnapshot: {
        name: cust?.name || "",
        gender: cust?.gender || "OTHER",
        age: cust?.age || "",
        address: cust?.address || "",
        rollNo: cust?.rollNo || "",
      },

      kind: a.kind || "SINGLE",
      pairId: a.pairId || null,
      roleInPair: a.roleInPair || null,

      occupiedDate: a.occupiedDate,
      occupiedContainerId: a.occupiedContainerId,
      meetingDecision: "CONFIRMED",
      confirmedAt: now,
      confirmedByUserId: session.userId,
      confirmedByLabel: actorLabel,

      whatsappConfirmSid: meta?.sid || null,
      whatsappConfirmTo: meta?.to || null,

      originalCreatedAt: a.createdAt,
      createdAt: now,
      updatedAt: now,
    };
  });

  if (historyDocs.length > 0) {
    await db.collection("calendarAssignmentHistory").insertMany(historyDocs);
  }

  // Move assignments to DIKSHA
  const bulk = group.map((a) => {
    const meta = sentMap.get(String(a.customerId));
    return {
      updateOne: {
        filter: { _id: a._id },
        update: {
          $set: {
            containerId: targetId,
            updatedAt: now,
            meetingDecision: "CONFIRMED",
            confirmedAt: now,
            confirmedByUserId: session.userId,
            whatsappConfirmSentAt: now,
            whatsappConfirmSid: meta?.sid || null,
            whatsappConfirmTo: meta?.to || null,
            whatsappConfirmBody: meta?.body || null,
          },
          $unset: { processingAt: "", processingByUserId: "" },
        },
      },
    };
  });

  await db.collection("calendarAssignments").bulkWrite(bulk, { ordered: true });

  await db.collection("sittingCustomers").updateMany(
    { _id: { $in: custIds } },
    {
      $set: {
        activeContainerId: targetId,
        status: "IN_EVENT",
        dikshaEligible: true,
        dikshaEligibleAt: now,
      },
    }
  );

  for (const cid of custIds) {
    await addCommit({
      customerId: cid,
      userId: session.userId,
      actorLabel,
      message: commitMessage,
      action: "MEETING_CONFIRM_TO_DIKSHA",
      meta: {
        fromMeetingContainerId: String(ctnId),
        toDikshaContainerId: String(targetId),
        occupiedDate: base.occupiedDate,
        kind: base.kind,
        pairId: base.pairId ? String(base.pairId) : null,
        whatsappConfirmSid: sentMap.get(String(cid))?.sid || null,
        historyRecordCreated: true,
      },
    });
  }

  return NextResponse.json({ ok: true, moved: custIds.length, historyCreated: historyDocs.length });
}
