const fs=require('fs');
const path=require('path');
const assert=require('assert');

const root=path.resolve(__dirname,'..');
const planePath=path.join(root,'raishin-legacy','src','world','WorldPlane.js');
const layoutPath=path.join(root,'raishin-legacy','src','world','dojo-layout.js');
assert.ok(fs.existsSync(planePath),'WorldPlane module must exist');
assert.ok(fs.existsSync(layoutPath),'dojo layout module must exist');

const WorldPlane=require(planePath);
const layout=require(layoutPath);
assert.equal(layout.WORLD_WIDTH,1000);
assert.equal(layout.WORLD_HEIGHT,600);
assert.deepStrictEqual(layout.floor.farLeft,{x:430,y:585});
assert.deepStrictEqual(layout.floor.farRight,{x:1170,y:585});
assert.deepStrictEqual(layout.floor.nearLeft,{x:165,y:835});
assert.deepStrictEqual(layout.floor.nearRight,{x:1435,y:835});
assert.equal(layout.floor.farScale,.72);
assert.equal(layout.floor.nearScale,1.06);

const plane=WorldPlane.create(layout);
function close(actual,expected,epsilon=1e-9){assert.ok(Math.abs(actual-expected)<=epsilon,`${actual} !== ${expected}`);}
for(const [world,expected] of [
  [{x:0,y:0},{x:430,y:585,scale:.72,depth:585}],
  [{x:1000,y:0},{x:1170,y:585,scale:.72,depth:585}],
  [{x:0,y:600},{x:165,y:835,scale:1.06,depth:835}],
  [{x:1000,y:600},{x:1435,y:835,scale:1.06,depth:835}],
  [{x:500,y:300},{x:800,y:710,scale:.89,depth:710}]
]){
  const projected=plane.project(world);
  for(const key of ['x','y','scale','depth'])close(projected[key],expected[key]);
}

const far=plane.project({x:500,y:60});
const near=plane.project({x:500,y:540});
assert.ok(far.y<near.y,'deeper/farther world point must render higher');
assert.ok(far.scale<near.scale,'deeper/farther world point must render smaller');
for(const world of [{x:0,y:0},{x:500,y:300},{x:900,y:520},{x:1000,y:600}]){
  const roundTrip=plane.unproject(plane.project(world));
  close(roundTrip.x,world.x,1e-7);close(roundTrip.y,world.y,1e-7);
}
assert.equal(plane.contains({x:500,y:300},24),true);
assert.equal(plane.contains({x:10,y:300},24),false);
assert.equal(plane.contains({x:990,y:590},24),false);
assert.doesNotMatch(fs.readFileSync(planePath,'utf8'),/Phaser|getImageData|canvas/i,'WorldPlane must stay pure math');
console.log('PASS: Raishin v2 calibrated perspective world plane');
