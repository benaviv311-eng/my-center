const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

test('shared Raika idea history persists seen signatures and semantic fingerprints',()=>{
  const src=fs.readFileSync('raika-idea-history.js','utf8');
  assert.match(src,/raika-idea-history-v1/);
  assert.match(src,/rememberCards/);
  assert.match(src,/recentSignatures/);
  assert.match(src,/filterFresh/);
  assert.match(src,/semantic/i);
  assert.match(src,/localStorage/);
});

test('generator uses the unified server idea engine instead of its own template bank',()=>{
  const src=fs.readFileSync('raika-generator-hotfix.js','utf8');
  assert.match(src,/RaikaFeedClient.*refreshAll/);
  assert.match(src,/RaikaIdeaHistory.*recentSignatures/);
  assert.match(src,/RaikaIdeaHistory.*rememberCards/);
  assert.doesNotMatch(src,/var bank=\{/);
  assert.doesNotMatch(src,/function ideas\(/);
});

test('main feed and generator both feed the same persistent seen history',()=>{
  const feed=fs.readFileSync('raika-feed-ui.js','utf8');
  const generator=fs.readFileSync('raika-generator-hotfix.js','utf8');
  assert.match(feed,/RaikaIdeaHistory.*recentSignatures/);
  assert.match(feed,/RaikaIdeaHistory.*rememberCards/);
  assert.match(generator,/RaikaIdeaHistory.*filterFresh/);
});

test('Writers Room loads shared history before both feed UI and generator hotfix',()=>{
  const html=fs.readFileSync('raika-writers-room.html','utf8');
  assert.match(html,/raika-idea-history\.js\?v=1/);
  const h=html.indexOf('raika-idea-history.js?v=1');
  const feed=html.indexOf('raika-feed-ui.js');
  const gen=html.indexOf('raika-generator-hotfix.js');
  assert.ok(h>=0&&h<feed&&h<gen);
  assert.match(html,/raika-feed-ui\.js\?v=3/);
  assert.match(html,/raika-generator-hotfix\.js\?v=4/);
});
