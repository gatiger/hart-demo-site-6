document.addEventListener("DOMContentLoaded", async () => {
  try {
    const data = await loadJSON("./content/permit.json");
    renderPermitPage(data || {});
  } catch (err) {
    console.error(err);
    const main = document.getElementById("main");
    if (main) {
      main.insertAdjacentHTML(
        "afterbegin",
        '<div class="card"><p class="sub">Unable to load permitting information at this time.</p></div>'
      );
    }
  }
});

function renderPermitPage(data){
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

  setText("permitEyebrow", intro.eyebrow || "Hart County");
  setText("permitTitle", intro.title || "Building Permits & Addressing");
  setText("permitDescription", intro.description || "");

  renderContact(data.contact || {});
  renderNotice(data.public_notice || {});
  renderParagraphs("permitOverview", data.overview || []);
  renderParagraphs("permitRequirements", data.residential_requirements || []);
  renderParagraphs("permitJurisdiction", data.jurisdiction || []);
  renderApplications(data.applications || []);
  renderSummaries(data.permit_summaries || []);

  function setText(id, value){
    const element = document.getElementById(id);
    if (element) element.textContent = safe(value);
  }

  function phoneMarkup(phone){
    const shown = safe(phone);
    const tel = shown.replace(/[^\d+]/g, "");
    return `
      <span class="phoneDesktop">${escapeHtml(shown)}</span>
      <a class="phoneMobile" href="tel:${escapeAttr(tel)}">${escapeHtml(shown)}</a>
    `;
  }

  function emailMarkup(email){
    const shown = safe(email);
    return `
      <span class="emailDesktop">${escapeHtml(shown)}</span>
      <a class="emailMobile" href="mailto:${escapeAttr(shown)}">${escapeHtml(shown)}</a>
    `;
  }

  function renderContact(contact){
    const mount = document.getElementById("permitContact");
    if (!mount) return;

    mount.innerHTML = `
      <div class="contactList">
        ${safe(contact.phone) ? `
          <div class="contactItem">
            <span class="contactLabel">Telephone</span>
            <div class="contactValue">${phoneMarkup(contact.phone)}</div>
          </div>
        ` : ""}

        ${safe(contact.email) ? `
          <div class="contactItem">
            <span class="contactLabel">Email</span>
            <div class="contactValue">${emailMarkup(contact.email)}</div>
          </div>
        ` : ""}
      </div>
    `;
  }

  function renderNotice(notice){
    const mount = document.getElementById("propertyNotice");
    if (!mount) return;

    const paragraphs = (notice.paragraphs || [])
      .map(text => `<p>${escapeHtml(safe(text))}</p>`)
      .join("");

    const important = safe(notice.important)
      ? `<p class="permitImportant">${escapeHtml(notice.important)}</p>`
      : "";

    mount.innerHTML = paragraphs + important;
  }

  function renderParagraphs(id, paragraphs){
    const mount = document.getElementById(id);
    if (!mount) return;

    mount.innerHTML = paragraphs
      .map(text => `<p>${escapeHtml(safe(text))}</p>`)
      .join("");
  }

  function renderApplications(items){
    const mount = document.getElementById("permitApplications");
    if (!mount) return;

    mount.innerHTML = items.map(item => `
      <div>
        <a
          class="permitTextLink"
          href="${escapeAttr(safe(item.url))}"
          target="_blank"
          rel="noopener noreferrer"
        >${escapeHtml(safe(item.title))}</a>
        ${safe(item.note) ? `<p class="permitLinkNote">${escapeHtml(safe(item.note))}</p>` : ""}
      </div>
    `).join("");
  }

  function renderSummaries(items){
    const mount = document.getElementById("permitSummaries");
    if (!mount) return;

    mount.innerHTML = items.map(item => `
      <a
        class="permitSummaryLink"
        href="${escapeAttr(safe(item.url))}"
        target="_blank"
        rel="noopener noreferrer"
      >Permit Summary – ${escapeHtml(safe(item.year))}</a>
    `).join("");
  }
}
