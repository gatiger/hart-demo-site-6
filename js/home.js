// Public homepage only

document.addEventListener("DOMContentLoaded", async () => {
  const site = await loadJSON("./content/site.json");
  const alerts = await loadJSON("./content/alerts.json");
  const home = await loadJSON("./content/home.json");

  if (typeof window.renderAlert === "function") {
    window.renderAlert(alerts || site);
  }

  renderHomeWelcome(home?.welcome || {});
  renderHomeExtraCards(home?.extraCards || []);

  if (document.getElementById("annList")) {
    renderAnnouncementsList({
      newsUrl: "./content/news.json",
      mountId: "annList",
      maxItems: 3,
      maxSummaryLength: 220
    });
  }
});

function renderHomeWelcome(welcome){
  const titleEl = document.getElementById("homeWelcomeTitle");
  const bodyEl = document.getElementById("homeWelcomeBody");

  if (titleEl) {
    titleEl.textContent = safeText(welcome.title) || "Welcome to Hart County";
  }

  if (!bodyEl) return;

  bodyEl.innerHTML = "";

  const paragraphs = Array.isArray(welcome.body)
    ? welcome.body
    : [welcome.body];

  paragraphs
    .map(safeText)
    .filter(Boolean)
    .forEach(text => {
      const p = document.createElement("p");
      p.textContent = text;
      bodyEl.appendChild(p);
    });
}

function renderHomeExtraCards(items){
  const mount = document.getElementById("homeExtraCards");
  if (!mount) return;

  const cards = (items || []).filter(item => item && item.enabled !== false);

  if (!cards.length) {
    mount.innerHTML = `<p class="sub">No additional information is posted at this time.</p>`;
    return;
  }

  mount.innerHTML = cards.map(item => {
    const title = escapeHtml(safeText(item.title) || "Additional Information");
    const paragraphs = Array.isArray(item.body) ? item.body : [item.body];

    const bodyHtml = paragraphs
      .map(safeText)
      .filter(Boolean)
      .map(text => `<p>${escapeHtml(text)}</p>`)
      .join("");

    const url = safeText(item.url);

    if (url) {
      return `
        <a class="homeExtraCard homeExtraCardLink"
          href="${escapeHtml(url)}"
          target="_blank"
          rel="noopener">
          <h3 class="homeExtraCardTitle">${title}</h3>
          <div class="homeExtraCardBody">
            ${bodyHtml}
          </div>
        </a>
      `;
    }

    return `
      <article class="homeExtraCard">
        <h3 class="homeExtraCardTitle">${title}</h3>
        <div class="homeExtraCardBody">
          ${bodyHtml}
        </div>
      </article>
    `;
  }).join("");
}

function renderAnnouncementsList({
  newsUrl = "./content/news.json",
  mountId = "annList",
  maxItems = 3,
  maxSummaryLength = 220
} = {}) {
  const mount = document.getElementById(mountId);
  if (!mount) return;

  const parseDate = (v) => {
    const s = safeText(v);
    const d = new Date(s);
    return isNaN(d.getTime()) ? new Date(0) : d;
  };

  const fmtDate = (d) =>
    d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

  const truncateText = (text, limit) => {
    const clean = safeText(text).replace(/\s+/g, " ");
    if (!clean || clean.length <= limit) return clean;

    const shortened = clean.slice(0, limit);
    const lastSpace = shortened.lastIndexOf(" ");

    if (lastSpace > Math.floor(limit * 0.6)) {
      return `${shortened.slice(0, lastSpace).trim()}…`;
    }

    return `${shortened.trim()}…`;
  };

  const start = async () => {
    let items = [];

    try {
      const res = await fetch(newsUrl, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load ${newsUrl}`);
      const data = await res.json();

      const list = Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : []);
      items = list
        .filter(x => x && x.enabled !== false)
        .slice()
        .sort((a, b) => parseDate(b.date) - parseDate(a.date))
        .slice(0, maxItems);
    } catch (e) {
      mount.innerHTML = `<p class="sub">Announcements are unavailable right now.</p>`;
      console.warn(e);
      return;
    }

    if (!items.length) {
      mount.innerHTML = `<p class="sub">No announcements yet.</p>`;
      return;
    }

    mount.innerHTML = items.map((it, i) => {
      const title = safeText(it.title || it.headline || "Update");
      const date = parseDate(it.date);
      const department = safeText(it.department || it.office);
      const summaryRaw = safeText(it.body || it.summary || it.excerpt || it.description || "");
      const summary = truncateText(summaryRaw, maxSummaryLength);
      const url = safeText(it.url || it.link || "news.html");

      return `
        <article class="annTile" style="margin-top:${i === 0 ? 0 : 12}px">
          <div class="annMetaRow">
            ${date.getTime() ? `<time class="annDate">${fmtDate(date)}</time>` : ""}
            ${department ? `<span class="annDept">${escapeHtml(department)}</span>` : ""}
          </div>

          <h3 class="annTitle">${escapeHtml(title)}</h3>

          ${summary ? `
            <p class="annBody">
              ${escapeHtml(summary)}
            </p>
          ` : ""}

          ${url ? `
            <div class="annFooter">
              <a class="annCta" href="${escapeHtml(url)}">Read more →</a>
            </div>
          ` : ""}
        </article>
      `;
    }).join("");
  };

  start();
}

function safeText(v){
  return (v === undefined || v === null) ? "" : String(v).trim();
}

function escapeHtml(value){
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}