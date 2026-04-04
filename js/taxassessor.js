document.addEventListener("DOMContentLoaded", () => {
  initTaxAssessorPage();
});

async function initTaxAssessorPage(){
  try{
    const res = await fetch("/content/taxassessor.json", { cache: "no-store" });
    if(!res.ok) throw new Error("Failed to load /content/taxassessor.json");

    const data = await res.json();

    renderIntro(data.intro || {});
    renderChief(data.chiefAppraiser || {});
    renderLinks(data.officeLinks || {});
    renderMiscCards(data.miscCards || []);
  }catch(err){
    console.error(err);
    renderTaxAssessorError();
  }
}

function renderIntro(intro){
  const introText = document.getElementById("taIntroText");
  if(introText){
    introText.textContent = safeText(intro.text) || "";
  }
}

function renderChief(chief){
  const sub = document.getElementById("taChiefSub");
  const mount = document.getElementById("taChiefCardBody");

  if(sub) sub.textContent = safeText(chief.subtitle) || "";
  if(!mount) return;

  const name = safeText(chief.name);
  const role = safeText(chief.role || "Chief Appraiser");
  const phone = safeText(chief.phone);
  const email = safeText(chief.email);
  const office = safeText(chief.officeHours);
  const info = chief.text;
  const photoSrc = getPhotoSrc(chief);
  const photoAlt = getPhotoAlt(chief, name);

  const phoneHtml = phone
    ? isMobileDevice()
      ? `<a href="tel:${escapeAttr(phone)}">${escapeHtml(phone)}</a>`
      : escapeHtml(phone)
    : "";

  const emailHtml = email
    ? `<a href="mailto:${escapeAttr(email)}">${escapeHtml(email)}</a>`
    : "";

  mount.innerHTML = `
    <div class="taChiefPhotoWrap">
      <div class="taChiefPhoto">
        ${photoSrc
          ? `<img src="${escapeAttr(photoSrc)}" alt="${escapeAttr(photoAlt)}" loading="lazy">`
          : ``
        }
      </div>
    </div>

    <div class="taChiefBody">
      ${name ? `<h3 class="taChiefName">${escapeHtml(name)}</h3>` : ""}
      ${role ? `<p class="taChiefRole">${escapeHtml(role)}</p>` : ""}

      <div class="taChiefMeta">
        ${phone ? `<div class="taChiefMetaRow"><strong>Phone:</strong> ${phoneHtml}</div>` : ""}
        ${email ? `<div class="taChiefMetaRow"><strong>Email:</strong> ${emailHtml}</div>` : ""}
        ${office ? `<div class="taChiefMetaRow"><strong>Office Hours:</strong> ${escapeHtml(office)}</div>` : ""}
      </div>

      ${renderParagraphBlock(info, "taChiefInfo")}
    </div>
  `;
}

function renderLinks(officeLinks){
  const sub = document.getElementById("taLinksSub");
  const mount = document.getElementById("taLinksGrid");

  if(sub) sub.textContent = safeText(officeLinks.subtitle) || "";
  if(!mount) return;

  const links = Array.isArray(officeLinks.items)
    ? officeLinks.items.filter(item => item && item.enabled !== false)
    : [];

  if(!links.length){
    mount.innerHTML = `<div class="taEmpty">No office links are available right now.</div>`;
    return;
  }

  mount.innerHTML = links.map(item => {
    const label = safeText(item.label);
    const href = safeText(item.href);
    const variant = item.variant === "primary" ? "btn primary" : "btn";
    const newTab = item.newTab ? ` target="_blank" rel="noopener"` : "";

    if(!href){
      return `<button class="${variant}" type="button" disabled aria-disabled="true">${escapeHtml(label)}</button>`;
    }

    return `<a class="${variant}" href="${escapeAttr(href)}"${newTab}>${escapeHtml(label)}</a>`;
  }).join("");
}

function renderMiscCards(cards){
  const mount = document.getElementById("taMiscGrid");
  if(!mount) return;

  const visible = Array.isArray(cards)
    ? cards.filter(card => card && card.enabled !== false)
    : [];

  if(!visible.length){
    mount.innerHTML = "";
    return;
  }

  mount.innerHTML = visible.map(card => {
    const title = safeText(card.title);
    const subtitle = safeText(card.subtitle);
    const text = card.text;
    const list = Array.isArray(card.items) ? card.items.filter(Boolean) : [];

    let bodyHtml = "";

    if(list.length){
      bodyHtml = `
        <div class="taMiscCardBody">
          <ul class="taInfoList">
            ${list.map(item => `<li>${escapeHtml(safeText(item))}</li>`).join("")}
          </ul>
        </div>
      `;
    } else {
      bodyHtml = `
        <div class="taMiscCardBody">
          ${renderParagraphBlock(text, "taMiscText")}
        </div>
      `;
    }

    return `
      <section class="card" aria-label="${escapeAttr(title || "Additional information")}">
        <div class="cardHead">
          <h2 class="cardTitle">${escapeHtml(title)}</h2>
          ${subtitle ? `<p class="cardSub">${escapeHtml(subtitle)}</p>` : ""}
        </div>
        ${bodyHtml}
      </section>
    `;
  }).join("");
}

function renderParagraphBlock(value, className){
  const html = renderParagraphHtml(value);
  if(!html) return "";
  return `<div class="${className}">${html}</div>`;
}

function renderParagraphHtml(value){
  if(Array.isArray(value)){
    return value
      .map(item => safeText(item))
      .filter(Boolean)
      .map(item => `<p>${escapeHtml(item)}</p>`)
      .join("");
  }

  const text = safeText(value);
  if(!text) return "";

  return text
    .split(/\n\s*\n/)
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => `<p>${escapeHtml(part)}</p>`)
    .join("");
}

function getPhotoSrc(item){
  if(item.photo && typeof item.photo === "object"){
    return safeText(item.photo.src);
  }
  if(item.image && typeof item.image === "object"){
    return safeText(item.image.src);
  }
  return safeText(item.photo || item.image || item.img);
}

function getPhotoAlt(item, fallbackName){
  if(item.photo && typeof item.photo === "object" && safeText(item.photo.alt)){
    return safeText(item.photo.alt);
  }
  if(item.image && typeof item.image === "object" && safeText(item.image.alt)){
    return safeText(item.image.alt);
  }
  return fallbackName ? `Portrait of ${fallbackName}` : "Photo";
}

function renderTaxAssessorError(){
  const intro = document.getElementById("taIntroText");
  const chief = document.getElementById("taChiefCardBody");
  const links = document.getElementById("taLinksGrid");
  const misc = document.getElementById("taMiscGrid");

  if(intro) intro.textContent = "Tax Assessor information is unavailable right now.";
  if(chief) chief.innerHTML = `<div class="taEmpty">Chief Appraiser information is unavailable right now.</div>`;
  if(links) links.innerHTML = `<div class="taEmpty">Office links are unavailable right now.</div>`;
  if(misc) misc.innerHTML = "";
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

function isMobileDevice(){
  return (
    ("ontouchstart" in window) ||
    navigator.maxTouchPoints > 0 ||
    /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  );
}