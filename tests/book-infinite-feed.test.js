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
assert.strictEqual(typeof feed.diversifyOrder, 'function', 'feed should expose a diversity-aware random ordering helper');

const sample = {id:'sample',slug:'sample',title:'Sample',content:{summary:'חשיבה החלטות למידה והרגלים',ideas:['קבלת החלטות'],topics:['חשיבה','למידה'],feed_posts:['רעיון מתוך הספר']}};
const batch = feed.buildBookFeedBatch(sample, {seed:'test', offset:0, count:40});
assert.strictEqual(batch.length, 40);
const kinds = new Set(batch.map(item => item.kind));
['question','term','definition','suggestion','fallacy'].forEach(kind => assert.ok(kinds.has(kind), `missing kind ${kind}`));
assert.ok(batch.some(item => item.kind === 'fallacy' && item.englishTitle));

const sampleItems = [
  {id:'q1',kind:'question'},
  {id:'q2',kind:'question'},
  {id:'q3',kind:'question'},
  {id:'t1',kind:'term'},
  {id:'d1',kind:'definition'},
  {id:'a1',kind:'application'},
  {id:'s1',kind:'suggestion'}
];
const diversified = feed.diversifyOrder(sampleItems,'variety');
for(let i=1;i<diversified.length;i++){
  assert.notStrictEqual(diversified[i].kind, diversified[i-1].kind, 'feed should avoid adjacent repeated content types when alternatives exist');
}

const firstOrder = feed.buildBookFeedBatch(sample,{seed:'entry-one',offset:0,count:12}).map(item=>`${item.kind}:${item.title}`);
const secondOrder = feed.buildBookFeedBatch(sample,{seed:'entry-two',offset:0,count:12}).map(item=>`${item.kind}:${item.title}`);
assert.notDeepStrictEqual(firstOrder,secondOrder,'different entry seeds should produce a different feed order');

console.log('book infinite feed tests: OK');
