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
  setText("aboutStatsTitle", data.statsTitle || "County At a Glance");
  setText("aboutStatsIntro", data.statsIntro);
  setText("aboutCarouselTitle", (data.carousel && data.carousel.title) || "Photo Gallery");
  applyAboutSectionLayout(data);

  renderAboutIntroComponents(data);
  renderAboutBadges(data.badges || []);
  renderAboutSections(data.sections || []);
  renderAboutStats(data.stats || []);
  applyAboutStaticTextStyles(data);
}


function clampAboutSpan(value, fallback = 24) {
  const parsed = Number(value);
  return Math.max(1, Math.min(24, Number.isFinite(parsed) ? parsed : fallback));
}

function clampAboutStart(value, span = 24) {
  const parsed = Number(value);
  const safeSpan = clampAboutSpan(span);
  const maxStart = Math.max(1, 25 - safeSpan);
  return Math.max(1, Math.min(maxStart, Number.isFinite(parsed) ? parsed : 1));
}

function applyAboutSectionLayout(data) {
  const intro = document.getElementById("aboutIntroSection");
  const carousel = document.getElementById("aboutCarouselSection");
  const infoGrid = document.getElementById("aboutInfoGrid");
  const stats = document.getElementById("aboutStatsSection");

  if (intro) { const span = clampAboutSpan(data && data.introGridSpan); intro.style.setProperty("--about-section-span", span); intro.style.setProperty("--about-section-start", clampAboutStart(data && data.introGridStart, span)); }
  if (carousel) { const span = clampAboutSpan(data && data.carousel && data.carousel.gridSpan); carousel.style.setProperty("--about-section-span", span); carousel.style.setProperty("--about-section-start", clampAboutStart(data && data.carousel && data.carousel.gridColumnStart, span)); }
  if (infoGrid) { const span = clampAboutSpan(data && data.sectionsGridSpan); infoGrid.style.setProperty("--about-section-span", span); infoGrid.style.setProperty("--about-section-start", clampAboutStart(data && data.sectionsGridStart, span)); }
  if (stats) { const span = clampAboutSpan(data && data.statsGridSpan); stats.style.setProperty("--about-section-span", span); stats.style.setProperty("--about-section-start", clampAboutStart(data && data.statsGridStart, span)); }
  const rowMap = [[intro, data && data.introGridRowSpan], [carousel, data && data.carousel && data.carousel.gridRowSpan], [infoGrid, data && data.sectionsGridRowSpan], [stats, data && data.statsGridRowSpan]];
  rowMap.forEach(([node, rows]) => node && node.style.setProperty("--about-section-rows", Math.max(0, Number(rows) || 0)));
  applyAboutPageOrder(data);
}


function applyAboutPageOrder(data) {
  const page = document.querySelector(".aboutPage");
  if (!page) return;
  const map = {intro:"aboutIntroSection", carousel:"aboutCarouselSection", sections:"aboutInfoGrid", stats:"aboutStatsSection"};
  const footer = page.querySelector(".footer");
  const order = Array.isArray(data && data.pageOrder) ? data.pageOrder : ["intro","carousel","sections","stats"];
  order.forEach(key => { const node = document.getElementById(map[key]); if (node) page.insertBefore(node, footer); });
}


function getComponentLayout(layout, key, fallbackOrder = 0) {
  const raw = layout && typeof layout[key] === "object" ? layout[key] : {};
  return {
    gridSpan: Math.max(1, Math.min(24, Number(raw.gridSpan) || 24)),
    gridColumnStart: clampAboutStart(raw.gridColumnStart, Math.max(1, Math.min(24, Number(raw.gridSpan) || 24))),
    gridRowSpan: Math.max(0, Number(raw.gridRowSpan) || 0),
    order: Number.isFinite(Number(raw.order)) ? Number(raw.order) : fallbackOrder
  };
}

function componentStyle(layout, key, fallbackOrder = 0) {
  const item = getComponentLayout(layout, key, fallbackOrder);
  return `--about-component-span:${item.gridSpan};--about-component-start:${item.gridColumnStart};--about-component-rows:${item.gridRowSpan};order:${item.order}`;
}

