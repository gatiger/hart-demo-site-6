document.addEventListener("DOMContentLoaded", async () => {
  try {
    const data = await loadJSON("./content/coroner.json");
    renderCoronerPage(data || {});
  } catch (err) {
    console.error(err);
    const main = document.getElementById("main");
    if (main) {
      main.insertAdjacentHTML(
        "afterbegin",
        '<div class="card"><p class="sub">Unable to load Coroner information at this time.</p></div>'
      );
    }
  }
});

function renderCoronerPage(data){
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
  setText("coronerEyebrow", intro.eyebrow || "Hart County");
  setText("coronerTitle", intro.title || "Hart County Coroner's Office");
  setText("coronerDescription", intro.description || "");

  renderContact(data.contact || {});
  renderParagraphs("coronerFunction", data.function_paragraphs || []);
  renderCases(data.investigation_cases || []);
  renderParagraphs("coronerAbout", data.about_paragraphs || []);
  renderLinks(data.links || []);

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

  function emailMarkup(email){
    const shown = safe(email);
    if (!shown) return "";

    return `
      <span class="emailDesktop">${escapeHtml(shown)}</span>
      <a class="emailMobile" href="mailto:${escapeAttr(shown)}">${escapeHtml(shown)}</a>
    `;
  }

  function renderContact(contact){
    const mount = document.getElementById("coronerContact");
    if (!mount) return;

    const address = [contact.address, contact.city_state_zip]
      .filter(Boolean)
      .join("\n");

    const rows = [
      ["Coroner", contact.name],
      ["Address", address]
    ].filter(([, value]) => safe(value));

    mount.innerHTML = `
      <div class="contactList">
        ${rows.map(([label, value]) => `
          <div class="contactItem">
            <span class="contactLabel">${escapeHtml(label)}</span>
            <div class="contactValue">${escapeHtml(safe(value))}</div>
          </div>
        `).join("")}

        ${safe(contact.phone) ? `
          <div class="contactItem">
            <span class="contactLabel">Telephone</span>
            <div class="contactValue">${phoneMarkup(contact.phone, contact.phone_raw)}</div>
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

  function renderParagraphs(id, paragraphs){
    const mount = document.getElementById(id);
    if (!mount) return;

    mount.innerHTML = paragraphs
      .map(text => `<p>${escapeHtml(safe(text))}</p>`)
      .join("");
  }

  function renderCases(items){
    const mount = document.getElementById("coronerCases");
    if (!mount) return;

    mount.innerHTML = items
      .map(item => `<li>${escapeHtml(safe(item))}</li>`)
      .join("");
  }

  function renderLinks(items){
    const mount = document.getElementById("coronerLinks");
    if (!mount) return;

    mount.innerHTML = items.map(item => `
      <a
        class="coronerTextLink"
        href="${escapeAttr(safe(item.url))}"
        ${item.external ? 'target="_blank" rel="noopener noreferrer"' : ""}
      >${escapeHtml(safe(item.title))}</a>
    `).join("");
  }
}
