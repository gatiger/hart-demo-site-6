document.addEventListener("DOMContentLoaded", () => {
  initFormsPage();
});

let formsData = null;
let activeFileButton = null;

async function initFormsPage() {
  try {
    const res = await fetch("/content/forms.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load /content/forms.json");

    formsData = await res.json();

    renderFormsHeader(formsData);

    const categories = normalizeFormsData(formsData);
    renderFormsTree(categories);
    updateSearchStatus(categories, "");


    const searchInput = document.getElementById("formsSearchInput");
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        const query = safeText(searchInput.value).toLowerCase();
        const filtered = filterForms(categories, query);

        activeFileButton = null;
        renderFormsTree(filtered);
        updateSearchStatus(filtered, query);

        const firstVisibleFile = document.querySelector(".formFileBtn");
        if (firstVisibleFile) {
          firstVisibleFile.click();
        } else {
          clearViewerForNoResults(query);
        }
      });
    }
  } catch (err) {
    console.error(err);

    const nav = document.getElementById("formsNavTree");
    const title = document.getElementById("formsViewerTitle");
    const desc = document.getElementById("formsViewerDescription");

    if (nav) {
      nav.innerHTML = `<p>Unable to load forms and documents.</p>`;
    }

    if (title) title.textContent = "Unable to load forms";
    if (desc) desc.innerHTML = `<p>Please try again later.</p>`;
  }
}

function renderFormsHeader(data) {
  setText("formsPageTitle", data.pageTitle);
  setText("formsPageIntro", data.pageIntro);

  const archiveLink = document.getElementById("formsArchiveLink");
  if (archiveLink) {
    archiveLink.textContent = safeText(data.archiveLink?.label);
    archiveLink.href = safeText(data.archiveLink?.href) || "#";
  }
}

function normalizeFormsData(data) {
  if (Array.isArray(data.categories)) {
    return data.categories;
  }

  const departments = Array.isArray(data.departments) ? data.departments : [];

  return departments.map(dept => ({
    id: dept.id || safeText(dept.name).toLowerCase().replace(/\s+/g, "-"),
    name: dept.name,
    types: [
      {
        id: `${dept.id || "dept"}-documents`,
        name: "Documents",
        files: (Array.isArray(dept.items) ? dept.items : []).map(item => ({
          label: item.title,
          title: item.title,
          href: item.href,
          description: item.description,
          year: item.year,
          updated: item.updated,
          fileType: item.fileType,
          keywords: item.keywords
        }))
      }
    ]
  }));
}

function filterForms(categories, query) {
  if (!query) return categories;

  return categories
    .map(category => {
      const categoryName = safeText(category.name).toLowerCase();
      const categoryMatches = categoryName.includes(query);

      const filteredTypes = (Array.isArray(category.types) ? category.types : [])
        .map(type => {
          const typeName = safeText(type.name).toLowerCase();
          const typeMatches = typeName.includes(query);

          const filteredFiles = (Array.isArray(type.files) ? type.files : []).filter(file => {
            const keywords = Array.isArray(file.keywords)
              ? file.keywords.map(k => safeText(k)).join(" ")
              : "";

            const text = [
              file.label,
              file.title,
              file.description,
              file.year,
              file.updated,
              file.fileType,
              keywords
            ]
              .map(safeText)
              .join(" ")
              .toLowerCase();

            return categoryMatches || typeMatches || text.includes(query);
          });

          return {
            ...type,
            files: filteredFiles
          };
        })
        .filter(type => type.files.length > 0 || safeText(type.name).toLowerCase().includes(query));

      return {
        ...category,
        types: filteredTypes
      };
    })
    .filter(category => category.types.length > 0 || safeText(category.name).toLowerCase().includes(query));
}

function renderFormsTree(categories) {
  const tree = document.getElementById("formsNavTree");
  if (!tree) return;

  tree.innerHTML = "";

  if (!categories.length) {
    tree.innerHTML = `<p>No forms or documents matched your search.</p>`;
    return;
  }

  categories.forEach(category => {
    const categoryWrap = document.createElement("section");
    categoryWrap.className = "formCategory";

    const categoryBtn = document.createElement("button");
    categoryBtn.className = "formCategoryBtn";
    categoryBtn.type = "button";
    categoryBtn.setAttribute("aria-expanded", "false");

    const categoryBtnText = document.createElement("span");
    categoryBtnText.className = "formCategoryBtnText";
    categoryBtnText.textContent = safeText(category.name);

    const categoryIcon = document.createElement("span");
    categoryIcon.className = "formCategoryIcon";
    categoryIcon.textContent = "−";

    categoryBtn.appendChild(categoryBtnText);
    categoryBtn.appendChild(categoryIcon);

    const typesWrap = document.createElement("div");
    typesWrap.className = "formTypes";
    typesWrap.hidden = true;

    const types = Array.isArray(category.types) ? category.types : [];

    types.forEach(type => {
      const typeWrap = document.createElement("section");
      typeWrap.className = "formType";

      const typeBtn = document.createElement("button");
      typeBtn.className = "formTypeBtn";
      typeBtn.type = "button";
      typeBtn.setAttribute("aria-expanded", "false");

      const typeBtnText = document.createElement("span");
      typeBtnText.textContent = safeText(type.name);

      const typeIcon = document.createElement("span");
      typeIcon.className = "formTypeIcon";
      typeIcon.textContent = "−";

      typeBtn.appendChild(typeBtnText);
      typeBtn.appendChild(typeIcon);

      const filesWrap = document.createElement("div");
      filesWrap.className = "formFiles";
      filesWrap.hidden = true;

      const files = Array.isArray(type.files) ? type.files : [];
      files.forEach(file => {
        const fileBtn = document.createElement("button");
        fileBtn.className = "formFileBtn";
        fileBtn.type = "button";
        fileBtn.textContent = safeText(file.label || file.title);

        fileBtn.addEventListener("click", () => {
          if (activeFileButton) activeFileButton.classList.remove("is-active");
          fileBtn.classList.add("is-active");
          activeFileButton = fileBtn;
          renderFileDetails(file, category.name, type.name);
        });

        filesWrap.appendChild(fileBtn);
      });

      typeBtn.addEventListener("click", () => {
        const expanded = typeBtn.getAttribute("aria-expanded") === "true";
        typeBtn.setAttribute("aria-expanded", String(!expanded));
        filesWrap.hidden = expanded;
        typeIcon.textContent = expanded ? "+" : "−";
      });

      typeWrap.appendChild(typeBtn);
      typeWrap.appendChild(filesWrap);
      typesWrap.appendChild(typeWrap);
    });

    categoryBtn.addEventListener("click", () => {
      const expanded = categoryBtn.getAttribute("aria-expanded") === "true";
      categoryBtn.setAttribute("aria-expanded", String(!expanded));
      typesWrap.hidden = expanded;
      categoryIcon.textContent = expanded ? "+" : "−";
    });

    categoryWrap.appendChild(categoryBtn);
    categoryWrap.appendChild(typesWrap);
    tree.appendChild(categoryWrap);
  });
}

