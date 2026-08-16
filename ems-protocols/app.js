let protocolData;
let deferredPrompt;
let selectedId = null;
let viewHistory = [];
let viewHistoryIndex = -1;
const CONTENT_VERSION = 'v133';

const treeNav = document.getElementById('treeNav');
const searchBox = document.getElementById('searchBox');
const installBtn = document.getElementById('installBtn');
const homeBtn = document.getElementById('homeBtn');
const backBtn = document.getElementById('backBtn');
const forwardBtn = document.getElementById('forwardBtn');

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
  const response = await fetch('content/ems_protocols_content.json?v=' + CONTENT_VERSION, { cache: 'no-store' });
  protocolData = await response.json();
  document.getElementById('metaLine').textContent = `Effective ${formatDate(protocolData.meta.effectiveDate)} • ${protocolData.protocols.length} entries`;
  renderTree(protocolData.navigation);
  showSplash();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js', { updateViaCache: 'none' }).then(registration => registration.update()).catch(() => {});
}

function showSplash() {
  if (!protocolData) return;
  selectedId = null;
  markActiveButton();

  const meta = protocolData.meta || {};
  document.getElementById('protocolType').textContent = 'Welcome';
  document.getElementById('protocol-title').textContent = 'Hart County EMS Protocols';
  document.getElementById('protocolPath').textContent = '';

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
const text = normalize(`${p.plainText || ''} ${JSON.stringify(p.content || [])}`);
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
    btn.textContent = item.title;
    btn.dataset.id = item.id;
    btn.addEventListener('click', () => showProtocol(item.id));
    container.appendChild(btn);
  }
}

function showProtocol(id, options = {}) {
  const shouldRecordHistory = options.recordHistory !== false;
  const protocol = protocolData.protocols.find(p => p.id === id);
  if (!protocol) return;

  if (shouldRecordHistory && viewHistory[viewHistoryIndex] !== id) {
    viewHistory = viewHistory.slice(0, viewHistoryIndex + 1);
    viewHistory.push(id);
    viewHistoryIndex = viewHistory.length - 1;
  }

  selectedId = id;
  updateHistoryButtons();
  markActiveButton();

  document.getElementById('protocolType').textContent = protocol.type;
  document.getElementById('protocol-title').textContent = protocol.title;
  document.getElementById('protocolPath').textContent = protocol.categoryPath.join(' › ');

  const content = document.getElementById('protocolContent');
  content.innerHTML = '';

  if (protocol.displayMode === 'native-approval') {
    renderApprovalStatement(protocol.approval || {}, content);
    return;
  }

  if (protocol.displayMode === 'native-legend') {
    renderLegend(protocol.legend || {}, content);
    return;
  }

  if (protocol.displayMode === 'pdf-page') {

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
        img.alt = protocol.title;
        img.loading = 'lazy';
        figure.appendChild(img);
        imageWrap.appendChild(figure);
      }
    } else {
      const missing = document.createElement('p');
      missing.textContent = 'Page image is not available yet.';
      imageWrap.appendChild(missing);
    }
    content.appendChild(imageWrap);

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

