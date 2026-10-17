import test from 'node:test';
import assert from 'node:assert/strict';
import { createLivingRoomWorld } from '../../crazy-family/world.js';
import { createLivingRoomLighting } from '../../crazy-family/living-room-lighting.js';

class V3{constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}}
class Obj{constructor(){this.children=[];this.position=new V3();this.name='';this.userData={};}add(...nodes){this.children.push(...nodes);return this;}remove(node){this.children=this.children.filter(n=>n!==node);}traverse(fn){fn(this);for(const c of this.children)c.traverse?c.traverse(fn):fn(c);}}
class Group extends Obj{}
class HemisphereLight extends Obj{constructor(sky,ground,intensity){super();this.isHemisphereLight=true;this.color=sky;this.groundColor=ground;this.intensity=intensity;}}
class DirectionalLight extends Obj{constructor(color,intensity){super();this.isDirectionalLight=true;this.color=color;this.intensity=intensity;this.castShadow=false;this.shadow={mapSize:{width:0,height:0,set:(w,h)=>{this.shadow.mapSize.width=w;this.shadow.mapSize.height=h;}},camera:{}};}}
class PointLight extends Obj{constructor(color,intensity,distance,decay){super();this.isPointLight=true;this.color=color;this.intensity=intensity;this.distance=distance;this.decay=decay;this.castShadow=false;}}
const THREE={Group,HemisphereLight,DirectionalLight,PointLight};

function fakeScene(){const scene=new Group();return scene;}

test('final art lighting uses one warm fixed key, one ambient fill and one local lamp light',()=>{
  const scene=fakeScene(),world=createLivingRoomWorld();
  const rig=createLivingRoomLighting({THREE,scene,world,quality:'high'});
  const nodes=[];rig.root.traverse(n=>nodes.push(n));
  assert.equal(nodes.filter(n=>n.isHemisphereLight).length,1);
  assert.equal(nodes.filter(n=>n.isDirectionalLight).length,1);
  assert.equal(nodes.filter(n=>n.isPointLight).length,1);
  assert.equal(rig.keyLight.name,'living-room-key');assert.equal(rig.keyLight.castShadow,true);assert.equal(rig.keyLight.shadow.mapSize.width,1024);assert.equal(rig.keyLight.shadow.mapSize.height,1024);
  assert.equal(rig.lampLight.name,'living-room-lamp-light');assert.equal(rig.lampLight.castShadow,false);assert.ok(Number.isFinite(rig.lampLight.intensity)&&rig.lampLight.intensity>0);assert.ok(Number.isFinite(rig.lampLight.distance)&&rig.lampLight.distance>0);
  const lamp=world.objects.find(o=>o.id==='lamp');assert.equal(rig.lampLight.position.x,lamp.x);assert.equal(rig.lampLight.position.z,lamp.z);
  assert.doesNotThrow(()=>rig.dispose());assert.doesNotThrow(()=>rig.dispose());
});

test('medium quality lowers only the key shadow budget and keeps lighting fixed in world space',()=>{
  const scene=fakeScene(),world=createLivingRoomWorld();
  const rig=createLivingRoomLighting({THREE,scene,world,quality:'medium'});
  assert.equal(rig.keyLight.shadow.mapSize.width,512);assert.equal(rig.keyLight.shadow.mapSize.height,512);
  assert.ok(Number.isFinite(rig.keyLight.position.x)&&Number.isFinite(rig.keyLight.position.y)&&Number.isFinite(rig.keyLight.position.z));
  assert.equal('camera' in rig.root.userData,false);assert.equal('player' in rig.root.userData,false);
  rig.dispose();
});
