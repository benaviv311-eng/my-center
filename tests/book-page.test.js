const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

const mustExist = [
  'book.html',
  'book-page.js',
  'book-page.css',
  'book-reading.js',
  'book-structure.js',
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
  'book-key-points-toggle',
  'book-key-points-section',
  'book-key-points-list',
  'book-learning-points-section',
  'book-learning-points-list',
  'book-learning-points-toggle',
  'book-reading-toc',
  'book-reading-body',
  'book-reading-progress',
  'book-chapter-summary',
  'book-summary-title',
  'book-summary-points',
  'book-read-aloud',
  'book-read-pause',
  'book-read-stop',
  'book-read-rate',
  'book-read-language',
  'book-read-floating',
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

['library-discovery.js', 'book-structure.js', 'book-reading.js', 'book-page.js', 'book-page.css'].forEach(file => {
  assert.ok(html.includes(file), `book.html should load ${file}`);
});

const approvedOrder = [
  'book-intro',
  'book-key-points-section',
  'book-learning-points-section',
  'book-reading-body',
  'book-infinite-feed',
  'book-ideas',
  'book-topics',
  'book-note'
];
for(let i=1;i<approvedOrder.length;i++){
  assert.ok(
    html.indexOf(approvedOrder[i-1]) < html.indexOf(approvedOrder[i]),
    `${approvedOrder[i-1]} should appear before ${approvedOrder[i]}`
  );
}
assert.ok(!/id="book-key-points-section"[^>]*\bhidden\b/.test(html), 'key points should be a permanent part of every book structure');
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
assert.ok(js.includes('BookStructure'), 'book page should use the shared universal book structure');
assert.ok(js.includes('renderBookLearningPoints'), 'book page should render the expanded learning-points section');

const pageCss = fs.readFileSync(path.join(root, 'book-page.css'), 'utf8');
['book-reading-layout','book-reading-toc-card','reading-chapter','reading-deep-panel','book-takeaways-section','book-key-points-section','book-learning-points-section'].forEach(token => {
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

assert.ok(js.includes('c8596613-aa90-49f3-8410-09d305926710'), 'reader prototype should be limited to the approved prototype book');
assert.ok(js.includes('renderChapterSummary'), 'prototype should update a short summary for the active chapter');
assert.ok(js.includes('speechSynthesis'), 'prototype should support browser read-aloud');
assert.ok(js.includes('SpeechSynthesisUtterance'), 'prototype should create speech utterances');
assert.ok(js.includes('book-read-aloud'), 'prototype should wire a chapter read-aloud control');
assert.ok(pageCss.includes('book-prototype-reading'), 'prototype should have an opt-in three-column reading layout');
assert.ok(pageCss.includes('grid-template-areas:"summary reader toc"'), 'prototype desktop layout should place summary on the physical left and TOC on the physical right');
assert.ok(pageCss.includes('book-chapter-summary-card'), 'prototype should style a sticky chapter summary');
assert.ok(!js.includes('title.textContent=`משפטי מפתח'), 'left rail should not show a redundant key-sentences heading');
assert.ok(js.includes('points.length===6'), 'left rail should expose six concise nuggets when enough material exists');
assert.ok(pageCss.includes('.book-chapter-summary-wrap{') && pageCss.includes('position:sticky'), 'left chapter summary rail should stay fixed while scrolling on desktop');
assert.ok(pageCss.includes('.book-prototype-reading .book-reading-toc-wrap{') && pageCss.includes('position:sticky'), 'prototype TOC wrapper should stay fixed while scrolling on desktop');
assert.ok(js.includes('excludeTitles'), 'prototype refresh should exclude the chapter titles currently on screen');
assert.ok(js.includes('fullRefresh:true'), 'prototype refresh should request a completely fresh chapter set');
assert.ok(js.includes('chapter.keySentences'), 'left rail should render key sentences supplied by the chapter model');
assert.ok(pageCss.includes('.book-prototype-reading .book-chapter-summary-head') && pageCss.includes('display:none'), 'prototype nugget rail should hide meta headings and show only ideas');
assert.ok(html.includes('0.75') && html.includes('1.25') && html.includes('1.5'), 'read-aloud prototype should offer multiple playback speeds');
assert.ok(js.includes('function readRate()'), 'reader should resolve the selected playback rate');
assert.ok(js.includes('utterance.rate=readRate()'), 'speech synthesis should use the selected playback rate');
assert.ok(pageCss.includes('.book-prototype-reading #book-refresh-all') && pageCss.includes('position:fixed'), 'refresh-all should stay fixed near the bottom of the viewport in the prototype');
assert.ok(html.includes('id="book-refresh-all"') && html.includes('aria-label="רענן הכול"'), 'refresh-all should keep an accessible label');
assert.ok(/id="book-refresh-all"[^>]*>🔄<\/button>/.test(html), 'refresh-all should render as an icon-only button');
assert.ok(pageCss.includes('left:16px'), 'refresh icon should be pinned to the physical left edge');
assert.ok(pageCss.includes('width:46px') && pageCss.includes('height:46px'), 'refresh icon should be compact');
assert.ok(pageCss.includes('bottom:calc(154px + env(safe-area-inset-bottom))'), 'desktop refresh icon should sit above the site chat button');
assert.ok(pageCss.includes('bottom:calc(144px + env(safe-area-inset-bottom))'), 'mobile refresh icon should sit above the site chat button');
assert.ok(html.includes('he-IL') && html.includes('ar-SA') && html.includes('it-IT') && html.includes('ru-RU') && html.includes('es-ES'), 'read-aloud should offer language switching across the site language set');
assert.ok(js.includes('function readLanguage()'), 'reader should resolve the selected read-aloud language');
assert.ok(js.includes('utterance.lang=readLanguage()'), 'speech synthesis should use the selected language');
assert.ok(js.includes('compactSummaryText(value,88)'), 'chapter key sentences should be noticeably shorter');
assert.ok(js.includes("stopReadAloud('ההקראה נעצרה בגלל רענון.')"), 'refresh-all should stop active read-aloud before replacing chapters');
assert.ok(js.includes('utterance.onboundary'), 'read-aloud should follow speech boundary events');
assert.ok(js.includes('data-speech-start'), 'reader should mark spoken words with character offsets');
assert.ok(js.includes('scrollIntoView({behavior:\'smooth\',block:\'center\''), 'spoken word tracking should auto-scroll the current word into view');
assert.ok(pageCss.includes('.speech-word.is-speaking-word'), 'current spoken word should have a visible highlight style');
assert.ok(html.includes('<option value="en-US">אנגלית</option>'), 'read-aloud language selector should include English');
assert.ok(pageCss.includes('.book-prototype-reading #book-read-floating') && pageCss.includes('position:fixed'), 'read-aloud should have a fixed floating control in the prototype');
assert.ok(pageCss.includes('bottom:calc(212px + env(safe-area-inset-bottom))'), 'floating read control should sit above refresh on desktop');
assert.ok(js.includes("$('book-read-floating').addEventListener"), 'floating read control should trigger read-aloud');
assert.ok(pageCss.includes('.book-summary-points li::marker'), 'nugget bullets should have an explicit marker style');
assert.ok(pageCss.includes('color:#111'), 'nugget text and bullets should render in solid black');
