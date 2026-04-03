// Public news page only

let allNewsItems = [];
let activeFilter = "All";
let activeSearch = "";

function safe(value){
  return value === undefined || value === null ? "" : String(value).trim();
}

function escapeHtml(value){
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function truncate(text, limit = 280){
  const clean = safe(text).replace(/\s+/g, " ");
  if(!clean) return "";
  if(clean.length <= limit) return clean;

  const cut = clean.slice(0, limit);
  const lastSpace = cut.lastIndexOf(" ");
  const finalText = lastSpace > Math.floor(limit * 0.6) ? cut.slice(0, lastSpace) : cut;
  return `${finalText.trim()}…`;
}

function parseDate(value){
  const d = new Date(safe(value));
  return isNaN(d.getTime()) ? new Date(0) : d;
}

function normalizeType(type){
  const t = safe(type).toLowerCase();

  if(t === "alert" || t === "alerts") return "Alert";
  if(t === "project" || t === "projects") return "Project";
  if(t === "press") return "Press";

  return safe(type);
}

function matchesFilter(item, filterValue){
  if(filterValue === "All") return true;
  return normalizeType(item.type) === filterValue;
}

function matchesSearch(item, searchValue){
  if(!searchValue) return true;

  const haystack = [
    item.title,
    item.headline,
    item.date,
    item.type,
    item.department,
    item.office,
    item.body,
    item.summary,
    item.excerpt,
    item.description
  ]
    .map(safe)
    .join(" ")
    .toLowerCase();

  return haystack.includes(searchValue.toLowerCase());
}

function getVisibleItems(items){
  return (items || [])
    .filter(item => item && item.enabled !== false)
    .filter(item => matchesFilter(item, activeFilter))
    .filter(item => matchesSearch(item, activeSearch))
    .slice()
    .sort((a, b) => parseDate(b.date) - parseDate(a.date));
}

function renderNews(items){
  const list = document.getElementById("newsList");
  if(!list) return;

  const visible = getVisibleItems(items);

  if(!visible.length){
    const hasSearch = !!safe(activeSearch);
    const hasFilter = activeFilter !== "All";

    let message = "No news posts are available right now.";
    if(hasSearch && hasFilter){
      message = `No posts match “${escapeHtml(activeSearch)}” in ${escapeHtml(activeFilter)}.`;
    }else if(hasSearch){
      message = `No posts match “${escapeHtml(activeSearch)}.”`;
    }else if(hasFilter){
      message = `No posts found in ${escapeHtml(activeFilter)}.`;
    }

    list.innerHTML = `<div class="newsEmpty">${message}</div>`;
    return;
  }

  list.innerHTML = visible.map(item => {
    const title = safe(item.title || item.headline || "Update");
    const date = safe(item.date);
    const type = normalizeType(item.type);
    const department = safe(item.department || item.office);
    const body = truncate(item.body || item.summary || item.excerpt || item.description || "", 280);

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

function setActivePill(filterValue){
  document.querySelectorAll(".filterBtn[data-filter]").forEach(btn => {
    const isActive = btn.getAttribute("data-filter") === filterValue;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}

function wireFilters(){
  document.querySelectorAll(".filterBtn[data-filter]").forEach(btn => {
    btn.addEventListener("click", () => {
      activeFilter = btn.getAttribute("data-filter") || "All";
      setActivePill(activeFilter);
      renderNews(allNewsItems);
    });
  });
}

function wireSearch(){
  const search = document.getElementById("newsSearch");
  if(!search) return;

  search.addEventListener("input", () => {
    activeSearch = search.value || "";
    renderNews(allNewsItems);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const newsEl = document.getElementById("newsList");
  const newsPath = newsEl?.getAttribute("data-json");
  if (!newsPath || !newsEl) return;

  const alerts = await loadJSON("./content/alerts.json");
  if (typeof window.renderAlert === "function") {
    window.renderAlert(alerts || {});
  }

  wireFilters();
  wireSearch();
  setActivePill(activeFilter);

  const news = await loadJSON(newsPath);

  if (news?.items) {
    allNewsItems = news.items;
    renderNews(allNewsItems);
  } else if (Array.isArray(news)) {
    allNewsItems = news;
    renderNews(allNewsItems);
  } else {
    newsEl.innerHTML = `<div class="newsEmpty">News is unavailable right now.</div>`;
  }
});