const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

test('coach home exposes volleyball as a primary destination and bottom-nav item',()=>{
  const html=read('coach.html');
  assert.match(html,/href=["']volleyball\.html["']/,'coach page should link to volleyball.html');
  assert.match(html,/🏐\s*כדורעף|כדורעף\s*🏐/,'coach page should visibly label the volleyball destination');
  const matches=html.match(/href=["']volleyball\.html["']/g)||[];
  assert.ok(matches.length>=2,'coach page should include volleyball in both the main content and bottom navigation');
});
