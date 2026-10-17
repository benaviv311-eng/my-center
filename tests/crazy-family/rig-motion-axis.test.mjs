import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateRigPose } from '../../crazy-family/character-rig.js';

test('walk swings limbs primarily through depth instead of scissoring sideways', () => {
  const pose=calculateRigPose({kind:'libi',state:'walk',timeSeconds:.19,speed:1,grounded:true});
  assert.ok(Math.abs(pose.joints.leftUpperArm.x)>.08,'arm needs forward/back depth swing');
  assert.ok(Math.abs(pose.joints.leftUpperLeg.x)>.08,'leg needs forward/back depth swing');
  assert.ok(pose.joints.leftUpperArm.x*pose.joints.leftUpperLeg.x<0,'same-side arm and leg must oppose in depth');
  assert.ok(Math.abs(pose.joints.leftUpperArm.x)>Math.abs(pose.joints.leftUpperArm.z),'depth swing must dominate screen-plane swing');
});

test('run increases depth swing while lateral swing stays restrained', () => {
  const walk=calculateRigPose({kind:'libi',state:'walk',timeSeconds:.19,speed:1,grounded:true});
  const run=calculateRigPose({kind:'libi',state:'run',timeSeconds:.19,speed:1,grounded:true});
  assert.ok(Math.abs(run.joints.leftUpperArm.x)>Math.abs(walk.joints.leftUpperArm.x));
  assert.ok(Math.abs(run.joints.leftUpperLeg.x)>Math.abs(walk.joints.leftUpperLeg.x));
  assert.ok(Math.abs(run.joints.leftUpperArm.z)<Math.abs(run.joints.leftUpperArm.x)*.4);
});
