let protocolData;
let deferredPrompt;
let selectedId = null;
let viewHistory = [];
let viewHistoryIndex = -1;

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
    paragraph.textContent = line;
    section.appendChild(paragraph);
  }

  container.appendChild(section);
}
function appendRichText(element, text, phrases = [], links = [], initials = [], redPhrases = [], underlinePhrases = []) {
  const source = String(text || '');
  const boldPhrases = (phrases || []).filter(Boolean);
  const linkedPhrases = (links || []).filter(link => link && link.text && link.protocolId);
  const initialPhrases = (initials || []).filter(Boolean);
  const redTextPhrases = (redPhrases || []).filter(Boolean);
  const underlinedPhrases = (underlinePhrases || []).filter(Boolean);
  if (!boldPhrases.length && !linkedPhrases.length && !initialPhrases.length && !redTextPhrases.length && !underlinedPhrases.length) {
    element.textContent = source;
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
      red.textContent = part;
      element.appendChild(red);
    } else if (boldPhrases.includes(part) || underlinedPhrases.includes(part)) {
      const emphasis = document.createElement(boldPhrases.includes(part) ? 'strong' : 'span');
      if (underlinedPhrases.includes(part)) emphasis.classList.add('protocol-underlined-text');
      emphasis.textContent = part;
      element.appendChild(emphasis);
    } else {
      element.appendChild(document.createTextNode(part));
    }
  }
}function appendFlowItems(items, container) {
  const list = document.createElement('ul');
  for (const item of items || []) {
    const li = document.createElement('li');
    const itemData = typeof item === 'object' ? item : { text: item };
    if (itemData.red?.length) li.classList.add('protocol-red-flow-item');
    let textContainer = li;
    if (itemData.icon) {
      li.className = 'assessment-icon-item';
      const icon = document.createElement('img');
      icon.src = itemData.icon;
      icon.alt = itemData.iconAlt || '';
      icon.loading = 'lazy';
      li.appendChild(icon);
      textContainer = document.createElement('span');
      li.appendChild(textContainer);
    }
    appendRichText(textContainer, itemData.text || '', itemData.bold || [], itemData.links || [], itemData.emphasizedInitials || [], itemData.red || []);
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
function renderProtocolImage(block, container) {
  const figure = document.createElement('figure');
  figure.className = 'protocol-reference-image';
  const image = document.createElement('img');
  image.src = block.image;
  image.alt = block.alt || '';
  image.loading = 'lazy';
  figure.appendChild(image);
  if (block.caption) {
    const caption = document.createElement('figcaption');
    caption.textContent = block.caption;
    figure.appendChild(caption);
  }
  container.appendChild(figure);
}

function renderIconNote(block, container) {
  const section = document.createElement('section');
  section.className = `protocol-icon-note ${block.red ? 'protocol-icon-note-red' : ''}`;
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
  section.className = `protocol-flow-stage ${block.arrowAfter ? 'flow-arrow-after' : ''}`;
  const heading = document.createElement('h3');
  appendRichText(heading, block.title || '', block.bold || [], block.links || []);
  section.appendChild(heading);
  appendFlowItems(block.items || [], section);
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
function renderBlock(block, container) {
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
      const cleanText = ordered ? rawText.replace(/^\s*\d+[\).]\s*/, '') : rawText.replace(/^\s*[â€¢\-o]\s*/, '');
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
    div.textContent = block.text || '';
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