function renderFileDetails(file, categoryName, typeName) {
  setText("formsViewerEyebrow", categoryName);
  setText("formsViewerTitle", file.label || file.title);

  const meta = document.getElementById("formsViewerMeta");
  const desc = document.getElementById("formsViewerDescription");
  const frame = document.getElementById("formsPreviewFrame");
  const fallback = document.getElementById("formsPreviewFallback");

  if (meta) {
    meta.innerHTML = "";
    const items = [
      { label: "Type", value: typeName },
      { label: "Year", value: file.year },
      { label: "Updated", value: file.updated },
      { label: "File Type", value: file.fileType }
    ].filter(item => safeText(item.value));

    items.forEach(item => {
      const pill = document.createElement("span");
      pill.className = "formsViewerMetaItem";
      pill.textContent = `${item.label}: ${safeText(item.value)}`;
      meta.appendChild(pill);
    });
  }

  if (desc) {
    desc.innerHTML = "";
    if (safeText(file.description)) {
      const p = document.createElement("p");
      p.textContent = safeText(file.description);
      desc.appendChild(p);
    }
  }

  const href = safeText(file.href);
  setViewerActions(href);

  const fileType = safeText(file.fileType).toLowerCase();
  const canPreviewPdf = href && (fileType === "pdf" || href.toLowerCase().endsWith(".pdf"));

  if (canPreviewPdf && frame && fallback) {
    frame.src = href;
    frame.hidden = false;
    fallback.hidden = true;
  } else if (frame && fallback) {
    frame.src = "";
    frame.hidden = true;
    fallback.hidden = false;
    fallback.innerHTML = `
      <p>
        Preview is not available for this file type here.
        Use the “Open PDF (Print or Save)” link above or below to view it.
      </p>
    `;
  }
}

function setViewerActions(href) {
  const topWrap = document.getElementById("formsViewerActionsTop");
  const bottomWrap = document.getElementById("formsViewerActionsBottom");

  const openTop = document.getElementById("formsViewerOpenTop");
  const openBottom = document.getElementById("formsViewerOpenBottom");

  if (!href) {
    if (topWrap) topWrap.hidden = true;
    if (bottomWrap) bottomWrap.hidden = true;
    return;
  }

  if (topWrap) topWrap.hidden = false;
  if (bottomWrap) bottomWrap.hidden = false;

  [openTop, openBottom].forEach(link => {
    if (link) link.href = href;
  });
}

function clearViewerActions() {
  setViewerActions("");
}

function clearViewerForNoResults(query) {
  setText("formsViewerEyebrow", "");
  setText("formsViewerTitle", "No matching files");

  const meta = document.getElementById("formsViewerMeta");
  const desc = document.getElementById("formsViewerDescription");
  const frame = document.getElementById("formsPreviewFrame");
  const fallback = document.getElementById("formsPreviewFallback");

  if (meta) meta.innerHTML = "";
  if (desc) {
    desc.innerHTML = `<p>No forms or documents matched "${escapeHtml(query)}".</p>`;
  }

  clearViewerActions();

  if (frame) {
    frame.src = "";
    frame.hidden = true;
  }
  if (fallback) {
    fallback.hidden = false;
    fallback.innerHTML = `<p>Try another search term.</p>`;
  }
}

function updateSearchStatus(categories, query) {
  const status = document.getElementById("formsSearchStatus");
  if (!status) return;

  const totalFiles = countFiles(categories);

  if (!query) {
    status.textContent = `${totalFiles} file${totalFiles === 1 ? "" : "s"} shown.`;
  } else if (totalFiles > 0) {
    status.textContent = `${totalFiles} match${totalFiles === 1 ? "" : "es"} for "${query}".`;
  } else {
    status.textContent = `No matches for "${query}".`;
  }
}

function countFiles(categories) {
  let count = 0;
  categories.forEach(category => {
    (Array.isArray(category.types) ? category.types : []).forEach(type => {
      count += Array.isArray(type.files) ? type.files.length : 0;
    });
  });
  return count;
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