function renderApprovalStatement(approval, container) {
  const approvers = Array.isArray(approval.approvers) ? approval.approvers : [];
  const section = document.createElement('section');
  section.className = 'approval-page';
  section.setAttribute('aria-labelledby', 'approval-page-heading');

  section.innerHTML = `
    <div class="approval-mark" aria-hidden="true">
      <img src="icons/ems-192.png" alt="">
    </div>
    <p class="approval-kicker">Hart County Emergency Medical Services</p>
    <h3 id="approval-page-heading">Official Protocol Approval</h3>
    <div class="approval-statement-copy">
      ${approval.statement ? `<p>${escapeHtml(approval.statement)}</p>` : ''}
      ${approval.effectiveStatement ? `<p>${escapeHtml(approval.effectiveStatement)}</p>` : ''}
    </div>
    <div class="approval-divider" aria-hidden="true"></div>
    <h4>Approved By</h4>
    <div class="approval-signers">
      ${approvers.map(person => `
        <article class="approval-signer">
          <p class="approval-name">${escapeHtml(person.name || '')}</p>
          <p class="approval-title">${escapeHtml(person.title || '')}</p>
          <p class="approval-status">${escapeHtml(person.status || 'Signature on file')}</p>
        </article>
      `).join('')}
    </div>
    <aside class="approval-record" aria-labelledby="approval-record-title">
      <h4 id="approval-record-title">${escapeHtml(approval.recordsTitle || 'Official Record')}</h4>
      <p>${escapeHtml(approval.recordsNotice || '')}</p>
    </aside>
  `;

  container.appendChild(section);
}
function renderLegend(legend, container) {
  const items = Array.isArray(legend.items) ? legend.items : [];
  const section = document.createElement('section');
  section.className = 'legend-page';
  section.setAttribute('aria-labelledby', 'legend-page-heading');

  section.innerHTML = `
    <header class="legend-intro">
      <p class="legend-kicker">Protocol Reference</p>
      <h3 id="legend-page-heading">Legend</h3>
      ${legend.introduction ? `<p>${escapeHtml(legend.introduction)}</p>` : ''}
      ${legend.abbreviationsNote ? `<p>${escapeHtml(legend.abbreviationsNote)}</p>` : ''}
    </header>
    <div class="legend-grid">
      ${items.map(item => `
        <article class="legend-item">
          <div class="legend-image-frame">
            <img src="${escapeHtml(item.image || '')}" alt="${escapeHtml(item.alt || '')}" loading="lazy">
            <div class="legend-image-placeholder" aria-hidden="true">
              <span>Image coming soon</span>
              <code>${escapeHtml((item.image || '').split('/').pop() || '')}</code>
            </div>
          </div>
          <div class="legend-item-copy">
            <h4>${escapeHtml(item.title || '')}</h4>
            <p>${escapeHtml(item.description || '')}</p>
          </div>
        </article>
      `).join('')}
    </div>
  `;

  section.querySelectorAll('.legend-image-frame img').forEach(img => {
    const markMissing = () => img.closest('.legend-image-frame').classList.add('is-missing');
    img.addEventListener('error', markMissing, { once: true });
    if (img.complete && !img.naturalWidth) markMissing();
  });

  container.appendChild(section);
}
function renderReferenceLink(block, container) {
  const wrap = document.createElement('div');
  wrap.className = `reference-link ${block.type === 'protocol-link' ? 'reference-link-internal' : 'reference-link-external'}`;

  if (block.type === 'protocol-link') {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'reference-link-control';
    button.textContent = block.text || block.label || '';
    button.addEventListener('click', () => showProtocol(block.protocolId));
    wrap.appendChild(button);
  } else {
    const link = document.createElement('a');
    link.className = 'reference-link-control';
    link.href = block.href || '#';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = block.text || block.label || block.href || '';
    wrap.appendChild(link);
  }

  container.appendChild(wrap);
}

function updateHistoryButtons() {
  if (backBtn) backBtn.disabled = viewHistoryIndex <= 0;
  if (forwardBtn) forwardBtn.disabled = viewHistoryIndex < 0 || viewHistoryIndex >= viewHistory.length - 1;
}

backBtn?.addEventListener('click', () => {
  if (viewHistoryIndex <= 0) return;
  viewHistoryIndex -= 1;
  showProtocol(viewHistory[viewHistoryIndex], { recordHistory: false });
});

