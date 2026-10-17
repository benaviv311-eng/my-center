import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createLivingRoomWorld } from '../../crazy-family/world.js';
import { createScenario, applyScenarioToWorld } from '../../crazy-family/scenario.js';

function blockerSnapshot(world){
  return world.colliders
    .filter(({id})=>['sofa','coffee-table','side-table'].includes(id))
    .map(({id,x,z,width,depth,height})=>({id,x,z,width,depth,height}))
    .sort((a,b)=>a.id.localeCompare(b.id));
}

test('cinematic rewrite keeps canonical Libi and Dad assets',async()=>{
  const source=await fs.readFile(new URL('../../crazy-family/character-canon.js',import.meta.url),'utf8');
  assert.match(source,/asset:\s*'assets\/libi-sprites-v025\.png'/);
  assert.match(source,/asset:\s*'assets\/crazy-family\/dad-sprites-v028\.png'/);
});

test('cinematic rewrite keeps fixed blocker geometry unchanged',()=>{
  const world=createLivingRoomWorld();
  assert.deepEqual(blockerSnapshot(world),[
    {id:'coffee-table',x:-0.25,z:0.55,width:2.15,depth:1.2,height:0.52},
    {id:'side-table',x:-5.05,z:0.38,width:0.85,depth:0.75,height:0.68},
    {id:'sofa',x:-3.35,z:0.55,width:3.15,depth:1.25,height:1.05},
  ]);
});

test('cinematic rewrite keeps item scenarios dynamic',()=>{
  const firstWorld=createLivingRoomWorld();
  const lastWorld=createLivingRoomWorld();
  const first=createScenario({world:firstWorld,rng:()=>0});
  const last=createScenario({world:lastWorld,rng:()=>0.999999});
  assert.notEqual(first.item.spawnId,last.item.spawnId);
  assert.notDeepEqual(first.item.position,last.item.position);
  applyScenarioToWorld(firstWorld,first);
  applyScenarioToWorld(lastWorld,last);
  const firstHeadphones=firstWorld.interactables.find(item=>item.id==='headphones');
  const lastHeadphones=lastWorld.interactables.find(item=>item.id==='headphones');
  assert.deepEqual({x:firstHeadphones.x,y:firstHeadphones.y,z:firstHeadphones.z},first.item.position);
  assert.deepEqual({x:lastHeadphones.x,y:lastHeadphones.y,z:lastHeadphones.z},last.item.position);
});

test('cinematic remains the default scene path and keeps dynamic objects independent',async()=>{
  const sceneSource=await fs.readFile(new URL('../../crazy-family/scene.js',import.meta.url),'utf8');
  const gameSource=await fs.readFile(new URL('../../crazy-family/game.js',import.meta.url),'utf8');
  assert.match(sceneSource,/REFERENCE_GAME_RENDER_V043/);
  assert.match(sceneSource,/visualMode\s*=\s*'cinematic'/);
  assert.match(sceneSource,/cinematic-home-v043\/manifest\.json/);
  assert.match(sceneSource,/objectsById\.set\('headphones'/);
  assert.match(sceneSource,/createToyBall\(def\)/);
  assert.match(sceneSource,/objectsById\.set\(def\.id,ball\)/);
  assert.match(sceneSource,/debug-procedural/);
  assert.match(sceneSource,/OrthographicCamera/);
  assert.match(sceneSource,/projectWorldToCinematicStage/);
  assert.match(gameSource,/await\s+createLivingRoomScene/);
  assert.match(gameSource,/resolveRendererMode/);
  assert.match(gameSource,/scenario\.item\.position/);
  assert.match(gameSource,/sceneHandle\.renderPosition/);
  const world=createLivingRoomWorld();
  assert.deepEqual(blockerSnapshot(world),[
    {id:'coffee-table',x:-0.25,z:0.55,width:2.15,depth:1.2,height:0.52},
    {id:'side-table',x:-5.05,z:0.38,width:0.85,depth:0.75,height:0.68},
    {id:'sofa',x:-3.35,z:0.55,width:3.15,depth:1.25,height:1.05},
  ]);
});
