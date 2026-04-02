document.addEventListener("DOMContentLoaded", () => {
  initEmsPage();
});

async function initEmsPage(){
  const sub = document.getElementById("emsSub");
  const aboutTitle = document.getElementById("emsAboutTitle");
  const aboutText = document.getElementById("emsAboutText");
  const staffSub = document.getElementById("emsStaffSub");
  const staffGrid = document.getElementById("emsStaffGrid");

  try{
    const res = await fetch("/content/ems.json", { cache: "no-store" });
    if(!res.ok) throw new Error("Failed to load /content/ems.json");

    const data = await res.json();

    if(sub) sub.textContent = safeText(data.subtitle) || "";

    if(aboutTitle){
      aboutTitle.textContent = safeText(data.about?.title) || "About EMS";
    }

    if(aboutText){
      renderRichTextBlock(aboutText, data.about?.text);
    }

    if(staffSub){
      staffSub.textContent = safeText(data.staff?.subtitle) || "";
    }

    if(staffGrid){
      renderStaff(staffGrid, data.staff?.people || []);
    }
  }catch(err){
    console.error(err);

    if(sub) sub.textContent = "Unable to load EMS content.";
    if(aboutTitle) aboutTitle.textContent = "About EMS";
    if(aboutText) aboutText.textContent = "EMS information is unavailable right now.";
    if(staffSub) staffSub.textContent = "";
    if(staffGrid){
      staffGrid.innerHTML = `<div class="emsEmpty">Staff information is unavailable right now.</div>`;
    }
  }
}

function renderStaff(mount, people){
  const visible = (people || []).filter(person => person && person.enabled !== false);

  if(!visible.length){
    mount.innerHTML = `<div class="emsEmpty">No staff entries are available right now.</div>`;
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
  const photo = safeText(person.photo || person.image || person.img);
  const bio = person.bio;
  const featured = person.featured === true || person.wide === true;

  const metaBits = [
    phone ? `<a href="tel:${escapeAttr(phone)}">${escapeHtml(phone)}</a>` : "",
    fax ? `<span>Fax: ${escapeHtml(fax)}</span>` : "",
    email ? `<a href="mailto:${escapeAttr(email)}">${escapeHtml(email)}</a>` : ""
  ].filter(Boolean).join("");

  const photoBlock = photo
    ? `
      <div class="emsPhoto">
        <img src="${escapeAttr(photo)}" alt="${escapeAttr(name || "EMS staff member")}">
      </div>
    `
    : `
      <div class="emsPhoto" aria-hidden="true"></div>
    `;

  if(featured){
    return `
      <article class="emsPerson emsPersonWide">
        <div class="emsLeft">
          ${photoBlock}
          <div class="emsBody">
            ${name ? `<h3 class="emsName">${escapeHtml(name)}</h3>` : ""}
            ${title ? `<p class="emsTitle">${escapeHtml(title)}</p>` : ""}
            ${metaBits ? `<div class="emsMeta">${metaBits}</div>` : ""}
            ${info ? `<div class="emsInfo">${escapeHtml(info)}</div>` : ""}
          </div>
        </div>
        <div class="emsBio">
          ${renderParagraphHtml(bio)}
        </div>
      </article>
    `;
  }

  return `
    <article class="emsPerson">
      ${photoBlock}
      <div class="emsBody">
        ${name ? `<h3 class="emsName">${escapeHtml(name)}</h3>` : ""}
        ${title ? `<p class="emsTitle">${escapeHtml(title)}</p>` : ""}
        ${metaBits ? `<div class="emsMeta">${metaBits}</div>` : ""}
        ${info ? `<div class="emsInfo">${escapeHtml(info)}</div>` : ""}
      </div>
    </article>
  `;
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