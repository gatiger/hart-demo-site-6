document.addEventListener("DOMContentLoaded",async()=>{try{const d=await loadJSON("./content/shop.json");renderShop(d||{})}catch(e){console.error(e)}});

function renderShop(d){
 const safe=v=>v==null?"":String(v).trim();
 const esc=v=>String(v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
 const intro=d.intro||{};
 text("shopEyebrow",intro.eyebrow||"Hart County"); text("shopTitle",intro.title||"Hart County Vehicle Maintenance"); text("shopDescription",intro.description||"");
 contact(d.contact||{}); paras("shopOverview",d.overview||[]); paras("shopRebuild",d.rebuild||[]); paras("shopFabrication",d.fabrication||[]);
 photo("shopFacilityPhoto",d.feature_image); photo("shopRebuildPhoto",d.rebuild_image); gallery(d.gallery||[]);
 function text(id,v){const e=document.getElementById(id);if(e)e.textContent=safe(v)}
 function phone(p){let t=safe(p).replace(/[^\d+]/g,"");return `<span class="phoneDesktop">${esc(p)}</span><a class="phoneMobile" href="tel:${t}">${esc(p)}</a>`}
 function email(e){return `<span class="emailDesktop">${esc(e)}</span><a class="emailMobile" href="mailto:${esc(e)}">${esc(e)}</a>`}
 function contact(c){const m=document.getElementById("shopContact");if(!m)return;m.innerHTML=`<div class="contactList">${c.phone?`<div><span class="contactLabel">Telephone</span><div class="contactValue">${phone(c.phone)}</div></div>`:""}${c.fax?`<div><span class="contactLabel">Fax</span><div class="contactValue">${esc(c.fax)}</div></div>`:""}${c.email?`<div><span class="contactLabel">Email</span><div class="contactValue">${email(c.email)}</div></div>`:""}</div>`}
 function paras(id,a){const m=document.getElementById(id);if(m)m.innerHTML=a.map(x=>`<p>${esc(x)}</p>`).join("")}
 function photo(id,x){const m=document.getElementById(id);if(!m||!x||!x.src){if(m)m.hidden=true;return}m.innerHTML=`<img src="${esc(x.src)}" alt="${esc(x.alt||"")}">${x.caption?`<figcaption>${esc(x.caption)}</figcaption>`:""}`}
 function gallery(a){const m=document.getElementById("shopGallery");if(!m)return;m.innerHTML=a.map(x=>`<figure><img src="${esc(x.src)}" alt="${esc(x.alt||"")}">${x.caption?`<figcaption>${esc(x.caption)}</figcaption>`:""}</figure>`).join("")}
}