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

  const truncate = (text, limit = 300) => {
    const clean = safe(text).replace(/\s+/g, " ");
    if(clean.length <= limit) return clean;

    const cut = clean.slice(0, limit);
    const lastSpace = cut.lastIndexOf(" ");
    return (lastSpace > Math.floor(limit * 0.6) ? cut.slice(0, lastSpace) : cut).trim() + "…";
  };

  const visible = (items || []).filter(n => n.enabled !== false);

  list.innerHTML = visible.map(n => {
    const title = safe(n.title);
    const date = safe(n.date);
    const type = safe(n.type);
    const department = safe(n.department || n.office);
    const body = truncate(n.body, 280);

    return `
      <article class="newsItem">
        <div class="newsTop">
          <h3 class="newsTitle">${escapeHtml(title)}</h3>
          ${type ? `<span class="tag">${escapeHtml(type)}</span>` : ""}
        </div>

        ${(date || department) ? `
          <div class="newsMeta">
            ${date ? `<span>${escapeHtml(date)}</span>` : ""}
            ${(date && department) ? `<span> • </span>` : ""}
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

  const news = await loadJSON(newsPath);

  if (news?.items) renderNews(news.items);
  else if (Array.isArray(news)) renderNews(news);
});