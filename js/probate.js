document.addEventListener("DOMContentLoaded", async () => {
  try {
    const data = await loadJSON("./content/probate.json");
    renderProbatePage(data || {});
  } catch (err) {
    console.error(err);
    const main = document.getElementById("main");
    if (main) main.insertAdjacentHTML("afterbegin", '<div class="card"><p class="sub">Unable to load Probate Court information at this time.</p></div>');
  }
});

function renderProbatePage(data){
  const safe = value => value === undefined || value === null ? "" : String(value).trim();
  const escapeHtml = value => String(value).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
  const intro = data.intro || {};
  setText("probateEyebrow", intro.eyebrow || "Hart County");
  setText("probateTitle", intro.title || "Hart County Probate Court");
  setText("probateDescription", intro.description || "");
  renderContact(data.contact || {});
  renderOverview(data.overview || []);
  renderServices(data.services || []);

  function setText(id,value){const el=document.getElementById(id);if(el)el.textContent=safe(value)}
  function phoneMarkup(phone,raw){
    const shown=safe(phone),tel=safe(raw||shown.replace(/[^d+]/g,""));
    return shown ? `<span class="phoneDesktop">${escapeHtml(shown)}</span><a class="phoneMobile" href="tel:${escapeHtml(tel)}">${escapeHtml(shown)}</a>` : "";
  }
  function renderContact(contact){
    const mount=document.getElementById("probateContact");if(!mount)return;
    const address=[contact.street_address,contact.mailing_address,contact.city_state_zip].filter(Boolean).join("\n");
    mount.innerHTML=`<div class="contactList">
      ${address?`<div class="contactItem"><span class="contactLabel">Address</span><div class="contactValue">${escapeHtml(address)}</div></div>`:""}
      ${safe(contact.phone)?`<div class="contactItem"><span class="contactLabel">Telephone</span><div class="contactValue">${phoneMarkup(contact.phone,contact.phone_raw)}</div></div>`:""}
      ${safe(contact.hours)?`<div class="contactItem"><span class="contactLabel">Hours</span><div class="contactValue">${escapeHtml(safe(contact.hours))}</div></div>`:""}
    </div>`;
  }
  function renderOverview(items){const mount=document.getElementById("probateOverview");if(mount)mount.innerHTML=items.map(text=>`<p>${escapeHtml(safe(text))}</p>`).join("")}
  function renderServices(items){const mount=document.getElementById("probateServices");if(mount)mount.innerHTML=items.map(item=>`<li>${escapeHtml(safe(item))}</li>`).join("")}
}
