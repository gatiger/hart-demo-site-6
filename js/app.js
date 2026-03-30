// Public site global JS
// Shared helpers and global page setup only.

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

function initGlobalNav(){
  const currentPath = window.location.pathname.split("/").pop() || "index.html";

  document.querySelectorAll(".topNav a, .menuNav a").forEach(link => {
    const href = link.getAttribute("href");
    if(!href) return;

    if(href === currentPath){
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
    }
  });

  document.querySelectorAll(".navOptional").forEach(link => {
    const href = link.getAttribute("href");
    if(!href) return;

    const shouldShow = href === currentPath;
    if(!shouldShow){
      link.style.display = "none";
      link.setAttribute("aria-hidden", "true");
      link.tabIndex = -1;
    }
  });
}

function updateResponsiveHeader() {
  const topbar = document.querySelector(".topbar");
  const navRow = document.querySelector(".navRow");
  const brand = document.querySelector(".brandLink");
  const nav = document.querySelector(".topNav");

  if (!topbar || !navRow || !brand || !nav) return;

  topbar.classList.remove("nav-compact");

  const rowWidth = navRow.clientWidth;
  const brandWidth = brand.getBoundingClientRect().width;
  const navWidth = nav.scrollWidth;
  const extraSpace = 40;

  const needsCompact = (brandWidth + navWidth + extraSpace) > rowWidth;

  topbar.classList.toggle("nav-compact", needsCompact);
}

document.addEventListener("DOMContentLoaded", () => {
  initMobileMenu();

  if (typeof initLanguageControls === "function") {
    initLanguageControls();
  }

  initGlobalNav();
  updateResponsiveHeader();

  window.addEventListener("resize", updateResponsiveHeader);
});

document.addEventListener("focusin", (e) => {
  const el = e.target;
  if(!el || typeof el.getBoundingClientRect !== "function") return;

  const topbar = document.querySelector(".topbar");
  if(!topbar) return;

  const topbarHeight = topbar.getBoundingClientRect().height;
  const extraGap = 16;

  requestAnimationFrame(() => {
    const rect = el.getBoundingClientRect();
    const minTop = topbarHeight + extraGap;

    if(rect.top < minTop){
      window.scrollBy({
        top: rect.top - minTop,
        behavior: "auto"
      });
    } else if(rect.bottom > window.innerHeight){
      window.scrollBy({
        top: rect.bottom - window.innerHeight + extraGap,
        behavior: "auto"
      });
    }
  });
});