const assert=require('assert');
const Guides=require('../book-search-guides.js');
const Search=require('../book-search.js');

const jung={title:'Psychological Types',content:{topics:['סוגי אישיות ביונג']}};
const guides=Guides.forBook(jung);
assert.equal(guides.length,8,'Jung chapter ten distinguishes eight functional types');
assert.equal(new Set(guides.map(guide=>guide.id)).size,8,'each type needs its own detail page');
assert.equal(Guides.forBook({title:'Atomic Habits'}).length,0,'Jung specific guides must not leak into other books');
const entries=Search.buildBookIndex(jung,[],[],guides);
const matches=Search.searchBookIndex(entries,'סוגי אישיות ביונג');
assert.equal(matches.filter(entry=>entry.kind==='guide').length,8,'general query should allow exploring all Jung types');
assert.ok(Search.searchBookIndex(entries,'חשיבה מופנמת').some(entry=>entry.kind==='guide'),'specific Jung function must be searchable');
assert.ok(guides.every(guide=>guide.explanation.length>90),'guides must contain substantive explanatory content');
assert.ok(guides.every(guide=>guide.example&&guide.distinction&&guide.sourceUrl),'each guide needs a concrete example, caveat and original source');

console.log('Jung personality type search guides tests: OK');
