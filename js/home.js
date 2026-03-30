// Public homepage only

function renderAnnouncementsList({
  newsUrl = "./content/news.json",
  mountId = "annList",
  maxItems = 3
} = {}) {
  const mount = document.getElementById(mountId);
  if (!mount) return;

  if (!mount.dataset.expandWired) {
    mount.addEventListener("click", (e) => {
      const btn = e.target.closest(".annExpandBtn");
      if (!btn) return;

      const bodyId = btn.getAttribute("data-expand");
      const p = document.getElementById(bodyId);
      if (!p) return;

      const expanded = btn.getAttribute("aria-expanded") === "true";

      if (expanded) {
        p.classList.add("clamp2");
        btn.setAttribute("aria-expanded", "false");
        btn.textContent = "View more";
      } else {
        p.classList.remove("clamp2");
        btn.setAttribute("aria-expanded", "true");
        btn.textContent = "View less";
      }
    });

    mount.dataset.expandWired = "1";
  }

  const safe = (v) => (v === undefined || v === null) ? "" : String(v).trim();
  const parseDate = (v) => {
    const s = safe(v);
    const d = new Date(s);
    return isNaN(d.getTime()) ? new Date(0) : d;
  };
  const fmtDate = (d) =>
    d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

  const start = async () => {
    let items = [];

    try {
      const res = await fetch(newsUrl, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load ${newsUrl}`);
      const data = await res.json();

      const list = Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : []);
      items = list
        .filter(x => x && (x.enabled !== false))
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
      const summary = safe(it.body || it.summary || it.excerpt || it.description || "");
      const url = safe(it.url || it.link || "news.html");
      const bodyId = `annBody-${i}`;

      return `
        <article class="annTile" style="margin-top:${i === 0 ? 0 : 12}px">
          <div class="annMetaRow">
            ${date.getTime() ? `<time class="annDate">${fmtDate(date)}</time>` : ""}
          </div>

          <h3 class="annTitle">${title}</h3>

          ${summary ? `
            <p class="annBody clamp2" id="${bodyId}">
              ${summary}
            </p>
            <button class="btn ghost annExpandBtn"
                    type="button"
                    data-expand="${bodyId}"
                    aria-expanded="false"
                    aria-controls="${bodyId}">
              View more
            </button>
          ` : ""}

          ${url ? `
            <div class="annFooter">
              <a class="annCta" href="${url}">Read more →</a>
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
      maxItems: 3
    });
  }
});