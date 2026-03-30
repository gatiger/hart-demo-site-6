function safeText(value){
  return value === undefined || value === null ? "" : String(value);
}

function getByPath(obj, path){
  if (!obj || !path) return undefined;
  return path.split(".").reduce((acc, part) => acc?.[part], obj);
}

async function loadLocalizedPage(pageKey){
  const lang = (typeof getCurrentLang === "function") ? getCurrentLang() : "en";
  const url = `/content/${pageKey}.${lang}.json`;

  const res = await fetch(url, { cache: "no-store" });
  if(!res.ok){
    throw new Error(`Failed to load ${url} (${res.status})`);
  }

  return await res.json();
}

function renderLocalizedFields(data, root = document){
  root.querySelectorAll("[data-content]").forEach(el => {
    const path = el.getAttribute("data-content");
    const value = getByPath(data, path);
    el.textContent = safeText(value);
  });
}

async function initLocalizedPage(pageKey, options = {}){
  const { onData = null } = options;

  try{
    const data = await loadLocalizedPage(pageKey);
    renderLocalizedFields(data);

    if(typeof onData === "function"){
      onData(data);
    }
  }catch(err){
    console.error(`${pageKey} load error:`, err);
  }
}