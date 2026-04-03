// Public news page only

function renderNews(items){
  const list = document.getElementById("newsList");
  if(!list) return;

  const safe = (v) => (v === undefined || v === null) ? "" : String(v).trim();

  const escapeHtml = (value) =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const truncate = (text, limit = 280) => {
    const clean = safe(text).replace(/\s+/g, " ");
    if(!clean) return "";
    if(clean.length <= limit) return clean;

    const cut = clean.slice(0, limit);
    const lastSpace = cut.lastIndexOf(" ");
    const finalText = lastSpace > Math.floor(limit * 0.6) ? cut.slice(0, lastSpace) : cut;
    return `${finalText.trim()}…`;
  };

  const parseDate = (v) => {
    const d = new Date(safe(v));
    return isNaN(d.getTime()) ? new Date(0) : d;
  };

  const visible = (items || [])
    .filter(n => n && n.enabled !== false)
    .slice()
    .sort((a, b) => parseDate(b.date) - parseDate(a.date));

  if(!visible.length){
    list.innerHTML = `<div class="newsEmpty">No news posts are available right now.</div>`;
    return;
  }

  list.innerHTML = visible.map(n => {
    const title = safe(n.title || n.headline || "Update");
    const date = safe(n.date);
    const type = safe(n.type);
    const department = safe(n.department || n.office);
    const body = truncate(n.body || n.summary || n.excerpt || n.description || "", 280);

    return `
      <article class="newsItem" aria-label="${escapeHtml(title)}">
        <div class="newsTop">
          <h3 class="newsTitle">${escapeHtml(title)}</h3>
          ${type ? `<span class="tag">${escapeHtml(type)}</span>` : ""}
        </div>

        ${(date || department) ? `
          <div class="newsMeta">
            ${date ? `<span>${escapeHtml(date)}</span>` : ""}
            ${(date && department) ? `<span class="newsMetaSep">•</span>` : ""}
            ${department ? `<span class="newsDept">${escapeHtml(department)}</span>` : ""}
          </div>
        ` : ""}

        ${body ? `<div class="newsBody">${escapeHtml(body)}</div>` : ""}
      </article>
    `;
  }).join("");
}

document.addEventListener("DOMContentLoaded", async () => {
  const newsEl = document.getElementById("newsList");
  const newsPath = newsEl?.getAttribute("data-json");
  if (!newsPath) return;

  const alerts = await loadJSON("./content/alerts.json");
  if (typeof window.renderAlert === "function") {
    window.renderAlert(alerts || {});
  }

  const news = await loadJSON(newsPath);
  if (news?.items) renderNews(news.items);
  else if (Array.isArray(news)) renderNews(news);
  else {
    newsEl.innerHTML = `<div class="newsEmpty">News is unavailable right now.</div>`;
  }
});