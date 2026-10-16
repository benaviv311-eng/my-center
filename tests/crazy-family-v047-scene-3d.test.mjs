import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

class Vec3 { constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;} set(x,y,z){this.x=x;this.y=y;this.z=z;return this;} }
class Euler { constructor(){this.x=0;this.y=0;this.z=0;} set(x,y,z){this.x=x;this.y=y;this.z=z;return this;} }
class Scale3 extends Vec3 { constructor(){super(1,1,1);} }
class Object3D { constructor(){this.children=[];this.position=new Vec3();this.rotation=new Euler();this.scale=new Scale3();this.userData={};this.name='';this.parent=null;} add(...nodes){for(const n of nodes){this.children.push(n);n.parent=this;}} remove(node){const i=this.children.indexOf(node);if(i>=0)this.children.splice(i,1);node.parent=null;} traverse(fn){fn(this);for(const c of this.children)c.traverse?.(fn);} }
class Scene extends Object3D { constructor(){super();this.background=null;} }
class Group extends Object3D {}
class PerspectiveCamera extends Object3D { constructor(fov=50,aspect=1,near=.1,far=100){super();this.isPerspectiveCamera=true;this.fov=fov;this.aspect=aspect;this.near=near;this.far=far;this.projectionUpdates=0;this.lastLookAt=null;} updateProjectionMatrix(){this.projectionUpdates++;} lookAt(x,y,z){if(typeof x==='object')this.lastLookAt={x:x.x,y:x.y,z:x.z};else this.lastLookAt={x,y,z};} }
class Mesh extends Object3D { constructor(geometry,material){super();this.geometry=geometry;this.material=material;this.isMesh=true;this.castShadow=false;this.receiveShadow=false;} }
class Geometry { constructor(type){this.type=type;} dispose(){} }
class BoxGeometry extends Geometry { constructor(...args){super('BoxGeometry');this.args=args;} }
class MeshStandardMaterial { constructor(options={}){Object.assign(this,options);} dispose(){} }
class HemisphereLight extends Object3D { constructor(sky,ground,intensity){super();this.skyColor=sky;this.groundColor=ground;this.intensity=intensity;this.isHemisphereLight=true;} }
class DirectionalLight extends Object3D { constructor(color,intensity){super();this.color=color;this.intensity=intensity;this.castShadow=false;this.isDirectionalLight=true;} }
class Color { constructor(value){this.value=value;} }
class WebGLRenderer { constructor(options={}){this.options=options;this.shadowMap={enabled:false,type:null};this.size=null;this.pixelRatio=1;this.renderCalls=0;this.disposed=false;} setPixelRatio(v){this.pixelRatio=v;} setSize(w,h,style){this.size={w,h,style};} render(scene,camera){this.renderCalls++;this.lastRender={scene,camera};} dispose(){this.disposed=true;} }
const THREE={Scene,Group,PerspectiveCamera,Mesh,BoxGeometry,MeshStandardMaterial,HemisphereLight,DirectionalLight,Color,WebGLRenderer,SRGBColorSpace:'srgb',ACESFilmicToneMapping:'aces',PCFSoftShadowMap:'soft'};
globalThis.__THREE_STUB__=THREE;

const path=new URL('../crazy-family/scene-3d.js',import.meta.url);
const raw=await fs.readFile(path,'utf8');
assert.doesNotMatch(raw,/cinematic-projection/,'native scene cannot import cinematic projection');
assert.doesNotMatch(raw,/OrthographicCamera/,'native scene cannot use an orthographic camera');
const source=raw.replace("import * as THREE from 'three';","const THREE = globalThis.__THREE_STUB__;");
const mod=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
assert.equal(typeof mod.createLivingRoomScene3D,'function');

const canvas={};
const world={bounds:{minX:-6,maxX:6,minZ:-4.6,maxZ:4.6}};
const handle=mod.createLivingRoomScene3D({canvas,world});
assert.ok(handle.camera instanceof PerspectiveCamera,'native scene needs PerspectiveCamera');
assert.ok(handle.characterLayer instanceof Group,'native scene needs character layer');
assert.ok(handle.scene.children.includes(handle.characterLayer));

let floor=null,hemi=null,key=null;
handle.scene.traverse(node=>{
  if(node.name==='native3d-floor')floor=node;
  if(node.isHemisphereLight)hemi=node;
  if(node.name==='native3d-warm-key')key=node;
});
assert.ok(floor&&floor.isMesh,'native scene needs a real floor mesh');
assert.equal(floor.receiveShadow,true,'floor must receive actor shadows');
assert.ok(hemi,'native scene needs hemisphere fill');
assert.ok(key&&key.isDirectionalLight,'native scene needs warm directional key');
assert.equal(key.castShadow,true,'directional key must cast shadows');
assert.equal(handle.renderer.shadowMap.enabled,true,'renderer shadows must be enabled');

handle.resize(960,0);
assert.equal(handle.renderer.size.w,960);
assert.equal(handle.renderer.size.h,1,'zero height must clamp to one pixel');
assert.ok(Number.isFinite(handle.camera.aspect)&&handle.camera.aspect>0);
const updatesBefore=handle.camera.projectionUpdates;
handle.applyCameraPose({position:{x:1,y:3,z:5},target:{x:0,y:1,z:0},fov:53});
assert.deepEqual({x:handle.camera.position.x,y:handle.camera.position.y,z:handle.camera.position.z},{x:1,y:3,z:5});
assert.deepEqual(handle.camera.lastLookAt,{x:0,y:1,z:0});
assert.equal(handle.camera.fov,53);
assert.ok(handle.camera.projectionUpdates>updatesBefore);
handle.render();
assert.equal(handle.renderer.renderCalls,1);
handle.dispose();
assert.equal(handle.renderer.disposed,true);

console.log('v0.47 native scene tests passed');
