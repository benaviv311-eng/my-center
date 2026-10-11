const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const game=fs.readFileSync(path.join(root,'raishin-legacy','game.js'),'utf8');

assert.match(game,/raika-walk-up-v2\.png/,'grounded Walk UP v2 sprite must be loaded');
assert.match(game,/upFootBaselineRatio\s*=\s*1(?:[;,])/,'Walk UP must use the actual sprite bottom as the floor baseline');
assert.match(game,/upWalkBob\s*=\s*0(?:[;,])/,'Walk UP must not add synthetic vertical bob on top of authored frames');
assert.match(game,/upFootContactOffsets\s*=\s*\[[^\]]+\]/s,'Walk UP must define planted-foot contact offsets for all frames');
assert.match(game,/drawFloorContact\([^\n]*contactX/s,'contact shadow must follow the planted foot, not only the body center');
console.log('PASS: Walk UP grounded foot-contact contract');
