import test from 'node:test';
import assert from 'node:assert/strict';
import { createReactivePropController, triggerRoomReaction, stepRoomReactions, surfaceCueFor } from '../../crazy-family/reactive-props.js';

const world={objects:[{id:'sofa'},{id:'toy-ball'},{id:'cushion-a'},{id:'cushion-b'},{id:'toy-blocks'}]};

function magnitude(t){return Math.hypot(t.x||0,t.y||0,t.z||0);}

test('mega sneeze reacts more strongly than a small sneeze',()=>{
  const small=createReactivePropController(world);
  triggerRoomReaction(small,'sneeze-small');
  const mega=createReactivePropController(world);
  triggerRoomReaction(mega,'sneeze-mega');
  assert.ok(mega.cameraShake>small.cameraShake);
  assert.ok(magnitude(mega.transforms['toy-ball'])>magnitude(small.transforms['toy-ball']));
  assert.ok(magnitude(mega.transforms['cushion-a'])>0);
});

test('pant near furniture compresses sofa without kicking toys',()=>{
  const c=createReactivePropController(world);
  triggerRoomReaction(c,'dad-pant-near-furniture',{nearId:'sofa'});
  assert.ok(Math.abs(c.transforms.sofa.scaleY-1)>0);
  assert.equal(magnitude(c.transforms['toy-ball']),0);
});

test('toy kick moves only the selected toy immediately',()=>{
  const c=createReactivePropController(world);
  triggerRoomReaction(c,'toy-kick',{id:'toy-ball',direction:{x:1,z:.3}});
  assert.ok(c.transforms['toy-ball'].x>0);
  assert.equal(magnitude(c.transforms['cushion-a']),0);
});

test('room reactions decay toward their authored base transforms',()=>{
  const c=createReactivePropController(world);
  triggerRoomReaction(c,'sneeze-mega');
  const before=magnitude(c.transforms['toy-ball']);
  for(let i=0;i<120;i++)stepRoomReactions(c,1/60);
  assert.ok(magnitude(c.transforms['toy-ball'])<before*.1);
  assert.ok(c.cameraShake<.05);
  assert.ok(Math.abs(c.transforms.sofa.scaleY-1)<.02);
});

test('surface cues are distinct for rug wood tile and sofa',()=>{
  const cues=['rug','wood','tile','sofa'].map(surfaceCueFor);
  assert.deepEqual(new Set(cues).size,4);
  assert.ok(cues.every(Boolean));
});
