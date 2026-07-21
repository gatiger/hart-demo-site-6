document.addEventListener("DOMContentLoaded", () => initExemptionsPage());

async function initExemptionsPage(){
  try{
    const res = await fetch("/content/taxassessor-exemptions.json", { cache: "no-store" });
    if(!res.ok) throw new Error("Failed to load exemptions JSON");
    const data = await res.json();

    renderHero(data.hero || {});
    renderNotice(data.notice || {});
    renderProcess(data.process || {});
    renderHelpfulDetails(data.helpfulDetails || {});
    renderInfoCards(data.infoCards || []);
  }catch(err){
    console.error(err);
    setText("exemptionsIntro", "Exemptions information is unavailable right now. Please contact the Tax Assessor’s Office for assistance.");
  }
}

function renderHero(hero){
  setText("exemptionsEyebrow", hero.eyebrow || "Tax Assessor");
  setText("exemptionsPageTitle", hero.title || "Exemptions Information");
  setText("exemptionsIntro", hero.intro || "Information about property tax exemptions.");

  const mount = document.getElementById("exemptionsActions");
  if(mount){
    const actions = Array.isArray(hero.actions) ? hero.actions.filter(x => x && x.enabled !== false) : [];
    mount.innerHTML = actions.map(renderAction).join("");
  }
}

function renderNotice(notice){
  const card = document.getElementById("exemptionsNoticeCard");
  const title = document.getElementById("exemptionsNoticeTitle");
  const body = document.getElementById("exemptionsNoticeBody");
  if(!card || !title || !body) return;

  const noticeTitle = safeText(notice.title);
  const noticeBody = renderParagraphs(notice.text);
  if(!noticeTitle && !noticeBody){
    card.hidden = true;
    return;
  }

  card.hidden = false;
  title.textContent = noticeTitle || "Important Information";
  body.innerHTML = noticeBody;
}

function renderProcess(process){
  setText("exemptionsStepsTitle", process.title || "Available Exemptions");
  setText("exemptionsStepsIntro", process.intro || "");

  const list = document.getElementById("exemptionsStepsList");
  if(!list) return;

  const steps = Array.isArray(process.steps) ? process.steps.filter(Boolean) : [];
  list.innerHTML = steps.map(step => `
    <li>
      <div class="exemptionsStepContent">
        ${safeText(step.title) ? `<h3>${escapeHtml(step.title)}</h3>` : ""}
        ${safeText(step.text) ? `<p>${escapeHtml(step.text)}</p>` : ""}
      </div>
    </li>
  `).join("");
}

function renderHelpfulDetails(details){
  setText("exemptionsSideTitle", details.title || "Helpful Details");
  setText("exemptionsSideIntro", details.intro || "");

  const mount = document.getElementById("exemptionsSideBlocks");
  if(!mount) return;

  const blocks = Array.isArray(details.blocks) ? details.blocks.filter(Boolean) : [];
  mount.innerHTML = blocks.map(block => {
    const items = Array.isArray(block.items) ? block.items.filter(Boolean) : [];
    return `
      <section class="exemptionsSideBlock" aria-label="${escapeAttr(block.title || "Exemption detail")}">
        ${safeText(block.title) ? `<h3>${escapeHtml(block.title)}</h3>` : ""}
        ${renderParagraphs(block.text)}
        ${items.length ? `<ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
      </section>
    `;
  }).join("");
}

function renderInfoCards(cards){
  const mount = document.getElementById("exemptionsInfoCards");
  if(!mount) return;

  const visible = Array.isArray(cards) ? cards.filter(card => card && card.enabled !== false) : [];
  mount.innerHTML = visible.map(card => {
    const items = Array.isArray(card.items) ? card.items.filter(Boolean) : [];
    const actions = Array.isArray(card.actions) ? card.actions.filter(x => x && x.enabled !== false) : [];
    return `
      <section class="card exemptionsInfoCard" aria-label="${escapeAttr(card.title || "Additional information")}">
        <div class="exemptionsCardHead">
          ${safeText(card.title) ? `<h2>${escapeHtml(card.title)}</h2>` : ""}
          ${safeText(card.subtitle) ? `<p>${escapeHtml(card.subtitle)}</p>` : ""}
        </div>
        <div class="exemptionsInfoBody">
          ${renderParagraphs(card.text)}
          ${items.length ? `<ul class="exemptionsInfoList">${items.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
          ${actions.length ? `<div class="exemptionsCardActions">${actions.map(renderAction).join("")}</div>` : ""}
        </div>
      </section>
    `;
  }).join("");
}

function renderAction(item){
  const label = safeText(item.label);
  const href = safeText(item.href);
  const variant = item.variant === "primary" ? "btn primary" : "btn";
  if(!href) return `<button class="${variant}" type="button" disabled aria-disabled="true">${escapeHtml(label)}</button>`;

  const isExternal = /^https?:\/\//i.test(href);
  const newTab = item.newTab || isExternal;
  const target = newTab ? ` target="_blank" rel="noopener"` : "";
  const sr = newTab ? `<span class="sr-only"> opens in a new tab</span>` : "";
  return `<a class="${variant}" href="${escapeAttr(href)}"${target}>${escapeHtml(label)}${sr}</a>`;
}

function renderParagraphs(value){
  if(Array.isArray(value)){
    return value.map(safeText).filter(Boolean).map(text => `<p>${escapeHtml(text)}</p>`).join("");
  }
  return safeText(value).split(/\n\s*\n/).map(safeText).filter(Boolean).map(text => `<p>${escapeHtml(text)}</p>`).join("");
}

function setText(id, value){
  const el = document.getElementById(id);
  if(el) el.textContent = safeText(value);
}

function safeText(value){
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

function escapeAttr(value){
  return escapeHtml(value);
}