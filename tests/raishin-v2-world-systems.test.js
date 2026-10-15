const fs=require('fs');
const path=require('path');
const assert=require('assert');

const root=path.resolve(__dirname,'..');
const dir=path.join(root,'raishin-legacy','src');
const collisionPath=path.join(dir,'world','CollisionMap.js');
const interactionPath=path.join(dir,'systems','InteractionSystem.js');
assert.ok(fs.existsSync(collisionPath),'CollisionMap module must exist');
assert.ok(fs.existsSync(interactionPath),'InteractionSystem module must exist');

const layout=require(path.join(dir,'world','dojo-layout.js'));
const WorldPlane=require(path.join(dir,'world','WorldPlane.js'));
const CollisionMap=require(collisionPath);
const InteractionSystem=require(interactionPath);

assert.deepStrictEqual(layout.bounds,{minX:35,maxX:965,minY:45,maxY:575});
assert.deepStrictEqual(layout.obstacles.map(o=>o.id),['training-bag','left-column','right-column']);
assert.deepStrictEqual(layout.interactions.map(i=>i.id),['training-bag','weapons-wall','training-center','courtyard-exit','seika-point']);

const collision=CollisionMap.create(layout);
assert.equal(collision.isWalkable({x:500,y:300},24),true,'center floor must be walkable');
assert.equal(collision.isWalkable({x:500,y:60},24),false,'rear wall margin must block the player footprint');
assert.equal(collision.isWalkable({x:36,y:300},24),false,'left bound must include player radius');
assert.equal(collision.isWalkable({x:150,y:220},24),false,'training bag footprint must collide');
assert.equal(collision.isWalkable({x:90,y:330},24),false,'left column footprint must collide');
assert.equal(collision.isWalkable({x:910,y:330},24),false,'right column footprint must collide');

const slide=collision.resolveMotion({x:220,y:220},{x:150,y:260},24);
assert.notDeepStrictEqual(slide,{x:150,y:260},'blocked diagonal motion must not enter obstacle');
assert.ok(slide.x===220||slide.y===220,'blocked diagonal motion should preserve one legal axis');
assert.equal(collision.isWalkable(slide,24),true,'resolved slide must be legal');

let p={x:500,y:420};
for(let i=0;i<200;i++)p=collision.resolveMotion(p,{x:p.x,y:p.y-4},24);
assert.ok(p.y>=layout.bounds.minY+24,'holding UP must stop before rear wall footprint margin');
assert.ok(p.y<420,'holding UP must still travel into dojo depth');

const plane=WorldPlane.create(layout);
const interactions=InteractionSystem.create(layout,plane);
assert.deepStrictEqual(interactions.items.map(i=>i.id),['training-bag','weapons-wall','training-center','courtyard-exit','seika-point']);
assert.equal(interactions.nearest({x:150,y:220},140).id,'training-bag');
assert.equal(interactions.nearest({x:500,y:270},140).id,'training-center');
assert.equal(interactions.nearest({x:10,y:590},30),null);
const prompt=interactions.projectPrompt(layout.interactions[1]);
assert.deepStrictEqual(prompt,plane.project({x:780,y:70}),'prompt projection must come from WorldPlane');

const sources=fs.readFileSync(collisionPath,'utf8')+fs.readFileSync(interactionPath,'utf8');
assert.doesNotMatch(sources,/sprite|getImageData|screen polygon/i,'world systems must not depend on character art');
console.log('PASS: Raishin v2 world-space collision and interaction systems');
