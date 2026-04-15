document.addEventListener("DOMContentLoaded", () => {
  initArchivesPage();
});

let archivesData = null;
let activeFileButton = null;

async function initArchivesPage() {
  try {
    const res = await fetch("/content/documents.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load /content/documents.json");

    archivesData = await res.json();

    renderArchivesHeader(archivesData.archivesPage || {});

    const categories = sortArchivesTreeData(
      filterCategoriesByShowIn(
        normalizeArchivesData(archivesData),
        "archives"
      )
    );

    renderArchivesTree(categories);
    updateSearchStatus(categories, "");

    const searchInput = document.getElementById("archivesSearchInput");
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        const query = safeText(searchInput.value).toLowerCase();
        const filtered = sortArchivesTreeData(filterArchives(categories, query));

        activeFileButton = null;
        renderArchivesTree(filtered);
        updateSearchStatus(filtered, query);

        const firstVisibleFile = document.querySelector(".archiveFileBtn");
        if (firstVisibleFile) {
          firstVisibleFile.click();
        } else {
          clearViewerForNoResults(query);
        }
      });
    }
  } catch (err) {
    console.error(err);

    const nav = document.getElementById("archivesNavTree");
    const title = document.getElementById("archivesViewerTitle");
    const desc = document.getElementById("archivesViewerDescription");

    if (nav) {
      nav.innerHTML = `<p>Unable to load archived documents.</p>`;
    }

    if (title) title.textContent = "Unable to load archive";
    if (desc) desc.innerHTML = `<p>Please try again later.</p>`;
  }
}

function renderArchivesHeader(data) {
  setText("archivesPageTitle", data.pageTitle);
  setText("archivesPageIntro", data.pageIntro);
}

function normalizeArchivesData(data) {
  if (Array.isArray(data.categories)) {
    return data.categories;
  }

  return [];
}

function filterCategoriesByShowIn(categories, target) {
  return (categories || [])
    .map(category => ({
      ...category,
      types: (Array.isArray(category.types) ? category.types : [])
        .map(type => ({
          ...type,
          files: (Array.isArray(type.files) ? type.files : []).filter(file => {
            const showIn = safeText(file.showIn).toLowerCase();
            return showIn === target;
          })
        }))
        .filter(type => Array.isArray(type.files) && type.files.length > 0)
    }))
    .filter(category => Array.isArray(category.types) && category.types.length > 0);
}

function sortArchivesTreeData(categories) {
  return (categories || [])
    .map(category => ({
      ...category,
      types: (Array.isArray(category.types) ? category.types : [])
        .map(type => ({
          ...type,
          files: (Array.isArray(type.files) ? type.files : [])
            .slice()
            .sort(compareFilesByDateDesc)
        }))
        .sort((a, b) =>
          safeText(a.name).localeCompare(safeText(b.name), undefined, { sensitivity: "base" })
        )
    }))
    .sort((a, b) =>
      safeText(a.name).localeCompare(safeText(b.name), undefined, { sensitivity: "base" })
    );
}

function compareFilesByDateDesc(a, b) {
  const aTime = getFileSortTime(a);
  const bTime = getFileSortTime(b);

  if (aTime !== bTime) return bTime - aTime;

  return safeText(a.label || a.title).localeCompare(
    safeText(b.label || b.title),
    undefined,
    { sensitivity: "base" }
  );
}

function getFileSortTime(file) {
  const updatedDate = parseDateString(file.updated);
  if (updatedDate) return updatedDate.getTime();

  const year = parseYearValue(file.year);
  if (year) return new Date(year, 11, 31).getTime();

  return 0;
}

function parseYearValue(value) {
  const text = safeText(value);
  const match = text.match(/\b(19|20)\d{2}\b/);
  return match ? Number(match[0]) : null;
}

function parseDateString(value) {
  const text = safeText(value);
  if (!text) return null;

  const direct = new Date(text);
  if (!Number.isNaN(direct.getTime())) return direct;

  const normalized = text
    .replace(/(\d+)(st|nd|rd|th)\b/gi, "$1")
    .replace(/\s+/g, " ")
    .trim();

  const retry = new Date(normalized);
  if (!Number.isNaN(retry.getTime())) return retry;

  const monthYear = normalized.match(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/i
  );
  if (monthYear) {
    const fallback = new Date(`${monthYear[1]} 1, ${monthYear[2]}`);
    if (!Number.isNaN(fallback.getTime())) return fallback;
  }

  const year = parseYearValue(normalized);
  if (year) {
    const fallback = new Date(year, 11, 31);
    if (!Number.isNaN(fallback.getTime())) return fallback;
  }

  return null;
}

