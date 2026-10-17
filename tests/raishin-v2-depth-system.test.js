const fs=require('fs');
const path=require('path');
const assert=require('assert');

const root=path.resolve(__dirname,'..');
const depthPath=path.join(root,'raishin-legacy','src','systems','DepthSystem.js');
assert.ok(fs.existsSync(depthPath),'DepthSystem module must exist');
const DepthSystem=require(depthPath);
assert.equal(typeof DepthSystem.depthFor,'function');
assert.equal(typeof DepthSystem.fixedBand,'function');

const rear={x:500,y:620,scale:.8,depth:620};
const front={x:500,y:1040,scale:.95,depth:1040};
assert.ok(DepthSystem.depthFor(rear)<DepthSystem.depthFor(front),'dynamic depth must sort by projected ground Y');
assert.equal(DepthSystem.depthFor(rear,12),632,'depth bias must be additive and predictable');
assert.ok(DepthSystem.fixedBand('background')<DepthSystem.fixedBand('floor'));
assert.ok(DepthSystem.fixedBand('floor')<DepthSystem.depthFor(rear));
assert.ok(DepthSystem.fixedBand('foreground')>DepthSystem.depthFor(front));
assert.throws(()=>DepthSystem.fixedBand('unknown'),/Unknown depth band/);
assert.doesNotMatch(fs.readFileSync(depthPath,'utf8'),/Phaser|canvas|sprite|camera/i,'DepthSystem must stay renderer-independent');
console.log('PASS: Raishin v2 shared depth system');
