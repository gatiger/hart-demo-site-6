document.addEventListener("DOMContentLoaded", () => {
  initPaynesPage();
});

let paynesCarouselItems = [];
let paynesCarouselIndex = 0;

async function initPaynesPage(){
  try{
    const res = await fetch("/content/paynes_creek.json", { cache: "no-store" });
    if(!res.ok) throw new Error("Failed to load /content/paynes_creek.json");

    const data = await res.json();

    renderIntro(data.intro || {});
    renderQuickInfo(data.quickInfo || {});
    renderAbout(data.about || {});
    renderAmenities(data.amenities || {});
    renderFees(data.fees || {});
    renderRules(data.rules || {});
    renderGallery(data.gallery || {});
  }catch(err){
    console.error(err);
    renderPaynesError();
  }

  wirePaynesCarousel();
}

function renderIntro(intro){
  const introText = document.getElementById("paynesIntroText");
  if(introText){
    introText.textContent = safeText(intro.text) || "";
  }
}

function renderQuickInfo(quickInfo){
  const sub = document.getElementById("pcQuickInfoSub");
  const list = document.getElementById("pcQuickInfoList");
  if(sub) sub.textContent = safeText(quickInfo.subtitle) || "";
  if(!list) return;

  const items = Array.isArray(quickInfo.items) ? quickInfo.items.filter(Boolean) : [];
  if(!items.length){
    list.innerHTML = `<div class="paynesEmpty">Quick information is unavailable right now.</div>`;
    return;
  }

  list.innerHTML = items.map(item => {
    const title = safeText(item.title);
    const value = safeText(item.value);
    const isPhone = item.type === "phone";

    let valueHtml = value ? escapeHtml(value) : "";
    if(isPhone && value){
      valueHtml = isMobileDevice()
        ? `<a class="paynesPhoneLink" href="tel:${escapeAttr(value)}">${escapeHtml(value)}</a>`
        : `<span class="paynesPhoneText">${escapeHtml(value)}</span>`;
    }

    return `
      <div class="paynesQuickInfoItem">
        ${title ? `<div class="paynesQuickInfoTitle">${escapeHtml(title)}</div>` : ""}
        ${value ? `<div class="paynesQuickInfoValue">${valueHtml}</div>` : ""}
      </div>
    `;
  }).join("");
}

function renderAbout(about){
  const title = document.getElementById("pcAboutTitle");
  const text = document.getElementById("pcAboutText");

  if(title){
    title.textContent = safeText(about.title) || "About Paynes Creek Campground";
  }

  if(text){
    text.innerHTML = renderParagraphHtml(about.text);
  }
}

function renderAmenities(amenities){
  const sub = document.getElementById("pcAmenitiesSub");
  const list = document.getElementById("pcAmenitiesList");

  if(sub) sub.textContent = safeText(amenities.subtitle) || "";
  if(!list) return;

  const items = Array.isArray(amenities.items) ? amenities.items.filter(Boolean) : [];
  if(!items.length){
    list.innerHTML = `<li>Information is unavailable right now.</li>`;
    return;
  }

  list.innerHTML = items.map(item => `<li>${escapeHtml(safeText(item))}</li>`).join("");
}

function renderFees(fees){
  const sub = document.getElementById("pcFeesSub");
  const list = document.getElementById("pcFeesList");
  const buttons = document.getElementById("pcFeesButtons");

  if(sub) sub.textContent = safeText(fees.subtitle) || "";
  if(list){
    const items = Array.isArray(fees.items) ? fees.items.filter(Boolean) : [];
    if(!items.length){
      list.innerHTML = `<li>Information is unavailable right now.</li>`;
    }else{
      list.innerHTML = items.map(item => `<li>${escapeHtml(safeText(item))}</li>`).join("");
    }
  }

  if(buttons){
    const ctas = Array.isArray(fees.buttons) ? fees.buttons.filter(btn => btn && btn.enabled !== false) : [];
    buttons.innerHTML = ctas.map(btn => {
      const label = safeText(btn.label);
      const href = safeText(btn.href);
      const variant = btn.variant === "primary" ? "btn primary" : "btn";

      if(!href){
        return `<button class="${variant}" type="button" disabled aria-disabled="true">${escapeHtml(label)}</button>`;
      }

      const target = btn.newTab ? ` target="_blank" rel="noopener"` : "";
      return `<a class="${variant}" href="${escapeAttr(href)}"${target}>${escapeHtml(label)}</a>`;
    }).join("");
  }
}

