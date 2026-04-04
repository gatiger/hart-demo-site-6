document.addEventListener("DOMContentLoaded", () => {
  initTaxFormsPage();
});

async function initTaxFormsPage(){
  try{
    const res = await fetch("/content/taxforms.json", { cache: "no-store" });
    if(!res.ok) throw new Error("Failed to load /content/taxforms.json");

    const data = await res.json();

    renderIntro(data.intro || {});
    renderCard(data.formsSection || {});
  }catch(err){
    console.error(err);
    renderTaxFormsError();
  }
}

function renderIntro(intro){
  const introText = document.getElementById("tfIntroText");
  if(introText){
    introText.textContent = safeText(intro.text) || "";
  }
}

function renderCard(section){
  const sub = document.getElementById("tfCardSub");
  const mount = document.getElementById("tfCategories");

  if(sub) sub.textContent = safeText(section.subtitle) || "";
  if(!mount) return;

  const categories = Array.isArray(section.categories)
    ? section.categories.filter(item => item && item.enabled !== false)
    : [];

  if(!categories.length){
    mount.innerHTML = `<div class="tfEmpty">No form categories are available right now.</div>`;
    return;
  }

  mount.innerHTML = categories.map((category, index) => {
    const id = safeText(category.id) || `category-${index + 1}`;
    const title = safeText(category.title);
    const desc = safeText(category.description);
    const forms = Array.isArray(category.forms)
      ? category.forms.filter(form => form && form.enabled !== false)
      : [];

    return `
      <section class="tfCategory${index === 0 ? " is-open" : ""}" data-category>
        <button class="tfCategoryToggle"
                type="button"
                aria-expanded="${index === 0 ? "true" : "false"}"
                aria-controls="${escapeAttr(id)}-panel">
          <span>
            <span class="tfCategoryTitle">${escapeHtml(title)}</span>
            ${desc ? `<span class="tfCategoryMeta">${escapeHtml(desc)}</span>` : ""}
          </span>
          <span class="tfChevron" aria-hidden="true">▾</span>
        </button>

        <div class="tfCategoryPanel" id="${escapeAttr(id)}-panel"${index === 0 ? "" : " hidden"}>
          ${
            forms.length
              ? `
                <ul class="tfFormsList">
                  ${forms.map(form => {
                    const name = safeText(form.name);
                    const href = safeText(form.href);
                    const desc = safeText(form.description);
                    const isExternal = /^https?:\/\//i.test(href);

                    if(!href){
                      return `
                        <li class="tfFormItem">
                          <div class="tfEmpty">${escapeHtml(name || "Form unavailable")}</div>
                        </li>
                      `;
                    }

                    return `
                      <li class="tfFormItem">
                        <a class="tfFormLink" href="${escapeAttr(href)}"${isExternal ? ` target="_blank" rel="noopener"` : ""}>
                          <span class="tfFormText">
                            <span class="tfFormName">${escapeHtml(name)}</span>
                            ${desc ? `<span class="tfFormDesc">${escapeHtml(desc)}</span>` : ""}
                          </span>
                          ${isExternal ? `<span class="tfExternal" aria-hidden="true">↗</span>` : ""}
                        </a>
                      </li>
                    `;
                  }).join("")}
                </ul>
              `
              : `<div class="tfEmpty">No forms are available in this category right now.</div>`
          }
        </div>
      </section>
    `;
  }).join("");

  wireCategories();
}

function wireCategories(){
  document.querySelectorAll("[data-category]").forEach(category => {
    const btn = category.querySelector(".tfCategoryToggle");
    const panel = category.querySelector(".tfCategoryPanel");
    if(!btn || !panel) return;

    btn.addEventListener("click", () => {
      const expanded = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", expanded ? "false" : "true");
      panel.hidden = expanded;
      category.classList.toggle("is-open", !expanded);
    });
  });
}

function renderTaxFormsError(){
  const intro = document.getElementById("tfIntroText");
  const mount = document.getElementById("tfCategories");

  if(intro) intro.textContent = "Tax form information is unavailable right now.";
  if(mount) mount.innerHTML = `<div class="tfEmpty">Form categories are unavailable right now.</div>`;
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