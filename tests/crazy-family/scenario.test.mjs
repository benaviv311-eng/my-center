import test from 'node:test';
import assert from 'node:assert/strict';
import { createLivingRoomWorld } from '../../crazy-family/world.js';
import { createScenario, applyScenarioToWorld, scenarioSpawnIsValid } from '../../crazy-family/scenario.js';

function furnitureSnapshot(world){
  return world.objects.map(({id,x,y,z,width,depth,height})=>({id,x,y,z,width,depth,height}));
}

test('special item and Dad can start in different valid places between scenarios',()=>{
  const world=createLivingRoomWorld();
  const first=createScenario({world,rng:()=>0});
  const last=createScenario({world,rng:()=>0.999999});
  assert.notEqual(first.item.spawnId,last.item.spawnId);
  assert.notDeepEqual(first.item.position,last.item.position);
  assert.notEqual(first.dad.spawnId,last.dad.spawnId);
  assert.equal(scenarioSpawnIsValid(world,first.item),true);
  assert.equal(scenarioSpawnIsValid(world,last.item),true);
  assert.equal(scenarioSpawnIsValid(world,first.dad),true);
  assert.equal(scenarioSpawnIsValid(world,last.dad),true);
});

test('applying a scenario moves only dynamic actors and keeps furniture geometry fixed',()=>{
  const world=createLivingRoomWorld();
  const before=furnitureSnapshot(world);
  const scenario=createScenario({world,rng:()=>0.42});
  applyScenarioToWorld(world,scenario);
  const headphones=world.interactables.find(item=>item.id==='headphones');
  assert.deepEqual(
    {x:headphones.x,y:headphones.y,z:headphones.z},
    scenario.item.position,
  );
  assert.equal(headphones.enabled,true);
  assert.deepEqual(furnitureSnapshot(world),before);
});

test('scenario spawn catalog has several logical household placements, not a fixed headphone spot',()=>{
  const world=createLivingRoomWorld();
  assert.ok(world.scenarioSpawns.item.length>=5);
  assert.ok(world.scenarioSpawns.dad.length>=4);
  assert.ok(new Set(world.scenarioSpawns.item.map(point=>point.id)).size>=5);
  assert.ok(world.scenarioSpawns.item.some(point=>point.surfaceId==='sofa'));
  assert.ok(world.scenarioSpawns.item.some(point=>point.zone==='dining'));
  assert.ok(world.scenarioSpawns.item.some(point=>point.zone==='kitchen'));
});
