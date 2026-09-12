const assert = require('assert');
const discovery = require('../library-discovery.js');

const books = [
  {
    id:'b1', slug:'atomic-habits', title:'הרגלים אטומיים',
    content:{
      category:'הרגלים והתנהגות',
      summary:'שינוי הרגלים, זהות, סביבה והתמדה דרך צעדים קטנים.',
      topics:['הרגלים','זהות','מוטיבציה','שינוי התנהגות'],
      ideas:['להפוך את ההתנהגות הרצויה לקלה וברורה'],
      feed_posts:['שינוי קטן שחוזר על עצמו יכול להפוך עם הזמן לדפוס יציב.']
    }
  },
  {
    id:'b2', slug:'thinking-fast-slow', title:'לחשוב מהר לחשוב לאט',
    content:{
      category:'פסיכולוגיה וקבלת החלטות',
      summary:'הטיות חשיבה, שיפוט, אינטואיציה וקבלת החלטות.',
      topics:['הטיות קוגניטיביות','עיגון','קבלת החלטות'],
      ideas:['האינטואיציה מועילה אך גם עלולה להטעות'],
      feed_posts:['המסגרת שבה מציגים מידע יכולה לשנות את ההחלטה שלנו.']
    }
  },
  {
    id:'b3', slug:'mindset', title:'כוחה של נחישות',
    content:{
      category:'למידה והתפתחות',
      summary:'למידה, מאמץ, מסוגלות, טעויות והתפתחות לאורך זמן.',
      topics:['למידה','מסוגלות עצמית','מוטיבציה'],
      ideas:['האופן שבו מפרשים טעות משפיע על ההמשך'],
      feed_posts:['טעות יכולה להיות מידע ללמידה במקום הוכחה לחוסר יכולת.']
    }
  }
];

assert.ok(Array.isArray(discovery.LEARNING_CONCEPTS));
assert.ok(discovery.LEARNING_CONCEPTS.length >= 20, 'should ship a meaningful bank of established learning concepts');
assert.ok(discovery.LEARNING_CONCEPTS.every(c => c.id && c.title && c.explanation && c.sourceKind === 'related-concept'));

const habitsMatches = discovery.matchConcepts(books[0], 5);
assert.ok(habitsMatches.length >= 2, 'habit book should get related concepts');
assert.ok(habitsMatches.some(c => /הרגל|מסוגלות|מוטיבציה|כוונות יישום|חיזוק/.test(c.title)), 'habit matches should be educationally relevant');

const thinkingMatches = discovery.matchConcepts(books[1], 5);
assert.ok(thinkingMatches.some(c => /עיגון|מסגור|אישור|זמינות|הפסד/.test(c.title)), 'decision book should surface established cognitive concepts');

const pool = discovery.buildDiscoveryPool(books);
assert.ok(pool.some(p => p.sourceKind === 'book'), 'pool should include book-derived posts');
assert.ok(pool.some(p => p.sourceKind === 'related-concept'), 'pool should include professional related concepts');
assert.ok(pool.every(p => p.bookId && p.bookTitle && p.id && p.text), 'every post should lead back to a book');

const a = discovery.buildRandomFeed({books, seed:'same-day', count:12});
const b = discovery.buildRandomFeed({books, seed:'same-day', count:12});
assert.deepStrictEqual(a.map(x=>x.id), b.map(x=>x.id), 'same seed should be stable');
const c = discovery.buildRandomFeed({books, seed:'another-seed', count:12});
assert.notDeepStrictEqual(a.map(x=>x.id), c.map(x=>x.id), 'refresh seed should change the order');
assert.ok(a.length <= 12 && a.length > 0);
for(let i=1;i<a.length;i++){
  if(books.length > 1) assert.notStrictEqual(a[i-1].bookId, a[i].bookId, 'smart random should avoid adjacent posts from the same book when possible');
}

assert.strictEqual(typeof discovery.buildBookSections, 'function', 'book view should expose a scrolling learning deck');
const sections = discovery.buildBookSections(books[0], 'book-seed-a');
['passage','idea','theory','psychology','approach','aspect','everyday','application','real-life'].forEach(kind => {
  assert.ok(sections.some(s => s.kind === kind), `book deck should include ${kind}`);
});
assert.ok(sections.every(s => s.title && s.text && s.sourceLabel), 'each book section should have title, text and source label');
const sectionsAgain = discovery.buildBookSections(books[0], 'book-seed-a');
assert.deepStrictEqual(sections.map(s=>s.id), sectionsAgain.map(s=>s.id), 'same book refresh seed should be stable');
const sectionsChanged = discovery.buildBookSections(books[0], 'book-seed-b');
assert.notDeepStrictEqual(sections.map(s=>s.id), sectionsChanged.map(s=>s.id), 'random book mode should change section choices');

console.log('library discovery tests: OK');
