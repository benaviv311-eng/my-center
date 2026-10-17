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
  for(const pivot of data.pivots[direction])assert.ok(pivot.x>=0&&pivot.x<=1&&pivot.y>=0&&pivot.y<=1,'pivot must be normalized');
}

const animator=PlayerAnimator.create(data,{stride:24});
let frame=animator.update({facing:'up',moving:true,movedDistance:0});
assert.equal(frame.frameIndex,0);assert.equal(frame.row,1);
frame=animator.update({facing:'up',moving:true,movedDistance:24});
assert.equal(frame.frameIndex,1,'24 world units must advance one frame');
const idle=animator.update({facing:'left',moving:false,movedDistance:0});
assert.equal(idle.frameIndex,data.idleFrames.left);assert.equal(idle.row,2);

const plane=WorldPlane.create(layout);
const projection=plane.project({x:1200,y:750});
for(const direction of ['up','down','left','right']){
  for(const pivot of data.pivots[direction]){
    const view=PlayerView.compute({projection,pivot,motion:{vx:0,vy:0,speedRatio:0}});
    assert.equal(view.x,projection.x);assert.equal(view.y,projection.y);
    assert.equal(view.originX,pivot.x);assert.equal(view.originY,pivot.y);
    assert.equal(view.scale,projection.scale);
    assert.equal(view.shadowX,projection.x);assert.equal(view.shadowY,projection.y);
    assert.equal('depth' in view,false,'PlayerView must not own render depth');
    assert.equal('shadowDepth' in view,false,'PlayerView must not own shadow render depth');
  }
}
const far=PlayerView.compute({projection:plane.project({x:1200,y:150}),pivot:{x:.5,y:.99}});
const near=PlayerView.compute({projection:plane.project({x:1200,y:1350}),pivot:{x:.5,y:.99}});
assert.ok(far.scale<near.scale,'farther movement into dojo must render smaller');

const sources=[dataPath,animatorPath,viewPath].map(p=>fs.readFileSync(p,'utf8')).join('\n');
for(const forbidden of ['getImageData','findDenseFootContact','buildUpGroundingMetrics','buildLeftGroundingMetrics','upFootContactOffsets','bobY'])assert.ok(!sources.includes(forbidden),`v2 must reject legacy runtime grounding: ${forbidden}`);
assert.doesNotMatch(sources,/ctx\.clip|scale\(-1\s*,\s*1\)/,'v2 must not mirror a clipped lower body');
console.log('PASS: Raishin v2 Ground Point view has no private depth ownership');
