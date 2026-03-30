document.addEventListener("DOMContentLoaded", () => {
  initBehavioralPage();
});

async function initBehavioralPage() {
  try {
    const res = await fetch("/content/behavioral.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load /content/behavioral.json");

    const data = await res.json();

    renderBehavioralHeader(data.header || {});
    renderBehavioralDetails(data.details || {});
    renderBehavioralPhoto(data.photo || {});
    renderBehavioralMessage(data.message || {});
  } catch (err) {
    console.error(err);

    const title = document.getElementById("behavioralPageTitle");
    const body = document.getElementById("behavioralMessageBody");

    if (title) title.textContent = "Behavioral Health";
    if (body) {
      body.innerHTML = "<p>Unable to load Behavioral Health content at this time.</p>";
    }
  }
}

function renderBehavioralHeader(header) {
  setText("behavioralEyebrow", header.eyebrow);
  setText("behavioralPageTitle", header.title);
}

function renderBehavioralDetails(details) {
  setText("behavioralName", details.name);
  setText("behavioralRole", details.role);

  setLabeledText("behavioralOfficeRow", "Office", details.office);
  setLabeledText("behavioralAddressRow", "Address", details.address);
  setPhoneRow("behavioralPhoneRow", "Phone", details.phone);
  setEmailRow("behavioralEmailRow", "Email", details.email);
  setLabeledText("behavioralHoursRow", "Hours", details.hours);
}

function renderBehavioralPhoto(photo) {
  const img = document.getElementById("behavioralPhoto");
  const textWrap = document.getElementById("behavioralPhotoText");

  if (img) {
    img.src = safeText(photo.src);
    img.alt = safeText(photo.alt) || "Behavioral Health photo";
  }

  if (textWrap) {
    textWrap.innerHTML = "";
    const paragraphs = Array.isArray(photo.description) ? photo.description : [photo.description];

    paragraphs
      .map(safeText)
      .filter(Boolean)
      .forEach(text => {
        const p = document.createElement("p");
        p.textContent = text;
        textWrap.appendChild(p);
      });
  }
}

function renderBehavioralMessage(message) {
  setText("behavioralMessageTitle", message.title);

  const body = document.getElementById("behavioralMessageBody");
  if (!body) return;

  body.innerHTML = "";

  const paragraphs = Array.isArray(message.paragraphs) ? message.paragraphs : [];
  paragraphs
    .map(safeText)
    .filter(Boolean)
    .forEach(text => {
      const p = document.createElement("p");
      p.textContent = text;
      body.appendChild(p);
    });
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = safeText(value);
}

function setLabeledText(id, label, value) {
  const el = document.getElementById(id);
  const safeValue = safeText(value);
  if (!el) return;

  if (!safeValue) {
    el.hidden = true;
    return;
  }

  el.hidden = false;
  el.innerHTML = `<strong>${escapeHtml(label)}:</strong> ${escapeHtml(safeValue)}`;
}

function setPhoneRow(id, label, value) {
  const el = document.getElementById(id);
  const safeValue = safeText(value);
  if (!el) return;

  if (!safeValue) {
    el.hidden = true;
    return;
  }

  const tel = safeValue.replace(/[^\d+]/g, "");
  el.hidden = false;
  el.innerHTML = `<strong>${escapeHtml(label)}:</strong> <a href="tel:${escapeHtml(tel)}">${escapeHtml(safeValue)}</a>`;
}

function setEmailRow(id, label, value) {
  const el = document.getElementById(id);
  const safeValue = safeText(value);
  if (!el) return;

  if (!safeValue) {
    el.hidden = true;
    return;
  }

  el.hidden = false;
  el.innerHTML = `<strong>${escapeHtml(label)}:</strong> <a href="mailto:${escapeHtml(safeValue)}">${escapeHtml(safeValue)}</a>`;
}

function safeText(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}