function filterArchives(categories, query) {
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
            const text = [
              file.label,
              file.title,
              file.description,
              file.year,
              file.updated,
              file.fileType
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

function renderArchivesTree(categories) {
  const tree = document.getElementById("archivesNavTree");
  if (!tree) return;

  tree.innerHTML = "";

  if (!categories.length) {
    tree.innerHTML = `<p>No archived documents matched your search.</p>`;
    return;
  }

  categories.forEach(category => {
    const categoryWrap = document.createElement("section");
    categoryWrap.className = "archiveCategory";

    const categoryBtn = document.createElement("button");
    categoryBtn.className = "archiveCategoryBtn";
    categoryBtn.type = "button";
    categoryBtn.setAttribute("aria-expanded", "false");

    const categoryBtnText = document.createElement("span");
    categoryBtnText.className = "archiveCategoryBtnText";
    categoryBtnText.textContent = safeText(category.name);

    const categoryIcon = document.createElement("span");
    categoryIcon.className = "archiveCategoryIcon";
    categoryIcon.textContent = "›";

    categoryBtn.appendChild(categoryBtnText);
    categoryBtn.appendChild(categoryIcon);

    const typesWrap = document.createElement("div");
    typesWrap.className = "archiveTypes";
    typesWrap.hidden = true;

    const types = Array.isArray(category.types) ? category.types : [];

    types.forEach(type => {
      const typeWrap = document.createElement("section");
      typeWrap.className = "archiveType";

      const typeBtn = document.createElement("button");
      typeBtn.className = "archiveTypeBtn";
      typeBtn.type = "button";
      typeBtn.setAttribute("aria-expanded", "false");

      const typeBtnText = document.createElement("span");
      typeBtnText.textContent = safeText(type.name);

      const typeIcon = document.createElement("span");
      typeIcon.className = "archiveTypeIcon";
      typeIcon.textContent = "›";

      typeBtn.appendChild(typeBtnText);
      typeBtn.appendChild(typeIcon);

      const filesWrap = document.createElement("div");
      filesWrap.className = "archiveFiles";
      filesWrap.hidden = true;

      const files = Array.isArray(type.files) ? type.files : [];
      files.forEach(file => {
        const fileBtn = document.createElement("button");
        fileBtn.className = "archiveFileBtn";
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
      });

      typeWrap.appendChild(typeBtn);
      typeWrap.appendChild(filesWrap);
      typesWrap.appendChild(typeWrap);
    });

    categoryBtn.addEventListener("click", () => {
      const expanded = categoryBtn.getAttribute("aria-expanded") === "true";
      categoryBtn.setAttribute("aria-expanded", String(!expanded));
      typesWrap.hidden = expanded;
    });

    categoryWrap.appendChild(categoryBtn);
    categoryWrap.appendChild(typesWrap);
    tree.appendChild(categoryWrap);
  });
}

function renderFileDetails(file, categoryName, typeName) {
  setText("archivesViewerEyebrow", categoryName);
  setText("archivesViewerTitle", file.label || file.title);

  const meta = document.getElementById("archivesViewerMeta");
  const desc = document.getElementById("archivesViewerDescription");
  const frame = document.getElementById("archivesPreviewFrame");
  const fallback = document.getElementById("archivesPreviewFallback");

  if (meta) {
    meta.innerHTML = "";
    const items = [
      { label: "Type", value: typeName },
      { label: "Year", value: file.year },
      { label: "Updated", value: file.updated },
      { label: "File Type", value: file.fileType }
    ].filter(item => safeText(item.value));

    items.forEach(item => {
      const metaItem = document.createElement("span");
      metaItem.className = "archivesViewerMetaItem";
      metaItem.textContent = `${item.label}: ${safeText(item.value)}`;
      meta.appendChild(metaItem);
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
  const topWrap = document.getElementById("archivesViewerActionsTop");
  const bottomWrap = document.getElementById("archivesViewerActionsBottom");
  const openTop = document.getElementById("archivesViewerOpenTop");
  const openBottom = document.getElementById("archivesViewerOpenBottom");

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
  setText("archivesViewerEyebrow", "");
  setText("archivesViewerTitle", "No matching files");

  const meta = document.getElementById("archivesViewerMeta");
  const desc = document.getElementById("archivesViewerDescription");
  const frame = document.getElementById("archivesPreviewFrame");
  const fallback = document.getElementById("archivesPreviewFallback");

  if (meta) meta.innerHTML = "";
  if (desc) {
    desc.innerHTML = `<p>No archived documents matched "${escapeHtml(query)}".</p>`;
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
  const status = document.getElementById("archivesSearchStatus");
  if (!status) return;

  const totalFiles = countFiles(categories);

  if (!query) {
    status.textContent = `${totalFiles} archived file${totalFiles === 1 ? "" : "s"} shown.`;
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