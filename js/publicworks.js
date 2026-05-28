document.addEventListener("DOMContentLoaded", () => {
  initPublicWorks();
});

async function initPublicWorks(){
  const sub = document.getElementById("pwSub");

  try{
    const res = await fetch("/content/publicworks.json", { cache: "no-store" });
    if(!res.ok) throw new Error("Failed to load /content/publicworks.json");
    const data = await res.json();

    if(sub) sub.textContent = safeText(data.subtitle) || "";

    renderHero(data.hero || {});
    renderAbout(data.about || {});
    renderServices(data.services || {});
    renderDepartments(data.departments || {});
    renderPermits(data.permits || {});
    renderBids(data.bidPackets || {});
    renderStaff(data.staff || {});
  }catch(err){
    if(sub) sub.textContent = "Unable to load Public Works content.";
    console.error(err);
  }
}

function renderHero(hero){
  const titleEl = document.getElementById("pwHeroTitle");
  const leftEl  = document.getElementById("pwHeroLeft");
  const rightEl = document.getElementById("pwHeroRight");
  const ctasEl  = document.getElementById("pwHeroCtas");

  if(titleEl) titleEl.textContent = safeText(hero.title) || "Hart County Public Works";

  // Address
  const streetEl = document.getElementById("pwStreet");
  const cityEl   = document.getElementById("pwCityStateZip");

  if(streetEl) streetEl.textContent = safeText(hero.address?.street) || "";
  if(cityEl){
    const city  = safeText(hero.address?.city);
    const state = safeText(hero.address?.state);
    const zip   = safeText(hero.address?.zip);
    const cityState = [city, state].filter(Boolean).join(", ");
    cityEl.textContent = cityState + (zip ? " " + zip : "");
  }

  // Images
  injectImg(leftEl, hero.leftImage?.src, hero.leftImage?.alt || "Public Works photo");
  injectImg(rightEl, hero.rightImage?.src, hero.rightImage?.alt || "Public Works photo");

  // Buttons
  if(ctasEl){
    ctasEl.innerHTML = "";
    const buttons = Array.isArray(hero.buttons) ? hero.buttons : [];
    buttons.filter(b => b && b.enabled !== false).slice(0, 6).forEach(b => {
      const a = document.createElement("a");
      a.className = (b.variant === "ghost") ? "btn ghost" : "btn";
      a.textContent = safeText(b.label) || "Learn more";
      a.href = safeText(b.href) || "#";
      if(b.newTab === true){
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      }
      const aria = safeText(b.ariaLabel);
      if(aria) a.setAttribute("aria-label", aria);
      ctasEl.appendChild(a);
    });
  }
}

function renderAbout(about){
  const titleEl = document.getElementById("pwAboutTitle");
  const textEl  = document.getElementById("pwAboutText");
  if(titleEl) titleEl.textContent = safeText(about.title) || "What Public Works Does";
  if(textEl){
  const lines = Array.isArray(about.text) ? about.text : [about.text];
  textEl.innerHTML = lines
    .filter(Boolean)
    .map(p => `<p>${escapeHtml(safeText(p))}</p>`)
    .join("");
}
}

function renderServices(services){
  const subEl = document.getElementById("pwServicesSub");
  const grid  = document.getElementById("pwServicesGrid");
  if(!grid) return;

  if(subEl) subEl.textContent = safeText(services.subtitle) || "";

  const items = Array.isArray(services.items) ? services.items : [];
  const visible = items.filter(x => x && x.enabled !== false);

  grid.innerHTML = visible.map(s => `
    <article class="pwService">
      <h3>${escapeHtml(safeText(s.title) || "Service")}</h3>
      <p>${escapeHtml(safeText(s.text) || "")}</p>
    </article>
  `).join("");
}


function renderDepartments(departments){
  const subEl = document.getElementById("pwDepartmentsSub");
  const grid  = document.getElementById("pwDepartmentsGrid");
  if(!grid) return;

  const titleEl = document.getElementById("pwDepartmentsTitle");
  if(titleEl) titleEl.textContent = safeText(departments.title) || "Departments";
  if(subEl) subEl.textContent = safeText(departments.subtitle) || "";

  const items = Array.isArray(departments.items) ? departments.items : [];
  const visible = items.filter(x => x && x.enabled !== false);

  grid.innerHTML = visible.map(d => {
    const title = safeText(d.title) || "Department";
    const text = safeText(d.text) || "";
    const href = safeText(d.href);
    const label = safeText(d.buttonLabel) || "Learn more";
    const newTab = d.newTab === true ? ` target="_blank" rel="noopener noreferrer"` : "";
    return `
      <article class="pwDepartment">
        <h3>${escapeHtml(title)}</h3>
        ${text ? `<p>${escapeHtml(text)}</p>` : ``}
        ${href ? `<a class="btn ghost pwSmallBtn" href="${escapeAttr(href)}"${newTab}>${escapeHtml(label)}</a>` : ``}
      </article>
    `;
  }).join("");
}

