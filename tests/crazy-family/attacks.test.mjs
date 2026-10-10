import test from 'node:test';
import assert from 'node:assert/strict';
import { WORLD_ATTACK_DEFINITIONS, createWorldAttack, stepWorldAttack, attackHitsPlayer } from '../../crazy-family/attacks.js';

test('all ten canonical Dad attack definitions remain available',()=>{
  assert.equal(WORLD_ATTACK_DEFINITIONS.length,10);
  assert.equal(WORLD_ATTACK_DEFINITIONS.find(a=>a.id==='wave-low').height,'low');
  assert.equal(WORLD_ATTACK_DEFINITIONS.find(a=>a.id==='wave-high').height,'high');
  assert.equal(WORLD_ATTACK_DEFINITIONS.find(a=>a.id==='wave-mid').height,'mid');
});

test('world attack originates at Dad position and travels along forward vector',()=>{
  const def=WORLD_ATTACK_DEFINITIONS.find(a=>a.id==='wave-low');
  let attack=createWorldAttack(def,{x:2,y:1,z:-1},{x:0,z:-1},1000);
  assert.deepEqual(attack.origin,{x:2,y:1,z:-1});
  attack=stepWorldAttack(attack,.5,{traceAttackSegment:()=>null});
  assert.ok(attack.position.z<-1);
  assert.equal(attack.position.x,2);
});

test('jumping clears a low attack',()=>{
  const def=WORLD_ATTACK_DEFINITIONS.find(a=>a.id==='wave-low');
  const attack=createWorldAttack(def,{x:0,y:0,z:0},{x:0,z:-1},0);
  attack.position={x:0,y:.24,z:0};
  assert.equal(attackHitsPlayer(attack,{position:{x:0,y:1,z:0},radius:.3,height:1.15,crouching:false}),false);
});

test('crouching clears a high attack while standing can be hit',()=>{
  const def=WORLD_ATTACK_DEFINITIONS.find(a=>a.id==='wave-high');
  const attack=createWorldAttack(def,{x:0,y:0,z:0},{x:0,z:-1},0);
  attack.position={x:0,y:1.05,z:0};
  assert.equal(attackHitsPlayer(attack,{position:{x:0,y:0,z:0},radius:.3,height:1.15,crouching:false}),true);
  assert.equal(attackHitsPlayer(attack,{position:{x:0,y:0,z:0},radius:.3,height:.58,crouching:true}),false);
});
