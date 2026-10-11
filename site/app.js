(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const safeUrl = (value) => /^https?:\/\//i.test(String(value || '')) ? String(value) : '';
  const zoneIds = ['about', 'experience', 'lab', 'archive', 'projects', 'skills', 'contact'];
  const projectVisuals = {
    'Analisis Data Disabilitas Nasional': 'page-02.jpg',
    'Dashboard Visualisasi Data KND': 'page-02.jpg',
    'SILAF (Sistem Layanan Administrasi FISIP)': 'page-07.jpg',
    'Photostory: Nusantara': 'page-08.jpg',
    'Sociology Visual: Social Interaction': 'page-09.jpg',
    'Virtual Exhibition: Urban Life': 'page-10.jpg',
    'Sociopreneurship: EcoCraft Creation': 'page-11.jpg',
    'Penelitian Sosial Kuantitatif UNAS': 'page-09.jpg',
    'Analisis Sentimen Media Sosial': 'page-02.jpg'
  };
  const galleryVisuals = [
    'design-crops/design-01-arkeduna.jpg',
    'design-crops/design-02-cryptocurrency.jpg',
    'design-crops/design-03-ramadhan.jpg',
    'design-crops/design-04-environment.jpg',
    'design-crops/design-05-kjmu.jpg',
    'design-crops/design-06-mochi-veby.jpg',
    'design-crops/design-07-bobbaby.jpg',
    'design-crops/design-08-mentai-yuk.jpg'
  ];
  const labData = {
    raw: { records: '10.000+', missing: '18,4%', signal: 'belum terbaca', bars: [42, 75, 31, 60, 48], note: 'Dataset mentah simulasi — perlu cleaning sebelum interpretasi.' },
    clean: { records: '8.420', missing: '0,0%', signal: '3 tren', bars: [64, 49, 82, 57, 72], note: 'Setelah cleaning simulasi — pola lebih siap dibaca, bukan hasil penelitian Salsa.' }
  };
  const copy = {
    id: { start: 'Mulai eksplorasi', mapTitle: 'Pilih jalurmu', mapCopy: 'Tujuh titik di peta ini menyimpan cara kerja, pengalaman, dan jejak belajar Salsa. Buka semuanya untuk menyelesaikan field notes.', lang: 'ID' },
    en: { start: 'Start exploring', mapTitle: 'Choose your path', mapCopy: 'Seven points on this map hold Salsa’s methods, experience, and learning trail. Open them all to complete the field notes.', lang: 'EN' }
  };
  const state = { visited: [], xp: 0, language: 'id', sound: false, labMode: 'raw', portfolio: null, lightbox: null };
  let lastTrigger = null;
  let lightboxTrigger = null;
  let toastTimer = null;

  function assetPath(sourcePath) {
    if (!sourcePath) return '';
    const filename = String(sourcePath).split('/').pop().replace(/\.(?:png|jpeg)$/i, '.jpg');
    return `assets/certificates/${encodeURIComponent(filename)}`;
  }
  function folioPath(filename) { return `assets/folio/${String(filename).split('/').map(encodeURIComponent).join('/')}`; }
  function lightboxAsset(sourcePath) {
    if (String(sourcePath).includes('/folio/')) return folioPath(String(sourcePath).split('/folio/').pop());
    return assetPath(sourcePath);
  }
  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem('salsa-field-notes-progress') || '{}');
      if (Array.isArray(saved.visited)) state.visited = saved.visited.filter((id) => zoneIds.includes(id));
      state.xp = state.visited.length * 20;
    } catch (_) { state.visited = []; state.xp = 0; }
  }
  function saveState() {
    try { localStorage.setItem('salsa-field-notes-progress', JSON.stringify({ visited: state.visited })); } catch (_) { /* private browsing can deny storage */ }
  }
  function updateHud() {
    const xp = $('[data-xp]');
    const fill = $('[data-xp-fill]');
    if (xp) xp.textContent = state.xp;
    if (fill) fill.style.width = `${Math.min(100, (state.xp / 140) * 100)}%`;
    $$('.zone').forEach((zone) => zone.classList.toggle('visited', state.visited.includes(zone.dataset.zone)));
  }
  function updateStats() {
    if (!state.portfolio) return;
    const stats = state.portfolio.stats || {};
    const values = {
      projects: state.portfolio.projects?.length || 0,
      datasets: stats.datasetsAnalyzed || 0,
      certificates: stats.certificatesEarned || state.portfolio.certificates?.length || 0,
      years: stats.yearsLearning || 0
    };
    Object.entries(values).forEach(([key, value]) => { const node = $(`[data-stat="${key}"]`); if (node) node.textContent = value; });
  }
  function notify(message) {
    const toast = $('[data-toast]');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2700);
  }
  function award(zoneId) {
    if (state.visited.includes(zoneId)) return;
    state.visited.push(zoneId);
    state.xp = state.visited.length * 20;
    saveState();
    updateHud();
    notify(`zona terbuka · +20 XP · total ${state.xp} XP`);
    tone(560, .07);
  }
  function tone(frequency, duration) {
    if (!state.sound) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = frequency;
      oscillator.type = 'square';
      gain.gain.value = .035;
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + duration);
      oscillator.stop(context.currentTime + duration);
    } catch (_) { /* audio is optional */ }
  }
  function renderHead(label, title, description) {
    return `<div class="dialog-head"><span class="micro-label">${escapeHtml(label)}</span><h2 id="dialog-title">${escapeHtml(title)}</h2><p id="dialog-description">${escapeHtml(description)}</p></div>`;
  }
  function renderAbout() {
    const p = state.portfolio;
    const education = p.education?.[0] || {};
    return renderHead('01 · character sheet', `Halo, saya ${p.nickname || 'Salsa'}`, p.description) + `<div class="two-col"><article class="paper-card"><h3>Current character build</h3><p>${escapeHtml(p.tagline)}</p><div class="tag-row"><span class="tag">social research</span><span class="tag">data-driven</span><span class="tag">visual thinking</span></div></article><article class="paper-card"><h3>Base camp</h3><p><strong>${escapeHtml(education.institution)}</strong><br>${escapeHtml(education.degree)} · ${escapeHtml(education.faculty)}<br>${escapeHtml(education.year)}</p><div class="tag-row"><span class="tag">${escapeHtml(p.contact?.location)}</span><span class="tag">curious learner</span></div></article></div><div class="paper-card profile-note"><h3>One-line brief</h3><p>${escapeHtml(p.title)} — ${escapeHtml(p.tagline)}</p></div>`;
  }
  function renderExperience() {
    const items = (state.portfolio.experience || []).map((item) => `<article class="timeline-item"><div class="timeline-year">${escapeHtml(item.period)}</div><div><h3>${escapeHtml(item.role)}</h3><h4>${escapeHtml(item.company)}</h4><p>${escapeHtml(item.description)}</p><ul class="list">${(item.highlights || []).map((h) => `<li>${escapeHtml(h)}</li>`).join('')}</ul>${safeUrl(item.link) ? `<a href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer">lihat jejak eksternal ↗</a>` : ''}</div></article>`).join('');
    return renderHead('02 · quest log', 'Pengalaman yang jadi kompas', 'Setiap quest melatih kemampuan yang berbeda: membaca konteks, menyusun sistem, bekerja bersama orang, dan menjaga detail.') + `<div class="timeline">${items}</div>`;
  }
  function renderLab() {
    const active = labData[state.labMode];
    return renderHead('03 · analysis lab', 'Dari messy ke meaningful', 'Mini lab ini menunjukkan perbedaan interface antara data mentah dan data yang sudah disiapkan. Semua angka di sini sengaja berupa simulasi, bukan metrik produksi.') + `<div class="lab-shell"><span class="micro-label">cleaning console / sample dataset</span><p>Toggle mode untuk melihat bagaimana proses cleaning mengubah kualitas sinyal. Ini bukan klaim metrik proyek pribadi.</p><div class="lab-controls"><button class="lab-btn" type="button" data-lab-mode="raw" aria-pressed="${state.labMode === 'raw'}">RAW TABLE</button><button class="lab-btn" type="button" data-lab-mode="clean" aria-pressed="${state.labMode === 'clean'}">CLEAN TABLE</button></div><div class="kpi-grid"><div class="kpi"><span>usable records</span><strong data-kpi="records">${active.records}</strong></div><div class="kpi"><span>missing values</span><strong data-kpi="missing">${active.missing}</strong></div><div class="kpi"><span>readable signals</span><strong data-kpi="signal">${active.signal}</strong></div></div><div class="chart" aria-label="Simulated comparison chart">${active.bars.map((height, index) => `<div class="bar-wrap"><div class="bar" style="height:${height}%" title="simulated bar ${index + 1}"></div><span class="bar-label">${String.fromCharCode(65 + index)}</span></div>`).join('')}</div><p class="lab-footnote">↳ ${escapeHtml(active.note)}</p></div>`;
  }
  function renderProjects() {
    const filters = [['all', 'semua'], ['data-analysis', 'data'], ['research', 'riset'], ['tech', 'tech'], ['creative', 'visual'], ['sociopreneurship', 'social']];
    const projects = state.portfolio.projects || [];
    const cards = projects.map((project, index) => {
      const visual = projectVisuals[project.title];
      const link = safeUrl(project.link);
      return `<article class="project-card ${visual ? '' : 'no-visual'}" data-project-category="${escapeHtml(project.category)}">${visual ? `<img class="project-visual" src="${folioPath(visual)}" alt="Visual source untuk ${escapeHtml(project.title)}" loading="lazy">` : '<div class="project-visual" aria-hidden="true"></div>'}<span class="project-index">PROJECT ${String(index + 1).padStart(2, '0')}</span><h3>${escapeHtml(project.title)}</h3><p>${escapeHtml(project.description)}</p><div class="tag-row">${(project.tech || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div><ul class="list">${(project.highlights || []).map((h) => `<li>${escapeHtml(h)}</li>`).join('')}</ul>${link ? `<a class="card-link" href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">buka artefak ↗</a>` : ''}</article>`;
    }).join('');
    return renderHead('05 · project inventory', 'Benda-benda yang pernah dibuat', 'Sembilan proyek pilihan dari riset, dashboard, layanan digital, photostory, sampai kewirausahaan sosial. Thumbnail berasal dari screenshot dokumentasi repository Salsa.') + `<div class="section-toolbar" role="toolbar" aria-label="Filter proyek">${filters.map(([key, label], index) => `<button class="filter-btn" type="button" data-project-filter="${key}" aria-pressed="${index === 0}">${label}</button>`).join('')}</div><div class="project-grid" id="project-grid">${cards}</div>`;
  }
  function renderSkills() {
    const labels = { dataAnalysis: 'Data analysis', visualization: 'Visualization', databaseQuery: 'Database & query', techTools: 'Tech tools', softSkills: 'Soft skills' };
    const branches = Object.entries(state.portfolio.skills || {}).map(([branch, nodes]) => `<article class="skill-branch"><h3><span aria-hidden="true">✦</span>${escapeHtml(labels[branch] || branch)}</h3>${(nodes || []).map((skill) => `<div class="skill-node" data-skill="${escapeHtml(skill)}"><span>${escapeHtml(skill)}</span><span class="sr-only">skill dari sumber portfolio</span></div>`).join('')}</article>`).join('');
    return renderHead('06 · skill tree', 'Toolkit & cara berpikir', 'Bukan sekadar daftar software — skill tree ini diambil dari data portfolio Salsa dan menunjukkan kombinasi metode, tools, dan kemampuan kolaborasi.') + `<div class="skill-tree">${branches}</div>`;
  }
  function renderArchive() {
    const certificates = state.portfolio.certificates || [];
    const categories = [['all', 'semua'], ['seminar', 'seminar'], ['organization', 'organisasi'], ['volunteer', 'volunteer'], ['community-service', 'pengabdian'], ['course', 'course']];
    const cards = certificates.map((cert, index) => {
      const firstImage = assetPath(cert.images?.[0]);
      return `<article class="archive-card" data-certificate-card data-cert-category="${escapeHtml(cert.category || 'other')}">${firstImage ? `<button class="archive-image-button" type="button" data-certificate="${index}" aria-label="Buka scan sertifikat ${escapeHtml(cert.title)}"><img src="${firstImage}" alt="Scan sertifikat ${escapeHtml(cert.title)}" loading="lazy"></button>` : ''}<span class="micro-label">${escapeHtml(cert.date)}</span><h3>${escapeHtml(cert.title)}</h3><p>${escapeHtml(cert.issuer)}</p></article>`;
    }).join('');
    const gallery = (state.portfolio.designs || []).map((design, index) => `<article class="archive-card"><button class="gallery-button" type="button" data-gallery="${index}" aria-label="Buka visual ${escapeHtml(design.title)}"><img class="gallery-thumb" src="${folioPath(galleryVisuals[index] || galleryVisuals[0])}" alt="Screenshot source untuk ${escapeHtml(design.title)}" loading="lazy"></button><span class="micro-label">${escapeHtml(design.category)}</span><h3>${escapeHtml(design.title)}</h3><p>${escapeHtml(design.description)}</p></article>`).join('');
    return renderHead('04 · archive', 'Jejak belajar & visual', `Koleksi ${certificates.length} sertifikat dan ${state.portfolio.designs?.length || 0} karya desain dari data portfolio Salsa. Klik thumbnail untuk melihat source asset ukuran penuh.`) + `<div class="section-toolbar" role="toolbar" aria-label="Filter sertifikat">${categories.map(([key, label], index) => `<button class="filter-btn" type="button" data-cert-filter="${key}" aria-pressed="${index === 0}">${label}</button>`).join('')}</div><div class="archive-grid" data-certificate-grid>${cards}</div><div class="archive-more">Semua scan sertifikat dimuat lazy agar halaman mobile tidak langsung mengunduh seluruh archive.</div><h3 style="margin-top:28px">Visual shelf</h3><div class="archive-grid">${gallery}</div>`;
  }
  function renderContact() {
    const c = state.portfolio.contact || {};
    return renderHead('07 · join the party', 'Mari bikin sesuatu', 'Kalau kamu punya pertanyaan, project riset, data yang ingin dibaca, atau sekadar ingin ngobrol — pintu komunikasi Salsa terbuka.') + `<div class="contact-grid"><div class="contact-list"><a class="contact-link" href="mailto:${escapeHtml(c.email)}">Email <span>${escapeHtml(c.email)} ↗</span></a><a class="contact-link" href="${escapeHtml(c.linkedin)}" target="_blank" rel="noopener noreferrer">LinkedIn <span>adinda-salsa-aryadi-putri ↗</span></a><a class="contact-link" href="${escapeHtml(c.github)}" target="_blank" rel="noopener noreferrer">GitHub <span>@adndaaryadi ↗</span></a><a class="contact-link" href="${escapeHtml(c.instagram)}" target="_blank" rel="noopener noreferrer">Instagram <span>@adndaaryadi ↗</span></a></div><aside class="contact-note"><h3>Ready to explore?</h3><p>Base camp Salsa ada di <strong>${escapeHtml(c.location)}</strong>. Bawa rasa ingin tahu — sisanya bisa kita susun bareng.</p><span class="tag">open for a good conversation</span></aside></div>`;
  }
  function renderQuickView() {
    const p = state.portfolio;
    return renderHead('quick view · recruiter friendly', p.title, p.tagline) + `<div class="two-col"><article class="paper-card"><h3>Snapshot</h3><p>${escapeHtml(p.description)}</p><div class="tag-row"><span class="tag">${p.projects.length} projects</span><span class="tag">${p.experience.length} experiences</span><span class="tag">${p.certificates.length} certificates</span></div></article><article class="paper-card"><h3>Start here</h3><p>Masuk ke <strong>Project Inventory</strong> untuk karya, <strong>Quest Log</strong> untuk pengalaman, atau <strong>Join the Party</strong> untuk kontak langsung.</p><div class="tag-row"><button class="btn small" type="button" data-quick-zone="projects">lihat projects ↗</button><button class="btn small secondary" type="button" data-quick-zone="contact">kontak Salsa ↗</button></div></article></div>`;
  }
  const renderers = { about: renderAbout, experience: renderExperience, lab: renderLab, archive: renderArchive, projects: renderProjects, skills: renderSkills, contact: renderContact };

  function setBackdrop(backdrop, open) {
    backdrop.hidden = !open;
    backdrop.classList.toggle('is-open', open);
  }
  function focusable(root) {
    return $$('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])', root).filter((el) => !el.disabled && el.getAttribute('aria-hidden') !== 'true');
  }
  function activeDialog() {
    if ($('[data-lightbox-backdrop]')?.classList.contains('is-open')) return $('.lightbox-card');
    if ($('[data-dialog-backdrop]')?.classList.contains('is-open')) return $('.dialog-card');
    return null;
  }
  function openDialog(content, trigger = null) {
    const backdrop = $('[data-dialog-backdrop]');
    $('#dialog-content').innerHTML = content;
    lastTrigger = trigger || null;
    setBackdrop(backdrop, true);
    document.body.classList.add('modal-open');
    $('.dialog-card').scrollTop = 0;
    const close = $('[data-action="close"]');
    if (close) close.focus();
  }
  function openZone(zoneId, trigger) {
    if (!state.portfolio || !renderers[zoneId]) return;
    award(zoneId);
    openDialog(renderers[zoneId](), trigger);
    tone(720, .05);
  }
  function closeDialog() {
    const backdrop = $('[data-dialog-backdrop]');
    if (!backdrop.classList.contains('is-open')) return;
    setBackdrop(backdrop, false);
    if (!state.lightbox) document.body.classList.remove('modal-open');
    if (lastTrigger && typeof lastTrigger.focus === 'function') lastTrigger.focus();
  }
  function openQuickView() {
    if (!state.portfolio) return;
    enterWorld();
    openDialog(renderQuickView());
  }
  function enterWorld() {
    document.body.classList.add('is-playing');
    try { history.replaceState(null, '', '#map'); } catch (_) { /* embedded contexts can deny history */ }
  }
  function applyProjectFilter(filter) {
    $$('.filter-btn[data-project-filter]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.projectFilter === filter)));
    $$('#project-grid [data-project-category]').forEach((card) => { card.hidden = filter !== 'all' && card.dataset.projectCategory !== filter; });
  }
  function applyCertFilter(filter) {
    $$('.filter-btn[data-cert-filter]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.certFilter === filter)));
    $$('[data-certificate-card]').forEach((card) => { card.hidden = filter !== 'all' && card.dataset.certCategory !== filter; });
  }
  function openLightbox(images, title, meta, trigger) {
    if (!images.length) return;
    state.lightbox = { images, index: 0, title, meta };
    lightboxTrigger = trigger || null;
    setBackdrop($('[data-lightbox-backdrop]'), true);
    document.body.classList.add('modal-open');
    updateLightbox();
    $('.lightbox-card').focus();
  }
  function updateLightbox() {
    if (!state.lightbox) return;
    const { images, index, title, meta } = state.lightbox;
    const image = $('[data-lightbox-image]');
    image.src = lightboxAsset(images[index]);
    image.alt = `${title} — halaman ${index + 1}`;
    $('#lightbox-title').textContent = title;
    $('[data-lightbox-meta]').textContent = meta || 'Asset source dari repository portfolio Salsa.';
    $('[data-lightbox-counter]').textContent = `${index + 1} / ${images.length}`;
    $('[data-lightbox-prev]').disabled = images.length < 2;
    $('[data-lightbox-next]').disabled = images.length < 2;
  }
  function closeLightbox() {
    const backdrop = $('[data-lightbox-backdrop]');
    if (!backdrop.classList.contains('is-open')) return;
    setBackdrop(backdrop, false);
    state.lightbox = null;
    document.body.classList.toggle('modal-open', $('[data-dialog-backdrop]').classList.contains('is-open'));
    if (lightboxTrigger && typeof lightboxTrigger.focus === 'function') lightboxTrigger.focus();
    lightboxTrigger = null;
  }
  function updateLanguage() {
    const current = copy[state.language];
    const start = $('[data-action="start"]');
    if (start) start.firstChild.textContent = current.start + ' ';
    const title = $('[data-map-title]');
    const mapCopy = $('[data-map-copy]');
    const language = $('[data-action="language"]');
    if (title) title.textContent = current.mapTitle;
    if (mapCopy) mapCopy.textContent = current.mapCopy;
    if (language) language.textContent = current.lang;
    document.documentElement.lang = state.language;
  }
  function bind() {
    document.addEventListener('click', (event) => {
      const zone = event.target.closest('[data-zone]');
      if (zone) { openZone(zone.dataset.zone, zone); return; }
      if (event.target.closest('[data-action="start"]')) { enterWorld(); tone(420, .08); return; }
      if (event.target.closest('[data-action="quick-view"]')) { openQuickView(); return; }
      if (event.target.closest('[data-action="close"]')) { closeDialog(); return; }
      if (event.target.closest('[data-action="lightbox-close"]')) { closeLightbox(); return; }
      if (event.target === $('[data-dialog-backdrop]')) { closeDialog(); return; }
      if (event.target === $('[data-lightbox-backdrop]')) { closeLightbox(); return; }
      const quickZone = event.target.closest('[data-quick-zone]');
      if (quickZone) { closeDialog(); openZone(quickZone.dataset.quickZone); return; }
      const labButton = event.target.closest('[data-lab-mode]');
      if (labButton) { state.labMode = labButton.dataset.labMode; $('#dialog-content').innerHTML = renderLab(); return; }
      const projectFilter = event.target.closest('[data-project-filter]');
      if (projectFilter) { applyProjectFilter(projectFilter.dataset.projectFilter); return; }
      const certFilter = event.target.closest('[data-cert-filter]');
      if (certFilter) { applyCertFilter(certFilter.dataset.certFilter); return; }
      const certificate = event.target.closest('[data-certificate]');
      if (certificate) { const item = state.portfolio.certificates[Number(certificate.dataset.certificate)]; openLightbox(item.images || [], item.title, `${item.issuer} · ${item.date}`, certificate); return; }
      const gallery = event.target.closest('[data-gallery]');
      if (gallery) { const item = state.portfolio.designs[Number(gallery.dataset.gallery)]; openLightbox([`/folio/${galleryVisuals[Number(gallery.dataset.gallery)] || galleryVisuals[0]}`], item.title, item.description, gallery); return; }
      if (event.target.closest('[data-lightbox-prev]')) { state.lightbox.index = (state.lightbox.index - 1 + state.lightbox.images.length) % state.lightbox.images.length; updateLightbox(); return; }
      if (event.target.closest('[data-lightbox-next]')) { state.lightbox.index = (state.lightbox.index + 1) % state.lightbox.images.length; updateLightbox(); return; }
      const sound = event.target.closest('[data-action="sound"]');
      if (sound) { state.sound = !state.sound; sound.setAttribute('aria-pressed', String(state.sound)); sound.setAttribute('aria-label', state.sound ? 'Matikan suara' : 'Nyalakan suara'); sound.textContent = state.sound ? '♫' : '♪'; tone(600, .08); return; }
      const language = event.target.closest('[data-action="language"]');
      if (language) { state.language = state.language === 'id' ? 'en' : 'id'; updateLanguage(); return; }
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !document.body.classList.contains('is-playing') && !event.target.matches('button,a,input,textarea,select')) { enterWorld(); return; }
      if (event.key === 'Escape') {
        if ($('[data-lightbox-backdrop]').classList.contains('is-open')) { closeLightbox(); return; }
        if ($('[data-dialog-backdrop]').classList.contains('is-open')) { closeDialog(); return; }
      }
      if (event.key === 'Tab') {
        const modal = activeDialog();
        if (!modal) return;
        const nodes = focusable(modal);
        if (!nodes.length) { event.preventDefault(); modal.focus(); return; }
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });
  }
  async function loadPortfolio() {
    try {
      const response = await fetch('data/portfolio.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('portfolio data request failed');
      state.portfolio = await response.json();
      updateStats();
    } catch (_) {
      notify('portfolio data belum bisa dimuat — coba refresh');
    }
  }

  loadState();
  updateHud();
  bind();
  updateLanguage();
  loadPortfolio();
  window.__SALSA_PORTFOLIO__ = { state, openZone, closeDialog, openLightbox };
})();
