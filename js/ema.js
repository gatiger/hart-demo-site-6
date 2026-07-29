document.addEventListener("DOMContentLoaded", async () => {
  try {
    const data = await loadJSON("./content/ema.json");
    renderEmaPage(data || {});
  } catch (err) {
    console.error(err);
    const main = document.getElementById("main");
    if (main) main.insertAdjacentHTML("afterbegin", '<div class="card"><p class="sub">Unable to load Emergency Management information at this time.</p></div>');
  }
});

function renderEmaPage(data){
  const safe = value => value === undefined || value === null ? "" : String(value).trim();
  const escapeHtml = value => String(value).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
  const escapeAttr = escapeHtml;
  const intro=data.intro||{};
  setText("emaEyebrow",intro.eyebrow||"Hart County");
  setText("emaTitle",intro.title||"Emergency Management Agency");
  setText("emaDescription",intro.description||"");
  renderContact(data.contact||{});
  renderParagraphs("emaFunction",data.function_paragraphs||[]);
  renderParagraphs("emaMission",data.mission_paragraphs||[]);
  renderLinks("emaResources",data.resources||[]);
  renderLinks("emaRelated",data.related_services||[]);

  function setText(id,value){const el=document.getElementById(id);if(el)el.textContent=safe(value)}
  function phoneMarkup(phone,raw){const shown=safe(phone),tel=safe(raw||shown.replace(/[^\d+]/g,""));return shown?`<span class="phoneDesktop">${escapeHtml(shown)}</span><a class="phoneMobile" href="tel:${escapeAttr(tel)}">${escapeHtml(shown)}</a>`:""}
  function emailMarkup(email){const shown=safe(email);return shown?`<span class="emailDesktop">${escapeHtml(shown)}</span><a class="emailMobile" href="mailto:${escapeAttr(shown)}">${escapeHtml(shown)}</a>`:""}
  function renderContact(contact){
    const mount=document.getElementById("emaContact");if(!mount)return;
    const address=[contact.address,contact.city_state_zip].filter(Boolean).join("\n");
    const items=[];
    if(safe(contact.director))items.push(["Director",escapeHtml(safe(contact.director))]);
    if(address)items.push(["Address",escapeHtml(address)]);
    if(safe(contact.phone))items.push(["Office",phoneMarkup(contact.phone,contact.phone_raw)]);
    if(safe(contact.fax))items.push(["Fax",escapeHtml(safe(contact.fax))]);
    if(safe(contact.email))items.push(["Email",emailMarkup(contact.email)]);
    mount.innerHTML=`<div class="contactList">${items.map(([label,value])=>`<div class="contactItem"><span class="contactLabel">${escapeHtml(label)}</span><div class="contactValue">${value}</div></div>`).join("")}</div>`;
  }
  function renderParagraphs(id,items){const mount=document.getElementById(id);if(mount)mount.innerHTML=items.map(x=>`<p>${escapeHtml(safe(x))}</p>`).join("")}
  function renderLinks(id,items){const mount=document.getElementById(id);if(!mount)return;mount.innerHTML=items.map(item=>`<a class="emaTextLink" href="${escapeAttr(safe(item.url))}" ${item.external?'target="_blank" rel="noopener noreferrer"':''}>${escapeHtml(safe(item.title))}</a>`).join("")}
}
