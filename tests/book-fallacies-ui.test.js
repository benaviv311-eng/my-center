const assert=require('assert');
const fs=require('fs');
const path=require('path');
const root=path.join(__dirname,'..');
const UI=require('../book-fallacies-ui.js');

const sample={id:'strawman-fallacy',title:'כשל איש הקש',englishTitle:'Strawman Fallacy',category:'relevance',definition:'עיוות טענה',example:'הצגת גרסה חלשה של טענה',sourceUrl:'https://www.logicallyfallacious.com/fallacies'};
const markup=UI.cardMarkup(sample,true);
assert.ok(markup.includes('data-fallacy-open="strawman-fallacy"'));
assert.ok(markup.includes('כשל איש הקש'));
assert.ok(markup.includes('Strawman Fallacy'));
assert.ok(markup.includes('שמורים'));

const detail=UI.detailMarkup(sample,true);
assert.ok(detail.includes('עיוות טענה'));
assert.ok(detail.includes('הצגת גרסה חלשה'));
assert.ok(detail.includes('data-fallacy-save="strawman-fallacy"'));
assert.ok(detail.includes('rel="noopener noreferrer"'));
assert.ok(detail.includes('https://www.logicallyfallacious.com/fallacies'));

const pending=UI.detailMarkup({...sample,definition:'',example:''},false);
assert.ok(pending.includes('טרם נוסף הסבר עברי'), 'missing translations should be honest');
assert.ok(pending.includes('המקור הרשמי'));
const unsafe=UI.cardMarkup({...sample,title:'<img onerror="alert(1)">',englishTitle:'<script>x</script>'},false);
assert.ok(!unsafe.includes('<script>'));
assert.ok(!unsafe.includes('<img'));

const html=fs.readFileSync(path.join(root,'book.html'),'utf8');
['book-fallacies-toggle','book-fallacies-section','book-fallacies-input','book-fallacies-filters','book-fallacies-results','book-fallacies-detail','book-fallacies-more','book-fallacies-count'].forEach(id=>assert.ok(html.includes(`id="${id}"`),`Missing ${id}`));
['book-fallacies-data.js','book-fallacies.js','book-fallacies-ui.js','book-fallacies.css'].forEach(file=>assert.ok(html.includes(file),`Missing ${file} include`));
assert.ok(html.indexOf('book-fallacies-section')<html.indexOf('book-reading-section'),'dictionary should appear before reading');
const pageJs=fs.readFileSync(path.join(root,'book-page.js'),'utf8');
assert.ok(pageJs.includes("key==='logically-fallacious'"),'A stable direct book URL should resolve even when the book has an opaque ID');
console.log('book fallacies UI tests: OK');
