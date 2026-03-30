// Employee portal global JS only
// Keep this file limited to portal-wide helpers.
// Page-specific logic should live in files like:
// - portal_directory.js
// - portal_resources.js
// - portal_jobs.js
// - portal_forms.js

async function loadJSON(path){
  try{
    const res = await fetch(path, { cache: "no-store" });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }catch(e){
    console.error("Content load failed:", path, e);
    return null;
  }
}

function initMobileMenu(){
  const btn = document.getElementById("menuBtn");
  const panel = document.getElementById("mobileMenu");
  const close = document.getElementById("menuClose");
  const backdrop = document.getElementById("menuBackdrop");

  if(!btn || !panel || !close || !backdrop) return;

  let lastFocus = null;

  panel.hidden = true;
  backdrop.hidden = true;
  btn.setAttribute("aria-expanded", "false");

  const focusableSelectors = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])"
  ].join(",");

  const getFocusable = () => {
    const all = [close, ...Array.from(panel.querySelectorAll(focusableSelectors))];
    return Array.from(new Set(all)).filter(el => el && el.offsetParent !== null);
  };

  const setOpen = (open) => {
    panel.hidden = !open;
    backdrop.hidden = !open;
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("menuOpen", open);
  };

  const openMenu = () => {
    lastFocus = document.activeElement;
    setOpen(true);
    close.focus();
  };

  const closeMenu = () => {
    setOpen(false);
    if(lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
    else btn.focus();
  };

  btn.addEventListener("click", () => {
    const expanded = btn.getAttribute("aria-expanded") === "true";
    expanded ? closeMenu() : openMenu();
  });

  close.addEventListener("click", closeMenu);
  backdrop.addEventListener("click", closeMenu);

  panel.addEventListener("click", (e) => {
    const t = e.target;
    if(t && t.matches && t.matches("a")) closeMenu();
  });

  document.addEventListener("keydown", (e) => {
    if(panel.hidden) return;

    if(e.key === "Escape"){
      e.preventDefault();
      closeMenu();
      return;
    }

    if(e.key !== "Tab") return;

    const focusables = getFocusable();
    if(!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if(!e.shiftKey && document.activeElement === last){
      e.preventDefault();
      first.focus();
    } else if(e.shiftKey && document.activeElement === first){
      e.preventDefault();
      last.focus();
    }
  });
}

function initPortalNav(){
  const currentPath = window.location.pathname.split("/").pop() || "index.html";

  document.querySelectorAll(".portalNav a, .menuNav a").forEach(link => {
    const href = link.getAttribute("href");
    if (!href) return;

    const normalizedHref = href.split("/").pop();

    if (normalizedHref === currentPath) {
      link.classList.add("active");
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
    }
  });
}

function initPortalPage(){
  initMobileMenu();
  initPortalNav();

  // Future portal-wide hooks:
  // - authentication/session checks
  // - user info display
}

document.addEventListener("DOMContentLoaded", initPortalPage);
