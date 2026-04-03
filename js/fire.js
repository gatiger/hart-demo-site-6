document.addEventListener("DOMContentLoaded", () => {
  initFirePage();
});

let fireCarouselItems = [];
let fireCarouselIndex = 0;

async function initFirePage(){
  const aboutTitle = document.getElementById("fireAboutTitle");
  const aboutText = document.getElementById("fireAboutText");
  const gallerySub = document.getElementById("fireGallerySub");
  const staffSub = document.getElementById("fireStaffSub");
  const staffGrid = document.getElementById("fireStaffGrid");
  const banner = document.getElementById("fireBannerImg");

  if (banner) {
    banner.addEventListener("error", () => {
      console.warn("Fire banner SVG not found at:", banner.src);
    });
  }

  try{
    const res = await fetch("/content/fire.json", { cache: "no-store" });
    if(!res.ok) throw new Error("Failed to load /content/fire.json");

    const data = await res.json();

    if(aboutTitle){
      aboutTitle.textContent = safeText(data.about?.title) || "About the Fire Department";
    }

    if(aboutText){
      renderRichTextBlock(aboutText, data.about?.text);
    }

    if(gallerySub){
      gallerySub.textContent = safeText(data.gallery?.subtitle) || "";
    }

    fireCarouselItems = Array.isArray(data.gallery?.images)
      ? data.gallery.images.filter(item => item && item.enabled !== false)
      : [];

    renderFireCarousel();

    if(staffSub){
      staffSub.textContent = safeText(data.staff?.subtitle) || "";
    }

    if(staffGrid){
      renderStaff(staffGrid, data.staff?.people || []);
    }
  }catch(err){
    console.error(err);

    if(aboutTitle) aboutTitle.textContent = "About the Fire Department";
    if(aboutText) aboutText.textContent = "Fire Department information is unavailable right now.";
    if(gallerySub) gallerySub.textContent = "";
    renderFireCarouselError();
    if(staffSub) staffSub.textContent = "";
    if(staffGrid){
      staffGrid.innerHTML = `<div class="fireEmpty">Staff information is unavailable right now.</div>`;
    }
  }

  wireFireCarousel();
}

function wireFireCarousel(){
  const prevBtn = document.getElementById("firePrevBtn");
  const nextBtn = document.getElementById("fireNextBtn");

  if(prevBtn){
    prevBtn.addEventListener("click", () => {
      if(!fireCarouselItems.length) return;
      fireCarouselIndex = (fireCarouselIndex - 1 + fireCarouselItems.length) % fireCarouselItems.length;
      renderFireCarousel();
    });
  }

  if(nextBtn){
    nextBtn.addEventListener("click", () => {
      if(!fireCarouselItems.length) return;
      fireCarouselIndex = (fireCarouselIndex + 1) % fireCarouselItems.length;
      renderFireCarousel();
    });
  }
}

function renderFireCarousel(){
  const stage = document.getElementById("fireCarouselStage");
  const meta = document.getElementById("fireCarouselMeta");
  const prevBtn = document.getElementById("firePrevBtn");
  const nextBtn = document.getElementById("fireNextBtn");

  if(!stage || !meta) return;

  if(!fireCarouselItems.length){
    stage.innerHTML = `<div class="fireCarouselEmpty">No gallery images are available right now.</div>`;
    meta.textContent = "";
    if(prevBtn) prevBtn.disabled = true;
    if(nextBtn) nextBtn.disabled = true;
    return;
  }

  if(prevBtn) prevBtn.disabled = fireCarouselItems.length < 2;
  if(nextBtn) nextBtn.disabled = fireCarouselItems.length < 2;

  const item = fireCarouselItems[fireCarouselIndex];
  const src = safeText(item.src);
  const alt = safeText(item.alt) || "Fire Department photo";
  const caption = safeText(item.caption);

  stage.innerHTML = `
    <figure class="fireCarouselFigure">
      <img class="fireCarouselImage" src="${escapeAttr(src)}" alt="${escapeAttr(alt)}">
      ${caption ? `<figcaption class="fireCarouselCaption">${escapeHtml(caption)}</figcaption>` : ""}
    </figure>
  `;

  meta.textContent = `${fireCarouselIndex + 1} of ${fireCarouselItems.length}`;
}

function renderFireCarouselError(){
  const stage = document.getElementById("fireCarouselStage");
  const meta = document.getElementById("fireCarouselMeta");
  const prevBtn = document.getElementById("firePrevBtn");
  const nextBtn = document.getElementById("fireNextBtn");

  if(stage){
    stage.innerHTML = `<div class="fireCarouselEmpty">Gallery information is unavailable right now.</div>`;
  }
  if(meta) meta.textContent = "";
  if(prevBtn) prevBtn.disabled = true;
  if(nextBtn) nextBtn.disabled = true;
}

function renderStaff(mount, people){
  const visible = (people || []).filter(person => person && person.enabled !== false);

  if(!visible.length){
    mount.innerHTML = `<div class="fireEmpty">No staff entries are available right now.</div>`;
    return;
  }

  mount.innerHTML = visible.map(person => renderStaffCard(person)).join("");
}

function renderStaffCard(person){
  const name = safeText(person.name);
  const title = safeText(person.title || person.role);
  const phone = safeText(person.phone);
  const fax = safeText(person.fax);
  const email = safeText(person.email);
  const info = safeText(person.info || person.description);
  const photoSrc = getPhotoSrc(person);
  const photoAlt = getPhotoAlt(person, name);

  const metaBits = [
    phone ? `<a href="tel:${escapeAttr(phone)}">${escapeHtml(phone)}</a>` : "",
    fax ? `<span>Fax: ${escapeHtml(fax)}</span>` : "",
    email ? `<a href="mailto:${escapeAttr(email)}">${escapeHtml(email)}</a>` : ""
  ].filter(Boolean).join("");

  const photoBlock = photoSrc
    ? `
      <div class="firePhoto">
        <img src="${escapeAttr(photoSrc)}" alt="${escapeAttr(photoAlt)}">
      </div>
    `
    : `
      <div class="firePhoto" aria-hidden="true"></div>
    `;

  return `
    <article class="firePerson">
      ${photoBlock}
      <div class="fireBody">
        ${name ? `<h3 class="fireName">${escapeHtml(name)}</h3>` : ""}
        ${title ? `<p class="fireTitle">${escapeHtml(title)}</p>` : ""}
        ${metaBits ? `<div class="fireMeta">${metaBits}</div>` : ""}
        ${info ? `<div class="fireInfo">${escapeHtml(info)}</div>` : ""}
      </div>
    </article>
  `;
}

function getPhotoSrc(person){
  if(person.photo && typeof person.photo === "object"){
    return safeText(person.photo.src);
  }

  if(person.image && typeof person.image === "object"){
    return safeText(person.image.src);
  }

  return safeText(person.photo || person.image || person.img);
}

function getPhotoAlt(person, name){
  if(person.photo && typeof person.photo === "object" && safeText(person.photo.alt)){
    return safeText(person.photo.alt);
  }

  if(person.image && typeof person.image === "object" && safeText(person.image.alt)){
    return safeText(person.image.alt);
  }

  return name ? `Portrait of ${name}` : "Fire Department staff member";
}

function renderRichTextBlock(mount, value){
  mount.innerHTML = renderParagraphHtml(value);
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