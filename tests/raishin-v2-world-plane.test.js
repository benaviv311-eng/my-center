const fs=require('fs');
const path=require('path');
const assert=require('assert');

const root=path.resolve(__dirname,'..');
const planePath=path.join(root,'raishin-legacy','src','world','WorldPlane.js');
const layoutPath=path.join(root,'raishin-legacy','src','world','dojo-layout.js');
const WorldPlane=require(planePath);
const layout=require(layoutPath);

assert.equal(layout.WORLD_WIDTH,2400);
assert.equal(layout.WORLD_HEIGHT,1500);
assert.deepStrictEqual(layout.floor.farLeft,{x:300,y:360});
assert.deepStrictEqual(layout.floor.farRight,{x:3300,y:360});
assert.deepStrictEqual(layout.floor.nearLeft,{x:0,y:1600});
assert.deepStrictEqual(layout.floor.nearRight,{x:3600,y:1600});
assert.equal(layout.floor.farScale,.72);
assert.equal(layout.floor.nearScale,1.1);

const plane=WorldPlane.create(layout);
function close(actual,expected,epsilon=1e-9){assert.ok(Math.abs(actual-expected)<=epsilon,`${actual} !== ${expected}`);}
for(const [world,expected] of [
  [{x:0,y:0},{x:300,y:360,scale:.72,depth:360}],
  [{x:2400,y:0},{x:3300,y:360,scale:.72,depth:360}],
  [{x:0,y:1500},{x:0,y:1600,scale:1.1,depth:1600}],
  [{x:2400,y:1500},{x:3600,y:1600,scale:1.1,depth:1600}],
  [{x:1200,y:750},{x:1800,y:980,scale:.91,depth:980}]
]){
  const projected=plane.project(world);
  for(const key of ['x','y','scale','depth'])close(projected[key],expected[key]);
}

const far=plane.project({x:1200,y:150});
const middle=plane.project({x:1200,y:750});
const near=plane.project({x:1200,y:1350});
assert.ok(far.y<middle.y&&middle.y<near.y,'render Y must increase continuously toward the camera');
assert.ok(far.scale<middle.scale&&middle.scale<near.scale,'perspective scale must increase continuously toward the camera');
for(const world of [{x:0,y:0},{x:1200,y:750},{x:2100,y:1300},{x:2400,y:1500},{x:400,y:1120}]){
  const roundTrip=plane.unproject(plane.project(world));
  close(roundTrip.x,world.x,1e-7);close(roundTrip.y,world.y,1e-7);
}
assert.equal(plane.contains({x:1200,y:750},24),true);
assert.equal(plane.contains({x:10,y:750},24),false);
assert.equal(plane.contains({x:2390,y:1490},24),false);
assert.doesNotMatch(fs.readFileSync(planePath,'utf8'),/Phaser|getImageData|canvas|camera/i,'WorldPlane must stay pure math and camera-independent');
console.log('PASS: Raishin v2 full-world perspective plane');
