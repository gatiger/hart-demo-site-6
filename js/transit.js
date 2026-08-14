document.addEventListener("DOMContentLoaded", async () => {
  try {
    const data = await loadJSON("./content/transit.json");
    renderTransitPage(data || {});
  } catch (err) {
    console.error(err);
    const main = document.getElementById("main");
    if (main) main.insertAdjacentHTML("afterbegin", '<div class="card"><p class="sub">Unable to load Public Transit information at this time.</p></div>');
  }
});

function renderTransitPage(data){
  const safe = value => value === undefined || value === null ? "" : String(value).trim();
  const escapeHtml = value => String(value).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
  const intro = data.intro || {}, contact = data.contact || {}, photo = data.photo || {};

  setText("transitEyebrow", intro.eyebrow || "Hart County");
  setText("transitTitle", intro.title || "Hart County Public Transit");
  setText("transitDescription", intro.description || "");

  const image = document.getElementById("transitPhoto");
  if (image) {
    image.src = safe(photo.src) || "/assets/transitbus.jpg";
    image.alt = safe(photo.alt) || "Hart County Public Transit bus";
  }
  setText("transitPhotoCaption", photo.caption || "Hart County Public Transit");
  renderContact(contact);
  renderService(data.service || {});
  renderFares(data.fares || []);
  renderResources(data.resources || []);

  function setText(id,value){ const el=document.getElementById(id); if(el) el.textContent=safe(value); }
  function phoneMarkup(phone,raw){
    const shown=safe(phone), tel=safe(raw || shown.replace(/[^d+]/g,""));
    return shown ? `<span class="phoneDesktop">${escapeHtml(shown)}</span><a class="phoneMobile" href="tel:${escapeHtml(tel)}">${escapeHtml(shown)}</a>` : "";
  }
  function emailMarkup(email){
    const shown=safe(email);
    return shown ? `<span class="emailDesktop">${escapeHtml(shown)}</span><a class="emailMobile" href="mailto:${escapeHtml(shown)}">${escapeHtml(shown)}</a>` : "";
  }
  function renderContact(item){
    const mount=document.getElementById("transitContact"); if(!mount) return;
    const address=[item.location,item.street_address,item.city_state_zip].filter(Boolean).join("\n");
    mount.innerHTML=`<div class="contactList">
      ${address ? `<div class="contactItem"><span class="contactLabel">Office</span><div class="contactValue">${escapeHtml(address)}</div></div>` : ""}
      ${safe(item.director) ? `<div class="contactItem"><span class="contactLabel">Director</span><div class="contactValue">${escapeHtml(safe(item.director))}</div></div>` : ""}
      ${safe(item.phone) ? `<div class="contactItem"><span class="contactLabel">Phone</span><div class="contactValue">${phoneMarkup(item.phone,item.phone_raw)}${safe(item.tty) ? ` (${escapeHtml(safe(item.tty))})` : ""}</div></div>` : ""}
      ${safe(item.fax) ? `<div class="contactItem"><span class="contactLabel">Fax</span><div class="contactValue">${escapeHtml(safe(item.fax))}</div></div>` : ""}
      ${safe(item.email) ? `<div class="contactItem"><span class="contactLabel">Email</span><div class="contactValue">${emailMarkup(item.email)}</div></div>` : ""}
    </div>`;
  }
  function renderService(item){
    const mount=document.getElementById("transitService"); if(!mount) return;
    const rows=[["Service Area",item.area],["Hours of Operation",item.hours],["Funding",item.funding],["Operations",item.operations]];
    mount.innerHTML=`<div class="transitServiceList">${rows.filter(([,value])=>safe(value)).map(([label,value])=>`<div class="transitServiceRow"><span class="transitServiceLabel">${escapeHtml(label)}</span><div class="transitServiceValue">${escapeHtml(safe(value))}</div></div>`).join("")}</div>`;
  }
  function renderFares(items){
    const mount=document.getElementById("transitFares");
    if(mount) mount.innerHTML=items.map(item=>`<div class="transitFare"><span class="transitFareAmount">${escapeHtml(safe(item.amount))}</span><div class="transitFareDescription">${escapeHtml(safe(item.description))}</div></div>`).join("");
  }
  function renderResources(items){
    const mount=document.getElementById("transitResources");
    if(mount) mount.innerHTML=items.map(item=>`<a class="transitTextLink" href="${escapeHtml(safe(item.url))}" target="_blank" rel="noopener noreferrer">${escapeHtml(safe(item.title))}</a>`).join("");
  }
}
