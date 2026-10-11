const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const gameDir=path.join(root,'raishin-legacy');
const js=fs.readFileSync(path.join(gameDir,'game.js'),'utf8');
const upSpriteV1=path.join(gameDir,'assets','player','raika-walk-up-v1.avif');
const upSpriteV2=path.join(gameDir,'assets','player','raika-walk-up-v2.png');

assert.ok(fs.existsSync(upSpriteV2)||fs.existsSync(upSpriteV1),'canonical Walk UP sprite strip must exist');
assert.match(js,/upSprite\s*=\s*new Image\(\)/,'game must load a dedicated Walk UP sprite');
assert.match(js,/raika-walk-up-v(?:1\.avif|2\.png)/,'Walk UP sprite path must be wired');
assert.match(js,/state\.direction\s*===\s*['"]up['"]/,'UP direction must use the dedicated sprite');
assert.match(js,/upSprite\.naturalWidth\/8/,'Walk UP sprite must be rendered as eight frames');
assert.match(js,/sprite\.naturalWidth\/8/,'legacy four-direction sprite must remain as fallback');
assert.match(js,/upSprite\.decode/,'asset readiness must include the Walk UP sprite');
console.log('PASS: canonical Raika Walk UP integration');
