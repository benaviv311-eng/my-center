const vm=require('node:vm');
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

test('premium library shell keeps core views and current editorial assets',()=>{
  const html=read('library.html');
  assert.match(html,/library-premium\.css\?v=2/);
  assert.match(html,/library-premium-ui\.js\?v=3/);
  assert.match(html,/library-editorial-header/);
  assert.match(html,/id="library-continue-section"/);
  assert.match(html,/id="library-shelves"/);
  for(const view of ['today','books','archive','favorites']){
    assert.match(html,new RegExp('data-library-view="'+view+'"'));
  }
});

test('premium layer keeps responsive shelves and custom covers',()=>{
  const css=read('library-premium.css');
  const js=read('library-premium-ui.js');
  assert.match(css,/\.library-book-cover/);
  assert.match(css,/\.library-shelf-track/);
  assert.match(css,/@media\(max-width:/);
  assert.match(js,/bookCoverHtml/);
  assert.match(js,/renderShelves/);
});

test('premium enhancer keeps continue-reading and richer book presentation',()=>{
  const js=read('library-premium-ui.js');
  assert.match(js,/library-premium-recent/);
  assert.match(js,/library-continue-list/);
  assert.match(js,/library-book-premium-hero/);
  assert.match(js,/MutationObserver/);
  assert.match(js,/data-library-hero-action/);
});

test('premium redesign preserves existing core library behavior',()=>{
  const ui=read('library-discovery-ui.js');
  for(const token of ['renderToday','renderBooks','renderDiscovery','renderArchive','renderFavorites','openBook','library-book-note']){
    assert.ok(ui.includes(token),token+' should remain');
  }
});

test('premium library presentation script has valid JavaScript syntax',()=>{
  assert.doesNotThrow(()=>new vm.Script(read('library-premium-ui.js')));
});
