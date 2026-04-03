// Public homepage only

function renderAnnouncementsList({
  newsUrl = "./content/news.json",
  mountId = "annList",
  maxItems = 3,
  maxSummaryLength = 220
} = {}) {
  const mount = document.getElementById(mountId);
  if (!mount) return;

  const safe = (v) => (v === undefined || v === null) ? "" : String(v).trim();

  const parseDate = (v) => {
    const s = safe(v);
    const d = new Date(s);
    return isNaN(d.getTime()) ? new Date(0) : d;
  };

  const fmtDate = (d) =>
    d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

  const escapeHtml = (value) =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const truncateText = (text, limit) => {
    const clean = safe(text).replace(/\s+/g, " ");
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
      const title = safe(it.title || it.headline || "Update");
      const date = parseDate(it.date);
      const summaryRaw = safe(it.body || it.summary || it.excerpt || it.description || "");
      const summary = truncateText(summaryRaw, maxSummaryLength);
      const url = safe(it.url || it.link || "news.html");

      return `
        <article class="annTile" style="margin-top:${i === 0 ? 0 : 12}px">
          <div class="annMetaRow">
            ${date.getTime() ? `<time class="annDate">${fmtDate(date)}</time>` : ""}
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

document.addEventListener("DOMContentLoaded", async () => {
  const site = await loadJSON("./content/site.json");
  const alerts = await loadJSON("./content/alerts.json");

  if (typeof window.renderAlert === "function") {
    window.renderAlert(alerts || site);
  }

  if (document.getElementById("annList")) {
    renderAnnouncementsList({
      newsUrl: "./content/news.json",
      mountId: "annList",
      maxItems: 3,
      maxSummaryLength: 220
    });
  }
});