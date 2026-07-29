document.addEventListener("DOMContentLoaded", async () => {
  try {
    const data = await loadJSON("./content/e911.json");
    renderE911Page(data || {});
  } catch (err) {
    console.error(err);
    const main = document.getElementById("main");
    if (main) main.insertAdjacentHTML("afterbegin", '<div class="card"><p class="sub">Unable to load E-911 information at this time.</p></div>');
  }
});

function renderE911Page(data){
  const safe=v=>v===undefined||v===null?"":String(v).trim();
  const escapeHtml=v=>String(v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
  const escapeAttr=escapeHtml;
  const intro=data.intro||{};
  setText("e911Eyebrow",intro.eyebrow||"Hart County");
  setText("e911Title",intro.title||"Hart County E-911 Services");
  setText("e911Description",intro.description||"");
  renderContact(data.contact||{});renderParagraphs("e911Services",data.services||[]);renderAddressing(data.addressing||{});renderParagraphs("e911Logans",data.logans_law||[]);renderParagraphs("e911CodeRed",data.codered||[]);renderLinks(data.forms||[]);
  function setText(id,value){const el=document.getElementById(id);if(el)el.textContent=safe(value)}
  function phoneMarkup(phone,raw){const shown=safe(phone),tel=safe(raw||shown.replace(/[^\d+]/g,""));if(!shown)return"";return `<span class="phoneDesktop">${escapeHtml(shown)}</span><a class="phoneMobile" href="tel:${escapeAttr(tel)}">${escapeHtml(shown)}</a>`}
  function emailMarkup(email){const shown=safe(email);if(!shown)return"";return `<span class="emailDesktop">${escapeHtml(shown)}</span><a class="emailMobile" href="mailto:${escapeAttr(shown)}">${escapeHtml(shown)}</a>`}
  function renderContact(c){const m=document.getElementById("e911Contact");if(!m)return;const address=[c.address,c.city_state_zip].filter(Boolean).join("\n");m.innerHTML=`<div class="contactList">${safe(c.director)?`<div class="contactItem"><span class="contactLabel">Director</span><div class="contactValue">${escapeHtml(safe(c.director))}</div></div>`:""}${address?`<div class="contactItem"><span class="contactLabel">Address</span><div class="contactValue">${escapeHtml(address)}</div></div>`:""}${safe(c.phone)?`<div class="contactItem"><span class="contactLabel">Office</span><div class="contactValue">${phoneMarkup(c.phone,c.phone_raw)}</div></div>`:""}${safe(c.fax)?`<div class="contactItem"><span class="contactLabel">Fax</span><div class="contactValue">${escapeHtml(safe(c.fax))}</div></div>`:""}${safe(c.email)?`<div class="contactItem"><span class="contactLabel">Email</span><div class="contactValue">${emailMarkup(c.email)}</div></div>`:""}</div>`}
  function renderParagraphs(id,items){const m=document.getElementById(id);if(m)m.innerHTML=items.map(t=>`<p>${escapeHtml(safe(t))}</p>`).join("")}
  function renderAddressing(a){const m=document.getElementById("e911Addressing");if(!m)return;const ps=(a.paragraphs||[]).map(t=>`<p>${escapeHtml(safe(t))}</p>`).join("");const ns=(a.notices||[]).map(t=>`<li>${escapeHtml(safe(t))}</li>`).join("");m.innerHTML=`${ps}${ns?`<ul class="e911NoticeList">${ns}</ul>`:""}`}
  function renderLinks(items){const m=document.getElementById("e911Forms");if(!m)return;m.innerHTML=items.map(i=>`<a class="e911TextLink" href="${escapeAttr(safe(i.url))}" ${i.external?'target="_blank" rel="noopener noreferrer"':""}>${escapeHtml(safe(i.title))}</a>`).join("")}
}
