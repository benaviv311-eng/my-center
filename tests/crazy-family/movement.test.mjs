import test from 'node:test';
import assert from 'node:assert/strict';
import { cameraRelativeIntent } from '../../crazy-family/input.js';
import { createCharacterState, stepCharacter, jumpCharacter } from '../../crazy-family/movement.js';

const world = {
  groundHeightAt(){ return 0; },
  resolveCharacterMove(from, to){ return to.x > 2 ? { ...to, x: 2 } : to; },
};

function magnitude(v){ return Math.hypot(v.x, v.z); }

test('diagonal input is normalized to cardinal magnitude', () => {
  const forward = {x:0,z:-1}, right = {x:1,z:0};
  const cardinal = cameraRelativeIntent({x:1,z:0}, forward, right);
  const diagonal = cameraRelativeIntent({x:1,z:-1}, forward, right);
  assert.ok(Math.abs(magnitude(cardinal) - magnitude(diagonal)) < 1e-9);
  assert.equal(magnitude(diagonal), 1);
});

test('input is resolved relative to camera forward and right', () => {
  const intent = cameraRelativeIntent({x:1,z:-1}, {x:0,z:-1}, {x:1,z:0});
  assert.ok(intent.x > 0);
  assert.ok(intent.z < 0);
});

test('acceleration and braking are gradual', () => {
  let state = createCharacterState({position:{x:0,y:0,z:0},maxSpeed:5,acceleration:10,braking:20,radius:.3,height:1});
  state = stepCharacter(state,{x:1,z:0},0.1,world);
  assert.ok(state.velocity.x > 0 && state.velocity.x < 5);
  const moving = state.velocity.x;
  state = stepCharacter(state,{x:0,z:0},0.02,world);
  assert.ok(state.velocity.x < moving && state.velocity.x > 0);
});

test('gravity returns character to the actual floor surface', () => {
  let state = createCharacterState({position:{x:0,y:1,z:0},maxSpeed:5,acceleration:10,braking:20,radius:.3,height:1});
  state.grounded = false;
  for(let i=0;i<120;i++) state = stepCharacter(state,{x:0,z:0},1/60,world);
  assert.equal(state.position.y, 0);
  assert.equal(state.grounded, true);
});

test('jump changes world Y only and preserves floor coordinates', () => {
  let state = createCharacterState({position:{x:1,y:0,z:-2},maxSpeed:5,acceleration:10,braking:20,radius:.3,height:1});
  state = jumpCharacter(state,7);
  state = stepCharacter(state,{x:0,z:0},0.05,world);
  assert.equal(state.position.x, 1);
  assert.equal(state.position.z, -2);
  assert.ok(state.position.y > 0);
});

test('world collision response prevents crossing a blocker', () => {
  let state = createCharacterState({position:{x:1.9,y:0,z:0},maxSpeed:10,acceleration:100,braking:100,radius:.3,height:1});
  state = stepCharacter(state,{x:1,z:0},0.1,world);
  assert.equal(state.position.x, 2);
});
