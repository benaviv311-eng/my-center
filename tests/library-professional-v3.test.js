const vm=require('node:vm');
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

test('professional V3 uses a restrained publication masthead',()=>{
  const html=read('library.html');
  const css=read('library-premium.css');
  assert.match(html,/library-professional-masthead/);
  assert.match(html,/library-masthead-top/);
  assert.match(html,/library-command-row/);
  assert.match(css,/\.library-professional-masthead/);
  assert.match(css,/\.library-masthead-main/);
});

test('daily selection is a lead story plus editorial supporting stack',()=>{
  const css=read('library-premium.css');
  const js=read('library-premium-ui.js');
  assert.match(css,/\.daily-book\.library-featured-book/);
  assert.match(css,/\.daily-book\.library-supporting-book/);
  assert.match(css,/grid-template-columns:minmax\(0,1\.8fr\) minmax\(280px,/);
  assert.match(js,/professionalizeDailySelection/);
});

test('professional library minimizes card chrome and uses publication rules',()=>{
  const css=read('library-premium.css');
  assert.match(css,/--rule:/);
  assert.match(css,/\.library-section-rule/);
  assert.match(css,/\.book-card\{[^}]*border:0/s);
  assert.match(css,/\.nugget-card\{[^}]*border-top:1px solid var\(--rule\)/s);
});

test('book reading opens as a full reading workspace with a sidebar',()=>{
  const css=read('library-premium.css');
  const js=read('library-premium-ui.js');
  assert.match(css,/\.book-sheet\{[^}]*background:var\(--page\)/s);
  assert.match(css,/\.library-reading-shell/);
  assert.match(css,/\.library-reading-sidebar/);
  assert.match(js,/ensureReadingShell/);
  assert.match(js,/library-reading-sidebar/);
});

test('V3 keeps deterministic book covers and core library actions',()=>{
  const html=read('library.html');
  const js=read('library-premium-ui.js');
  assert.match(js,/bookCoverHtml/);
  for(const id of ['library-search','daily-books','library-randomize','library-random-top','library-discovery-feed','daily-feed','library-books-grid','library-book-sheet','library-book-note']){
    assert.match(html,new RegExp('id="'+id+'"'));
  }
});

test('professional V3 assets are cache-busted and JavaScript parses',()=>{
  const html=read('library.html');
  assert.match(html,/library-premium\.css\?v=3/);
  assert.match(html,/library-premium-ui\.js\?v=4/);
  assert.doesNotThrow(()=>new vm.Script(read('library-premium-ui.js')));
});