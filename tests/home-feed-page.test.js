const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');

test('home favorites bridge reuses the existing store and emits changes',()=>{
  const js=read('home-feed-favorites.js');
  assert.ok(js.includes("const KEY='my-center-favorites'"));
  assert.ok(js.includes('MyCenterFavorites'));
  assert.ok(js.includes('mycenter:favorites-changed'));
  assert.ok(js.includes('toggle'));
});

test('home feed renderer exposes source, feedback controls and deep link',()=>{
  const H=require('../home-feed.js');
  const html=H.renderCard({id:'coach:x',source:'coach',type:'concept',title:'כותרת',summary:'קצר',fullText:'הרחבה',deepLink:'coach.html',tags:[],expandable:true,metadata:{}},{saved:false,recycled:false});
  assert.ok(html.includes('data-home-item="coach:x"'));
  assert.ok(html.includes('data-home-action="more"'));
  assert.ok(html.includes('data-home-action="less"'));
  assert.ok(html.includes('data-home-action="hide"'));
  assert.ok(html.includes('פתח לעומק'));
});

test('Raika status is preserved as a display badge without promotion',()=>{
  const H=require('../home-feed.js');
  const html=H.renderCard({id:'raika:idea:x',source:'raika',type:'idea',title:'רעיון',summary:'טקסט',fullText:'',deepLink:'raika-writers-room.html',expandable:false,metadata:{status:'idea'}},{});
  assert.ok(html.includes('💡 הצעה'));
  assert.equal(html.includes('✅ קאנון'),false);
});

test('controller code uses required infinite-scroll and dwell thresholds',()=>{
  const js=read('home-feed.js');
  assert.ok(js.includes("rootMargin:'700px 0px'"));
  assert.ok(js.includes('intersectionRatio>=0.6'));
  assert.ok(js.includes('BATCH_SIZE=12'));
  assert.ok(js.includes('buildRecycleCycle'));
  assert.ok(js.includes('restoreCount'));
});

test('index is a unified feed, not the old section mosaic',()=>{
  const html=read('index.html');
  ['home-feed-toolbar','home-feed-status','home-feed-list','home-feed-sentinel'].forEach(id=>assert.ok(html.includes(`id="${id}"`)));
  ['for-you','all','raika','coach','volleyball','languages','music','library','verses','saved'].forEach(mode=>assert.ok(html.includes(`data-home-filter="${mode}"`)));
  ['home-feed.css','home-feed-favorites.js','home-feed-state.js','home-feed-sources.js','home-feed-ranking.js','home-feed.js'].forEach(file=>assert.ok(html.includes(file)));
  assert.equal(html.includes('id="daily-verses"'),false);
  assert.equal(html.includes('⚡ ראיקה היום'),false);
  assert.equal(html.includes('🏐 היום כמאמן'),false);
});
