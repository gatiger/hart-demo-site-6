// Public About page only

let aboutCarouselState = {
  slides: [],
  index: 0,
  intervalId: null,
  intervalMs: 5000
};

document.addEventListener("DOMContentLoaded", async () => {
  const data = await loadJSON("./content/about.json");
  if (!data) return;

  renderAboutPage(data);
  initAboutSearch();
  initAboutCarousel(data.carousel || {});
});

function renderAboutPage(data) {
  setText("aboutPageTitle", data.pageTitle);
  setText("aboutPageIntro", data.pageIntro);
  setText("aboutStatsIntro", data.statsIntro);

  renderAboutBadges(data.badges || []);
  renderAboutSections(data.sections || []);
  renderAboutStats(data.stats || []);
}

function renderAboutBadges(items) {
  const row = document.getElementById("aboutBadgeRow");
  if (!row) return;

  row.innerHTML = (items || []).map(item => {
    const label = safeText(item.label);
    const value = safeText(item.value);

    return `
      <div class="aboutBadge">
        <strong>${escapeHtml(label)}:</strong>
        <span>${escapeHtml(value)}</span>
      </div>
    `;
  }).join("");
}

function renderAboutSections(items) {
  const grid = document.getElementById("aboutInfoGrid");
  if (!grid) return;

  grid.innerHTML = (items || []).map(item => {
    const title = safeText(item.title);
    const body = safeText(item.body);

    return `
      <article class="card aboutInfoCard aboutSearchItem" data-search-text="${escapeHtml((title + " " + body).toLowerCase())}">
        <h2 class="aboutInfoTitle">${escapeHtml(title)}</h2>
        <p class="aboutInfoText">${escapeHtml(body)}</p>
      </article>
    `;
  }).join("");
}

function renderAboutStats(items) {
  const list = document.getElementById("aboutStatsList");
  if (!list) return;

  list.innerHTML = (items || []).map(item => {
    const title = safeText(item.title);
    const value = safeText(item.value);

    return `
      <div class="item aboutSearchItem" data-search-text="${escapeHtml((title + " " + value).toLowerCase())}">
        <div class="itemTitle">${escapeHtml(title)}</div>
        <div class="meta">${escapeHtml(value)}</div>
      </div>
    `;
  }).join("");
}

function initAboutCarousel(carousel) {
  const section = document.getElementById("aboutCarouselSection");
  const intro = document.getElementById("aboutCarouselIntro");
  const track = document.getElementById("aboutCarouselTrack");
  const dots = document.getElementById("aboutCarouselDots");
  const prev = document.getElementById("aboutCarouselPrev");
  const next = document.getElementById("aboutCarouselNext");
  const wrapper = document.getElementById("aboutCarousel");

  const slides = Array.isArray(carousel.images) ? carousel.images.filter(img => safeText(img.src)) : [];
  if (!section || !track || !dots || !prev || !next || !wrapper || !slides.length) return;

  section.hidden = false;
  intro.textContent = safeText(carousel.intro);
  aboutCarouselState.slides = slides;
  aboutCarouselState.intervalMs = Number(carousel.intervalMs) > 0 ? Number(carousel.intervalMs) : 5000;

  track.innerHTML = slides.map((item, index) => `
    <div class="aboutSlide" aria-hidden="${index === 0 ? "false" : "true"}">
      <img src="${escapeHtml(item.src)}" alt="${escapeHtml(safeText(item.alt))}">
      ${(safeText(item.title) || safeText(item.caption)) ? `
        <div class="aboutSlideCaption">
          ${safeText(item.title) ? `<h3 class="aboutSlideTitle">${escapeHtml(item.title)}</h3>` : ""}
          ${safeText(item.caption) ? `<p class="aboutSlideText">${escapeHtml(item.caption)}</p>` : ""}
        </div>
      ` : ""}
    </div>
  `).join("");

  dots.innerHTML = slides.map((_, index) => `
    <button
      type="button"
      class="aboutCarouselDot${index === 0 ? " is-active" : ""}"
      aria-label="Go to slide ${index + 1}"
      aria-pressed="${index === 0 ? "true" : "false"}"
      data-slide-index="${index}">
    </button>
  `).join("");

  prev.addEventListener("click", () => {
    stopAboutCarousel();
    showAboutSlide(aboutCarouselState.index - 1);
    startAboutCarousel();
  });

  next.addEventListener("click", () => {
    stopAboutCarousel();
    showAboutSlide(aboutCarouselState.index + 1);
    startAboutCarousel();
  });

  dots.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-slide-index]");
    if (!btn) return;
    stopAboutCarousel();
    showAboutSlide(Number(btn.getAttribute("data-slide-index")));
    startAboutCarousel();
  });

  wrapper.addEventListener("mouseenter", stopAboutCarousel);
  wrapper.addEventListener("mouseleave", startAboutCarousel);
  wrapper.addEventListener("focusin", stopAboutCarousel);
  wrapper.addEventListener("focusout", startAboutCarousel);

  showAboutSlide(0);
  startAboutCarousel();
}

function showAboutSlide(index) {
  const track = document.getElementById("aboutCarouselTrack");
  const slides = Array.from(document.querySelectorAll(".aboutSlide"));
  const dots = Array.from(document.querySelectorAll(".aboutCarouselDot"));
  if (!track || !slides.length) return;

  const max = slides.length - 1;
  if (index < 0) index = max;
  if (index > max) index = 0;

  aboutCarouselState.index = index;
  track.style.transform = `translateX(-${index * 100}%)`;

  slides.forEach((slide, i) => {
    slide.setAttribute("aria-hidden", i === index ? "false" : "true");
  });

  dots.forEach((dot, i) => {
    dot.classList.toggle("is-active", i === index);
    dot.setAttribute("aria-pressed", i === index ? "true" : "false");
  });
}

function startAboutCarousel() {
  stopAboutCarousel();
  if (aboutCarouselState.slides.length < 2) return;

  aboutCarouselState.intervalId = window.setInterval(() => {
    showAboutSlide(aboutCarouselState.index + 1);
  }, aboutCarouselState.intervalMs);
}

function stopAboutCarousel() {
  if (aboutCarouselState.intervalId) {
    window.clearInterval(aboutCarouselState.intervalId);
    aboutCarouselState.intervalId = null;
  }
}

function initAboutSearch() {
  const input = document.getElementById("aboutSearch");
  if (!input) return;

  input.addEventListener("input", () => {
    const q = safeText(input.value).toLowerCase();
    document.querySelectorAll(".aboutSearchItem").forEach(el => {
      const haystack = el.getAttribute("data-search-text") || "";
      el.classList.toggle("about-hidden", q && !haystack.includes(q));
    });
  });
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = safeText(value);
}

function safeText(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}