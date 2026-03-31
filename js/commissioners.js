document.addEventListener("DOMContentLoaded", async () => {
  const mount = document.getElementById("commissionersList");
  if (!mount) return;

  try {
    const commissioners = await loadJSON("./content/commissioners.json");
    renderCommissioners(commissioners?.items || commissioners || []);
  } catch (err) {
    console.error(err);
    mount.innerHTML = "<p class=\"sub\">Unable to load commissioner information at this time.</p>";
  }
});

function renderCommissioners(items){
  const mount = document.getElementById("commissionersList");
  if (!mount) return;

  const safe = (v) => (v === undefined || v === null) ? "" : String(v).trim();
  const escapeHtml = (str) =>
    String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  mount.innerHTML = (items || []).map(c => {
    const name = safe(c.name);
    const role = safe(c.role);
    const district = safe(c.district);
    const phone = safe(c.phone);
    const phoneRaw = safe(c.phone_raw || phone.replace(/[^\d+]/g, ""));
    const email = safe(c.email);
    const photo = safe(c.photo || "./assets/commissioners/placeholder.png");
    const bio = safe(c.bio);

    const roleLine = [role, district].filter(Boolean).join(" • ");

    return `
      <article class="commCard" aria-label="${escapeHtml(name ? `Profile for ${name}` : "Commissioner profile")}">
        <figure class="commPhoto">
          <img
            src="${escapeHtml(photo)}"
            alt="${escapeHtml(name ? `Photo of ${name}` : "Commissioner photo")}">
        </figure>

        <div class="commInfo">
          <h3 class="commName">${escapeHtml(name)}</h3>

          ${roleLine ? `
            <div class="commRole">${escapeHtml(roleLine)}</div>
          ` : ""}

          ${(phone || email) ? `
            <div class="commMeta" aria-label="Contact information">
              ${phone ? `<span>Phone: <a class="phone-link" href="tel:${escapeHtml(phoneRaw)}">${escapeHtml(phone)}</a></span>` : ``}
              ${(phone && email) ? `<span aria-hidden="true">•</span>` : ``}
              ${email ? `<span>Email: <a class="email-link" href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></span>` : ``}
            </div>
          ` : ""}

          ${bio ? `<p class="sub commBio">${escapeHtml(bio)}</p>` : ``}
        </div>
      </article>
    `;
  }).join("");

  if (!items || !items.length) {
    mount.innerHTML = "<p class=\"sub\">No commissioner information is available at this time.</p>";
  }
}