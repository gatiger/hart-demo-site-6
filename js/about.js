// Public About page only

document.addEventListener("DOMContentLoaded", async () => {
  const data = await loadJSON("./content/about.json");
  if (!data) return;

  renderAboutPage(data);
  initAboutSearch();
});

function renderAboutPage(data) {
  setText("aboutPageTitle", data.pageTitle);
  setText("aboutPageIntro", data.pageIntro);
  setText("aboutStatsIntro", data.statsIntro);

  renderAboutBadges(data.badges || []);
  renderAboutSections(data.sections || []);
  renderAboutStats(data.stats || []);
}

function renderAboutBadges(items) {
  const row = document.getElementById("aboutBadgeRow");
  if (!row) return;

  row.innerHTML = (items || []).map(item => {
    const label = safeText(item.label);
    const value = safeText(item.value);

    return `
      <div class="aboutBadge">
        <strong>${escapeHtml(label)}:</strong>
        <span>${escapeHtml(value)}</span>
      </div>
    `;
  }).join("");
}

function renderAboutSections(items) {
  const grid = document.getElementById("aboutInfoGrid");
  if (!grid) return;

  grid.innerHTML = (items || []).map((item, index) => {
    const title = safeText(item.title);
    const body = safeText(item.body);

    return `
      <article class="card aboutInfoCard aboutSearchItem" data-search-text="${escapeHtml((title + ' ' + body).toLowerCase())}">
        <h2 class="aboutInfoTitle">${escapeHtml(title)}</h2>
        <p class="aboutInfoText">${escapeHtml(body)}</p>
      </article>
    `;
  }).join("");
}

function renderAboutStats(items) {
  const list = document.getElementById("aboutStatsList");
  if (!list) return;

  list.innerHTML = (items || []).map(item => {
    const title = safeText(item.title);
    const value = safeText(item.value);

    return `
      <div class="item aboutSearchItem" data-search-text="${escapeHtml((title + ' ' + value).toLowerCase())}">
        <div class="itemTitle">${escapeHtml(title)}</div>
        <div class="meta">${escapeHtml(value)}</div>
      </div>
    `;
  }).join("");
}

function initAboutSearch() {
  const input = document.getElementById("aboutSearch");
  if (!input) return;

  input.addEventListener("input", () => {
    const q = safeText(input.value).toLowerCase();
    document.querySelectorAll(".aboutSearchItem").forEach(el => {
      const haystack = el.getAttribute("data-search-text") || "";
      el.classList.toggle("about-hidden", q && !haystack.includes(q));
    });
  });
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = safeText(value);
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