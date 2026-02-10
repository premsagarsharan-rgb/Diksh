let _templateCache = null;
let _templatePartsCache = null;

function escapeHtml(s) {
  const str = String(s ?? "");
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function applyTemplate(tpl, data) {
  return String(tpl || "").replace(/{{\s*([A-Z0-9_]+)\s*}}/g, (_, key) => {
    return escapeHtml(data?.[key] ?? "");
  });
}

function pickGuardianLabel(rel) {
  const r = String(rel || "").toLowerCase();
  if (r === "father") return "Father's Name";
  if (r === "mother") return "Mother's Name";
  if (r === "husband") return "Husband's Name";
  return "Guardian's Name";
}

function maritalKey(v) {
  const s = String(v || "").toLowerCase();
  if (["marrid", "married"].includes(s)) return "MARRIED";
  if (["unmarrid", "unmarried"].includes(s)) return "UNMARRIED";
  if (["divorce", "divorcee", "divorced"].includes(s)) return "DIVORCEE";
  if (["virakt"].includes(s)) return "VIRAKT";
  return "";
}

function splitTwoLines(text, maxLen = 55) {
  const s = String(text || "").trim();
  if (!s) return ["", ""];
  if (s.length <= maxLen) return [s, ""];

  let cut = s.lastIndexOf(" ", maxLen);
  if (cut < 15) cut = maxLen;

  const a = s.slice(0, cut).trim();
  const b = s.slice(cut).trim();
  return [a, b];
}

async function getTemplate() {
  if (_templateCache) return _templateCache;
  const res = await fetch("/print/form2.html", { cache: "no-store" });
  const html = await res.text();
  _templateCache = html;
  return html;
}

async function getTemplateParts() {
  if (_templatePartsCache) return _templatePartsCache;

  const html = await getTemplate();

  // Prefer DOMParser in browser
  if (typeof DOMParser !== "undefined") {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const headInner = doc?.head?.innerHTML || "";
    const pageEl = doc?.querySelector?.(".page");
    const pageTpl = pageEl?.outerHTML || `<div class="page"></div>`;
    _templatePartsCache = { headInner, pageTpl };
    return _templatePartsCache;
  }

  // Fallback regex (should rarely be used)
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const headInner = headMatch ? headMatch[1] : "";

  const pageMatch = html.match(/<div\s+class=["']page["'][^>]*>[\s\S]*<\/div>\s*<\/body>/i);
  const pageTpl = pageMatch ? pageMatch[0].replace(/<\/body>[\s\S]*$/i, "") : `<div class="page"></div>`;

  _templatePartsCache = { headInner, pageTpl };
  return _templatePartsCache;
}

function buildData({ customer, form, source, sequenceNo }) {
  const gender = String(form?.gender || customer?.gender || "").toUpperCase();
  const ms = maritalKey(form?.maritalStatus || customer?.maritalStatus);

  const state =
    form?.state === "__OTHER__"
      ? String(form?.stateOther || "").trim()
      : String(form?.state || customer?.state || "").trim();

  const city =
    form?.city === "__OTHER__"
      ? String(form?.cityOther || "").trim()
      : String(form?.city || customer?.city || "").trim();

  const address = String(form?.address || customer?.address || "").trim();
  const [addr1, addr2] = splitTwoLines(address);

  const idType = String(form?.idType || customer?.idType || "aadhaar").toLowerCase();
  const idTypeName = String(form?.idTypeName || customer?.idTypeName || "").trim();
  const idValue = String(form?.idValue || customer?.idValue || "").trim();

  let ID_LABEL = "Aadhaar No";
  if (idType === "passport") ID_LABEL = "Passport No";
  else if (idType === "other") ID_LABEL = `${idTypeName || "Other ID"} No`;

  const phoneFull = `${String(form?.phoneCountryCode || customer?.phoneCountryCode || "").trim()} ${String(
    form?.phoneNumber || customer?.phoneNumber || ""
  ).trim()}`.trim();

  const whatsappFull = `${String(form?.whatsappCountryCode || customer?.whatsappCountryCode || "").trim()} ${String(
    form?.whatsappNumber || customer?.whatsappNumber || ""
  ).trim()}`.trim();

  const cardNoRaw = sequenceNo ?? form?.sequenceNo ?? customer?.sequenceNo ?? customer?.seqNo ?? "";
  const cardNo = cardNoRaw ? (String(cardNoRaw).startsWith("#") ? String(cardNoRaw) : `#${cardNoRaw}`) : "";

  const now = new Date();
  const formFillDate = now.toLocaleDateString("en-GB"); // dd/mm/yyyy

  return {
    FORM_NO: String(customer?.rollNo || customer?.rollSeq || customer?._id || "").trim(),
    CARD_NO: cardNo,
    MANTRA_DATE: "___ / ___ / ____",

    NAME: String(form?.name || customer?.name || "").trim(),
    GUARDIAN_LABEL: pickGuardianLabel(form?.guardianRelation || customer?.guardianRelation),
    GUARDIAN_NAME: String(form?.guardianName || customer?.guardianName || "").trim(),

    G_MALE: gender === "MALE" ? "✓" : "",
    G_FEMALE: gender === "FEMALE" ? "✓" : "",
    AGE: String(form?.age || customer?.age || "").trim(),

    MS_MARRIED: ms === "MARRIED" ? "✓" : "",
    MS_UNMARRIED: ms === "UNMARRIED" ? "✓" : "",
    MS_DIVORCEE: ms === "DIVORCEE" ? "✓" : "",
    MS_VIRAKT: ms === "VIRAKT" ? "✓" : "",

    ADDRESS_LINE1: addr1,
    ADDRESS_LINE2: addr2,

    CITY: city,
    STATE: state,
    PIN: String(form?.pincode || customer?.pincode || "").trim(),

    OCCUPATION: String(form?.occupation || customer?.occupation || "").trim(),

    PHONE_FULL: phoneFull,
    WHATSAPP_FULL: whatsappFull,

    ID_LABEL,
    ID_VALUE: idValue,

    DECL_OK: "✓",

    FM_NAME: String(form?.familyMemberName || customer?.familyMemberName || "").trim(),
    FM_RELATION: String(form?.familyMemberRelation || customer?.familyMemberRelation || "").trim(),
    FM_MOBILE: String(form?.familyMemberMobile || customer?.familyMemberMobile || "").trim(),

    FORM_FILL_DATE: formFillDate,
    SOURCE: String(source || "").trim(),
  };
}

export async function buildForm2PrintHtml({ customer, form, source, sequenceNo = null }) {
  const tpl = await getTemplate();
  const data = buildData({ customer, form, source, sequenceNo });
  return applyTemplate(tpl, data);
}

export async function openForm2PrintPreview(args) {
  const html = await buildForm2PrintHtml(args);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  const w = window.open(url, "_blank");
  if (!w) {
    URL.revokeObjectURL(url);
    alert("Popup blocked. Please allow popups for printing.");
    return;
  }

  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/* -------------------------
   ✅ NEW: PRINT ALL using same form2.html template
-------------------------- */
export async function buildForm2PrintAllHtml({ title = "Print All", items = [], source = "" }) {
  const { headInner, pageTpl } = await getTemplateParts();

  const pages = items.map((it, idx) => {
    const customer = it?.customer || {};
    const form = it?.form || customer; // if form not provided, use customer fields
    const seq = it?.sequenceNo ?? idx + 1;

    const data = buildData({ customer, form, source, sequenceNo: seq });
    return applyTemplate(pageTpl, data);
  });

  const extraCss = `
    /* Print-all wrapper + page breaks */
    .wrap { padding: 16px; display:flex; flex-direction:column; gap:16px; align-items:center; }
    .page { page-break-after: always; break-after: page; }
    .page:last-child { page-break-after: auto; break-after: auto; }

    /* override template screen mode (template makes body flex center) */
    @media screen {
      body { display:block !important; padding:0 !important; background:#f7f7f7 !important; }
    }

    .topbar {
      position: sticky; top: 0; z-index: 9999;
      background:#111; color:#fff;
      padding:10px 12px; display:flex; justify-content:space-between; gap:10px; align-items:center;
    }
    .btn {
      border:0; border-radius:10px; padding:10px 12px; font-weight:800; cursor:pointer;
    }
    .btnClose { background: rgba(255,255,255,0.18); color:#fff; }
    .btnPrint { background:#fff; color:#111; }

    @media print {
      .topbar { display:none; }
      .wrap { padding:0; gap:0; }
      body { background:#fff !important; }
    }
  `;

  const safeTitle = escapeHtml(title);

  return `<!doctype html>
<html>
<head>
${headInner}
<title>${safeTitle}</title>
<style>${extraCss}</style>
</head>
<body>
  <div class="topbar">
    <div style="font-weight:900;">${safeTitle} • Total: ${items.length}</div>
    <div style="display:flex; gap:8px;">
      <button class="btn btnClose" id="btnClose" type="button">Close</button>
      <button class="btn btnPrint" id="btnPrint" type="button">Print</button>
    </div>
  </div>

  <div class="wrap">
    ${pages.join("\n")}
  </div>

  <script>
    document.getElementById('btnPrint').addEventListener('click', function(){ window.focus(); window.print(); });
    document.getElementById('btnClose').addEventListener('click', function(){ window.close(); });
  </script>
</body>
</html>`;
}

export async function openForm2PrintAllPreview(args) {
  const html = await buildForm2PrintAllHtml(args);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  const w = window.open(url, "_blank");
  if (!w) {
    URL.revokeObjectURL(url);
    alert("Popup blocked. Please allow popups for printing.");
    return;
  }

  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
