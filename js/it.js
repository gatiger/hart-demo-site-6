document.addEventListener("DOMContentLoaded", async () => {
  try {
    const data = await loadJSON("./content/it.json");
    renderITPage(data || {});
  } catch (err) {
    console.error(err);
    const main = document.getElementById("main");
    if (main) {
      main.insertAdjacentHTML(
        "afterbegin",
        '<div class="card"><p class="sub">Unable to load Information Technology information at this time.</p></div>'
      );
    }
  }
});

function renderITPage(data){
  const safe = (value) =>
    value === undefined || value === null ? "" : String(value).trim();

  const escapeHtml = (value) =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const intro = data.intro || {};

  setText("itEyebrow", intro.eyebrow || "Hart County");
  setText("itTitle", intro.title || "Information Technology");
  setText("itDescription", intro.description || "");

  renderParagraphs("itOverview", data.overview || []);
  renderResponsibilities(data.responsibilities || []);

  function setText(id, value){
    const element = document.getElementById(id);
    if (element) element.textContent = safe(value);
  }

  function renderParagraphs(id, paragraphs){
    const mount = document.getElementById(id);
    if (!mount) return;

    mount.innerHTML = paragraphs
      .map(text => `<p>${escapeHtml(safe(text))}</p>`)
      .join("");
  }

  function renderResponsibilities(items){
    const mount = document.getElementById("itResponsibilities");
    if (!mount) return;

    mount.innerHTML = items
      .map(item => `<li>${escapeHtml(safe(item))}</li>`)
      .join("");
  }
}
