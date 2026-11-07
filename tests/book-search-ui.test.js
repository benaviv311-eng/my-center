const assert=require('assert');
const UI=require('../book-search-ui.js');

const html=UI.makeResultsMarkup([
  {id:'chapter:c1',kind:'chapter',title:'קבלת החלטות',description:'הפרק עוסק בהחלטות.',chapterId:'c1'},
  {id:'concept:x',kind:'concept',title:'מסוגלות עצמית',description:'האמונה ביכולת לבצע משימה.'}
]);
assert.match(html,/data-book-search-result="chapter:c1"/,'chapter result should be actionable');
assert.match(html,/פרקים/,'chapter results should be grouped and labelled');
assert.match(html,/מושגים מקצועיים/,'concept results should be grouped separately');
assert.match(html,/מסוגלות עצמית/,'results should display concept title');
assert.match(UI.makeResultsMarkup([]),/לא נמצאו תוצאות/,'zero results should communicate no matches');
const escaped=UI.makeResultsMarkup([{id:'x',kind:'topic',title:'<script>alert(1)</script>',description:'& text'}]);
assert.ok(!escaped.includes('<script>'),'user-originated text must be escaped');
assert.ok(escaped.includes('&lt;script&gt;'),'unsafe tags should render as text');

assert.equal(
  UI.makeBookPlaceholder({title:'הרגלים אטומיים',content:{topics:['בניית הרגלים','סביבה והרגלים']}}),
  'למשל: בניית הרגלים · סביבה והרגלים',
  'search examples should come from the open book rather than a fixed Jung-specific example'
);
assert.equal(
  UI.makeBookPlaceholder({title:'Psychological Types',content:{topics:[{title:'חשיבה מוחצנת'},'חישה מופנמת']}}),
  'למשל: חשיבה מוחצנת · חישה מופנמת',
  'topics represented as objects should remain readable'
);
assert.equal(
  UI.makeBookPlaceholder({title:'ספר ללא נושאים',content:{topics:[]}}),
  'חפש פרק, רעיון או מושג בספר הזה…',
  'books without suitable topics need a neutral placeholder'
);

console.log('book search UI rendering tests: OK');
