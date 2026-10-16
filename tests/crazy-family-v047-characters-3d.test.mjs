import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

class Vec3 { constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;} set(x,y,z){this.x=x;this.y=y;this.z=z;return this;} }
class Euler { constructor(){this.x=0;this.y=0;this.z=0;} set(x,y,z){this.x=x;this.y=y;this.z=z;return this;} }
class Scale3 extends Vec3 { constructor(){super(1,1,1);} }
class Object3D { constructor(){this.children=[];this.position=new Vec3();this.rotation=new Euler();this.scale=new Scale3();this.userData={};this.visible=true;this.name='';} add(...nodes){for(const n of nodes){this.children.push(n);n.parent=this;}} traverse(fn){fn(this);for(const c of this.children)c.traverse(fn);} }
class Group extends Object3D {}
class Mesh extends Object3D { constructor(geometry,material){super();this.geometry=geometry;this.material=material;this.isMesh=true;this.castShadow=false;this.receiveShadow=false;} }
class Geometry { constructor(type){this.type=type;} dispose(){} }
class BoxGeometry extends Geometry { constructor(){super('BoxGeometry');} }
class SphereGeometry extends Geometry { constructor(){super('SphereGeometry');} }
class CylinderGeometry extends Geometry { constructor(){super('CylinderGeometry');} }
class CapsuleGeometry extends Geometry { constructor(){super('CapsuleGeometry');} }
class TorusGeometry extends Geometry { constructor(){super('TorusGeometry');} }
class MeshStandardMaterial { constructor(options={}){Object.assign(this,options);} dispose(){} }
const THREE={Group,Mesh,BoxGeometry,SphereGeometry,CylinderGeometry,CapsuleGeometry,TorusGeometry,MeshStandardMaterial};
globalThis.__THREE_STUB__=THREE;

const path=new URL('../crazy-family/characters-3d.js',import.meta.url);
const raw=await fs.readFile(path,'utf8');
assert.doesNotMatch(raw,/PlaneGeometry/,'native actors may not use PlaneGeometry');
const source=raw.replace("import * as THREE from 'three';","const THREE = globalThis.__THREE_STUB__;");
const mod=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
assert.equal(typeof mod.createCharacter3D,'function');

const scene=new Group();
const libi=mod.createCharacter3D({scene,kind:'libi'});
const dad=mod.createCharacter3D({scene,kind:'dad'});
assert.ok(libi.root instanceof Group);
assert.ok(dad.root instanceof Group);
assert.ok(scene.children.includes(libi.root)&&scene.children.includes(dad.root));

const geometryTypes=[];
libi.root.traverse(node=>{if(node.isMesh)geometryTypes.push(node.geometry?.type);});
dad.root.traverse(node=>{if(node.isMesh)geometryTypes.push(node.geometry?.type);});
assert.ok(geometryTypes.length>=18,'characters need multiple volumetric body meshes');
assert.ok(geometryTypes.every(type=>type&&type!=='PlaneGeometry'));
assert.ok(mod.CHARACTER_3D_PROFILES.dad.height>mod.CHARACTER_3D_PROFILES.libi.height,'Dad must be taller than Libi');

for(const required of ['torso','head','left-arm','right-arm','left-leg','right-leg','left-shoe','right-shoe']){
  let found=false;libi.root.traverse(node=>{if(node.name===required)found=true;});
  assert.equal(found,true,`Libi missing ${required}`);
}
assert.equal(libi.root.userData.identity,'libi');
assert.equal(dad.root.userData.identity,'dad');

libi.setTransform({position:{x:2,y:0.5,z:-3},facing:Math.PI/2,state:'run',speed:4,grounded:false});
assert.deepEqual({x:libi.root.position.x,y:libi.root.position.y,z:libi.root.position.z},{x:2,y:0.5,z:-3});
const scaleBefore=libi.root.scale.x;
libi.setTransform({position:{x:2,y:0.5,z:-3},facing:-Math.PI/2,state:'idle',speed:0,grounded:true});
assert.equal(libi.root.scale.x,scaleBefore,'facing may not flip scale.x');
assert.ok(Number.isFinite(libi.root.rotation.y));

const leftArm=libi.root.children.find(node=>node.name==='left-arm');
const before=leftArm.rotation.x;
libi.setTransform({position:{x:0,y:0,z:0},facing:0,state:'run',speed:5,grounded:true});
libi.update(0.016,500);
assert.notEqual(leftArm.rotation.x,before,'run update should animate limbs');
for(const state of ['jump','crouch','ground']){libi.setTransform({position:{x:0,y:0,z:0},facing:0,state,speed:0,grounded:state!=='jump'});libi.update(0.016,750);assert.ok(Number.isFinite(libi.root.rotation.y));}
for(const state of ['chase','sing','pant','yawn','sneeze']){dad.setTransform({position:{x:0,y:0,z:0},facing:0,state,speed:2,grounded:true});dad.update(0.016,900);assert.ok(Number.isFinite(dad.root.rotation.y));}

libi.dispose();dad.dispose();
assert.equal(scene.children.length,0,'dispose should detach actor roots');
console.log('v0.47 volumetric character tests passed');
