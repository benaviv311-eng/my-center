const fs=require('fs');
const path=require('path');
const assert=require('assert');

const root=path.resolve(__dirname,'..');
const base=path.join(root,'raishin-legacy','src');
const layout=require(path.join(base,'world','dojo-layout.js'));
const WorldModel=require(path.join(base,'world','WorldModel.js'));
const WorldPlane=require(path.join(base,'world','WorldPlane.js'));
const CollisionMap=require(path.join(base,'world','CollisionMap.js'));
const PlayerController=require(path.join(base,'player','PlayerController.js'));
const PlayerAnimator=require(path.join(base,'player','PlayerAnimator.js'));
const PlayerView=require(path.join(base,'player','PlayerView.js'));
const animationData=require(path.join(base,'player','raika-animation-data.js'));
const CameraRig=require(path.join(base,'systems','CameraRig.js'));
const DepthSystem=require(path.join(base,'systems','DepthSystem.js'));
const InteractionSystem=require(path.join(base,'systems','InteractionSystem.js'));

const world=WorldModel.create(layout);
const plane=WorldPlane.create(layout);
const collision=CollisionMap.create(world);
const controller=PlayerController.createPlayerController({spawn:world.spawn});
const animator=PlayerAnimator.create(animationData,{stride:24});

function walk(input,count){
  let state;
  for(let i=0;i<count;i++){
    state=controller.step({input,dt:.05,resolveMotion:(current,proposed,radius)=>collision.resolveMotion(current,proposed,radius)});
    assert.equal(collision.isWalkable({x:state.worldX,y:state.worldY},controller.radius),true,'integrated movement must remain collision-safe');
  }
  const projection=plane.project({x:state.worldX,y:state.worldY});
  const animation=animator.update({facing:state.facing,moving:state.moving,movedDistance:state.movedDistance});
  const view=PlayerView.compute({projection,pivot:animation.pivot,motion:state});
  assert.equal(view.x,projection.x,'view X must remain the projected Ground Point');
  assert.equal(view.y,projection.y,'view Y must remain the projected Ground Point');
  assert.equal(view.shadowX,projection.x);assert.equal(view.shadowY,projection.y);
  return state;
}

for(const input of [{x:1,y:0},{x:0,y:1},{x:-1,y:0},{x:0,y:-1}])walk(input,12);

const far=plane.project({x:1200,y:300});
const middle=plane.project({x:1200,y:750});
const near=plane.project({x:1200,y:1200});
assert.ok(far.scale<middle.scale&&middle.scale<near.scale,'perspective scale must stay monotonic through integrated traversal');

const trainingBag=world.renderObjects.find(item=>item.id==='training-bag');
const bagProjection=plane.project({x:trainingBag.x,y:trainingBag.groundY});
const behindProjection=plane.project({x:trainingBag.x+180,y:trainingBag.groundY-90});
const frontProjection=plane.project({x:trainingBag.x+180,y:trainingBag.groundY+90});
const bagDepth=DepthSystem.depthFor(bagProjection,trainingBag.depthBias||0);
assert.ok(DepthSystem.depthFor(behindProjection,1)<bagDepth,'Raika behind a prop must sort behind it');
assert.ok(DepthSystem.depthFor(frontProjection,1)>bagDepth,'Raika in front of a prop must sort in front of it');

const camera=CameraRig.create({viewportWidth:1600,viewportHeight:900,worldBounds:world.renderBounds,zoom:1,deadZoneX:96,deadZoneY:54,smoothing:8,lookAheadX:120,lookAheadY:70});
const cameraStart=camera.reset(plane.project(world.spawn));
let cameraState=cameraStart;
const travelProjection=plane.project({x:2180,y:1200});
for(let i=0;i<180;i++)cameraState=camera.update({groundProjection:travelProjection,velocity:{x:210,y:0},dt:.016});
assert.ok(cameraState.scrollX-cameraStart.scrollX>500,'integrated camera must visibly traverse the world');
assert.ok(cameraState.scrollX>=world.renderBounds.x);
assert.ok(cameraState.scrollX<=world.renderBounds.x+world.renderBounds.width-1600+1e-6);

const interactions=InteractionSystem.create(world,plane);
const bagInteraction=world.interactions.find(item=>item.id==='training-bag');
for(const cameraSnapshot of [
  {scrollX:0,scrollY:0,zoom:1},
  {scrollX:900,scrollY:500,zoom:1.2},
  {scrollX:1800,scrollY:850,zoom:.9}
]){
  const nearest=interactions.nearest({x:bagInteraction.x,y:bagInteraction.y},160);
  assert.equal(nearest.id,'training-bag','nearest interaction must be independent of camera state');
  const projected=interactions.projectPrompt(nearest);
  const screenX=(projected.x-cameraSnapshot.scrollX)*cameraSnapshot.zoom;
  const screenY=(projected.y-cameraSnapshot.scrollY)*cameraSnapshot.zoom;
  assert.ok(Number.isFinite(screenX)&&Number.isFinite(screenY));
}

const sceneSource=fs.readFileSync(path.join(base,'scenes','DojoScene.js'),'utf8');
assert.match(sceneSource,/updateInteractionPrompt\s*\(/,'scene must update the world-space interaction prompt');
assert.match(sceneSource,/interactions\.nearest\(\{x:state\.worldX\s*,\s*y:state\.worldY\}/,'interaction lookup must use logical world coordinates');
assert.match(sceneSource,/\(promptProjection\.x-camera\.scrollX\)\*camera\.zoom/,'prompt X must be projected through camera scroll/zoom');
assert.match(sceneSource,/\(promptProjection\.y-camera\.scrollY\)\*camera\.zoom/,'prompt Y must be projected through camera scroll/zoom');
assert.match(sceneSource,/updateInteractionPrompt\(state\s*,\s*camera\)/,'scene update must refresh prompts after camera state is known');

console.log('PASS: Raishin v2 world-core movement, depth, camera and interactions integrate');
