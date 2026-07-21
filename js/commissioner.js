document.addEventListener("DOMContentLoaded", async () => {
  try {
    const id = new URLSearchParams(window.location.search).get("id");
    const data = await loadJSON("./content/commissioners.json");
    const items = data?.items || data || [];

    const commissioner = findCommissioner(items, id);

    if (!commissioner) {
      renderNotFound();
      return;
    }

    renderCommissioner(commissioner);
  } catch (err) {
    console.error(err);
    renderNotFound();
  }
});

function findCommissioner(items, id){
  const safe = (v) => (v === undefined || v === null) ? "" : String(v).trim();

  const slugify = (value) =>
    safe(value)
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  return (items || []).find(item => {
    const slug = safe(item.slug) || slugify(item.name || item.id || "");
    return slug === safe(id);
  });
}

function renderCommissioner(item){
  const safe = (v) => (v === undefined || v === null) ? "" : String(v).trim();

  const name = safe(item.name);
  const role = safe(item.role);
  const district = safe(item.district);
  const phone = safe(item.phone);
  const phoneRaw = safe(item.phone_raw || phone.replace(/[^\d+]/g, ""));
  const email = safe(item.email);
  const photo = safe(item.photo || "/assets/commissioners/placeholder.png");
  const bioParts = normalizeBio(item.bio);

  const roleLine = [role, district].filter(Boolean).join(" • ");

  document.title = `${name || "Commissioner"} | Hart County`;

  setText("commissionerIntroText", roleLine || "Hart County Board of Commissioners");
  setText("commissionerEyebrow", district || "Hart County");
  setText("commissionerName", name);
  setText("commissionerRole", roleLine);

  const img = document.getElementById("commissionerPhoto");
  if (img) {
    img.src = photo;
    img.alt = name ? `Photo of ${name}` : "Commissioner photo";
  }

  setPhoneRow("commissionerPhoneRow", "Phone", phone, phoneRaw);
  setEmailRow("commissionerEmailRow", "Email", email);

  const bioBody = document.getElementById("commissionerBioBody");
  if (bioBody) {
    bioBody.innerHTML = "";

    if (bioParts.length) {
      bioParts.forEach(text => {
        const p = document.createElement("p");
        p.textContent = text;
        bioBody.appendChild(p);
      });
    } else {
      bioBody.innerHTML = "<p>Biography information is not available at this time.</p>";
    }
  }
}

function normalizeBio(bio){
  if (Array.isArray(bio)) {
    return bio
      .map(part => String(part || "").trim())
      .filter(Boolean);
  }

  const single = String(bio || "").trim();
  return single ? [single] : [];
}

function renderNotFound(){
  setText("commissionerIntroText", "The requested commissioner profile could not be found.");
  setText("commissionerEyebrow", "");
  setText("commissionerName", "Commissioner Not Found");
  setText("commissionerRole", "");

  const bioBody = document.getElementById("commissionerBioBody");
  if (bioBody) {
    bioBody.innerHTML = "<p>Please return to the Commissioners page and select a profile.</p>";
  }
}

function setText(id, value){
  const el = document.getElementById(id);
  if (el) el.textContent = value || "";
}

function setPhoneRow(id, label, value, rawValue){
  const el = document.getElementById(id);
  if (!el) return;

  if (!value) {
    el.hidden = true;
    el.innerHTML = "";
    return;
  }

  el.hidden = false;
  el.innerHTML = `<strong>${escapeHtml(label)}:</strong> <a href="tel:${escapeHtml(rawValue || "")}">${escapeHtml(value)}</a>`;
}

function setEmailRow(id, label, value){
  const el = document.getElementById(id);
  if (!el) return;

  if (!value) {
    el.hidden = true;
    el.innerHTML = "";
    return;
  }

  el.hidden = false;
  el.innerHTML = `<strong>${escapeHtml(label)}:</strong> <a href="mailto:${escapeHtml(value)}">${escapeHtml(value)}</a>`;
}

function escapeHtml(value){
  return String(value ?? "").replace(/[&<>"']/g, ch => {
    switch(ch){
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "\"": return "&quot;";
      case "'": return "&#39;";
      default: return ch;
    }
  });
}