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

console.log('book search UI rendering tests: OK');