forwardBtn?.addEventListener('click', () => {
  if (viewHistoryIndex >= viewHistory.length - 1) return;
  viewHistoryIndex += 1;
  showProtocol(viewHistory[viewHistoryIndex], { recordHistory: false });
});
function renderLegalText(block, container) {
  const section = document.createElement('section');
  section.className = 'legal-text-block';
  const rawLines = String(block.text || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const entries = [];
  let current = '';

  const isHeading = line => /^(TITLE|CHAPTER|ARTICLE|OCGA)\b/.test(line);
  const isClause = line => /^(?:\([a-z]\)(?:\(\d+\))?|\(\d+\)|\([A-Z]\)|\d+\.\s*\(\d+\))/.test(line);
  const flush = () => {
    if (current) entries.push({ type: 'text', text: current });
    current = '';
  };

  for (const line of rawLines) {
    if (/^Suspected Abuse \(Continued\)$/i.test(line)) continue;
    const previous = entries[entries.length - 1];
    if (!current && previous?.type === 'heading' && /^[A-Z0-9][A-Z0-9\s;:,\-]+$/.test(line) && !isHeading(line)) {
      previous.text += ` ${line}`;
    } else if (isHeading(line)) {
      flush();
      entries.push({ type: 'heading', text: line });
    } else if (isClause(line)) {
      flush();
      current = line;
    } else {
      current = current ? `${current} ${line}` : line;
    }
  }
  flush();

  for (const entry of entries) {
    if (entry.type === 'heading') {
      const heading = document.createElement('h4');
      heading.className = 'legal-source-heading';
      heading.textContent = entry.text;
      section.appendChild(heading);
      continue;
    }

    const paragraph = document.createElement('p');
    paragraph.className = 'legal-clause';
    if (/^\([A-Z]\)/.test(entry.text)) paragraph.classList.add('legal-indent-2');
    else if (/^(?:\(\d+\)|\d+\.\s*\(\d+\))/.test(entry.text)) paragraph.classList.add('legal-indent-1');
    paragraph.textContent = entry.text;
    section.appendChild(paragraph);
  }

  container.appendChild(section);
}
function renderDocumentExample(block, container) {
  const section = document.createElement('section');
  section.className = 'document-example';
  section.setAttribute('aria-label', block.title || 'Document example');

  const title = document.createElement('h4');
  title.className = 'document-example-title';
  title.textContent = block.title || '';
  section.appendChild(title);

  for (const line of block.lines || []) {
    const paragraph = document.createElement('p');
    appendPhoneAwareText(paragraph, line);
    section.appendChild(paragraph);
  }

  container.appendChild(section);
}
const mobilePhoneLinksEnabled = window.matchMedia('(max-width: 820px) and (pointer: coarse)').matches;
function appendPhoneAwareText(element, value) {
  const text = String(value || '');
  const phonePattern = /(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]\d{3}[\s.-]\d{4}/g;
  let lastIndex = 0;
  for (const match of text.matchAll(phonePattern)) {
    if (match.index > lastIndex) element.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
    if (mobilePhoneLinksEnabled) {
      const link = document.createElement('a');
      const digits = match[0].replace(/\D/g, '');
      link.className = 'mobile-phone-link';
      link.href = `tel:${digits.length === 10 ? `+1${digits}` : `+${digits}`}`;
      link.textContent = match[0];
      link.setAttribute('aria-label', `Call ${match[0]}`);
      element.appendChild(link);
    } else {
      element.appendChild(document.createTextNode(match[0]));
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) element.appendChild(document.createTextNode(text.slice(lastIndex)));
}function appendRichText(element, text, phrases = [], links = [], initials = [], redPhrases = [], underlinePhrases = []) {
  const source = String(text || '');
  const boldPhrases = (phrases || []).filter(Boolean);
  const linkedPhrases = (links || []).filter(link => link && link.text && link.protocolId);
  const initialPhrases = (initials || []).filter(Boolean);
  const redTextPhrases = (redPhrases || []).filter(Boolean);
  const underlinedPhrases = (underlinePhrases || []).filter(Boolean);
  if (!boldPhrases.length && !linkedPhrases.length && !initialPhrases.length && !redTextPhrases.length && !underlinedPhrases.length) {
    appendPhoneAwareText(element, source);
    return;
  }

  const tokens = [...new Set([
    ...linkedPhrases.map(link => link.text),
    ...initialPhrases,
    ...redTextPhrases,
    ...underlinedPhrases,
    ...boldPhrases
  ])].sort((a, b) => b.length - a.length);
  const escaped = tokens.map(phrase => phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const matcher = new RegExp(`(${escaped.join('|')})`, 'g');
  for (const part of source.split(matcher)) {
    if (!part) continue;
    const linkedPhrase = linkedPhrases.find(link => link.text === part);
    if (linkedPhrase) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'inline-protocol-link';
      button.textContent = part;
      if (boldPhrases.includes(part)) button.classList.add('inline-protocol-link-bold');
      button.addEventListener('click', () => showProtocol(linkedPhrase.protocolId));
      element.appendChild(button);
    } else if (initialPhrases.includes(part)) {
      const initial = document.createElement('strong');
      initial.className = 'assessment-emphasized-initial';
      initial.textContent = part.charAt(0);
      element.appendChild(initial);
      element.appendChild(document.createTextNode(part.slice(1)));
    } else if (redTextPhrases.includes(part)) {
      const red = document.createElement(boldPhrases.includes(part) ? 'strong' : 'span');
      red.className = 'protocol-red-text';
      appendPhoneAwareText(red, part);
      element.appendChild(red);
    } else if (boldPhrases.includes(part) || underlinedPhrases.includes(part)) {
      const emphasis = document.createElement(boldPhrases.includes(part) ? 'strong' : 'span');
      if (underlinedPhrases.includes(part)) emphasis.classList.add('protocol-underlined-text');
      appendPhoneAwareText(emphasis, part);
      element.appendChild(emphasis);
    } else {
      appendPhoneAwareText(element, part);
    }
  }
}function appendFlowItems(items, container) {
  const list = document.createElement('ul');
  for (const item of items || []) {
    const li = document.createElement('li');
    const itemData = typeof item === 'object' ? item : { text: item };
    const redPhrases = itemData.red === true ? [itemData.text || ''] : (itemData.red || []);
    if (itemData.struck) li.classList.add('protocol-struck-flow-item');
    if (itemData.highlight) li.classList.add('protocol-highlight-flow-item');
    if (itemData.noBullet) li.classList.add('flow-item-no-bullet');
    if (redPhrases.length && !itemData.redTextOnly) li.classList.add('protocol-red-flow-item');
    if (itemData.indent) li.classList.add(`flow-item-indent-${Math.min(Number(itemData.indent) || 1, 3)}`);
    if (itemData.pairs?.length) {
      li.classList.add('assessment-paired-item');
      const grid = document.createElement('div');
      grid.className = 'assessment-paired-grid';
      for (const pair of itemData.pairs) {
        for (const value of pair) {
          const cell = document.createElement('span');
          cell.textContent = value;
          grid.appendChild(cell);
        }
      }
      li.appendChild(grid);
      list.appendChild(li);
      continue;
    }
    let textContainer = li;
    if (itemData.icon) {
      li.classList.add('assessment-icon-item');
      const icon = document.createElement('img');
      icon.src = itemData.icon;
      icon.alt = itemData.iconAlt || '';
      icon.loading = 'lazy';
      li.appendChild(icon);
      textContainer = document.createElement('span');
      li.appendChild(textContainer);
    }
    appendRichText(textContainer, itemData.text || '', itemData.bold || [], itemData.links || [], itemData.emphasizedInitials || [], redPhrases);
    if (itemData.children?.length) appendFlowItems(itemData.children, li);
    list.appendChild(li);
  }
  container.appendChild(list);
}

function appendAssessmentStage(stage, container) {
  const section = document.createElement('section');
  section.className = 'assessment-stage';
  const heading = document.createElement('h4');
  heading.textContent = stage.title || '';
  section.appendChild(heading);
  if (stage.items?.length) appendFlowItems(stage.items, section);
  container.appendChild(section);
}

function renderPediatricAssessmentFlow(block, container) {
  const flow = document.createElement('section');
  flow.className = 'pediatric-assessment-flow';

  const first = document.createElement('section');
  first.className = 'assessment-stage assessment-first-impression';
  const firstHeading = document.createElement('h3');
  appendRichText(firstHeading, block.firstImpression.title, [], block.firstImpression.titleLinks || []);
  first.appendChild(firstHeading);
  appendFlowItems(block.firstImpression.items, first);
  flow.appendChild(first);

  const question = document.createElement('div');
  question.className = 'assessment-decision';
  question.textContent = block.question;
  flow.appendChild(question);

  const branches = document.createElement('div');
  branches.className = 'assessment-branches';
  for (const branchData of block.branches || []) {
    const branch = document.createElement('section');
    branch.className = `assessment-branch assessment-branch-${branchData.kind || 'standard'}`;
    const answer = document.createElement('p');
    answer.className = 'assessment-answer';
    answer.textContent = branchData.answer;
    branch.appendChild(answer);
    const title = document.createElement('h3');
    title.textContent = branchData.title;
    branch.appendChild(title);
    if (branchData.intro?.length) appendFlowItems(branchData.intro, branch);
    for (const stage of branchData.stages || []) appendAssessmentStage(stage, branch);
    branches.appendChild(branch);
  }
  flow.appendChild(branches);

  const documentation = document.createElement('section');
  documentation.className = 'assessment-documentation';
  const image = document.createElement('img');
  image.src = block.documentation.image;
  image.alt = block.documentation.alt || '';
  image.loading = 'lazy';
  documentation.appendChild(image);
  const documentationBody = document.createElement('div');
  const documentationHeading = document.createElement('h3');
  documentationHeading.textContent = block.documentation.title;
  documentationBody.appendChild(documentationHeading);
  appendFlowItems(block.documentation.items, documentationBody);
  documentation.appendChild(documentationBody);
  flow.appendChild(documentation);

  if (block.note) {
    const note = document.createElement('div');
    note.className = 'note-block assessment-note';
    note.textContent = block.note;
    flow.appendChild(note);
  }

  container.appendChild(flow);
}
function renderStrokeLateralityDiagram(block, container) {
  const figure = document.createElement('figure');
  figure.className = 'stroke-laterality-diagram';
  const heading = document.createElement('h3');
  heading.textContent = block.title || 'Stroke Laterality';
  figure.appendChild(heading);
  if (block.intro) {
    const intro = document.createElement('p');
    intro.className = 'stroke-laterality-intro';
    intro.textContent = block.intro;
    figure.appendChild(intro);
  }
  const grid = document.createElement('div');
  grid.className = 'stroke-laterality-grid';
  for (const panelData of block.panels || []) {
    const panel = document.createElement('article');
    panel.className = 'stroke-laterality-panel';
    const title = document.createElement('h4');
    title.textContent = panelData.title;
    panel.appendChild(title);
    const visual = document.createElement('div');
    visual.className = 'stroke-laterality-visual';
    const brain = document.createElement('div');
    brain.className = 'stroke-brain lesion-' + panelData.brainSide;
    brain.setAttribute('role', 'img');
    brain.setAttribute('aria-label', panelData.brainSide + ' brain hemisphere highlighted');
    brain.innerHTML = '<span class="hemisphere left"></span><span class="hemisphere right"></span><span class="brain-divider"></span>';
    visual.appendChild(brain);
    const arrow = document.createElement('span');
    arrow.className = 'stroke-laterality-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '→';
    visual.appendChild(arrow);
    const person = document.createElement('div');
    person.className = 'stroke-person affected-' + panelData.affectedSide + ' brain-' + panelData.brainSide;
    person.setAttribute('role', 'img');
    person.setAttribute('aria-label', panelData.affectedSide + ' side of body highlighted');
    person.innerHTML = '<span class="head"></span><span class="torso"></span><span class="arm left"></span><span class="arm right"></span><span class="leg left"></span><span class="leg right"></span>';
    visual.appendChild(person);
    panel.appendChild(visual);
    const affected = document.createElement('p');
    affected.className = 'stroke-affected-label';
    affected.textContent = panelData.affectedLabel;
    panel.appendChild(affected);
    appendFlowItems(panelData.effects || [], panel);
    grid.appendChild(panel);
  }
  figure.appendChild(grid);
  const footer = document.createElement('figcaption');
  const review = document.createElement('strong');
  review.textContent = block.reviewNote || '';
  footer.appendChild(review);
  if (block.sourceUrl && block.sourceLabel) {
    footer.appendChild(document.createTextNode(' Source: '));
    const source = document.createElement('a');
    source.href = block.sourceUrl;
    source.target = '_blank';
    source.rel = 'noopener noreferrer';
    source.textContent = block.sourceLabel;
    footer.appendChild(source);
  }
  figure.appendChild(footer);
  container.appendChild(figure);
}
function renderProtocolImage(block, container) {
  const figure = document.createElement('figure');
  figure.className = 'protocol-reference-image';
  const image = document.createElement('img');
  image.src = block.image;
  image.alt = block.alt || '';
  image.loading = 'lazy';
  image.addEventListener('error', () => figure.classList.add('is-missing'), { once: true });
  figure.appendChild(image);

  const placeholder = document.createElement('div');
  placeholder.className = 'protocol-reference-image-placeholder';
  placeholder.setAttribute('aria-hidden', 'true');
  placeholder.innerHTML = `<strong>Image coming soon</strong><code>${escapeHtml((block.image || '').split('/').pop() || '')}</code>`;
  figure.appendChild(placeholder);

  if (block.caption) {
    const caption = document.createElement('figcaption');
    caption.textContent = block.caption;
    figure.appendChild(caption);
  }
  container.appendChild(figure);
}

function renderIconNote(block, container) {
  const section = document.createElement('section');
  section.className = `protocol-icon-note ${block.red ? 'protocol-icon-note-red' : ''} ${block.arrowAfter ? 'flow-arrow-after' : ''}`;
  const image = document.createElement('img');
  image.src = block.image;
  image.alt = block.alt || '';
  image.loading = 'lazy';
  section.appendChild(image);
  const text = document.createElement('p');
  appendRichText(text, block.text || '', block.bold || [], block.links || []);
  section.appendChild(text);
  container.appendChild(section);
}

function renderDocumentationCard(block, container) {
  const section = document.createElement('section');
  section.className = 'protocol-documentation-card';
  const image = document.createElement('img');
  image.src = block.image;
  image.alt = block.alt || '';
  image.loading = 'lazy';
  section.appendChild(image);
  const body = document.createElement('div');
  const heading = document.createElement('h3');
  heading.textContent = block.title || 'Document:';
  body.appendChild(heading);
  appendFlowItems(block.items || [], body);
  section.appendChild(body);
  container.appendChild(section);
}
function renderStopControl(block, container) {
  const figure = document.createElement('figure');
  figure.className = `medical-control-reference ${block.arrowAfter ? 'flow-arrow-after' : ''}`;
  const image = document.createElement('img');
  image.src = block.image || 'assets/legend-medical-control.webp';
  image.alt = block.alt || `${block.title || 'STOP'} — ${block.text || 'CONTACT MEDICAL CONTROL'}`;
  image.loading = 'lazy';
  figure.appendChild(image);
  if (block.note) {
    const note = document.createElement('figcaption');
    note.className = 'medical-control-note';
    note.textContent = block.note;
    figure.appendChild(note);
  }
  container.appendChild(figure);
}
function renderScoreCallout(block, container) {
  const callout = document.createElement('div');
  callout.className = 'score-callout';
  appendRichText(callout, block.text || '', block.bold || [], block.links || []);
  container.appendChild(callout);
}
function renderFlowStage(block, container) {
  const section = document.createElement('section');
  section.className = `protocol-flow-stage ${block.arrowAfter && !block.sideDocumentation ? 'flow-arrow-after' : ''}`;
  const heading = document.createElement('h3');
  appendRichText(heading, block.title || '', block.bold || [], block.links || []);
  section.appendChild(heading);
  if (block.items?.length) appendFlowItems(block.items, section);
  if (block.sideDocumentation) {
    const row = document.createElement('div');
    row.className = `flow-stage-with-documentation ${block.sideDocumentationLayout ? `layout-${block.sideDocumentationLayout}` : ''} ${block.arrowAfter ? 'flow-arrow-after' : ''}`;
    row.appendChild(section);
    renderDocumentationCard(block.sideDocumentation, row);
    container.appendChild(row);
    return;
  }
  container.appendChild(section);
}

function renderThreeWayFlow(block, container) {
  const flow = document.createElement('section');
  flow.className = `three-way-flow ${block.arrowAfter ? 'flow-arrow-after' : ''}`;
  const connector = document.createElement('div');
  connector.className = 'three-way-connector';
  connector.setAttribute('aria-hidden', 'true');
  flow.appendChild(connector);
  const grid = document.createElement('div');
  grid.className = 'three-way-grid';
  for (const path of block.paths || []) {
    const card = document.createElement('section');
    card.className = 'three-way-card';
    const heading = document.createElement('h3');
    heading.textContent = path.title || '';
    card.appendChild(heading);
    appendFlowItems(path.items || [], card);
    grid.appendChild(card);
  }
  flow.appendChild(grid);
  container.appendChild(flow);
}
function renderTwoWayDecision(block, container) {
  const flow = document.createElement('section');
  flow.className = 'two-way-decision';
  const connector = document.createElement('div');
  connector.className = 'two-way-connector';
  const label = document.createElement('strong');
  label.textContent = block.question || '';
  connector.appendChild(label);
  flow.appendChild(connector);
  const grid = document.createElement('div');
  grid.className = 'two-way-grid';
  for (const path of block.paths || []) {
    const column = document.createElement('div');
    column.className = 'two-way-column';
    const answer = document.createElement('span');
    answer.className = 'two-way-answer';
    answer.textContent = path.answer || '';
    column.appendChild(answer);
    const card = document.createElement('section');
    card.className = 'two-way-card';
    if (!path.title && !(path.items || []).length) card.classList.add('two-way-card-empty');
    const heading = document.createElement('h3');
    heading.textContent = path.title || '';
    card.appendChild(heading);
    appendFlowItems(path.items || [], card);
    column.appendChild(card);
    grid.appendChild(column);
  }
  flow.appendChild(grid);
  const join = document.createElement('div');
  join.className = 'two-way-join';
  join.setAttribute('aria-hidden', 'true');
  flow.appendChild(join);
  if (block.footer) {
    const footer = document.createElement('section');
    footer.className = 'two-way-footer';
    appendFlowItems(block.footer.items || [], footer);
    flow.appendChild(footer);
  }
  container.appendChild(flow);
}
function renderLvadDeviceGrid(block, container) {
  const section = document.createElement('section');
  section.className = 'lvad-device-section' + (block.title === 'LVAD Monitor Comparison' ? ' lvad-monitor-section' : '');
  const heading = document.createElement('h3');
  heading.textContent = block.title || '';
  section.appendChild(heading);
  const grid = document.createElement('div');
  grid.className = 'lvad-device-grid';
  for (const device of block.devices || []) {
    const card = document.createElement('article');
    card.className = 'lvad-device-card';
    const image = document.createElement('img');
    image.src = device.image || '';
    image.alt = device.alt || '';
    image.loading = 'lazy';
    card.appendChild(image);
    const title = document.createElement('h4');
    title.textContent = device.name || '';
    card.appendChild(title);
    const subtitle = document.createElement('p');
    subtitle.className = 'lvad-device-type';
    subtitle.textContent = device.deviceType || '';
    card.appendChild(subtitle);
    const list = document.createElement('dl');
    for (const spec of device.specs || []) {
      const term = document.createElement('dt');
      term.textContent = spec.label || '';
      const value = document.createElement('dd');
      value.textContent = spec.value || '';
      list.append(term, value);
    }
    card.appendChild(list);
    grid.appendChild(card);
  }
  section.appendChild(grid);
  container.appendChild(section);
}

function renderLvadUnresponsiveFlow(block, container) {
  const flow = document.createElement('section');
  flow.className = 'lvad-unresponsive-flow';
  const heading = document.createElement('h3');
  heading.textContent = block.title || 'Assessment of the Unresponsive LVAD Patient';
  flow.appendChild(heading);
  const viewport = document.createElement('div');
  viewport.className = 'lvad-chart-viewport';
  viewport.innerHTML = `
    <svg class="lvad-chart" viewBox="0 0 1000 920" role="img" aria-labelledby="lvad-chart-title lvad-chart-desc">
      <title id="lvad-chart-title">Assessment of the unresponsive LVAD patient</title>
      <desc id="lvad-chart-desc">Decision flow assessing perfusion, VAD hum, restart status, chest compressions, ACLS protocols, and calling the VAD center.</desc>
      <defs><marker id="lvad-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z"></path></marker></defs>
      <g class="lvad-chart-lines" marker-end="url(#lvad-arrow)">
        <path d="M500 80 V100"/><path d="M500 200 V225"/>
        <path d="M380 260 H350"/><path d="M620 260 H650"/>
        <path d="M815 365 V392 H760 V395"/>
        <path d="M645 430 H590"/><path d="M760 465 V490"/>
        <path d="M775 580 V605"/>
        <path d="M655 640 H620 V530 H590"/>
        <path d="M760 675 V762 H340"/>
        <path d="M475 620 V762 H340"/>
        <path d="M185 365 V710 H210 V735"/>
        <path d="M210 790 V830"/>
      </g>
      <g class="lvad-chart-labels">
        <text x="360" y="250">YES</text><text x="640" y="250" class="no">NO</text>
        <text x="620" y="420">YES</text><text x="775" y="480" class="no">NO</text>
        <text x="625" y="630" class="no">NO</text><text x="775" y="700">YES</text>
      </g>
      <foreignObject x="400" y="20" width="200" height="60"><div class="lvad-svg-box start">Unresponsive LVAD Patient</div></foreignObject>
      <foreignObject x="325" y="100" width="350" height="100"><div class="lvad-svg-box">Assess ventilation and perfusion:<ul><li>Normal skin color?</li><li>Normal capillary refill?</li></ul></div></foreignObject>
      <foreignObject x="20" y="215" width="330" height="150"><div class="lvad-svg-box">Assess and treat non-LVAD causes for altered mental status such as:<ul class="two-column"><li>Hypoxia</li><li>Overdose</li><li>Stroke</li><li>Blood glucose</li></ul></div></foreignObject>
      <ellipse class="lvad-svg-decision" cx="500" cy="260" rx="120" ry="35"/><text class="lvad-svg-decision-text" x="500" y="254"><tspan x="500">Adequate</tspan><tspan x="500" dy="20">perfusion?</tspan></text>
      <foreignObject x="650" y="215" width="330" height="150"><div class="lvad-svg-box">Assess VAD:<ul><li>Connections ok?</li><li>Adequate power?</li><li>Auscultate apex for VAD hum</li></ul></div></foreignObject>
      <ellipse class="lvad-svg-decision" cx="760" cy="430" rx="115" ry="35"/><text class="lvad-svg-decision-text" x="760" y="436">VAD hum?</text>
      <foreignObject x="360" y="395" width="230" height="225"><div class="lvad-svg-box action">Perform external chest compressions</div></foreignObject>
      <foreignObject x="650" y="490" width="250" height="90"><div class="lvad-svg-box">Attempt to restart LVAD<br>Change controller</div></foreignObject>
      <ellipse class="lvad-svg-decision" cx="775" cy="640" rx="120" ry="35"/><text class="lvad-svg-decision-text" x="775" y="646">VAD restarted?</text>
      <foreignObject x="80" y="735" width="260" height="55"><div class="lvad-svg-box outcome">Follow ACLS protocols</div></foreignObject>
      <foreignObject x="110" y="830" width="200" height="55"><div class="lvad-svg-box call">Call VAD Center</div></foreignObject>
    </svg>`;
  flow.appendChild(viewport);
  container.appendChild(flow);
}
function renderBlock(block, container) {
  if (block.type === 'lvad-device-grid') {
    renderLvadDeviceGrid(block, container);
    return;
  }

  if (block.type === 'lvad-unresponsive-flow') {
    renderLvadUnresponsiveFlow(block, container);
    return;
  }
  if (block.type === 'two-way-decision') {
    renderTwoWayDecision(block, container);
    return;
  }

  if (block.type === 'flow-stage') {
    renderFlowStage(block, container);
    return;
  }

  if (block.type === 'three-way-flow') {
    renderThreeWayFlow(block, container);
    return;
  }

  if (block.type === 'score-callout') {
    renderScoreCallout(block, container);
    return;
  }

  if (block.type === 'stop-control') {
    renderStopControl(block, container);
    return;
  }

  if (block.type === 'stroke-laterality-diagram') {
    renderStrokeLateralityDiagram(block, container);
    return;
  }

  if (block.type === 'protocol-image') {
    renderProtocolImage(block, container);
    return;
  }

  if (block.type === 'icon-note') {
    renderIconNote(block, container);
    return;
  }

  if (block.type === 'documentation-card') {
    renderDocumentationCard(block, container);
    return;
  }

  if (block.type === 'pediatric-assessment-flow') {
    renderPediatricAssessmentFlow(block, container);
    return;
  }

  if (block.type === 'document-example') {
    renderDocumentExample(block, container);
    return;
  }

  if (block.type === 'legal-text') {
    renderLegalText(block, container);
    return;
  }

  if (block.type === 'external-link' || block.type === 'protocol-link') {
    renderReferenceLink(block, container);
    return;
  }

  if (block.type === 'heading') {
    const level = block.level === 2 ? 'h3' : 'h4';
    const h = document.createElement(level);
    appendRichText(h, block.text || '', block.bold || [], block.links || [], [], block.red || []);
    container.appendChild(h);
    return;
  }

  if (block.type === 'list') {
    const itemText = item => typeof item === 'object' ? String(item.text || '') : String(item || '');
    const ordered = (block.ordered === true) || (block.items || []).every(item => /^\s*\d+[\).]/.test(itemText(item)));
    const list = document.createElement(ordered ? 'ol' : 'ul');
    if (ordered && block.start) list.start = Number(block.start);
    if (ordered && block.listStyle) list.style.listStyleType = block.listStyle;
    if (block.indent) list.classList.add('nested-list');
    for (const item of block.items || []) {
      const li = document.createElement('li');
      const rawText = itemText(item);
      const cleanText = ordered ? rawText.replace(/^\s*\d+[\).]\s*/, '') : rawText.replace(/^\s*[•\-o]\s*/, '');
      appendRichText(
        li,
        cleanText,
        typeof item === 'object' ? item.bold : [],
        typeof item === 'object' ? item.links : [],
        [],
        typeof item === 'object' ? item.red : [],
        typeof item === 'object' ? item.underline : []
      );
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
    appendPhoneAwareText(div, block.text || '');
    container.appendChild(div);
    return;
  }

  const p = document.createElement('p');
  appendRichText(p, block.text || '', block.bold || [], block.links || [], [], block.red || []);
  container.appendChild(p);
}


function normalizeCell(cell) {
  if (cell && typeof cell === 'object') return cell;
  return { text: cell == null ? '' : String(cell) };
}

function applyCellFormatting(el, cell, isHeader = false) {
  const c = normalizeCell(cell);
  appendPhoneAwareText(el, c.text || '');
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
  if (block.className) table.classList.add(...String(block.className).split(/\s+/).filter(Boolean));
  if (block.caption) {
    const caption = document.createElement('caption');
    caption.textContent = block.caption;
    if (block.subtitle) {
      const subtitle = document.createElement('span');
      subtitle.className = 'table-caption-subtitle';
      subtitle.textContent = block.subtitle;
      caption.appendChild(subtitle);
    }
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
  (block.rows || []).forEach((rowData, index) => {
    const row = Array.isArray(rowData) ? rowData : (rowData.cells || []);
    const tr = document.createElement('tr');
    if (!Array.isArray(rowData) && rowData.background) tr.classList.add(`table-row-${rowData.background}`);
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
  if (block.note) {
    const note = document.createElement('p');
    note.className = 'table-footnote';
    if (block.noteClassName) note.classList.add(...String(block.noteClassName).split(/\s+/).filter(Boolean));
    note.textContent = block.note;
    wrap.appendChild(note);
  }
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
