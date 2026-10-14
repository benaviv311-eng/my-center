const fs=require('fs');
const path=require('path');
const assert=require('assert');

const root=path.resolve(__dirname,'..');
const dir=path.join(root,'raishin-legacy','src','player');
const dataPath=path.join(dir,'raika-animation-data.js');
const animatorPath=path.join(dir,'PlayerAnimator.js');
const viewPath=path.join(dir,'PlayerView.js');
for(const file of [dataPath,animatorPath,viewPath])assert.ok(fs.existsSync(file),`${path.basename(file)} must exist`);

const data=require(dataPath);
const PlayerAnimator=require(animatorPath);
const PlayerView=require(viewPath);
const WorldPlane=require(path.join(root,'raishin-legacy','src','world','WorldPlane.js'));
const layout=require(path.join(root,'raishin-legacy','src','world','dojo-layout.js'));

assert.equal(data.textureKey,'raika-walk');
assert.equal(data.asset,'./assets/player/raika-walk-4dir-8f.png');
assert.equal(data.framesPerDirection,8);
assert.deepStrictEqual(data.rows,{down:0,up:1,left:2,right:3});
for(const direction of ['up','down','left','right']){
  assert.equal(data.pivots[direction].length,8,`${direction} needs eight static pivots`);
  assert.ok(Number.isInteger(data.idleFrames[direction]));
  for(const pivot of data.pivots[direction]){
    assert.ok(pivot.x>=0&&pivot.x<=1&&pivot.y>=0&&pivot.y<=1,'pivot must be normalized');
  }
}

const animator=PlayerAnimator.create(data,{stride:24});
let frame=animator.update({facing:'up',moving:true,movedDistance:0});
assert.equal(frame.frameIndex,0);
assert.equal(frame.row,1);
frame=animator.update({facing:'up',moving:true,movedDistance:23.9});
assert.equal(frame.frameIndex,0);
frame=animator.update({facing:'up',moving:true,movedDistance:.1});
assert.equal(frame.frameIndex,1,'24 world units must advance one frame');
frame=animator.update({facing:'up',moving:true,movedDistance:72});
assert.equal(frame.frameIndex,4,'96 cumulative units must reach frame 4');
const idle=animator.update({facing:'left',moving:false,movedDistance:0});
assert.equal(idle.frameIndex,data.idleFrames.left,'idle frame must be stable per direction');
assert.equal(idle.row,2);

const plane=WorldPlane.create(layout);
for(const direction of ['up','down','left','right']){
  const projection=plane.project({x:500,y:300});
  for(const pivot of data.pivots[direction]){
    const view=PlayerView.compute({projection,pivot});
    assert.equal(view.x,projection.x);assert.equal(view.y,projection.y);
    assert.equal(view.originX,pivot.x);assert.equal(view.originY,pivot.y);
    assert.equal(view.scale,projection.scale);
    assert.equal(view.shadowX,projection.x);assert.equal(view.shadowY,projection.y);
    assert.equal(view.depth,projection.depth+1);
    assert.equal(view.shadowDepth,projection.depth-1);
  }
}
const far=PlayerView.compute({projection:plane.project({x:500,y:60}),pivot:{x:.5,y:.985}});
const near=PlayerView.compute({projection:plane.project({x:500,y:540}),pivot:{x:.5,y:.985}});
assert.ok(far.scale<near.scale,'farther movement into dojo must render smaller');
assert.ok(far.depth<near.depth,'farther movement into dojo must sort behind near movement');

const sources=[dataPath,animatorPath,viewPath].map(p=>fs.readFileSync(p,'utf8')).join('\n');
for(const forbidden of ['getImageData','findDenseFootContact','buildUpGroundingMetrics','buildLeftGroundingMetrics','upFootContactOffsets'])assert.ok(!sources.includes(forbidden),`v2 must reject legacy runtime grounding: ${forbidden}`);
assert.doesNotMatch(sources,/ctx\.clip|scale\(-1\s*,\s*1\)/,'v2 must not mirror a clipped lower body');
console.log('PASS: Raishin v2 static animation metadata and single Ground Point view');
