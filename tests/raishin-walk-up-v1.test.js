const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const gameDir=path.join(root,'raishin-legacy');
const js=fs.readFileSync(path.join(gameDir,'game.js'),'utf8');
const upSprite=path.join(gameDir,'assets','player','raika-walk-up-v1.avif');

assert.ok(fs.existsSync(upSprite),'normalized canonical Walk UP sprite strip must exist');
assert.match(js,/upSprite\s*=\s*new Image\(\)/,'game must load a dedicated Walk UP sprite');
assert.match(js,/raika-walk-up-v1\.avif/,'Walk UP sprite path must be wired');
assert.match(js,/state\.direction\s*===\s*['"]up['"]/,'UP direction must use the dedicated sprite');
assert.match(js,/upSprite\.naturalWidth\/8/,'Walk UP sprite must be rendered as eight frames');
assert.match(js,/sprite\.naturalWidth\/8/,'legacy four-direction sprite must remain as fallback');
assert.match(js,/upSprite\.decode/,'asset readiness must include the Walk UP sprite');
console.log('PASS: canonical Raika Walk UP v1 integration');
