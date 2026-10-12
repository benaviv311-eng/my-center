const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const movement=require(path.join(root,'raishin-legacy','movement.js'));
const game=fs.readFileSync(path.join(root,'raishin-legacy','game.js'),'utf8');
const professionalSprite=path.join(root,'raishin-legacy','assets','player','raika-walk-up-professional-v3.png');

assert.ok(fs.existsSync(professionalSprite),'professional Walk UP sprite must exist');
assert.ok(fs.statSync(professionalSprite).size>7000,'professional Walk UP sprite must contain real image data');
assert.equal(typeof movement.frameAtDistance,'function','movement should expose distance-driven walk frames');
assert.equal(movement.frameAtDistance(0,24,8),0);
assert.equal(movement.frameAtDistance(23.9,24,8),0);
assert.equal(movement.frameAtDistance(24,24,8),1);
assert.equal(movement.frameAtDistance(96,24,8),4);
assert.equal(movement.frameAtDistance(191.9,24,8),7);
assert.equal(movement.frameAtDistance(192,24,8),0);

assert.match(game,/raika-walk-up-professional-v3\.png/,'game should load the professional Walk UP strip');
assert.match(game,/upDistance/,'UP animation should track actual distance travelled');
assert.match(game,/Math\.hypot\(next\.x-state\.x,next\.y-state\.y\)/,'UP cycle should advance from real world displacement');
assert.match(game,/upFootContacts/,'Walk UP should carry per-frame foot contact metadata');
assert.match(game,/contact\.x\*sw/,'foot contact X must scale with the actual sprite resolution');
assert.match(game,/contact\.y\*sh/,'foot contact Y must scale with the actual sprite resolution');
assert.match(game,/drawUpFrame/,'Walk UP should use a dedicated grounded renderer');
assert.match(game,/frameIndex\s*>=\s*4/,'second half of the cycle should switch supporting leg without mirroring Raika’s head/ribbon');
assert.match(game,/ctx\.clip\(\)/,'support-leg alternation should be clipped to the lower body only');
console.log('PASS: professional distance-driven grounded Walk UP v3 contract');
