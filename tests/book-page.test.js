const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

const mustExist = [
  'book.html',
  'book-page.js',
  'book-page.css',
  'book-reading.js',
  'library-book-links.js'
];

mustExist.forEach(file => {
  assert.ok(fs.existsSync(path.join(root, file)), `${file} should exist`);
});

const html = fs.readFileSync(path.join(root, 'book.html'), 'utf8');
[
  'book-title',
  'book-category',
  'book-refresh-all',
  'book-random',
  'book-surprise',
  'book-reading-toc',
  'book-reading-body',
  'book-reading-progress',
  'book-chapter-summary',
  'book-summary-title',
  'book-summary-points',
  'book-read-aloud',
  'book-read-pause',
  'book-read-stop',
  'book-read-rate',
  'book-takeaways',
  'book-summary',
  'book-ideas',
  'book-topics',
  'book-history',
  'book-note',
  'book-save-note'
].forEach(id => {
  assert.ok(html.includes(`id="${id}"`), `book.html should contain ${id}`);
});

['library-discovery.js', 'book-reading.js', 'book-page.js', 'book-page.css'].forEach(file => {
  assert.ok(html.includes(file), `book.html should load ${file}`);
});
assert.ok(html.indexOf('book-reading-body') < html.indexOf('book-infinite-feed'), 'reading body should precede the infinite feed');
assert.ok(html.includes('עוד מהספר'), 'infinite feed should be framed as supplemental discovery');
assert.ok(html.includes('editorial-book'), 'book page should opt into the editorial reading design');

const js = fs.readFileSync(path.join(root, 'book-page.js'), 'utf8');
assert.ok(js.includes('buildReadingChapters'), 'book page should build continuous reading chapters');
assert.ok(js.includes('data-reading-deepen'), 'book page should support optional deep expansion');
assert.ok(js.includes('book-reading-toc'), 'book page should render a table of contents');
assert.ok(js.includes('book-takeaways'), 'book page should render end-of-book synthesis');
assert.ok(js.includes('book-reading-progress'), 'book page should update reading progress');
assert.ok(js.includes('data-source-expand'), 'book page should preserve source provenance expansion');
assert.ok(js.includes('URLSearchParams'), 'book page should resolve a book from the URL');
assert.ok(js.includes('book-surprise'), 'book page should support surprise learning');

const pageCss = fs.readFileSync(path.join(root, 'book-page.css'), 'utf8');
['book-reading-layout','book-reading-toc-card','reading-chapter','reading-deep-panel','book-takeaways-section'].forEach(token => {
  assert.ok(pageCss.includes(token), `book-page.css should style ${token}`);
});
assert.ok(pageCss.includes('grid-template-areas:"reader toc"'), 'desktop reading layout should keep the table of contents on the physical left');
assert.ok(pageCss.includes('.book-reading-main{grid-area:reader'), 'reading column should occupy the reader grid area');
assert.ok(pageCss.includes('.book-reading-toc-wrap{grid-area:toc'), 'table of contents should occupy the left toc grid area');
assert.ok(pageCss.includes('.editorial-book .book-page-hero'), 'book page should use the Editorial Research visual system');

const links = fs.readFileSync(path.join(root, 'library-book-links.js'), 'utf8');
assert.ok(links.includes('book.html?book='), 'library clicks should navigate to standalone book pages');
assert.ok(links.includes("addEventListener('click'"), 'library navigation should intercept book clicks');

const library = fs.readFileSync(path.join(root, 'library.html'), 'utf8');
assert.ok(library.includes('library-book-links.js'), 'library.html should load standalone-book navigation');

console.log('standalone book page tests: OK');


assert.ok(js.includes('c8596613-aa90-49f3-8410-09d305926710'), 'reader prototype should be limited to the approved prototype book');
assert.ok(js.includes('renderChapterSummary'), 'prototype should update a short summary for the active chapter');
assert.ok(js.includes('speechSynthesis'), 'prototype should support browser read-aloud');
assert.ok(js.includes('SpeechSynthesisUtterance'), 'prototype should create speech utterances');
assert.ok(js.includes('book-read-aloud'), 'prototype should wire a chapter read-aloud control');
assert.ok(pageCss.includes('book-prototype-reading'), 'prototype should have an opt-in three-column reading layout');
assert.ok(pageCss.includes('grid-template-areas:"summary reader toc"'), 'prototype desktop layout should place summary on the physical left and TOC on the physical right');
assert.ok(pageCss.includes('book-chapter-summary-card'), 'prototype should style a sticky chapter summary');

assert.ok(js.includes('משפטי מפתח'), 'left rail should label the short points as chapter key sentences');
assert.ok(js.includes('points.length===5'), 'left rail should expose five concise nuggets when enough material exists');
assert.ok(pageCss.includes('.book-chapter-summary-wrap{') && pageCss.includes('position:sticky'), 'left chapter summary rail should stay fixed while scrolling on desktop');

assert.ok(pageCss.includes('.book-prototype-reading .book-reading-toc-wrap{') && pageCss.includes('position:sticky'), 'prototype TOC wrapper should stay fixed while scrolling on desktop');
assert.ok(js.includes('excludeTitles'), 'prototype refresh should exclude the chapter titles currently on screen');
assert.ok(js.includes('fullRefresh:true'), 'prototype refresh should request a completely fresh chapter set');

assert.ok(js.includes('chapter.keySentences'), 'left rail should render key sentences supplied by the chapter model');
assert.ok(js.includes('משפטי מפתח'), 'left rail should be labeled as key sentences rather than a chapter explanation');

assert.ok(html.includes('0.75') && html.includes('1.25') && html.includes('1.5'), 'read-aloud prototype should offer multiple playback speeds');
assert.ok(js.includes('function readRate()'), 'reader should resolve the selected playback rate');
assert.ok(js.includes('utterance.rate=readRate()'), 'speech synthesis should use the selected playback rate');
assert.ok(pageCss.includes('.book-prototype-reading #book-refresh-all') && pageCss.includes('position:fixed'), 'refresh-all should stay fixed near the bottom of the viewport in the prototype');

assert.ok(html.includes('id="book-refresh-all"') && html.includes('aria-label="רענן הכול"'), 'refresh-all should keep an accessible label');
assert.ok(/id="book-refresh-all"[^>]*>🔄<\/button>/.test(html), 'refresh-all should render as an icon-only button');
assert.ok(pageCss.includes('left:16px'), 'refresh icon should be pinned to the physical left edge');
assert.ok(pageCss.includes('width:46px') && pageCss.includes('height:46px'), 'refresh icon should be compact');