function renderRules(rules){
  const sub = document.getElementById("pcRulesSub");
  const list = document.getElementById("pcRulesList");

  if(sub) sub.textContent = safeText(rules.subtitle) || "";
  if(!list) return;

  const items = Array.isArray(rules.items) ? rules.items.filter(Boolean) : [];
  if(!items.length){
    list.innerHTML = `<div class="paynesEmpty">Rules information is unavailable right now.</div>`;
    return;
  }

  list.innerHTML = items.map(item => {
    const title = safeText(item.title);
    const text = safeText(item.text);

    return `
      <div class="paynesRuleItem">
        ${title ? `<h3 class="paynesRuleTitle">${escapeHtml(title)}</h3>` : ""}
        ${text ? `<p class="paynesRuleText">${escapeHtml(text)}</p>` : ""}
      </div>
    `;
  }).join("");
}

function renderGallery(gallery){
  const sub = document.getElementById("pcGallerySub");
  if(sub) sub.textContent = safeText(gallery.subtitle) || "";

  paynesCarouselItems = Array.isArray(gallery.images)
    ? gallery.images.filter(item => item && item.enabled !== false)
    : [];

  renderPaynesCarousel();
}

function wirePaynesCarousel(){
  const prevBtn = document.getElementById("pcPrevBtn");
  const nextBtn = document.getElementById("pcNextBtn");

  if(prevBtn){
    prevBtn.addEventListener("click", () => {
      if(!paynesCarouselItems.length) return;
      paynesCarouselIndex = (paynesCarouselIndex - 1 + paynesCarouselItems.length) % paynesCarouselItems.length;
      renderPaynesCarousel();
    });
  }

  if(nextBtn){
    nextBtn.addEventListener("click", () => {
      if(!paynesCarouselItems.length) return;
      paynesCarouselIndex = (paynesCarouselIndex + 1) % paynesCarouselItems.length;
      renderPaynesCarousel();
    });
  }
}

function renderPaynesCarousel(){
  const stage = document.getElementById("pcCarouselStage");
  const meta = document.getElementById("pcCarouselMeta");
  const prevBtn = document.getElementById("pcPrevBtn");
  const nextBtn = document.getElementById("pcNextBtn");

  if(!stage || !meta) return;

  if(!paynesCarouselItems.length){
    stage.innerHTML = `<div class="paynesCarouselEmpty">No campground photos are available right now.</div>`;
    meta.textContent = "";
    if(prevBtn) prevBtn.disabled = true;
    if(nextBtn) nextBtn.disabled = true;
    return;
  }

  if(prevBtn) prevBtn.disabled = paynesCarouselItems.length < 2;
  if(nextBtn) nextBtn.disabled = paynesCarouselItems.length < 2;

  const item = paynesCarouselItems[paynesCarouselIndex];
  const src = safeText(item.src);
  const alt = safeText(item.alt) || "Paynes Creek Campground photo";
  const caption = safeText(item.caption);

  stage.innerHTML = `
    <figure class="paynesCarouselFigure">
      <img class="paynesCarouselImage" src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" loading="lazy">
      ${caption ? `<figcaption class="paynesCarouselCaption">${escapeHtml(caption)}</figcaption>` : ""}
    </figure>
  `;

  meta.textContent = `${paynesCarouselIndex + 1} of ${paynesCarouselItems.length}`;
}

function renderPaynesError(){
  const ids = [
    "pcQuickInfoList",
    "pcCarouselStage",
    "pcAboutText",
    "pcAmenitiesList",
    "pcFeesList",
    "pcRulesList"
  ];

  ids.forEach(id => {
    const el = document.getElementById(id);
    if(el) el.innerHTML = `<div class="paynesEmpty">This content is unavailable right now.</div>`;
  });

  const meta = document.getElementById("pcCarouselMeta");
  if(meta) meta.textContent = "";
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