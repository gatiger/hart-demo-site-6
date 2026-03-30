// Public commissioners page only

function renderCommissioners(items){
  const mount = document.getElementById("commissionersList");
  if(!mount) return;

  if (!mount.dataset.expandWired) {
    mount.addEventListener("click", (e) => {
      const btn = e.target.closest(".annExpandBtn");
      if (!btn) return;

      const bodyId = btn.getAttribute("data-expand");
      const p = document.getElementById(bodyId);
      if (!p) return;

      const expanded = btn.getAttribute("aria-expanded") === "true";

      if (expanded) {
        p.classList.add("clamp2");
        btn.setAttribute("aria-expanded", "false");
        btn.textContent = "Expand";
      } else {
        p.classList.remove("clamp2");
        btn.setAttribute("aria-expanded", "true");
        btn.textContent = "Collapse";
      }
    });

    mount.dataset.expandWired = "1";
  }

  const safe = (v)=> (v===undefined||v===null) ? "" : String(v).trim();

  mount.innerHTML = (items || []).map(c => {
    const name = safe(c.name);
    const role = safe(c.role);
    const district = safe(c.district);
    const phone = safe(c.phone);
    const phoneRaw = safe(c.phone_raw);
    const email = safe(c.email);
    const photo = safe(c.photo || "./assets/commissioners/placeholder.png");
    const bio = safe(c.bio);

    return `
      <article class="commCard" aria-label="Commissioner profile">
        <figure class="commPhoto">
          <img src="${photo}" alt="Photo of ${name}">
        </figure>

        <div class="commInfo">
          <h3 class="commName">${name}</h3>
          <div class="commRole">
            ${role ? role + " • " : ""}${district}
          </div>

          <div class="commMeta" aria-label="Contact information">
            ${phone ? `<span>Phone: <a class="phone-link" href="tel:${phoneRaw}">${phone}</a></span>` : ``}
            ${(phone && email) ? `<span>•</span>` : ``}
            ${email ? `<span>Email: <a class="email-link" href="mailto:${email}">${email}</a></span>` : ``}
          </div>

          ${bio ? `<p class="sub" style="margin-top:10px">${bio}</p>` : ``}
        </div>
      </article>
    `;
  }).join("");
}

document.addEventListener("DOMContentLoaded", async () => {
  const mount = document.getElementById("commissionersList");
  if (!mount) return;

  const commissioners = await loadJSON("./content/commissioners.json");
  renderCommissioners(commissioners?.items || commissioners || []);
});