function aboutTextStyle(style) {
  if (!style || typeof style !== "object") return "";
  const bits = [];
  const size = Number(style.fontSize);
  if (Number.isFinite(size) && size >= 8 && size <= 96) bits.push(`font-size:${size}px`);
  const color = safeText(style.color);
  if (/^#[0-9a-f]{6}$/i.test(color)) bits.push(`color:${color}`);
  const weight = Number(style.fontWeight);
  if (Number.isFinite(weight) && weight >= 100 && weight <= 900) bits.push(`font-weight:${weight}`);
  const align = safeText(style.textAlign).toLowerCase();
  if (["left", "center", "right"].includes(align)) bits.push(`text-align:${align}`);
  const line = Number(style.lineHeight);
  if (Number.isFinite(line) && line >= .8 && line <= 3) bits.push(`line-height:${line}`);
  return bits.join(";");
}

function applyAboutStaticTextStyles(data) {
  const rootStyles = data && data.textStyles && typeof data.textStyles === "object" ? data.textStyles : {};
  const carouselStyles = data && data.carousel && data.carousel.textStyles && typeof data.carousel.textStyles === "object" ? data.carousel.textStyles : {};
  const map = [
    ["aboutStatsTitle", rootStyles.statsTitle],
    ["aboutStatsIntro", rootStyles.statsIntro],
    ["aboutCarouselTitle", carouselStyles.title],
    ["aboutCarouselIntro", carouselStyles.intro]
  ];
  map.forEach(([id, style]) => {
    const node = document.getElementById(id);
    if (!node) return;
    const css = aboutTextStyle(style);
    if (css) node.style.cssText += ";" + css;
  });
}

function applyIntroComponentLayout(data) {
  const layout = data && data.componentLayout ? data.componentLayout : {};
  const mappings = [
    ["aboutPageTitle", "title", 0], ["aboutPageIntro", "text", 1],
    ["aboutIntroImage", "image", 2], ["aboutSearch", "search", 3],
    ["aboutIntroButtonRow", "buttons", 4], ["aboutBadgeRow", "badges", 5]
  ];
  const textStyles = data && data.textStyles && typeof data.textStyles === "object" ? data.textStyles : {};
  mappings.forEach(([id, key, order]) => {
    const node = document.getElementById(id);
    if (node) {
      const textKey = key === "title" || key === "text" ? key : null;
      const textCss = textKey ? aboutTextStyle(textStyles[textKey]) : "";
      node.setAttribute("style", componentStyle(layout, key, order) + (textCss ? ";" + textCss : ""));
    }
  });
}

function renderAboutIntroComponents(data) {
  const imageHost = document.getElementById("aboutIntroImage");
  const buttonHost = document.getElementById("aboutDynamicButtons");
  const textBlockHost = document.getElementById("aboutIntroTextBlocks");

  if (imageHost) {
    const image = data && data.image && typeof data.image === "object" ? data.image : null;
    if (image) {
      imageHost.hidden = false;
      imageHost.innerHTML = renderAboutImage(image, "aboutIntroMedia");
    } else {
      imageHost.hidden = true;
      imageHost.innerHTML = "";
    }
  }

  if (buttonHost) {
    buttonHost.innerHTML = renderAboutButtons(Array.isArray(data && data.buttons) ? data.buttons : []);
  }
  if (textBlockHost) {
    textBlockHost.innerHTML = renderAboutTextBlocks(data && data.textBlocks, data && data.componentLayout, "aboutIntroTextBlock");
  }
  applyIntroComponentLayout(data || {});
}

function renderAboutImage(image, className) {
  const src = safeText(image && image.src);
  const alt = safeText(image && image.alt);
  const title = safeText(image && image.title);
  const caption = safeText(image && image.caption);
  const gridSpan = Math.max(1, Math.min(24, Number(image && image.gridSpan) || 24));
  const gridStart = clampAboutStart(image && image.gridColumnStart, gridSpan);

  const media = src
    ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}">`
    : `<div class="aboutImagePlaceholder" role="img" aria-label="Image placeholder">
         <span class="aboutImagePlaceholderIcon" aria-hidden="true">▧</span>
         <strong>Image added</strong>
         <span>Enter an image path in the editor to display the photo.</span>
       </div>`;

  return `
    <figure class="aboutComponentImage ${escapeHtml(className || "")}" style="--about-image-span:${gridSpan};--about-image-start:${gridStart};--about-image-rows:${Math.max(0, Number(image && image.gridRowSpan) || 0)}">
      ${media}
      ${(title || caption) ? `<figcaption>${title ? `<strong>${escapeHtml(title)}</strong>` : ""}${caption ? `<span>${escapeHtml(caption)}</span>` : ""}</figcaption>` : ""}
    </figure>
  `;
}

function renderAboutButtons(buttons) {
  return (buttons || []).map(button => {
    const label = safeText(button.label) || "Learn More";
    const href = safeText(button.href) || "#";
    const style = safeText(button.style).toLowerCase();
    const styleClass = style === "ghost" || style === "secondary" ? " ghost" : "";
    const textCss = aboutTextStyle(button && button.textStyle && typeof button.textStyle === "object" ? button.textStyle : {});
    return `<a class="btn${styleClass} aboutComponentButton" href="${escapeHtml(href)}" style="${textCss}">${escapeHtml(label)}</a>`;
  }).join("");
}

function renderAboutTextBlocks(blocks, layout, className) {
  return (Array.isArray(blocks) ? blocks : []).map((block, index) => {
    if (!block || typeof block !== "object") return "";
    const id = safeText(block.id) || `text-${index + 1}`;
    const text = safeText(block.text);
    const style = aboutTextStyle(block.style && typeof block.style === "object" ? block.style : {});
    const layoutCss = componentStyle(layout || {}, `text:${id}`, 20 + index);
    return `<div class="aboutTextBlock aboutCardComponent ${escapeHtml(className || "")}" data-text-block-id="${escapeHtml(id)}" style="${layoutCss}${style ? ";" + style : ""}">${escapeHtml(text)}</div>`;
  }).join("");
}

