const vm=require('node:vm');
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

test('library premium V1 is wired without removing existing library views',()=>{
  const html=read('library.html');
  assert.match(html,/library-premium\.css\?v=1/);
  assert.match(html,/library-premium-ui\\.js\\?v=2/);
  assert.match(html,/class="library-premium-hero"/);
  assert.match(html,/id="library-continue-section"/);
  assert.match(html,/id="library-shelves"/);
  for(const view of ['today','books','archive','favorites']){
    assert.match(html,new RegExp('data-library-view="'+view+'"'));
  }
});

test('premium library uses visual editorial imagery and responsive shelves',()=>{
  const css=read('library-premium.css');
  const js=read('library-premium-ui.js');
  assert.match(css,/\.library-premium-hero/);
  assert.match(css,/\.library-cover/);
  assert.match(css,/\.library-shelf-track/);
  assert.match(css,/@media\(max-width:/);
  assert.match(js,/images\.unsplash\.com/);
  assert.match(js,/library-cover/);
  assert.match(js,/library-shelf/);
});

test('premium enhancer adds continue-reading and richer book presentation',()=>{
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


test('premium library keeps a broad image pool and position-based visible variety',()=>{
  const js=read('library-premium-ui.js');
  const imageMatches=[...js.matchAll(/https:\/\/images\.unsplash\.com\/photo-[^'"]+/g)].map(m=>m[0]);
  assert.ok(new Set(imageMatches).size>=10,'expected at least ten distinct editorial photos');
  assert.match(js,/function imageForPosition/);
  assert.match(js,/visibleIndex/);
});

test('library cache-busts the corrected image-variety layer',()=>{
  const html=read('library.html');
  assert.match(html,/library-premium-ui\.js\?v=2/);
});
