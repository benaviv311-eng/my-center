const fs=require('fs');
const path=require('path');
const assert=require('assert');

const root=path.resolve(__dirname,'..');
const dir=path.join(root,'raishin-legacy','src');
const collisionPath=path.join(dir,'world','CollisionMap.js');
const interactionPath=path.join(dir,'systems','InteractionSystem.js');
const modelPath=path.join(dir,'world','WorldModel.js');
assert.ok(fs.existsSync(collisionPath),'CollisionMap module must exist');
assert.ok(fs.existsSync(interactionPath),'InteractionSystem module must exist');
assert.ok(fs.existsSync(modelPath),'WorldModel module must exist');

const layout=require(path.join(dir,'world','dojo-layout.js'));
const WorldModel=require(modelPath);
const WorldPlane=require(path.join(dir,'world','WorldPlane.js'));
const CollisionMap=require(collisionPath);
const InteractionSystem=require(interactionPath);
const world=WorldModel.create(layout);

assert.deepStrictEqual(world.interactions.map(i=>i.id),['training-bag','weapons-wall','training-center','courtyard-exit','seika-point']);
assert.deepStrictEqual(world.solids.map(o=>o.id),['training-bag','left-column','right-column','weapons-rack']);

const collision=CollisionMap.create(world);
assert.equal(collision.isWalkable(world.spawn,24),true,'spawn floor must be walkable');
assert.equal(collision.isWalkable({x:1200,y:120},24),false,'rear polygon edge must block player footprint');
assert.equal(collision.isWalkable({x:20,y:900},24),false,'left polygon edge must include player radius');
for(const solid of world.solids)assert.equal(collision.isWalkable({x:solid.x,y:solid.y},24),false,`${solid.id} footprint must collide`);

const slide=collision.resolveMotion({x:300,y:600},{x:380,y:650},24);
assert.notDeepStrictEqual(slide,{x:380,y:650},'blocked diagonal motion must not enter training bag');
assert.ok(slide.x===300||slide.y===600,'blocked diagonal motion should preserve one legal axis');
assert.equal(collision.isWalkable(slide,24),true,'resolved slide must be legal');

let p={...world.spawn};
for(let i=0;i<120;i++)p=collision.resolveMotion(p,{x:p.x,y:p.y-20},24);
assert.ok(p.y>=180,'holding UP must stop before rear walkable edge plus footprint radius');
assert.ok(p.y<world.spawn.y,'holding UP must still travel deeply into dojo');
assert.equal(collision.isWalkable(p,24),true);

const plane=WorldPlane.create(layout);
const interactions=InteractionSystem.create(layout,plane);
assert.deepStrictEqual(interactions.items.map(i=>i.id),['training-bag','weapons-wall','training-center','courtyard-exit','seika-point']);
const bag=layout.interactions.find(item=>item.id==='training-bag');
const center=layout.interactions.find(item=>item.id==='training-center');
assert.equal(interactions.nearest({x:bag.x,y:bag.y},140).id,'training-bag');
assert.equal(interactions.nearest({x:center.x,y:center.y},140).id,'training-center');
assert.equal(interactions.nearest({x:-100,y:-100},30),null);
const weapons=layout.interactions.find(item=>item.id==='weapons-wall');
const prompt=interactions.projectPrompt(weapons);
assert.deepStrictEqual(prompt,plane.project({x:weapons.x,y:weapons.y}),'prompt projection must come from WorldPlane');

const sources=fs.readFileSync(collisionPath,'utf8')+fs.readFileSync(interactionPath,'utf8');
assert.doesNotMatch(sources,/Phaser|sprite|getImageData|camera|screen polygon|canvas/i,'world systems must remain render-independent');
console.log('PASS: Raishin v2 world-space collision and interaction systems');
