// Static-reader fidelity and journeys. No browser automation or model changes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const doc = file => new JSDOM(read(file)).window.document;
const compact = text => text.replace(/\s+/g, ' ').trim();
let checks = 0;
function check(condition, message) { assert.ok(condition, message); checks++; }
function equal(actual, expected, message) { assert.deepEqual(actual, expected, message); checks++; }

async function main() {
  const essay = 'apps/work-that-must-exist/index.html';
  const reader = 'apps/work-that-must-exist/method.html';
  const markdown = read('apps/work-that-must-exist/README.md');
  const method = doc(reader);
  const expectedText = markdown.split('\n').slice(1)
    .filter(line => !/^\|[-:|\s]+\|$/.test(line))
    .map(line => line.replace(/^#{1,6}\s+/, '').replace(/^-\s+/, '').replace(/^\|(.*)\|$/, '$1').replace(/\|/g, ' '))
    .join(' ').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[`*]/g, '');
  const renderedText = [...method.querySelectorAll('.method-text p, .method-text h2, .method-text li, .method-text th, .method-text td')]
    .map(element => element.textContent).join(' ');
  equal(compact(renderedText), compact(expectedText), 'The complete reader must retain the ordered README text, including all results and limits.');
  equal([...method.querySelectorAll('.method-text a')].map(link => link.getAttribute('href')),
    [...markdown.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map(match => match[1]), 'All original source links remain in order.');
  equal(method.querySelectorAll('script').length, 0, 'The method is readable without scripts.');
  check(method.querySelector('a[href="README.md"][download]'), 'Original method remains downloadable.');
  equal([...method.querySelectorAll('.method-text h2')].map(element => element.textContent),
    [...markdown.matchAll(/^## (.+)$/gm)].map(match => match[1]), 'Every substantive source section is present.');

  const pages = ['index.html', 'app-index.html', essay, reader];
  for (const page of pages) {
    const document = doc(page);
    for (const element of document.querySelectorAll('a[href], link[href], img[src], script[src]')) {
      const ref = element.getAttribute('href') || element.getAttribute('src');
      const url = new URL(ref, 'https://local.example/' + page);
      if (url.origin !== 'https://local.example') continue;
      let target = decodeURIComponent(url.pathname).slice(1);
      if (target.endsWith('/')) target += 'index.html';
      check(fs.existsSync(path.join(root, target)), `${page}: local route exists: ${ref}`);
      if (!url.hash) continue;
      if (target === essay && url.hash.includes('scope=')) {
        const params = new URLSearchParams(url.hash.slice(1));
        equal([...params.keys()], ['scope', 'access', 'methods', 'view'], 'Experiment links preserve state syntax.');
        check(['both', 'a', 'b', 'none'].includes(params.get('scope')), 'Valid scope');
        check(['open', 'tight', 'closed'].includes(params.get('access')), 'Valid access');
        check(['both', 'gantry', 'trolley', 'none'].includes(params.get('methods')), 'Valid methods');
        check(['reasons', 'wbs', 'comparison', 'findings'].includes(params.get('view')), 'Valid result view');
      } else if (target.endsWith('.html')) {
        check(doc(target).getElementById(decodeURIComponent(url.hash.slice(1))), `${page}: fragment exists: ${ref}`);
      }
    }
    check(document.querySelector('a[href="https://lawrencerowland.github.io/side-projects.html"]'), `${page}: estate Projects return`);
    check(document.querySelector('a[href="https://lawrencerowland.github.io/library.html"]'), `${page}: estate Library return`);
  }
  const experiment = doc(essay);
  check(experiment.querySelector('.intro a[href="method.html"]'), 'Reader visible at essay entrance.');
  check(experiment.querySelector('.sources a[href="method.html"]'), 'Reader visible in sources.');
  check(experiment.querySelector('noscript a[href="method.html"]'), 'Reader works as no-script fallback.');
  equal(experiment.querySelector('.topbar a[href="../../index.html"]').textContent, 'Solway overview', 'Overview label identifies its actual destination.');
  check(experiment.querySelector('.topbar a[href="../../app-index.html"]'), 'Actual catalogue remains separately reachable.');

  // Exercise the existing catalogue code with the actual CSV, including filtering.
  const catalogue = new JSDOM(read('app-index.html'), { runScripts: 'outside-only' });
  catalogue.window.fetch = async () => ({ text: async () => read('app-index.csv') });
  catalogue.window.eval(catalogue.window.document.querySelector('script').textContent);
  await new Promise(resolve => setImmediate(resolve));
  const cards = [...catalogue.window.document.querySelectorAll('.example-card')];
  equal(cards.length, 13, 'All 13 current collection cards are rendered.');
  for (const card of cards) {
    const ref = card.querySelector('h3 a').getAttribute('href');
    const url = new URL(ref, 'https://local.example/');
    if (url.origin === 'https://local.example') {
      let target = url.pathname.slice(1);
      if (target.endsWith('/')) target += 'index.html';
      check(fs.existsSync(path.join(root, target)), `Catalogue destination exists: ${ref}`);
    }
  }
  const earlyEssai = cards.find(card => card.querySelector('h3 a').getAttribute('href') === 'apps/digital-construction-ontology/index.html');
  equal(earlyEssai.querySelector('img').getAttribute('src'), 'pics/15.jpg', 'The early essai uses its retained screenshot directly.');
  check(fs.existsSync(path.join(root, earlyEssai.querySelector('img').getAttribute('src'))), 'Retained early-essai image exists.');
  const filters = [...catalogue.window.document.querySelectorAll('.filter button')];
  check(filters.length > 1, 'Existing topic filters remain available.');
  for (const filter of filters) {
    filter.click();
    const tag = filter.dataset.tag;
    for (const card of cards) {
      const visible = tag === 'all' || card.dataset.tags.split(',').map(value => value.trim()).includes(tag);
      equal(card.style.display, visible ? 'inline-block' : 'none', `Filter ${tag} retains its behavior.`);
    }
  }
  filters[0].click();
  equal(cards.filter(card => card.style.display === 'inline-block').length, 13, 'All resets the complete catalogue.');
  catalogue.window.close();
  console.log(`Method reader: ${checks} source, route and catalogue checks passed.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
