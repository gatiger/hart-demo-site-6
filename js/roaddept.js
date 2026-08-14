document.addEventListener("DOMContentLoaded",async()=>{try{const data=await loadJSON("./content/roaddept.json");renderRoadsPage(data||{})}catch(err){console.error(err);const main=document.getElementById("main");if(main)main.insertAdjacentHTML("afterbegin",'<div class="card"><p class="sub">Unable to load Roads Department information at this time.</p></div>')}});

function renderRoadsPage(data){
  const safe=value=>value===undefined||value===null?"":String(value).trim();
  const escapeHtml=value=>String(value).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
  const intro=data.intro||{};
  setText("roadsEyebrow",intro.eyebrow||"Hart County");setText("roadsTitle",intro.title||"Hart County Roads Department");setText("roadsDescription",intro.description||"");
  renderContact(data.contact||{});renderEmergency(data.emergency||{});renderParagraphs("roadsWork",data.work_orders||[]);renderParagraphs("roadsMaintenance",data.maintenance||[]);renderParagraphs("roadsInventory",data.road_inventory||[]);renderParagraphs("roadsMowing",data.mowing||[]);renderParagraphs("roadsPlan",data.long_range_plan||[]);renderLinks(data.resources||[]);renderGallery(data.gallery||[]);
  function setText(id,value){const el=document.getElementById(id);if(el)el.textContent=safe(value)}
  function phoneMarkup(phone,raw){const shown=safe(phone),tel=safe(raw||shown.replace(/[^d+]/g,""));return shown?`<span class="phoneDesktop">${escapeHtml(shown)}</span><a class="phoneMobile" href="tel:${escapeHtml(tel)}">${escapeHtml(shown)}</a>`:""}
  function emailMarkup(email){const shown=safe(email);return shown?`<span class="emailDesktop">${escapeHtml(shown)}</span><a class="emailMobile" href="mailto:${escapeHtml(shown)}">${escapeHtml(shown)}</a>`:""}
  function renderContact(item){const mount=document.getElementById("roadsContact");if(!mount)return;mount.innerHTML=`<div class="contactList">${safe(item.work_order_phone)?`<div><span class="contactLabel">Work Orders</span><div class="contactValue">${phoneMarkup(item.work_order_phone,item.work_order_phone_raw)}</div></div>`:""}${safe(item.email)?`<div><span class="contactLabel">Email</span><div class="contactValue">${emailMarkup(item.email)}</div></div>`:""}</div>`}
  function renderEmergency(item){const mount=document.getElementById("roadsEmergency");if(!mount)return;const phone=safe(item.phone),tel=safe(item.phone_raw||phone.replace(/[^d+]/g,""));mount.innerHTML=`<p>${escapeHtml(safe(item.text))} ${phone?`<a href="tel:${escapeHtml(tel)}">${escapeHtml(phone)}</a>`:""}</p>`}
  function renderParagraphs(id,items){const mount=document.getElementById(id);if(mount)mount.innerHTML=items.map(text=>`<p>${escapeHtml(safe(text))}</p>`).join("")}
  function renderLinks(items){const mount=document.getElementById("roadsResources");if(mount)mount.innerHTML=items.map(item=>`<a class="roadsTextLink" href="${escapeHtml(safe(item.url))}" target="_blank" rel="noopener noreferrer">${escapeHtml(safe(item.title))}</a>`).join("")}
  function renderGallery(items){const mount=document.getElementById("roadsGallery");if(mount)mount.innerHTML=items.map(item=>`<figure class="roadsFigure"><img src="${escapeHtml(safe(item.src))}" alt="${escapeHtml(safe(item.alt))}" loading="lazy"><figcaption>${escapeHtml(safe(item.caption))}</figcaption></figure>`).join("")}
}
