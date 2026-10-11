import test from 'node:test';
import assert from 'node:assert/strict';
import { contactState } from '../../crazy-family/contact-effects.js';

test('grounded actor gets visible soft contact shadow',()=>{
  const state=contactState({position:{y:0},grounded:true,surfaceKind:'wood',visible:true,scale:1});
  assert.equal(state.visible,true);
  assert.ok(state.opacity>=0.2);
  assert.ok(state.scaleX>0 && state.scaleZ>0);
});

test('airborne actor shadow softens and expands instead of following upward at full opacity',()=>{
  const grounded=contactState({position:{y:0},grounded:true,surfaceKind:'wood',visible:true,scale:1});
  const airborne=contactState({position:{y:1.2},grounded:false,surfaceKind:'wood',visible:true,scale:1});
  assert.ok(airborne.opacity<grounded.opacity);
  assert.ok(airborne.scaleX>grounded.scaleX);
  assert.equal(airborne.y,0.018);
});

test('hidden item has no contact effect',()=>{
  const hidden=contactState({position:{y:0},grounded:true,surfaceKind:'wood',visible:false,scale:.45});
  assert.equal(hidden.visible,false);
  assert.equal(hidden.opacity,0);
});

test('rug and wood alter subtle intensity only',()=>{
  const wood=contactState({position:{y:0},grounded:true,surfaceKind:'wood',visible:true,scale:1});
  const rug=contactState({position:{y:0},grounded:true,surfaceKind:'rug',visible:true,scale:1});
  assert.notEqual(wood.opacity,rug.opacity);
  assert.equal(wood.visible,rug.visible);
  assert.equal(wood.scaleX,rug.scaleX);
});
