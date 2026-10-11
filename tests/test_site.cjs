const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const siteDir = path.join(__dirname, '..', 'site');
const htmlPath = path.join(siteDir, 'index.html');
const dataPath = path.join(siteDir, 'data', 'portfolio.json');
const cssPath = path.join(siteDir, 'styles.css');
const appPath = path.join(siteDir, 'app.js');


function load() {
  if (!fs.existsSync(htmlPath)) throw new Error('site/index.html is missing');
  if (!fs.existsSync(dataPath)) throw new Error('site/data/portfolio.json is missing');
  if (!fs.existsSync(cssPath)) throw new Error('site/styles.css is missing');
  if (!fs.existsSync(appPath)) throw new Error('site/app.js is missing');
  const portfolio = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const html = fs.readFileSync(htmlPath, 'utf8')
    .replace('<link rel="stylesheet" href="styles.css">', () => `<style>${fs.readFileSync(cssPath, 'utf8')}</style>`)
    .replace('<script src="app.js" defer></script>', () => `<script>${fs.readFileSync(appPath, 'utf8')}</script>`);
  return new JSDOM(html, {
    url: 'https://example.vercel.app/',
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    beforeParse(window) {
      window.fetch = async () => ({ ok: true, json: async () => portfolio });
    }
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const dom = load();
  const { document, window } = dom.window;
  const packaged = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  assert(packaged.name === 'Adinda Salsa Aryadi Putri', 'packaged portfolio name must be source-backed');
  assert(packaged.projects.length === 9, 'all source projects must be packaged');
  assert(packaged.experience.length === 5, 'all source experience entries must be packaged');
  assert(packaged.certificates.length === 24, 'all source certificates must be packaged');
  assert(packaged.designs.length === 8, 'all source design entries must be packaged');
  assert(packaged.projects.some(project => project.title === 'Analisis Data Disabilitas Nasional'), 'source project title is missing');
  for (const certificate of packaged.certificates) {
    const filename = path.basename(certificate.images[0]).replace(/\.(?:png|jpeg)$/i, '.jpg');
    assert(fs.existsSync(path.join(siteDir, 'assets', 'certificates', filename)), `missing packaged certificate asset: ${filename}`);
  }
  for (const crop of ['design-01-arkeduna.jpg', 'design-08-mentai-yuk.jpg']) {
    assert(fs.existsSync(path.join(siteDir, 'assets', 'folio', 'design-crops', crop)), `missing packaged design crop: ${crop}`);
  }
  assert(!fs.readFileSync(appPath, 'utf8').includes('data-skill-level'), 'skills must not imply unsupported proficiency levels');
  assert(fs.readFileSync(cssPath, 'utf8').includes('grid-template-columns: repeat(2, minmax(0, 1fr))'), 'mobile map must use a real grid layout');
  assert(fs.readFileSync(appPath, 'utf8').includes('assets/certificates'), 'app must expose source-backed certificate asset path');
  assert(document.documentElement.lang === 'id', 'document language must be Indonesian');
  assert(document.querySelector('main'), 'semantic main element required');
  assert(document.querySelector('[data-action="start"]'), 'start action required');
  assert(document.querySelector('[data-zone="projects"]'), 'projects zone required');
  assert(document.querySelector('[data-zone="lab"]'), 'analysis lab zone required');
  assert(document.querySelector('[data-zone="contact"]'), 'contact zone required');
  assert(document.querySelector('[role="dialog"]'), 'accessible dialog required');
  assert(document.querySelector('button[data-action="sound"]'), 'sound control required');
  assert(document.body.textContent.includes('Adinda Salsa Aryadi Putri'), 'source portfolio name required');

  await new Promise(resolve => setTimeout(resolve, 60));
  const start = document.querySelector('[data-action="start"]');
  start.click();
  assert(document.body.classList.contains('is-playing'), 'start must open the game map');

  const projectZone = document.querySelector('[data-zone="projects"]');
  projectZone.click();
  await new Promise(resolve => setTimeout(resolve, 60));
  assert(document.querySelector('#project-grid article'), 'project cards required');
  assert(document.querySelector('[data-dialog-backdrop].is-open'), 'zone click must open dialog');
  assert(Number(document.querySelector('[data-xp]').textContent) >= 20, 'first zone visit must award XP');

  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' }));
  assert(!document.querySelector('[role="dialog"].is-open'), 'Escape must close dialog');

  const skillsZone = document.querySelector('[data-zone="skills"]');
  skillsZone.click();
  assert(document.querySelectorAll('[data-skill]').length >= 10, 'skill tree must contain real skills');
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' }));

  const labZone = document.querySelector('[data-zone="lab"]');
  labZone.click();
  const rawButton = document.querySelector('[data-lab-mode="raw"]');
  const cleanButton = document.querySelector('[data-lab-mode="clean"]');
  rawButton.click();
  const rawKpi = document.querySelector('[data-kpi="records"]').textContent;
  document.querySelector('[data-lab-mode="clean"]').click();
  const cleanKpi = document.querySelector('[data-kpi="records"]').textContent;
  assert(rawKpi !== cleanKpi, 'analysis lab raw/clean state must change KPI');

  assert(!document.documentElement.outerHTML.match(/vcp_[A-Za-z0-9]{20,}/), 'Vercel credential leaked into HTML');
  assert(!document.documentElement.outerHTML.includes('PRIVATE KEY'), 'private key leaked into HTML');
  console.log('PASS site behavior and secret scan');
}

main().catch(error => { console.error('FAIL', error.message); process.exit(1); });
