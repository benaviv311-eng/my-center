const assert=require('assert');
const Search=require('../book-search.js');

const book={
  id:'sample',title:'A Book',content:{
    summary:'הקדמה קצרה על קבלת החלטות.',
    ideas:['דיוק לפני מהירות'],
    topics:['תכנון לטווח ארוך','משוב בלמידה'],
    feed_posts:['דוגמה על משוב מדויק'],
    key_points:[{title:'הבחנה חשובה',text:'יש להבדיל בין עובדות לפרשנויות.'}],
    learning_points:[{title:'התנהגות עקבית',text:'הסביבה משפיעה על ההתמדה.'}]
  }
};
const shown=[{id:'chapter-1',title:'דיוק לפני מהירות',bodyParagraphs:['לא ממהרים להחליט בלי מידע.'],deep:{sections:[]}}];
const concepts=[{id:'motivation',title:'מוטיבציה פנימית',explanation:'תחושת בחירה ועניין בפעילות.'}];
const entries=Search.buildBookIndex(book,shown,concepts,[]);

assert.ok(entries.some(item=>item.kind==='chapter'&&item.chapterId==='chapter-1'),'visible chapters should be navigable');
assert.ok(entries.some(item=>item.kind==='topic'&&item.title==='תכנון לטווח ארוך'),'index should include topics outside displayed chapters');
assert.ok(entries.some(item=>item.kind==='point'&&item.title==='התנהגות עקבית'),'index should include all learning points');
assert.ok(entries.some(item=>item.kind==='concept'&&item.title==='מוטיבציה פנימית'),'index should include professional concepts');

assert.strictEqual(Search.searchBookIndex(entries,'תִּכְנוּן   לטווח־ארוך')[0].title,'תכנון לטווח ארוך','Hebrew marks and punctuation must not block matches');
assert.strictEqual(Search.searchBookIndex(entries,'מוטיבציה פנימית')[0].kind,'concept','search should find concept titles');
assert.ok(Search.searchBookIndex(entries,'ללא תוצאה').length===0,'irrelevant queries should return no items');
assert.strictEqual(Search.searchBookIndex(entries,'').length,entries.length,'empty query should allow browsing the entire index');

const guide=[{id:'jung-a',title:'טיפוס חשיבה מוחצן',explanation:'מכוון חשיבה למידע חיצוני.',searchTerms:'סוגי אישיות יונג psychological types',sourceLabel:'הסבר לימודי'}];
const guided=Search.buildBookIndex({title:'Psychological Types',content:{}},[],[],guide);
assert.strictEqual(Search.searchBookIndex(guided,'סוגי אישיות').length,1,'guide aliases should be searchable');
assert.deepStrictEqual(Search.buildBookIndex({title:'Empty',content:{}},[],[],[]),[],'sparse books should produce no invented entries');

console.log('per-book search index tests: OK');
