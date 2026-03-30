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
    renderAdminFallback();
  }
}

function renderAdminHeader(header) {
  setText("adminEyebrow", header.eyebrow);
  setText("adminPageTitle", header.title || "Administration");
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
  const paragraphs = toParagraphArray(photo.description);

  if (img) {
    const src = safeText(photo.src);
    img.src = src || "/assets/admin-placeholder.jpg";
    img.alt = safeText(photo.alt) || "Hart County Administration Building";
    img.onerror = () => {
      img.onerror = null;
      img.src = "/assets/admin-placeholder.jpg";
    };
  }

  if (!textWrap) return;

  textWrap.innerHTML = "";

  if (!paragraphs.length) return;

  paragraphs.forEach((text, index) => {
    const p = document.createElement("p");
    p.textContent = text;

    if (index === 0) {
      p.id = "adminPhotoCaption";
    }

    textWrap.appendChild(p);
  });
}

function renderAdminShortMessage(shortMessage) {
  setText("adminShortMessageTitle", shortMessage.title);

  const body = document.getElementById("adminShortMessageBody");
  if (!body) return;

  body.innerHTML = "";

  const paragraphs = toParagraphArray(shortMessage.paragraphs);

  paragraphs.forEach(text => {
    const p = document.createElement("p");
    p.textContent = text;
    body.appendChild(p);
  });

  if (!paragraphs.length) {
    body.innerHTML = "<p>No additional notices are available at this time.</p>";
  }
}

function renderAdminMessage(message) {
  setText("adminMessageTitle", message.title);

  const body = document.getElementById("adminMessageBody");
  if (!body) return;

  body.innerHTML = "";

  const paragraphs = toParagraphArray(message.paragraphs);

  paragraphs.forEach(text => {
    const p = document.createElement("p");
    p.textContent = text;
    body.appendChild(p);
  });

  if (!paragraphs.length) {
    body.innerHTML = "<p>Administration information is not available at this time.</p>";
  }
}

function renderOrgChart(orgChart) {
  const block = document.getElementById("orgChartBlock");
  const title = document.getElementById("orgChartTitle");
  const link = document.getElementById("orgChartLink");

  if (!block || !title || !link) return;

  const linkLabel = safeText(orgChart.label);
  const href = safeText(orgChart.href);
  const titleText = safeText(orgChart.title);

  if (!linkLabel || !href) {
    block.hidden = true;
    return;
  }

  block.hidden = false;
  title.textContent = titleText;
  link.href = href;
  link.textContent = linkLabel;
}

function renderAdminFallback() {
  setText("adminEyebrow", "");
  setText("adminPageTitle", "Administration");
  setText("adminName", "");
  setText("adminRole", "");

  hideRow("adminOfficeRow");
  hideRow("adminAddressRow");
  hideRow("adminPhoneRow");
  hideRow("adminEmailRow");
  hideRow("adminHoursRow");

  setText("adminShortMessageTitle", "Administrative Notice");
  setHtml("adminShortMessageBody", "<p>Unable to load administration content at this time.</p>");

  setText("adminMessageTitle", "Message from the Administrator");
  setHtml("adminMessageBody", "<p>Please check back later for updated administration information.</p>");

  const orgChartBlock = document.getElementById("orgChartBlock");
  if (orgChartBlock) orgChartBlock.hidden = true;
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = safeText(value);
}

function setHtml(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

function hideRow(id) {
  const el = document.getElementById(id);
  if (el) el.hidden = true;
}

function setLabeledText(id, label, value) {
  const el = document.getElementById(id);
  const safeValue = safeText(value);
  if (!el) return;

  if (!safeValue) {
    el.hidden = true;
    el.innerHTML = "";
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
    el.innerHTML = "";
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
    el.innerHTML = "";
    return;
  }

  el.hidden = false;
  el.innerHTML = `<strong>${escapeHtml(label)}:</strong> <a href="mailto:${escapeHtml(safeValue)}">${escapeHtml(safeValue)}</a>`;
}

function toParagraphArray(value) {
  if (Array.isArray(value)) {
    return value.map(safeText).filter(Boolean);
  }

  const single = safeText(value);
  return single ? [single] : [];
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