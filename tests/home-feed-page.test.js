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
