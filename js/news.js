// Public news page only

function renderNews(items){
  const list = document.getElementById("newsList");
  if(!list) return;

  const safe = (v) => (v === undefined || v === null) ? "" : String(v).trim();
  const visible = (items || []).filter(n => n.enabled !== false);

  list.innerHTML = visible.map(n => {
    const title = safe(n.title);
    const date  = safe(n.date);
    const type  = safe(n.type);
    const body  = safe(n.body);

    return `
      <article class="item" aria-label="${title || "News item"}">
        <div class="itemTop">
          <h3 class="itemTitle">${title}</h3>
          ${type ? `<span class="tag">${type}</span>` : ""}
        </div>
        ${(date || body) ? `
          <div class="meta">
            ${date ? `<span>${date}</span>` : ""}
            ${(date && body) ? `<span>•</span>` : ""}
            ${body ? `<span>${body}</span>` : ""}
          </div>
        ` : ""}
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
