document.addEventListener("DOMContentLoaded", () => {
  initTaxAssessorExemptionsPage();
});

async function initTaxAssessorExemptionsPage() {
  try {
    const res = await fetch("/content/taxassessor-exemptions.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load /content/taxassessor-exemptions.json");

    const data = await res.json();

    renderIntro(data.intro || {});
    renderCards(data.cards || []);
    renderContact(data.contact || {});
  } catch (err) {
    console.error(err);
    renderError();
  }
}

function renderIntro(intro) {
  const introEl = document.getElementById("taExIntro");
  if (introEl) introEl.textContent = safeText(intro.text) || "";
}

function renderCards(cards) {
  const mount = document.getElementById("taExGrid");
  if (!mount) return;

  const visible = Array.isArray(cards) ? cards.filter(card => card && card.enabled !== false) : [];

  if (!visible.length) {
    mount.innerHTML = `<section class="card"><div class="taEmpty">No exemption information is available right now.</div></section>`;
    return;
  }

  mount.innerHTML = visible.map(card => {
    const title = safeText(card.title);
    const subtitle = safeText(card.subtitle);
    const text = Array.isArray(card.text) ? card.text : [];

    return `
      <section class="card" aria-label="${escapeAttr(title || "Exemption information")}">
        <div class="cardHead">
          <h2 class="cardTitle">${escapeHtml(title)}</h2>
          ${subtitle ? `<p class="cardSub">${escapeHtml(subtitle)}</p>` : ""}
        </div>
        <div class="taExCardBody">
          ${text.map(p => `<p>${escapeHtml(safeText(p))}</p>`).join("")}
        </div>
      </section>
    `;
  }).join("");
}

function renderContact(contact) {
  const mount = document.getElementById("taExContactBody");
  if (!mount) return;

  const name = safeText(contact.name);
  const phone = safeText(contact.phone);
  const email = safeText(contact.email);
  const officeHours = safeText(contact.officeHours);
  const text = Array.isArray(contact.text) ? contact.text : [];

  mount.innerHTML = `
    ${name ? `<p><strong>${escapeHtml(name)}</strong></p>` : ""}
    ${phone ? `<p><strong>Phone:</strong> ${escapeHtml(phone)}</p>` : ""}
    ${email ? `<p><strong>Email:</strong> <a href="mailto:${escapeAttr(email)}">${escapeHtml(email)}</a></p>` : ""}
    ${officeHours ? `<p><strong>Office Hours:</strong> ${escapeHtml(officeHours)}</p>` : ""}
    ${text.map(p => `<p>${escapeHtml(safeText(p))}</p>`).join("")}
  `;
}

function renderError() {
  const introEl = document.getElementById("taExIntro");
  const grid = document.getElementById("taExGrid");
  const contact = document.getElementById("taExContactBody");

  if (introEl) introEl.textContent = "We were unable to load the exemptions information at this time.";
  if (grid) grid.innerHTML = "";
  if (contact) contact.innerHTML = "";
}

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(str) {
  return escapeHtml(str);
}