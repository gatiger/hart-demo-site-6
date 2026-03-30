const SITE_LANGS = ["en", "es", "vi"];
const DEFAULT_LANG = "en";

const UI_TEXT = {
  en: {
    directory: "Directory",
    commissioners: "Commissioners",
    employment: "Employment",
    about: "About",
    paynesCreek: "Paynes Creek",
    news: "News",
    meetings: "Meetings",
    fire: "Fire",
    ems: "EMS",
    publicWorks: "Public Works",
    accessibility: "Accessibility",
    home: "Home",
    aboutHartCounty: "About Hart County",
    paynesCreekCampground: "Paynes Creek Campground",
    menu: "Menu",
    close: "Close",
    language: "Language"
  },
  es: {
    directory: "Directorio",
    commissioners: "Comisionados",
    employment: "Empleo",
    about: "Acerca de",
    paynesCreek: "Paynes Creek",
    news: "Noticias",
    meetings: "Reuniones",
    fire: "Bomberos",
    ems: "EMS",
    publicWorks: "Obras Públicas",
    accessibility: "Accesibilidad",
    home: "Inicio",
    aboutHartCounty: "Acerca de Hart County",
    paynesCreekCampground: "Campamento Paynes Creek",
    menu: "Menú",
    close: "Cerrar",
    language: "Idioma"
  },
  vi: {
    directory: "Danh bạ",
    commissioners: "Ủy viên",
    employment: "Việc làm",
    about: "Giới thiệu",
    paynesCreek: "Paynes Creek",
    news: "Tin tức",
    meetings: "Cuộc họp",
    fire: "Cứu hỏa",
    ems: "EMS",
    publicWorks: "Công trình Công cộng",
    accessibility: "Trợ năng",
    home: "Trang chủ",
    aboutHartCounty: "Giới thiệu Quận Hart",
    paynesCreekCampground: "Khu cắm trại Paynes Creek",
    menu: "Menu",
    close: "Đóng",
    language: "Ngôn ngữ"
  }
};

function getCurrentLang(){
  const saved = localStorage.getItem("siteLang");
  return SITE_LANGS.includes(saved) ? saved : DEFAULT_LANG;
}

function setCurrentLang(lang){
  const next = SITE_LANGS.includes(lang) ? lang : DEFAULT_LANG;
  localStorage.setItem("siteLang", next);
  document.documentElement.lang = next;
  return next;
}

function t(key){
  const lang = getCurrentLang();
  return UI_TEXT[lang]?.[key] || UI_TEXT[DEFAULT_LANG]?.[key] || key;
}

function applyLanguageUI(){
  const lang = getCurrentLang();
  document.documentElement.lang = lang;

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (!key) return;
    el.textContent = t(key);
  });

  document.querySelectorAll(".langSelect").forEach(select => {
    select.value = lang;
    select.setAttribute("aria-label", t("language"));
  });

  const menuBtn = document.getElementById("menuBtn");
  if(menuBtn) menuBtn.textContent = t("menu");

  const closeBtn = document.getElementById("menuClose");
  if(closeBtn) closeBtn.textContent = t("close");
}

function initLanguageControls(){
  document.querySelectorAll(".langSelect").forEach(select => {
    select.value = getCurrentLang();

    select.addEventListener("change", () => {
  console.log("selected:", select.id, select.value);
  setCurrentLang(select.value);
  console.log("saved:", localStorage.getItem("siteLang"));
  location.reload();
});
  });

  applyLanguageUI();
}