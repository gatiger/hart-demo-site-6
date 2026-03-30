// Public directory page only

function renderDirectory(items) {
  const list = document.getElementById("directoryList");
  if (!list) return;

  const safe = (v) => (v === undefined || v === null) ? "" : String(v).trim();
  const visible = (items || [])
  .filter(d => d.enabled !== false)
  .sort((a, b) =>
    (a.title || "").localeCompare((b.title || ""), undefined, { sensitivity: "base" })
  );

  list.innerHTML = visible.map(d => {
    const name  = safe(d.name);
    const dept  = safe(d.department || d.dept || d.tag || "");
    const title = safe(d.title || d.role || "");

    const phone = safe(d.phone);
    const fax   = safe(d.fax);
    const email = safe(d.email);

    const pageUrl    = safe(d.url);
    const websiteUrl = safe(d.website);

    const hours = safe(d.hours);
    const desc  = safe(d.description);

    const telHref  = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : "";
    const faxHref  = fax ? `tel:${fax.replace(/[^\d+]/g, "")}` : "";
    const mailHref = email ? `mailto:${email}` : "";

    const webHref = websiteUrl
      ? (websiteUrl.startsWith("http://") || websiteUrl.startsWith("https://")
          ? websiteUrl
          : `https://${websiteUrl}`)
      : "";

    const titleHref = pageUrl || webHref;

    const metaParts = [];
    if (Array.isArray(d.phone)) {
      d.phone.forEach(num => {
        const clean = safe(num);
        if (!clean) return;
        const tel = `tel:${clean.replace(/[^\d+]/g, "")}`;
        metaParts.push(`<a href="${tel}" class="phone-link">${clean}</a>`);
      });
    } else if (phone) {
      metaParts.push(`<a href="${telHref}" class="phone-link">${phone}</a>`);
    }

    if (fax)   metaParts.push(`<a href="${faxHref}" class="phone-link">Fax: ${fax}</a>`);
    if (email) metaParts.push(`<a href="${mailHref}" class="link">Email ${name || "office"}</a>`);

    const displayTitle = title || name || "Unnamed";

    return `
      <article class="item" aria-label="${displayTitle}">
        <div class="itemTop">
          <div>
            <h3 class="itemTitle">
              ${titleHref
                ? `<a href="${titleHref}"
                      class="title-link ${titleHref.startsWith("http") ? "external-link" : ""}"
                      ${titleHref.startsWith("http") ? 'target="_blank" rel="noopener noreferrer"' : ""}>
                      ${displayTitle}
                      ${titleHref.startsWith("http") ? `
                        <span class="extIcon" aria-hidden="true">
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" focusable="false">
                            <path d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3z"/>
                            <path d="M5 5h6v2H7v10h10v-4h2v6H5z"/>
                          </svg>
                        </span>
                        <span class="sr-only">(opens in a new tab)</span>
                      ` : ""}
                    </a>`
                : displayTitle
              }
            </h3>
            ${title && name ? `<div class="sub" style="margin-top:4px">${name}</div>` : ""}
            ${dept ? `<div class="sub" style="margin-top:4px">${dept}</div>` : ""}
          </div>
        </div>

        ${metaParts.length ? `<div class="meta">${metaParts.join(`<span>•</span>`)}</div>` : ""}
        ${hours ? `<div class="meta"><span>Hours: ${hours}</span></div>` : ""}
        ${desc ? `<p class="sub" style="margin-top:6px">${desc}</p>` : ""}
      </article>
    `;
  }).join("");

  const isDesktop = window.matchMedia("(min-width: 769px)").matches;
  document.querySelectorAll("#directoryList .phone-link").forEach(a => {
    if (isDesktop) {
      a.setAttribute("tabindex", "-1");
      a.setAttribute("aria-hidden", "true");
    } else {
      a.removeAttribute("tabindex");
      a.removeAttribute("aria-hidden");
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const dirEl = document.getElementById("directoryList");
  const dirPath = dirEl?.getAttribute("data-json");
  if (!dirPath) return;

  const directory = await loadJSON(dirPath);
  if (directory?.items) renderDirectory(directory.items);
  else if (Array.isArray(directory)) renderDirectory(directory);
});
