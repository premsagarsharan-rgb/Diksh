import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const myfrom = process.env.TWILIO_WHATSAPP_FROM;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export function buildWhatsAppTo(customer) {
  const ccRaw = String(customer?.whatsappCountryCode || customer?.phoneCountryCode || "").trim();
  const numRaw = String(customer?.whatsappNumber || customer?.phoneNumber || "").trim();

  if (!numRaw) return null;

  const num = numRaw.replace(/[^\d]/g, "");
  let cc = ccRaw.replace(/[^\d+]/g, "");

  if (!cc) return null;
  if (!cc.startsWith("+")) cc = `+${cc}`;

  const e164 = `${cc}${num}`;
  if (!e164.startsWith("+") || e164.length < 10) return null;

  return `whatsapp:${e164}`;
}

export async function sendWhatsAppText({ to, body }) {
  if (!client) throw new Error("Twilio client not configured (missing TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN)");

  const from = myfrom;
  if (!from) throw new Error("TWILIO_WHATSAPP_FROM missing");

  const message = await client.messages.create({
    from,
    to,
    body: String(body || ""),
  });

  return { sid: message.sid, status: message.status };
}
