import test from 'node:test';
import assert from 'node:assert/strict';
import { createLivingRoomWorld } from '../../crazy-family/world.js';
import { createLivingRoomArt } from '../../crazy-family/living-room-art.js';

class V3{constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}clone(){return new V3(this.x,this.y,this.z);}}
class Euler extends V3{}
class Obj{constructor(){this.children=[];this.position=new V3();this.rotation=new Euler();this.scale=new V3(1,1,1);this.userData={};this.name='';this.visible=true;}add(...nodes){for(const n of nodes){this.children.push(n);n.parent=this;}return this;}traverse(fn){fn(this);for(const c of this.children)c.traverse?c.traverse(fn):fn(c);}}
class Group extends Obj{}
class Attr{constructor(points){this.points=points;this.count=points.length;}getX(i){return this.points[i][0];}getY(i){return this.points[i][1];}getZ(i){return this.points[i][2];}setXYZ(i,x,y,z){this.points[i]=[x,y,z];}}
class Geometry{constructor(type='Geometry'){this.type=type;this.isBufferGeometry=true;this.disposed=false;}dispose(){this.disposed=true;}computeVertexNormals(){}computeBoundingBox(){}}
class BoxGeometry extends Geometry{constructor(w=1,h=1,d=1){super('BoxGeometry');const xs=[-w/2,0,w/2],ys=[-h/2,0,h/2],zs=[-d/2,0,d/2],p=[];for(const x of xs)for(const y of ys)for(const z of zs)p.push([x,y,z]);this.attributes={position:new Attr(p)};}}
class SphereGeometry extends Geometry{constructor(){super('SphereGeometry');}}
class CylinderGeometry extends Geometry{constructor(){super('CylinderGeometry');}}
class TorusGeometry extends Geometry{constructor(){super('TorusGeometry');}}
class Mesh extends Obj{constructor(geometry,material){super();this.geometry=geometry;this.material=material;this.isMesh=true;this.castShadow=false;this.receiveShadow=false;}}
const THREE={Group,Mesh,BoxGeometry,SphereGeometry,CylinderGeometry,TorusGeometry};
const materials={get:(name)=>({name,isMeshStandardMaterial:true})};

function meshCount(root){let count=0;root.traverse(n=>{if(n.isMesh)count++;});return count;}
function createWorldWithUnknown(){const world=createLivingRoomWorld();const unknown={id:'mystery-stool',kind:'dressing',x:3.8,y:.25,z:3.25,width:.7,height:.5,depth:.7};return{...world,renderables:[...world.renderables,unknown]};}

test('final art registry builds semantic multi-part living room assemblies', async()=>{
  const world=createWorldWithUnknown();
  const art=await createLivingRoomArt({THREE,world,materials});
  for(const id of ['floor','wall-north','wall-south','wall-east','wall-west','sofa','coffee-table','rug','side-table','lamp','cushion-a','cushion-b','toy-blocks','toy-ball','doorway','mystery-stool']){
    const root=art.objectsById.get(id);assert.ok(root,`missing ${id}`);assert.equal(root.name,id);assert.equal(root.userData.semanticId,id);assert.equal(root.userData.artMode,'stylized-final-v1');assert.ok(root.userData.baseTransform,`${id} baseTransform`);
  }
  const sofa=art.objectsById.get('sofa');assert.ok(meshCount(sofa)>=14,'sofa should have cushions, arms, body and visible feet');assert.notEqual(sofa.isMesh,true,'sofa semantic root must be a group, not one mesh');
  assert.ok(meshCount(art.objectsById.get('coffee-table'))>=4);assert.ok(meshCount(art.objectsById.get('side-table'))>=3);assert.ok(meshCount(art.objectsById.get('lamp'))>=4);assert.ok(meshCount(art.objectsById.get('doorway'))>=3);
  const cushionA=art.objectsById.get('cushion-a'),cushionB=art.objectsById.get('cushion-b');assert.notEqual(cushionA,cushionB);assert.ok(cushionA.children[0].position.y>.2);assert.ok(cushionB.children[0].position.y>.2);
  assert.ok(meshCount(art.objectsById.get('mystery-stool'))>=1,'unknown renderables need fallback art');
  const dressingIds=art.dressingRoot.children.map(child=>child.name);
  for(const id of ['dressing-books','dressing-basket','dressing-frame','dressing-window','dressing-console','dressing-plant'])assert.ok(dressingIds.includes(id),`missing ${id}`);
  assert.ok(art.dressingRoot.children.length>=6);
  for(const dressing of art.dressingRoot.children){assert.match(dressing.name,/^dressing-/);assert.equal(world.colliders.some(c=>c.id===dressing.name),false);assert.equal(world.interactables.some(i=>i.id===dressing.name),false);}
  art.dispose();
});

test('future asset resolver falls back safely and normalizes successful assets', async()=>{
  const world=createLivingRoomWorld();
  const external=new THREE.Group();
  const art=await createLivingRoomArt({THREE,world,materials,resolveAsset:async(id)=>{
    if(id==='sofa')return null;
    if(id==='coffee-table')throw new Error('asset unavailable');
    if(id==='side-table')return external;
    return null;
  }});
  assert.ok(meshCount(art.objectsById.get('sofa'))>=14,'null asset must use procedural sofa');
  assert.ok(meshCount(art.objectsById.get('coffee-table'))>=4,'thrown asset must use procedural table');
  assert.ok(art.root.userData.assetFallbacks.some(entry=>entry.id==='coffee-table'&&/asset unavailable/.test(entry.message)));
  assert.equal(art.objectsById.get('side-table'),external);assert.equal(external.name,'side-table');assert.equal(external.userData.semanticId,'side-table');assert.equal(external.userData.artMode,'stylized-final-v1');assert.ok(external.userData.baseTransform);
  art.dispose();
});