function renderAboutBadges(items) {
  const row = document.getElementById("aboutBadgeRow");
  if (!row) return;

  row.innerHTML = (items || []).map(item => {
    const label = safeText(item.label);
    const value = safeText(item.value);

    const styles = item && item.textStyles && typeof item.textStyles === "object" ? item.textStyles : {};
    return `
      <div class="aboutBadge">
        <strong style="${aboutTextStyle(styles.label)}">${escapeHtml(label)}:</strong>
        <span style="${aboutTextStyle(styles.value)}">${escapeHtml(value)}</span>
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
    const widthClass = getAboutCardWidthClass(item.width);
    const cardSpan = Math.max(1, Math.min(24, Number(item.gridSpan) || ({quarter:6,half:12,"three-quarter":18,full:24}[safeText(item.width).toLowerCase()] || 12)));
    const cardStart = clampAboutStart(item.gridColumnStart, cardSpan);

    const imageHtml = item.image && typeof item.image === "object"
      ? renderAboutImage(item.image, "aboutInfoMedia")
      : "";
    const buttonsHtml = renderAboutButtons(Array.isArray(item.buttons) ? item.buttons : []);

    const layout = item.componentLayout || {};
    const textStyles = item.textStyles && typeof item.textStyles === "object" ? item.textStyles : {};
    const titleStyle = [componentStyle(layout, "title", 1), aboutTextStyle(textStyles.title)].filter(Boolean).join(";");
    const bodyStyle = [componentStyle(layout, "body", 2), aboutTextStyle(textStyles.body)].filter(Boolean).join(";");
    return `
      <article class="card aboutInfoCard aboutSearchItem ${widthClass}" style="--about-card-span:${cardSpan};--about-card-start:${cardStart};--about-card-rows:${Math.max(0, Number(item.gridRowSpan) || 0)}" data-search-text="${escapeHtml((title + " " + body).toLowerCase())}">
        ${imageHtml ? `<div class="aboutCardComponent aboutCardImageComponent" style="${componentStyle(layout, "image", 0)}">${imageHtml}</div>` : ""}
        <h2 class="aboutInfoTitle aboutCardComponent" style="${titleStyle}">${escapeHtml(title)}</h2>
        <p class="aboutInfoText aboutCardComponent" style="${bodyStyle}">${escapeHtml(body)}</p>
        ${renderAboutTextBlocks(item.textBlocks, layout, "aboutInfoTextBlock")}
        ${buttonsHtml ? `<div class="aboutInfoButtons btnRow aboutCardComponent" style="${componentStyle(layout, "buttons", 3)}">${buttonsHtml}</div>` : ""}
      </article>
    `;
  }).join("");
}


function getAboutCardWidthClass(width) {
  const normalized = safeText(width).toLowerCase();

  const widthClasses = {
    quarter: "aboutWidthQuarter",
    half: "aboutWidthHalf",
    "three-quarter": "aboutWidthThreeQuarter",
    full: "aboutWidthFull"
  };

  return widthClasses[normalized] || "aboutWidthHalf";
}

function renderAboutStats(items) {
  const list = document.getElementById("aboutStatsList");
  if (!list) return;

  list.innerHTML = (items || []).map(item => {
    const title = safeText(item.title);
    const value = safeText(item.value);

    const styles = item && item.textStyles && typeof item.textStyles === "object" ? item.textStyles : {};
    return `
      <div class="item aboutSearchItem" data-search-text="${escapeHtml((title + " " + value).toLowerCase())}">
        <div class="itemTitle" style="${aboutTextStyle(styles.title)}">${escapeHtml(title)}</div>
        <div class="meta" style="${aboutTextStyle(styles.value)}">${escapeHtml(value)}</div>
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
  const carouselTitle = document.getElementById("aboutCarouselTitle");
  if (carouselTitle) carouselTitle.textContent = safeText(carousel.title) || "Photo Gallery";
  const carouselStyles = carousel.textStyles && typeof carousel.textStyles === "object" ? carousel.textStyles : {};
  if (carouselTitle) carouselTitle.style.cssText += ";" + aboutTextStyle(carouselStyles.title);
  intro.style.cssText += ";" + aboutTextStyle(carouselStyles.intro);
  aboutCarouselState.slides = slides;
  aboutCarouselState.intervalMs = Number(carousel.intervalMs) > 0 ? Number(carousel.intervalMs) : 5000;

  track.innerHTML = slides.map((item, index) => `
    <div class="aboutSlide" aria-hidden="${index === 0 ? "false" : "true"}">
      <img src="${escapeHtml(item.src)}" alt="${escapeHtml(safeText(item.alt))}">
      ${(safeText(item.title) || safeText(item.caption)) ? `
        <div class="aboutSlideCaption">
          ${safeText(item.title) ? `<h3 class="aboutSlideTitle" style="${aboutTextStyle(item.textStyles && item.textStyles.title)}">${escapeHtml(item.title)}</h3>` : ""}
          ${safeText(item.caption) ? `<p class="aboutSlideText" style="${aboutTextStyle(item.textStyles && item.textStyles.caption)}">${escapeHtml(item.caption)}</p>` : ""}
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