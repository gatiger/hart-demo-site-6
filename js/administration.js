document.addEventListener("DOMContentLoaded", () => {
  initAdministrationPage();
});

async function initAdministrationPage() {
  try {
    const res = await fetch("/content/administration.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load /content/administration.json");

    const data = await res.json();

    renderAdminHeader(data.header || {});
    renderAdminDetails(data.details || {});
    renderAdminPhoto(data.photo || {});
    renderAdminShortMessage(data.shortMessage || {});
    renderAdminMessage(data.message || {});
    renderOrgChart(data.orgChart || {});
  } catch (err) {
    console.error(err);

    const title = document.getElementById("adminPageTitle");
    const body = document.getElementById("adminMessageBody");

    if (title) title.textContent = "Administration";
    if (body) {
      body.innerHTML = "<p>Unable to load administration content at this time.</p>";
    }
  }
}

function renderAdminHeader(header) {
  setText("adminEyebrow", header.eyebrow);
  setText("adminPageTitle", header.title);
}

function renderAdminDetails(details) {
  setText("adminName", details.name);
  setText("adminRole", details.role);

  setLabeledText("adminOfficeRow", "Office", details.office);
  setLabeledText("adminAddressRow", "Address", details.address);
  setPhoneRow("adminPhoneRow", "Phone", details.phone);
  setEmailRow("adminEmailRow", "Email", details.email);
  setLabeledText("adminHoursRow", "Hours", details.hours);
}

function renderAdminPhoto(photo) {
  const img = document.getElementById("adminPhoto");
  const textWrap = document.getElementById("adminPhotoText");

  if (img) {
    img.src = safeText(photo.src);
    img.alt = safeText(photo.alt) || "Administration photo";
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

function renderAdminMessage(message) {
  setText("adminMessageTitle", message.title);

  const body = document.getElementById("adminMessageBody");
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

function renderOrgChart(orgChart) {
  setText("orgChartTitle", orgChart.title);

  const link = document.getElementById("orgChartLink");
  if (!link) return;

  link.href = safeText(orgChart.href) || "#";
  link.textContent = safeText(orgChart.label);
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

function renderAdminShortMessage(shortMessage) {
  setText("adminShortMessageTitle", shortMessage.title);

  const body = document.getElementById("adminShortMessageBody");
  if (!body) return;

  body.innerHTML = "";

  const paragraphs = Array.isArray(shortMessage.paragraphs)
    ? shortMessage.paragraphs
    : [shortMessage.paragraphs];

  paragraphs
    .map(safeText)
    .filter(Boolean)
    .forEach(text => {
      const p = document.createElement("p");
      p.textContent = text;
      body.appendChild(p);
    });
}