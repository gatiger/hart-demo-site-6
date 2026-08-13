document.addEventListener("DOMContentLoaded", async () => {
  try {
    const data = await loadJSON("./content/magistrate.json");
    renderMagistratePage(data || {});
  } catch (err) {
    console.error(err);
    const main = document.getElementById("main");
    if (main) {
      main.insertAdjacentHTML(
        "afterbegin",
        '<div class="card"><p class="sub">Unable to load Magistrate Court information at this time.</p></div>'
      );
    }
  }
});

function renderMagistratePage(data){
  const safe = (value) =>
    value === undefined || value === null ? "" : String(value).trim();

  const escapeHtml = (value) =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const escapeAttr = escapeHtml;
  const intro = data.intro || {};

  setText("magistrateEyebrow", intro.eyebrow || "Hart County");
  setText("magistrateTitle", intro.title || "Hart County Magistrate Court");
  setText("magistrateDescription", intro.description || "");
  setText("magistrateFeeNotice", data.fee_notice || "");

  renderContact(data.contact || {});
  renderLinks(data.resources || []);
  renderStaff(data.staff || []);
  renderParagraphs("magistrateCriminal", data.criminal_matters || []);
  renderParagraphs("magistrateCivil", data.civil_matters || []);
  renderFees(data.filing_fees || []);

  function setText(id, value){
    const element = document.getElementById(id);
    if (element) element.textContent = safe(value);
  }

  function phoneMarkup(phone, raw){
    const shown = safe(phone);
    const tel = safe(raw || shown.replace(/[^\d+]/g, ""));
    if (!shown) return "";

    return `
      <span class="phoneDesktop">${escapeHtml(shown)}</span>
      <a class="phoneMobile" href="tel:${escapeAttr(tel)}">${escapeHtml(shown)}</a>
    `;
  }

  function renderContact(contact){
    const mount = document.getElementById("magistrateContact");
    if (!mount) return;

    const mailing = [contact.mailing_address, contact.city_state_zip]
      .filter(Boolean)
      .join("\n");

    mount.innerHTML = `
      <div class="contactList">
        ${safe(contact.chief_magistrate) ? `
          <div class="contactItem">
            <span class="contactLabel">Chief Magistrate</span>
            <div class="contactValue">${escapeHtml(safe(contact.chief_magistrate))}</div>
          </div>
        ` : ""}

        ${mailing ? `
          <div class="contactItem">
            <span class="contactLabel">Mailing Address</span>
            <div class="contactValue">${escapeHtml(mailing)}</div>
          </div>
        ` : ""}

        ${safe(contact.phone) ? `
          <div class="contactItem">
            <span class="contactLabel">Telephone</span>
            <div class="contactValue">${phoneMarkup(contact.phone, contact.phone_raw)}</div>
          </div>
        ` : ""}

        ${safe(contact.location) ? `
          <div class="contactItem">
            <span class="contactLabel">Location</span>
            <div class="contactValue">${escapeHtml(safe(contact.location))}</div>
          </div>
        ` : ""}

        ${safe(contact.hours) ? `
          <div class="contactItem">
            <span class="contactLabel">Hours</span>
            <div class="contactValue">${escapeHtml(safe(contact.hours))}</div>
          </div>
        ` : ""}
      </div>
    `;
  }

  function renderLinks(items){
    const mount = document.getElementById("magistrateResources");
    if (!mount) return;

    mount.innerHTML = items.map(item => `
      <a
        class="magistrateTextLink"
        href="${escapeAttr(safe(item.url))}"
        ${item.external ? 'target="_blank" rel="noopener noreferrer"' : ""}
      >${escapeHtml(safe(item.title))}</a>
    `).join("");
  }

  function renderStaff(items){
    const mount = document.getElementById("magistrateStaff");
    if (!mount) return;

    mount.innerHTML = items.map(person => `
      <div class="staffMember">
        <div class="staffName">${escapeHtml(safe(person.name))}</div>
        ${safe(person.role) ? `<div class="staffRole">${escapeHtml(safe(person.role))}</div>` : ""}
      </div>
    `).join("");
  }

  function renderParagraphs(id, paragraphs){
    const mount = document.getElementById(id);
    if (!mount) return;

    mount.innerHTML = paragraphs
      .map(text => `<p>${escapeHtml(safe(text))}</p>`)
      .join("");
  }

  function renderFees(items){
    const mount = document.getElementById("magistrateFees");
    if (!mount) return;

    mount.innerHTML = items.map(item => `
      <div class="feeRow">
        <div class="feeName">${escapeHtml(safe(item.name))}</div>
        <div class="feeDetail">${escapeHtml(safe(item.detail))}</div>
      </div>
    `).join("");
  }
}
