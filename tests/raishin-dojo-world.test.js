const assert=require('assert'),path=require('path');
const world=require(path.join(__dirname,'..','raishin-legacy','dojo-world.js'));
assert.strictEqual(world.WORLD_WIDTH,1600);assert.strictEqual(world.WORLD_HEIGHT,900);
assert.strictEqual(world.isWalkable({x:800,y:650}),true,'center floor should be walkable');
assert.strictEqual(world.isWalkable({x:30,y:100}),false,'outside room must not be walkable');
for(const p of [{x:360,y:560},{x:1240,y:395},{x:250,y:455},{x:800,y:405}]) assert.strictEqual(world.isWalkable(p,24),false,`obstacle should block ${JSON.stringify(p)}`);
const resolved=world.resolvePlayerMotion({x:520,y:565},{x:360,y:560},24);assert.ok(resolved.x===520||resolved.y===565,'diagonal collision should preserve one valid axis');assert.notDeepStrictEqual(resolved,{x:360,y:560});
assert.deepStrictEqual(world.INTERACTIONS.map(x=>x.id),['training-bag','weapons-wall','training-center','courtyard-exit','seika-point']);
assert.strictEqual(world.nearestInteraction({x:350,y:650},180).id,'training-bag');
assert.strictEqual(world.nearestInteraction({x:800,y:650},180).id,'training-center');
assert.strictEqual(world.nearestInteraction({x:50,y:850},50),null);
for(const p of [{x:-100,y:2000},{x:800,y:650},{x:1800,y:-50}]){const m=world.worldToMinimap(p);assert.ok(m.x>=0&&m.x<=1&&m.y>=0&&m.y<=1);}
console.log('PASS: Inazuma dojo world geometry');
