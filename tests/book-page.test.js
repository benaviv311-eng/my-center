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
