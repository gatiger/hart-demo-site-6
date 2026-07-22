document.addEventListener("DOMContentLoaded", async () => {
  try {
    const data = await loadJSON("./content/elections.json");
    renderElectionsPage(data || {});
  } catch (err) {
    console.error(err);
    const main = document.getElementById("main");
    if (main) {
      main.insertAdjacentHTML(
        "afterbegin",
        '<div class="card"><p class="sub">Unable to load election information at this time.</p></div>'
      );
    }
  }
});

function renderElectionsPage(data){
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
  setText("electionsEyebrow", intro.eyebrow || "Hart County");
  setText("electionsTitle", intro.title || "Board of Elections and Registration");
  setText("electionsDescription", intro.description || "");

  renderContact(data.contact || {});
  renderPeople(data.people || []);
  renderDocuments(data.documents || []);
  renderInformation(data.information_sections || []);

  function setText(id, value){
    const el = document.getElementById(id);
    if (el) el.textContent = safe(value);
  }

  function phoneMarkup(phone, raw){
    const shown = safe(phone);
    const tel = safe(raw || shown.replace(/[^\d+]/g, ""));
    if (!shown) return "";
    return `
      <span class="phoneDesktop">${escapeHtml(shown)}</span>
      <a class="phoneMobile inlineLink" href="tel:${escapeAttr(tel)}">${escapeHtml(shown)}</a>
    `;
  }

  function renderContact(contact){
    const mount = document.getElementById("electionsContact");
    if (!mount) return;

    const address = [contact.mailing_address, contact.mailing_city_state_zip]
      .filter(Boolean)
      .join("\n");

    const location = safe(contact.office_location);
    const hours = Array.isArray(contact.office_hours)
      ? contact.office_hours.join("\n")
      : safe(contact.office_hours);

    const rows = [
      ["Mailing Address", address],
      ["Office Location", location],
      ["Office Hours", hours]
    ].filter(([, value]) => safe(value));

    const phone = safe(contact.phone);
    const fax = safe(contact.fax);

    mount.innerHTML = `
      <div class="contactList">
        ${rows.map(([label, value]) => `
          <div class="contactItem">
            <span class="contactLabel">${escapeHtml(label)}</span>
            <div class="contactValue">${escapeHtml(value)}</div>
          </div>
        `).join("")}

        ${phone ? `
          <div class="contactItem">
            <span class="contactLabel">Telephone</span>
            <div class="contactValue">${phoneMarkup(phone, contact.phone_raw)}</div>
          </div>
        ` : ""}

        ${fax ? `
          <div class="contactItem">
            <span class="contactLabel">Fax</span>
            <div class="contactValue">${escapeHtml(fax)}</div>
          </div>
        ` : ""}
      </div>
    `;
  }

  function renderPeople(groups){
    const mount = document.getElementById("electionsPeople");
    if (!mount) return;

    mount.innerHTML = groups.map(group => `
      <section class="peopleGroup">
        <h3>${escapeHtml(safe(group.title))}</h3>
        <div class="personList">
          ${(group.items || []).map(person => `
            <div class="person">
              <div class="personName">${escapeHtml(safe(person.name))}</div>
              ${safe(person.role) ? `<div class="personRole">${escapeHtml(safe(person.role))}</div>` : ""}
            </div>
          `).join("")}
        </div>
      </section>
    `).join("");
  }

  function renderDocuments(items){
    const mount = document.getElementById("electionsDocuments");
    if (!mount) return;

    mount.innerHTML = items.map(item => `
      <a
        class="documentLink"
        href="${escapeAttr(safe(item.url))}"
        ${item.external ? 'target="_blank" rel="noopener noreferrer"' : ""}
      >
        <span>${escapeHtml(safe(item.title))}</span>
      </a>
    `).join("");
  }

  function renderInformation(sections){
    const mount = document.getElementById("electionsInformation");
    if (!mount) return;

    mount.innerHTML = sections.map(section => {
      const paragraphs = (section.paragraphs || []).map(text =>
        `<p>${renderInlineLinks(safe(text), section.links || [])}</p>`
      ).join("");

      const list = Array.isArray(section.items) && section.items.length
        ? `<ul>${section.items.map(item => `<li>${renderInlineLinks(safe(item), section.links || [])}</li>`).join("")}</ul>`
        : "";

      const subsections = (section.subsections || []).map(sub => `
        <div class="infoSubsection">
          <h3>${escapeHtml(safe(sub.title))}</h3>
          ${(sub.paragraphs || []).map(text => `<p>${renderInlineLinks(safe(text), sub.links || [])}</p>`).join("")}
          ${Array.isArray(sub.items) && sub.items.length
            ? `<ul>${sub.items.map(item => `<li>${renderInlineLinks(safe(item), sub.links || [])}</li>`).join("")}</ul>`
            : ""}
        </div>
      `).join("");

      return `
        <article class="card infoCard ${section.width === "full" ? "full" : ""}">
          <h2>${escapeHtml(safe(section.title))}</h2>
          ${paragraphs}
          ${list}
          ${subsections}
        </article>
      `;
    }).join("");
  }

  function renderInlineLinks(text, links){
    let output = escapeHtml(text);
    (links || []).forEach(link => {
      const label = safe(link.label);
      const url = safe(link.url);
      if (!label || !url) return;
      const linked = `<a class="inlineLink" href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`;
      output = output.replace(escapeHtml(label), linked);
    });
    return output;
  }
}
