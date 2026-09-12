const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

const mustExist = [
  'book.html',
  'book-page.js',
  'book-page.css',
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
  'book-learning-scroll',
  'book-summary',
  'book-ideas',
  'book-topics',
  'book-history',
  'book-note',
  'book-save-note'
].forEach(id => {
  assert.ok(html.includes(`id="${id}"`), `book.html should contain ${id}`);
});

['library-discovery.js', 'book-page.js', 'book-page.css'].forEach(file => {
  assert.ok(html.includes(file), `book.html should load ${file}`);
});

const js = fs.readFileSync(path.join(root, 'book-page.js'), 'utf8');
assert.ok(js.includes('buildBookSections'), 'book page should use the learning-section model');
assert.ok(js.includes('data-refresh-section'), 'book page should support per-card refresh');
assert.ok(js.includes('URLSearchParams'), 'book page should resolve a book from the URL');
assert.ok(js.includes('book-surprise'), 'book page should support surprise learning');

const links = fs.readFileSync(path.join(root, 'library-book-links.js'), 'utf8');
assert.ok(links.includes('book.html?book='), 'library clicks should navigate to standalone book pages');
assert.ok(links.includes("addEventListener('click'"), 'library navigation should intercept book clicks');

const library = fs.readFileSync(path.join(root, 'library.html'), 'utf8');
assert.ok(library.includes('library-book-links.js'), 'library.html should load standalone-book navigation');

console.log('standalone book page tests: OK');
