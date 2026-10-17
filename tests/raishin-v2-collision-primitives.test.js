const fs=require('fs');
const path=require('path');
const assert=require('assert');

const root=path.resolve(__dirname,'..');
const collisionPath=path.join(root,'raishin-legacy','src','world','CollisionMap.js');
const CollisionMap=require(collisionPath);

const world=Object.freeze({
  walkablePolygons:Object.freeze([Object.freeze([
    Object.freeze({x:0,y:0}),Object.freeze({x:1000,y:0}),Object.freeze({x:1000,y:1000}),Object.freeze({x:0,y:1000})
  ])]),
  solids:Object.freeze([
    Object.freeze({id:'circle',type:'circle',x:200,y:200,radius:40}),
    Object.freeze({id:'rect',type:'rect',x:420,y:420,width:100,height:80}),
    Object.freeze({id:'obox',type:'obox',x:720,y:720,width:120,height:60,rotation:Math.PI/4}),
    Object.freeze({id:'thin-wall',type:'rect',x:500,y:650,width:20,height:260})
  ])
});

const collision=CollisionMap.create(world);
assert.equal(collision.isWalkable({x:500,y:200},20),true,'open floor must be walkable');
assert.equal(collision.isWalkable({x:10,y:500},20),false,'player radius must stay inside polygon edge');
assert.equal(collision.isWalkable({x:200,y:200},20),false,'circle primitive must block');
assert.equal(collision.isWalkable({x:420,y:420},20),false,'rect primitive must block');
assert.equal(collision.isWalkable({x:720,y:720},20),false,'oriented rect primitive must block');
assert.equal(collision.isWalkable({x:320,y:420},20),true,'space beyond rect + player radius must remain clear');

const slide=collision.resolveMotion({x:300,y:200},{x:170,y:280},20);
assert.notDeepStrictEqual(slide,{x:170,y:280},'blocked diagonal motion must not enter circle');
assert.ok(slide.x===300||slide.y===200,'blocked diagonal motion must slide along one legal axis');
assert.equal(collision.isWalkable(slide,20),true,'resolved slide must stay legal');

const tunnelStart={x:400,y:650};
const tunnelEnd={x:600,y:650};
assert.equal(collision.isWalkable(tunnelStart,10),true);
assert.equal(collision.isWalkable(tunnelEnd,10),true,'endpoint beyond thin wall is independently legal');
const tunnelResolved=collision.resolveMotion(tunnelStart,tunnelEnd,10);
assert.ok(tunnelResolved.x<480,'swept movement must not tunnel through a thin rectangle');
assert.equal(collision.isWalkable(tunnelResolved,10),true);

let corner={x:900,y:900};
for(let i=0;i<30;i++){
  const next=collision.resolveMotion(corner,{x:corner.x+25,y:corner.y+25},20);
  assert.equal(collision.isWalkable(next,20),true,'repeated diagonal corner pressure must stay legal');
  corner=next;
}
assert.ok(corner.x<=980&&corner.y<=980,'corner movement must respect footprint radius');

const source=fs.readFileSync(collisionPath,'utf8');
assert.doesNotMatch(source,/Phaser|sprite|camera|screen|canvas|getImageData/i,'CollisionMap must remain world-space pure logic');
console.log('PASS: Raishin v2 collision primitives and swept motion');
