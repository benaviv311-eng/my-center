import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveCinematicOcclusion, applyCinematicOcclusion } from '../../crazy-family/cinematic-occlusion.js';

const sofa={id:'cinematic-sofa',x:0,z:1.8,width:3,depth:1,kind:'furniture',object:{userData:{baseRenderOrder:8},renderOrder:8}};
const wall={id:'cinematic-background',x:0,z:-4,width:12,depth:.2,kind:'background',object:{userData:{baseRenderOrder:-20},renderOrder:-20}};

test('Libi behind sofa activates sofa occlusion',()=>{
  const ids=resolveCinematicOcclusion({camera:{x:0,z:5},actor:{x:0,z:0},occluders:[sofa,wall]});
  assert.deepEqual([...ids],['cinematic-sofa']);
});

test('Libi on camera side of sofa does not false-occlude',()=>{
  const ids=resolveCinematicOcclusion({camera:{x:0,z:5},actor:{x:0,z:3.2},occluders:[sofa]});
  assert.equal(ids.size,0);
});

test('background layers are never actor occluders',()=>{
  const ids=resolveCinematicOcclusion({camera:{x:0,z:5},actor:{x:0,z:-4.5},occluders:[wall]});
  assert.equal(ids.size,0);
});

test('Dad and Libi can be evaluated independently',()=>{
  const libi=resolveCinematicOcclusion({camera:{x:0,z:5},actor:{x:0,z:0},occluders:[sofa]});
  const dad=resolveCinematicOcclusion({camera:{x:0,z:5},actor:{x:3.5,z:0},occluders:[sofa]});
  assert.equal(libi.has('cinematic-sofa'),true);
  assert.equal(dad.has('cinematic-sofa'),false);
});

test('applyCinematicOcclusion records active state without permanently hiding layers',()=>{
  const layer={visible:true,renderOrder:8,userData:{baseRenderOrder:8}};
  const set={occluders:[{id:'cinematic-sofa',object:layer}]};
  applyCinematicOcclusion(set,new Set(['cinematic-sofa']));
  assert.equal(layer.visible,true);
  assert.equal(layer.userData.actorOccluderActive,true);
  assert.ok(layer.renderOrder>8);
  applyCinematicOcclusion(set,new Set());
  assert.equal(layer.userData.actorOccluderActive,false);
  assert.equal(layer.renderOrder,8);
});