function renderPermits(permits){
  const titleEl = document.getElementById("pwPermitsTitle");
  const subEl = document.getElementById("pwPermitsSub");
  const list = document.getElementById("pwPermitsLinks");
  renderLinkCard(permits, titleEl, subEl, list, "Permits & Applications", "No permit links are listed yet.");
}

function renderBids(bids){
  const titleEl = document.getElementById("pwBidsTitle");
  const subEl = document.getElementById("pwBidsSub");
  const list = document.getElementById("pwBidLinks");
  renderLinkCard(bids, titleEl, subEl, list, "Current Bid Packets", "No current bid packets are listed at this time.");
}

function renderLinkCard(section, titleEl, subEl, listEl, fallbackTitle, emptyText){
  if(titleEl) titleEl.textContent = safeText(section.title) || fallbackTitle;
  if(subEl) subEl.textContent = safeText(section.subtitle) || "";
  if(!listEl) return;

  const links = Array.isArray(section.links) ? section.links : [];
  const visible = links.filter(x => x && x.enabled !== false);

  if(!visible.length){
    listEl.innerHTML = `<p class="pwEmptyText">${escapeHtml(emptyText)}</p>`;
    return;
  }

  listEl.innerHTML = visible.map(link => {
    const label = safeText(link.label) || "Open link";
    const href = safeText(link.href) || "#";
    const description = safeText(link.description);
    const newTab = link.newTab === true ? ` target="_blank" rel="noopener noreferrer"` : "";
    const aria = safeText(link.ariaLabel) ? ` aria-label="${escapeAttr(link.ariaLabel)}"` : "";
    const variant = link.variant === "ghost" ? "btn ghost pwActionBtn" : "btn pwActionBtn";

    return `
      <div class="pwActionItem">
        <a class="${variant}" href="${escapeAttr(href)}"${newTab}${aria}>${escapeHtml(label)}</a>
        ${description ? `<p>${escapeHtml(description)}</p>` : ``}
      </div>
    `;
  }).join("");
}

function renderStaff(staff){
  const subEl = document.getElementById("pwStaffSub");
  const grid  = document.getElementById("pwStaffGrid");
  if(!grid) return;

  if(subEl) subEl.textContent = safeText(staff.subtitle) || "";

  const people = Array.isArray(staff.people) ? staff.people : [];
  const visible = people.filter(p => p && p.enabled !== false).slice(0, 12);

  grid.innerHTML = visible.map(p => staffCard(p)).join("");
}

function staffCard(p){
  const name  = safeText(p.name) || "Name";
  const title = safeText(p.title) || "";
  const phone = safeText(p.phone) || "";
  const fax   = safeText(p.fax) || "";
  const info  = safeText(p.info) || "";
  const imgSrc = safeText(p.photo?.src) || "";
  const imgAlt = safeText(p.photo?.alt) || `${name} photo`;

  const phoneLine = phone ? `<div><a href="tel:${telHref(phone)}">${escapeHtml(phone)}</a></div>` : "";
  const faxLine   = fax ? `<div>Fax: ${escapeHtml(fax)}</div>` : "";
  const metaBlock = (phone || fax) ? `<div class="pwMeta">${phoneLine}${faxLine}</div>` : "";
  
  const bio = Array.isArray(p.bio) ? p.bio : (p.bio ? [p.bio] : []);
  const bioHtml = bio
   .map(x => safeText(x))
   .filter(Boolean)
   .map(x => `<p>${escapeHtml(x)}</p>`)
   .join("");

  return `
  <article class="pwPerson pwPersonWide">
    <div class="pwLeft">
      <div class="pwPhoto">
        ${imgSrc
          ? `<img src="${escapeAttr(imgSrc)}" alt="${escapeAttr(imgAlt)}" loading="lazy">`
          : `<div class="muted">Add photo.src</div>`}
      </div>

      <div class="pwBody">
        <h3 class="pwName">${escapeHtml(name)}</h3>
        ${title ? `<div class="pwTitle">${escapeHtml(title)}</div>` : `<div class="pwTitle muted"></div>`}
        ${metaBlock}
        ${info ? `<div class="pwInfo">${escapeHtml(info)}</div>` : ``}
      </div>
    </div>

    <div class="pwBio" aria-label="Bio">
      ${bioHtml ? bioHtml : `<div class="muted"> </div>`}
    </div>
  </article>
`;
}

function injectImg(holder, src, alt){
  if(!holder) return;
  holder.innerHTML = "";
  const s = safeText(src);
  if(!s){
    holder.innerHTML = `<div class="muted">Add image src</div>`;
    return;
  }
  const img = document.createElement("img");
  img.src = s;
  img.alt = safeText(alt) || "Image";
  img.loading = "lazy";
  holder.appendChild(img);
}

function safeText(v){
  return (v === undefined || v === null) ? "" : String(v).trim();
}
function telHref(phone){
  return String(phone).replace(/[^\d+]/g, "");
}
function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
function escapeAttr(str){
  return escapeHtml(str);
}