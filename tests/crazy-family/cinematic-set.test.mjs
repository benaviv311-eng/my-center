import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareCinematicDefinitions, validateCinematicManifest } from '../../crazy-family/cinematic-set.js';

const world={
  objects:[
    {id:'sofa',x:-3.35,y:.525,z:.55,width:3.15,depth:1.25,height:1.05},
    {id:'coffee-table',x:-.25,y:.26,z:.55,width:2.15,depth:1.2,height:.52},
  ],
};

const baseManifest={
  visualEnvelope:{minX:-6,maxX:6,minY:0,maxY:4,minZ:-4.5,maxZ:4.5},
  layers:[
    {id:'cinematic-background',src:'background.webp',kind:'background',world:{x:0,y:2,z:-4.5,width:12,height:6},renderOrder:-20,occluder:false,required:true},
    {id:'cinematic-sofa',src:'sofa.webp',kind:'furniture',anchorId:'sofa',world:{x:.2,y:1.3,z:-.1,width:4,height:2.5},renderOrder:8,occluder:true,required:true,proxy:{width:3.15,depth:1.25}},
    {id:'cinematic-decoration',src:'optional.webp',kind:'foreground',world:{x:4,y:1,z:2,width:2,height:2},renderOrder:20,occluder:false,required:false},
  ],
};

test('manifest entries become stable semantic layer definitions',()=>{
  validateCinematicManifest(baseManifest);
  const prepared=prepareCinematicDefinitions(baseManifest,world);
  assert.deepEqual(prepared.layers.map(layer=>layer.id),['cinematic-background','cinematic-sofa','cinematic-decoration']);
  assert.equal(prepared.visualEnvelope.maxZ,4.5);
});

test('anchored sofa resolves from world coordinates plus presentation offset',()=>{
  const prepared=prepareCinematicDefinitions(baseManifest,world);
  const sofa=prepared.layers.find(layer=>layer.id==='cinematic-sofa');
  assert.equal(sofa.position.x,-3.15);
  assert.equal(sofa.position.z,.45);
  assert.equal(sofa.position.y,1.3);
  assert.equal(sofa.anchorId,'sofa');
  assert.deepEqual(sofa.proxy,{x:-3.35,z:.55,width:3.15,depth:1.25});
});

test('missing optional decoration is not a manifest validation failure',()=>{
  const manifest={...baseManifest,layers:baseManifest.layers.filter(layer=>layer.id!=='cinematic-decoration')};
  assert.doesNotThrow(()=>validateCinematicManifest(manifest));
});

test('missing required background or anchored furniture rejects initialization',()=>{
  const noBackground={...baseManifest,layers:baseManifest.layers.filter(layer=>layer.kind!=='background')};
  assert.throws(()=>validateCinematicManifest(noBackground),/required background/i);
  const brokenAnchor={...baseManifest,layers:baseManifest.layers.map(layer=>layer.id==='cinematic-sofa'?{...layer,anchorId:'missing-sofa'}:layer)};
  assert.throws(()=>prepareCinematicDefinitions(brokenAnchor,world),/missing world anchor/i);
});
