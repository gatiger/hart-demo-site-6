document.addEventListener("DOMContentLoaded", initAccessibility);

async function initAccessibility() {
  const mount = document.getElementById("accessibilityContent");
  if (!mount) return;

  try {
    const data = await loadJSON("./content/accessibility.json");
    if (!data) throw new Error("Unable to load accessibility content.");

    renderAccessibility(data);
  } catch (err) {
    console.error(err);
    mount.innerHTML = `
      <section class="card accessCard">
        <div class="cardHead">
          <h1 class="cardTitle">Accessibility</h1>
        </div>
        <div class="prose">
          <p class="muted">Unable to load accessibility information.</p>
        </div>
      </section>
    `;
  }
}

function renderAccessibility(data) {
  const mount = document.getElementById("accessibilityContent");
  if (!mount) return;

  let html = `
    <section class="pageHead" aria-labelledby="accessibilityPageTitle">
      <h1 id="accessibilityPageTitle" class="pageTitle">${escapeHtml(safeText(data.title))}</h1>
      ${safeText(data.subtitle) ? `<p class="pageSub">${escapeHtml(data.subtitle)}</p>` : ""}
    </section>
  `;

  (Array.isArray(data.sections) ? data.sections : []).forEach(section => {
    html += `
      <section class="card accessCard">
        <div class="cardHead">
          <h2 class="cardTitle">${escapeHtml(safeText(section.title))}</h2>
        </div>
        <div class="prose">
    `;

    if (Array.isArray(section.paragraphs)) {
      section.paragraphs.forEach(p => {
        html += `<p>${escapeHtml(safeText(p))}</p>`;
      });
    }

    if (Array.isArray(section.list) && section.list.length) {
      html += `<ul>`;
      section.list.forEach(item => {
        html += `<li>${escapeHtml(safeText(item))}</li>`;
      });
      html += `</ul>`;
    }

    html += `
        </div>
      </section>
    `;
  });

  const contact = data.contact || {};
  html += `
    <section class="card accessCard contactCard">
      <div class="cardHead">
        <h2 class="cardTitle">${escapeHtml(safeText(contact.title || "Contact information"))}</h2>
      </div>

      <div class="prose">
        <div class="accessContactBlock">
          <p>
            ${escapeHtml(safeText(contact.name))}<br>
            ${escapeHtml(safeText(contact.street))}<br>
            ${escapeHtml(safeText(contact.city))}, ${escapeHtml(safeText(contact.state))} ${escapeHtml(safeText(contact.zip))}
          </p>

          ${safeText(contact.phone) ? `
            <p>
              Phone:
              <a href="tel:${safeText(contact.phone).replace(/[^0-9]/g, "")}">
                ${escapeHtml(safeText(contact.phone))}
              </a>
            </p>
          ` : ""}

          ${safeText(contact.email) ? `
            <p>
              Email:
              <a href="mailto:${escapeHtml(safeText(contact.email))}">
                ${escapeHtml(safeText(contact.email))}
              </a>
            </p>
          ` : ""}

          ${safeText(data.lastUpdated) ? `
            <p class="muted">Last updated: ${escapeHtml(safeText(data.lastUpdated))}</p>
          ` : ""}
        </div>
      </div>
    </section>
  `;

  mount.innerHTML = html;
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