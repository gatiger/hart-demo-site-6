let protocolData;
let deferredPrompt;
let selectedId = null;

const treeNav = document.getElementById('treeNav');
const searchBox = document.getElementById('searchBox');
const installBtn = document.getElementById('installBtn');
const homeBtn = document.getElementById('homeBtn');

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredPrompt = event;
  installBtn.hidden = false;
});

installBtn?.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.hidden = true;
});

async function init() {
  const response = await fetch('content/ems_protocols_content.json', { cache: 'no-cache' });
  protocolData = await response.json();
  document.getElementById('metaLine').textContent = `Effective ${formatDate(protocolData.meta.effectiveDate)} • ${protocolData.protocols.length} entries`;
  renderTree(protocolData.navigation);
  showSplash();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js').catch(() => {});
}

function showSplash() {
  if (!protocolData) return;
  selectedId = null;
  markActiveButton();

  const meta = protocolData.meta || {};
  document.getElementById('protocolType').textContent = 'Welcome';
  document.getElementById('protocolPages').textContent = '';
  document.getElementById('protocol-title').textContent = 'Hart County EMS Protocols';
  document.getElementById('protocolPath').textContent = '';
  document.getElementById('reviewNotice').hidden = true;

  const content = document.getElementById('protocolContent');
  content.innerHTML = `
    <section class="protocol-splash" aria-labelledby="splash-heading">
      <div class="splash-banner">
        <img src="assets/Hart_EMS_Banner.webp" alt="Hart County EMS">
      </div>
      <p class="splash-agency">${escapeHtml(meta.agency || 'Hart County Emergency Medical Services')}</p>
      <h3 id="splash-heading">Prehospital Clinical Operating Protocols &amp; Standing Orders</h3>
      <p class="splash-effective">Effective ${escapeHtml(formatDate(meta.effectiveDate))}</p>
      <dl class="splash-leadership">
        <div><dt>Medical Director</dt><dd>${escapeHtml(meta.medicalDirector || '')}</dd></div>
        <div><dt>EMS Director</dt><dd>${escapeHtml(meta.emsDirector || '')}</dd></div>
      </dl>
      <div class="splash-actions">
        <button id="browseProtocolsBtn" class="btn btn-primary" type="button">Browse Protocols</button>
        <a class="btn" href="${escapeHtml(meta.sourcePdf || 'documents/ems/2026-hcems-protocols.pdf')}" target="_blank" rel="noopener">Open Official PDF</a>
      </div>
      <p class="splash-note">Use the protocol navigation or search to find clinical guidance.</p>
    </section>
  `;

  document.getElementById('browseProtocolsBtn')?.addEventListener('click', () => {
    searchBox.focus();
    searchBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

homeBtn?.addEventListener('click', showSplash);
function formatDate(value) {
  if (!value) return 'date not set';
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function pdfUrlFor(protocol) {
  const pdf = protocol?.source?.pdf || protocolData?.meta?.sourcePdf || 'documents/ems/2026-hcems-protocols.pdf';
  const page = protocol?.source?.pageStart;
  return page ? `${pdf}#page=${page}` : pdf;
}


function pageImageUrlsFor(protocol) {
  const source = protocol?.source || {};
  const start = Number(source.pageStart || 0);
  const end = Number(source.pageEnd || start || 0);
  const urls = [];
  if (!start) return urls;
  for (let page = start; page <= end; page++) {
    urls.push({ page, url: `page-images/page-${String(page).padStart(3, '0')}.jpg` });
  }
  return urls;
}

function normalize(value) {
  return (value || '').toString().toLowerCase();
}

function searchProtocols(term) {
  const clean = normalize(term).trim();
  if (!clean) return [];
  const terms = clean.split(/\s+/).filter(Boolean);
  const results = [];

  for (const p of protocolData.protocols) {
    const title = normalize(p.title);
    const categories = normalize((p.categoryPath || []).join(' '));
    const tags = normalize((p.tags || []).join(' '));
    const text = normalize(p.plainText || p.pageText || '');
    const haystack = `${title} ${categories} ${tags} ${text}`;

    const allMatch = terms.every(t => haystack.includes(t));
    const phraseMatch = haystack.includes(clean);
    if (!allMatch && !phraseMatch) continue;

    let score = 0;
    if (title === clean) score += 100;
    if (title.includes(clean)) score += 50;
    if (categories.includes(clean)) score += 20;
    if (tags.includes(clean)) score += 20;
    if (text.includes(clean)) score += 10;
    for (const t of terms) {
      if (title.includes(t)) score += 10;
      if (text.includes(t)) score += 2;
    }

    results.push({ protocol: p, score, snippet: makeSnippet(p, terms, clean) });
  }

  return results.sort((a, b) => b.score - a.score || a.protocol.title.localeCompare(b.protocol.title));
}

function makeSnippet(protocol, terms, phrase) {
  const text = (protocol.plainText || protocol.pageText || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  const lower = text.toLowerCase();
  let index = phrase ? lower.indexOf(phrase) : -1;
  if (index < 0) {
    for (const t of terms) {
      index = lower.indexOf(t);
      if (index >= 0) break;
    }
  }
  if (index < 0) index = 0;
  const start = Math.max(0, index - 60);
  const end = Math.min(text.length, index + 150);
  return `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`;
}

function renderTree(sections, filter = '') {
  treeNav.innerHTML = '';
  const term = filter.trim();
  const results = searchProtocols(term);
  const matches = new Set(results.map(r => r.protocol.id));

  if (term) {
    const summary = document.createElement('div');
    summary.className = 'search-summary';
    summary.textContent = `${results.length} result${results.length === 1 ? '' : 's'} for “${term}”`;
    treeNav.appendChild(summary);

    const resultList = document.createElement('div');
    resultList.className = 'search-results';
    for (const { protocol, snippet } of results.slice(0, 20)) {
      const btn = document.createElement('button');
      btn.className = 'search-result-btn';
      btn.type = 'button';
      btn.dataset.id = protocol.id;
      btn.innerHTML = `<strong>${escapeHtml(protocol.title)}</strong><span>${escapeHtml(protocol.categoryPath.join(' › '))}</span>${snippet ? `<small>${escapeHtml(snippet)}</small>` : ''}`;
      btn.addEventListener('click', () => showProtocol(protocol.id));
      resultList.appendChild(btn);
    }
    treeNav.appendChild(resultList);
  }

  for (const section of sections) {
    const details = document.createElement('details');
    details.className = 'tree-section';
    details.open = !!term && sectionHasMatch(section, matches);

    const summary = document.createElement('summary');
    summary.className = 'tree-heading tree-toggle';
    summary.textContent = section.title;
    details.appendChild(summary);

    const children = document.createElement('div');
    children.className = 'tree-child';
    renderItems(section.children || [], children, matches, term);
    if (!term || children.children.length) {
      details.appendChild(children);
      treeNav.appendChild(details);
    }
  }
  markActiveButton();
}

function sectionHasMatch(section, matches) {
  const items = section.children || [];
  for (const item of items) {
    if (item.children && sectionHasMatch(item, matches)) return true;
    if (item.id && matches.has(item.id)) return true;
  }
  return false;
}

function renderItems(items, container, matches, term) {
  for (const item of items) {
    if (item.children) {
      const details = document.createElement('details');
      details.className = 'tree-group';
      details.open = !!term && sectionHasMatch(item, matches);

      const summary = document.createElement('summary');
      summary.className = 'tree-heading tree-subheading tree-toggle';
      summary.textContent = item.title;
      details.appendChild(summary);

      const childWrap = document.createElement('div');
      childWrap.className = 'tree-child';
      renderItems(item.children, childWrap, matches, term);
      if (!term || childWrap.children.length) {
        details.appendChild(childWrap);
        container.appendChild(details);
      }
      continue;
    }
    if (term && !matches.has(item.id)) continue;
    const btn = document.createElement('button');
    btn.className = 'tree-btn';
    btn.type = 'button';
    btn.textContent = `${item.title} ${item.pageStart ? `(p. ${item.pageStart}${item.pageEnd && item.pageEnd !== item.pageStart ? '-' + item.pageEnd : ''})` : ''}`;
    btn.dataset.id = item.id;
    btn.addEventListener('click', () => showProtocol(item.id));
    container.appendChild(btn);
  }
}

function showProtocol(id) {
  const protocol = protocolData.protocols.find(p => p.id === id);
  if (!protocol) return;
  selectedId = id;
  markActiveButton();

  document.getElementById('protocolType').textContent = protocol.type;
  document.getElementById('protocolPages').textContent = `PDF page ${protocol.source.pageLabel}`;
  document.getElementById('protocol-title').textContent = protocol.title;
  document.getElementById('protocolPath').textContent = protocol.categoryPath.join(' › ');
  document.getElementById('reviewNotice').hidden = !protocol.needsReview;

  const content = document.getElementById('protocolContent');
  content.innerHTML = '';

  const tools = document.createElement('div');
  tools.className = 'protocol-tools';
  const pdfLink = document.createElement('a');
  pdfLink.className = 'btn';
  pdfLink.href = protocol?.source?.pdf || protocolData?.meta?.sourcePdf || 'documents/ems/2026-hcems-protocols.pdf';
  pdfLink.target = '_blank';
  pdfLink.rel = 'noopener';
  pdfLink.textContent = 'Open full PDF';
  tools.appendChild(pdfLink);
  content.appendChild(tools);

  if ((protocol.displayMode === 'pdf-page' && !(protocol.content || []).length) || protocol.id === 'approval-statement') {
    const note = document.createElement('p');
    note.className = 'signature-note';
    note.textContent = protocol.id === 'approval-statement'
      ? 'This page is displayed from the official PDF because it contains signatures.'
      : 'This entry is displayed from the official PDF because it contains tables, charts, forms, algorithms, or visual formatting that should not be flattened into plain text.';
    content.appendChild(note);

    const imageWrap = document.createElement('div');
    imageWrap.className = 'pdf-page-image-wrap';
    const pages = pageImageUrlsFor(protocol);
    if (pages.length) {
      for (const pageInfo of pages) {
        const figure = document.createElement('figure');
        figure.className = 'pdf-page-figure';
        const img = document.createElement('img');
        img.className = 'pdf-page-image';
        img.src = pageInfo.url;
        img.alt = `${protocol.title} - PDF page ${pageInfo.page}`;
        img.loading = 'lazy';
        const cap = document.createElement('figcaption');
        cap.textContent = `PDF page ${pageInfo.page}`;
        figure.appendChild(img);
        figure.appendChild(cap);
        imageWrap.appendChild(figure);
      }
    } else {
      const missing = document.createElement('p');
      missing.textContent = 'Page image is not available yet.';
      imageWrap.appendChild(missing);
    }
    content.appendChild(imageWrap);

    if (protocol.plainText) {
      const details = document.createElement('details');
      details.className = 'extracted-text-details';
      const summary = document.createElement('summary');
      summary.textContent = 'Show extracted searchable text';
      const pre = document.createElement('pre');
      pre.className = 'plain-text-fallback';
      pre.textContent = protocol.plainText;
      details.appendChild(summary);
      details.appendChild(pre);
      content.appendChild(details);
    }
    return;
  }

  const blocks = protocol.content || [];
  for (const block of blocks) renderBlock(block, content);

  if (!blocks.length && protocol.plainText) {
    const pre = document.createElement('pre');
    pre.className = 'plain-text-fallback';
    pre.textContent = protocol.plainText;
    content.appendChild(pre);
  }
}

function renderBlock(block, container) {
  if (block.type === 'heading') {
    const level = block.level === 2 ? 'h3' : 'h4';
    const h = document.createElement(level);
    h.textContent = block.text;
    container.appendChild(h);
    return;
  }

  if (block.type === 'list') {
    const ordered = (block.ordered === true) || (block.items || []).every(item => /^\s*\d+[\).]/.test(item));
    const list = document.createElement(ordered ? 'ol' : 'ul');
    for (const item of block.items || []) {
      const li = document.createElement('li');
      li.textContent = ordered ? item.replace(/^\s*\d+[\).]\s*/, '') : item.replace(/^\s*[•\-o]\s*/, '');
      list.appendChild(li);
    }
    container.appendChild(list);
    return;
  }

  if (block.type === 'table') {
    renderPdfStyleTable(block, container);
    return;
  }

  if (block.type === 'note' || block.type === 'warning') {
    const div = document.createElement('div');
    div.className = block.type === 'warning' ? 'warning-block' : 'note-block';
    div.textContent = block.text || '';
    container.appendChild(div);
    return;
  }

  const p = document.createElement('p');
  p.textContent = block.text || '';
  container.appendChild(p);
}


function normalizeCell(cell) {
  if (cell && typeof cell === 'object') return cell;
  return { text: cell == null ? '' : String(cell) };
}

function applyCellFormatting(el, cell, isHeader = false) {
  const c = normalizeCell(cell);
  el.textContent = c.text || '';
  if (c.colspan) el.colSpan = Number(c.colspan);
  if (c.rowspan) el.rowSpan = Number(c.rowspan);
  if (c.align) el.style.textAlign = c.align;
  if (c.valign) el.style.verticalAlign = c.valign;
  if (c.width) el.style.width = c.width;
  if (c.bold || isHeader) el.classList.add('cell-bold');
  if (c.italic) el.classList.add('cell-italic');
  if (c.background) el.classList.add(`cell-bg-${c.background}`);
  if (c.className) el.classList.add(...String(c.className).split(/\s+/).filter(Boolean));
}

function looksLikeUnitRow(row) {
  const joined = (row || []).map(c => normalizeCell(c).text || '').join(' ').toLowerCase();
  return /mg|mcg|kg|lbs|lpm|cmh|dose|route|gtts|minute|hour/.test(joined);
}

function renderPdfStyleTable(block, container) {
  const wrap = document.createElement('div');
  wrap.className = 'table-wrap pdf-table-wrap';
  if (block.sourcePage) wrap.dataset.sourcePage = block.sourcePage;

  const table = document.createElement('table');
  table.className = 'pdf-table';
  if (block.caption) {
    const caption = document.createElement('caption');
    caption.textContent = block.caption;
    table.appendChild(caption);
  }

  if (block.columns?.length) {
    const colgroup = document.createElement('colgroup');
    for (const col of block.columns) {
      const colEl = document.createElement('col');
      if (col.width) colEl.style.width = col.width;
      colgroup.appendChild(colEl);
    }
    table.appendChild(colgroup);
  }

  if (block.headers?.length) {
    const thead = document.createElement('thead');
    const tr = document.createElement('tr');
    for (const header of block.headers) {
      const th = document.createElement('th');
      applyCellFormatting(th, header, true);
      tr.appendChild(th);
    }
    thead.appendChild(tr);
    table.appendChild(thead);
  }

  const tbody = document.createElement('tbody');
  (block.rows || []).forEach((row, index) => {
    const tr = document.createElement('tr');
    if (looksLikeUnitRow(row) && index === 0 && block.headers?.length) tr.classList.add('unit-row');
    for (const rawCell of row) {
      const cell = normalizeCell(rawCell);
      const useHeaderCell = cell.header === true || cell.scope === 'row' || cell.scope === 'col';
      const td = document.createElement(useHeaderCell ? 'th' : 'td');
      if (cell.scope) td.scope = cell.scope;
      applyCellFormatting(td, cell, useHeaderCell);
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);
  container.appendChild(wrap);
}

function markActiveButton() {
  document.querySelectorAll('.tree-btn, .search-result-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.id === selectedId);
  });
}

function escapeHtml(value) {
  return (value || '').replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));
}

searchBox.addEventListener('input', event => renderTree(protocolData.navigation, event.target.value));
init().catch(err => {
  document.getElementById('protocolContent').innerHTML = `<p>Could not load protocol data. ${escapeHtml(err.message)}</p>`;
});
