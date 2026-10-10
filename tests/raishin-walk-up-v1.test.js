const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const gameDir=path.join(root,'raishin-legacy');
const js=fs.readFileSync(path.join(gameDir,'game.js'),'utf8');
const upDir=path.join(gameDir,'assets','player','walk-up');

for(let i=1;i<=8;i++){
  const name=`frame-${String(i).padStart(2,'0')}.svg`;
  assert.ok(fs.existsSync(path.join(upDir,name)),`${name} must exist`);
}
assert.match(js,/upFrames\s*=\s*Array\.from\(\{length:8\}/,'game must load eight dedicated Walk UP frames');
assert.match(js,/assets\/player\/walk-up\/frame-/,'Walk UP frame path must be wired');
assert.match(js,/state\.direction\s*===\s*['"]up['"]/,'UP direction must use dedicated frames');
assert.match(js,/sprite\.naturalWidth\/8/,'legacy four-direction sprite must remain as fallback');
assert.match(js,/\.\.\.upFrames\.map/,'asset readiness must include Walk UP frames');
console.log('PASS: canonical Raika Walk UP v1 integration');
