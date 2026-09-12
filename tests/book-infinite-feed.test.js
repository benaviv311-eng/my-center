const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

assert.ok(fs.existsSync(path.join(root, 'book-infinite-feed.js')), 'book-infinite-feed.js should exist');
const html = fs.readFileSync(path.join(root, 'book.html'), 'utf8');
['book-infinite-feed','book-feed-sentinel','book-feed-filters'].forEach(id => {
  assert.ok(html.includes(`id="${id}"`), `book.html should contain ${id}`);
});
assert.ok(html.includes('book-infinite-feed.js'), 'book.html should load book-infinite-feed.js');

const page = fs.readFileSync(path.join(root, 'book-page.js'), 'utf8');
assert.ok(page.includes('IntersectionObserver'), 'book page should auto-load while scrolling');
assert.ok(page.includes('buildBookFeedBatch'), 'book page should build feed batches');
assert.ok(page.includes('data-book-feed-filter'), 'book page should filter feed types');

const feed = require(path.join(root, 'book-infinite-feed.js'));
assert.ok(Array.isArray(feed.LOGICAL_FALLACIES));
assert.ok(feed.LOGICAL_FALLACIES.length >= 10);
['straw-man','ad-hominem','false-dilemma','slippery-slope','appeal-to-authority','hasty-generalization','post-hoc','red-herring','circular-reasoning','bandwagon'].forEach(id => {
  assert.ok(feed.LOGICAL_FALLACIES.some(item => item.id === id), `missing ${id}`);
});
assert.strictEqual(typeof feed.buildBookFeedBatch, 'function');

const sample = {id:'sample',slug:'sample',title:'Sample',content:{summary:'חשיבה החלטות למידה והרגלים',ideas:['קבלת החלטות'],topics:['חשיבה','למידה'],feed_posts:['רעיון מתוך הספר']}};
const batch = feed.buildBookFeedBatch(sample, {seed:'test', offset:0, count:40});
assert.strictEqual(batch.length, 40);
const kinds = new Set(batch.map(item => item.kind));
['question','term','definition','suggestion','fallacy'].forEach(kind => assert.ok(kinds.has(kind), `missing kind ${kind}`));
assert.ok(batch.some(item => item.kind === 'fallacy' && item.englishTitle));

console.log('book infinite feed tests: OK');
