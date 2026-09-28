const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const read=p=>fs.readFileSync(p,'utf8');

test('Writers Room exposes the infinite Raika idea engine controls',()=>{
  const html=read('raika-writers-room.html');
  assert.match(html,/id="raika-feed"/);
  assert.match(html,/id="raika-feed-refresh-all"/);
  assert.match(html,/רענן הכל/);
  assert.match(html,/value="new"[^>]*>[^<]*רעיונות חדשים/);
  assert.match(html,/id="raika-feed-list"/);
  for(const script of ['raika-feed-context.js','raika-creative-feed-state.js','raika-feed-client.js','raika-feed-ui.js','raika-idea-engine-core.js']){
    assert.match(html,new RegExp(script.replace('.','\\.')));
  }
});

test('Raika feed client sends full refresh and permanent block actions',()=>{
  const src=read('raika-feed-client.js');
  assert.match(src,/async function refreshAll/);
  assert.match(src,/action:'refresh_all'/);
  assert.match(src,/count=24/);
  assert.match(src,/async function blockForever/);
  assert.match(src,/action:'block_forever'/);
  assert.match(src,/seed_card_id/);
});

test('Raika feed UI refreshes 24 ideas and blocks a card only after server success',()=>{
  const src=read('raika-feed-ui.js');
  assert.match(src,/async function rfuRefreshAll/);
  assert.match(src,/refreshAll\(\{count:24/);
  assert.match(src,/data-rf-action="never"/);
  assert.match(src,/אל תציע לי יותר/);
  const blockIndex=src.indexOf('await RaikaFeedClient.blockForever');
  const hideIndex=src.indexOf('rfuHide(id)',blockIndex);
  assert.ok(blockIndex>=0&&hideIndex>blockIndex,'server block must succeed before local hide');
});


test('Raika idea cards keep their existing feed actions wired',()=>{
  const src=read('raika-feed-ui.js');
  for(const action of ['save','like','more','develop','scene','less','hide']){
    assert.match(src,new RegExp(`data-rf-action=["']${action}["']`));
  }
  assert.match(src,/RaikaWorkspaceClient\.save/);
  assert.match(src,/RaikaFeedClient\.moreLike/);
  assert.match(src,/RaikaFeedClient\.expandScene/);
  assert.match(src,/RaikaFeedClient\.feedback/);
});
