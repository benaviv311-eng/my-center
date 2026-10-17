const fs=require('fs');
const path=require('path');
const assert=require('assert');

const root=path.resolve(__dirname,'..');
const worldModelPath=path.join(root,'raishin-legacy','src','world','WorldModel.js');
const layoutPath=path.join(root,'raishin-legacy','src','world','dojo-layout.js');
assert.ok(fs.existsSync(worldModelPath),'WorldModel module must exist');
assert.ok(fs.existsSync(layoutPath),'dojo layout module must exist');

const WorldModel=require(worldModelPath);
const layout=require(layoutPath);
assert.equal(typeof WorldModel.create,'function','WorldModel.create must exist');
assert.equal(layout.WORLD_WIDTH,2400,'dojo world width must be 2400 logical units');
assert.equal(layout.WORLD_HEIGHT,1500,'dojo world height must be 1500 logical units');

const world=WorldModel.create(layout);
assert.equal(world.width,2400);
assert.equal(world.height,1500);
assert.ok(world.spawn&&Number.isFinite(world.spawn.x)&&Number.isFinite(world.spawn.y),'world must expose a numeric spawn');
assert.ok(Array.isArray(world.walkablePolygons)&&world.walkablePolygons.length>=1,'world must expose at least one walkable polygon');
assert.ok(world.walkablePolygons.some(poly=>Array.isArray(poly)&&poly.length>=3),'walkable polygon must contain at least three points');
assert.ok(Array.isArray(world.solids)&&world.solids.some(item=>item.type==='circle'),'world must include circle collision primitives');
assert.ok(world.solids.some(item=>item.type==='rect'||item.type==='obox'),'world must include rectangle collision primitives');
assert.ok(Array.isArray(world.renderObjects)&&world.renderObjects.length>=5,'world must expose semantic render objects');
const layers=new Set(world.renderObjects.map(item=>item.layer));
for(const layer of ['rear','floor','prop','foreground'])assert.ok(layers.has(layer),`missing render layer: ${layer}`);
const interactionIds=world.interactions.map(item=>item.id);
assert.deepStrictEqual(interactionIds,['training-bag','weapons-wall','training-center','courtyard-exit','seika-point']);
assert.ok(world.renderBounds&&world.renderBounds.width>1600&&world.renderBounds.height>=900,'render bounds must exceed one viewport');

function pointInPolygon(point,polygon){
  let inside=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
    const a=polygon[i],b=polygon[j];
    const hit=((a.y>point.y)!==(b.y>point.y))&&(point.x<(b.x-a.x)*(point.y-a.y)/(b.y-a.y)+a.x);
    if(hit)inside=!inside;
  }
  return inside;
}
assert.ok(world.walkablePolygons.some(poly=>pointInPolygon(world.spawn,poly)),'spawn must be inside a walkable polygon');
assert.doesNotMatch(fs.readFileSync(worldModelPath,'utf8'),/Phaser|canvas|sprite/i,'WorldModel must remain renderer-independent');
console.log('PASS: Raishin v2 explorable dojo world model');
