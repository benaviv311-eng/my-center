const vm=require('node:vm');
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

test('editorial library removes generic stock photography from core presentation',()=>{
  const html=read('library.html');
  const css=read('library-premium.css');
  const js=read('library-premium-ui.js');
  assert.doesNotMatch(html,/images\.unsplash\.com|library-photo-credit|library-premium-hero-media/);
  assert.doesNotMatch(css,/images\.unsplash\.com|library-photo-strip/);
  assert.doesNotMatch(js,/images\.unsplash\.com|EDITORIAL_IMAGES|addPhotoStrip/);
});

test('each book uses a deterministic typographic cover system',()=>{
  const js=read('library-premium-ui.js');
  const css=read('library-premium.css');
  for(const token of ['coverTheme','coverInitials','bookCoverHtml','library-book-cover']){
    assert.ok(js.includes(token),token+' should exist');
  }
  assert.match(css,/\.library-book-cover/);
  assert.match(css,/\.library-book-cover-title/);
  assert.match(css,/\.library-book-cover-mark/);
});

test('today view has one professional featured book and quieter supporting books',()=>{
  const css=read('library-premium.css');
  const js=read('library-premium-ui.js');
  assert.match(css,/\.daily-book\.library-featured-book/);
  assert.match(css,/\.daily-book\.library-supporting-book/);
  assert.match(js,/enhanceDailySelection/);
  assert.match(js,/library-featured-book/);
  assert.match(js,/library-supporting-book/);
});

test('library includes editorial insight treatment and clean reading navigation',()=>{
  const html=read('library.html');
  const css=read('library-premium.css');
  const js=read('library-premium-ui.js');
  assert.match(html,/library-editorial-header/);
  assert.match(css,/\.library-editorial-insight/);
  assert.match(css,/\.library-book-internal-nav/);
  assert.match(js,/decorateEditorialInsight/);
  assert.match(js,/library-book-internal-nav/);
});

test('editorial redesign preserves all core library destinations and actions',()=>{
  const html=read('library.html');
  for(const id of ['library-search','daily-books','library-randomize','library-random-top','library-discovery-feed','daily-feed','library-books-grid','library-shelves','library-book-sheet','library-book-note']){
    assert.match(html,new RegExp('id="'+id+'"'));
  }
  for(const view of ['today','books','archive','favorites']){
    assert.match(html,new RegExp('data-library-view="'+view+'"'));
  }
});

test('editorial layer is cache-busted and syntactically valid',()=>{
  const html=read('library.html');
  assert.match(html,/library-premium\.css\?v=2/);
  assert.match(html,/library-premium-ui\.js\?v=3/);
  assert.doesNotThrow(()=>new vm.Script(read('library-premium-ui.js')));
});
