import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import test from 'node:test';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../..');
const profilePath = path.join(repoRoot, 'crazy-family/character-rig-profile.js');
const rigPath = path.join(repoRoot, 'crazy-family/character-rig.js');
const moduleExists = existsSync(profilePath);
const rigExists = existsSync(rigPath);
let rigProfile = null;
let rigModule = null;
if (moduleExists) rigProfile = await import(pathToFileURL(profilePath));
if (rigExists) rigModule = await import(pathToFileURL(rigPath));

const expectedPartNames = [
  'torso','head',
  'leftUpperArm','leftLowerArm','rightUpperArm','rightLowerArm',
  'leftUpperLeg','leftLowerLeg','rightUpperLeg','rightLowerLeg',
];

test('segmented rig profile module exists', () => {
  assert.equal(moduleExists, true, 'character-rig-profile.js must exist before the profile contract can pass');
});

if (moduleExists) {
  test('canonical rig profiles use frame 0 and the 25 degree readable yaw limit', () => {
    const libi = rigProfile.getCharacterRigProfile('libi');
    const dad = rigProfile.getCharacterRigProfile('dad');
    assert.equal(libi.sourceFrame, 0);
    assert.equal(dad.sourceFrame, 0);
    assert.equal(libi.readableYawLimitRadians, 25 * Math.PI / 180);
    assert.equal(dad.readableYawLimitRadians, 25 * Math.PI / 180);
    assert.deepEqual(rigProfile.CHARACTER_RIG_PART_NAMES, expectedPartNames);
  });

  test('every canonical rig part has normalized crop, pivot, depth and overlap metadata', () => {
    for (const kind of ['libi', 'dad']) {
      const profile = rigProfile.getCharacterRigProfile(kind);
      for (const name of expectedPartNames) {
        const part = profile.parts[name];
        assert.ok(part, `${kind}.${name} missing`);
        assert.ok(part.crop, `${kind}.${name}.crop missing`);
        for (const key of ['x','y','width','height']) {
          assert.equal(Number.isFinite(part.crop[key]), true, `${kind}.${name}.crop.${key} must be finite`);
        }
        assert.ok(part.crop.x >= 0 && part.crop.x <= 1, `${kind}.${name}.crop.x out of range`);
        assert.ok(part.crop.y >= 0 && part.crop.y <= 1, `${kind}.${name}.crop.y out of range`);
        assert.ok(part.crop.width > 0 && part.crop.width <= 1, `${kind}.${name}.crop.width out of range`);
        assert.ok(part.crop.height > 0 && part.crop.height <= 1, `${kind}.${name}.crop.height out of range`);
        assert.ok(part.crop.x + part.crop.width <= 1.000001, `${kind}.${name}.crop exceeds frame width`);
        assert.ok(part.crop.y + part.crop.height <= 1.000001, `${kind}.${name}.crop exceeds frame height`);
        assert.ok(part.depth > 0, `${kind}.${name}.depth must be positive`);
        assert.ok(part.pivot && Number.isFinite(part.pivot.x) && Number.isFinite(part.pivot.y), `${kind}.${name}.pivot missing`);
        assert.ok(part.overlap && Number.isFinite(part.overlap.x) && Number.isFinite(part.overlap.y), `${kind}.${name}.overlap missing`);
        assert.equal(Number.isFinite(part.zOrder), true, `${kind}.${name}.zOrder missing`);
      }
    }
  });

  test('Libi and Dad retain separate motion profiles and unknown character kinds fail closed', () => {
    const libi = rigProfile.getCharacterRigProfile('libi');
    const dad = rigProfile.getCharacterRigProfile('dad');
    assert.notStrictEqual(libi.motion, dad.motion);
    assert.notDeepEqual(libi.motion, dad.motion);
    for (const key of ['idle','walk','run','jump','crouch']) {
      assert.ok(libi.motion[key], `libi motion.${key} missing`);
      assert.ok(dad.motion[key], `dad motion.${key} missing`);
    }
    assert.throws(() => rigProfile.getCharacterRigProfile('unknown'), /Unknown Crazy Family rig profile/);
  });
}

test('segmented rig implementation module exists', () => {
  assert.equal(rigExists, true, 'character-rig.js must exist before extraction tests can pass');
});

if (rigExists) {
  test('cropRectToPixels maps normalized crops inside one frame of the 5x2 canonical sheet', () => {
    const rect = rigModule.cropRectToPixels(
      {x:.25,y:.20,width:.50,height:.40},
      0,
      1000,
      400,
      5,
      2,
    );
    assert.deepEqual(rect, {x:50,y:40,width:100,height:80});

    const secondRowLastFrame = rigModule.cropRectToPixels(
      {x:0,y:0,width:1,height:1},
      9,
      1000,
      400,
      5,
      2,
    );
    assert.deepEqual(secondRowLastFrame, {x:800,y:200,width:200,height:200});
  });

  test('segmented rig factory fails closed when the canonical source image is unavailable', async () => {
    await assert.rejects(
      rigModule.createCanonicalSegmentedRig({
        kind: 'libi',
        canonical: {asset:'assets/libi-sprites-v025.png',version:'v025',width:.9,height:1.34,spriteColumns:5,spriteRows:2},
        sourceImage: {naturalWidth:0,naturalHeight:0},
        documentRef: {},
        THREERef: {},
      }),
      /Crazy Family segmented rig: canonical image unavailable/,
    );
  });

  test('rig implementation is canon-only and keeps canvas extraction out of pose updates', async () => {
    const source = await readFile(rigPath, 'utf8');
    assert.match(source, /canonical\.asset/);
    assert.match(source, /canonical\.version/);
    assert.match(source, /canonical-segmented-rig/);
    assert.doesNotMatch(source, /libi-sprites-v0(?!25)|dad-sprites-v0(?!28)/);
    const poseStart = source.indexOf('function applyPoseToRig');
    if (poseStart >= 0) {
      const poseSection = source.slice(poseStart, source.indexOf('\n}', poseStart) + 2);
      assert.doesNotMatch(poseSection, /drawImage|createElement\(['"]canvas['"]\)/);
    }
  });

  test('pose and yaw helpers are exported for deterministic articulation tests', () => {
    assert.equal(typeof rigModule.calculateRigPose, 'function');
    assert.equal(typeof rigModule.resolveReadableYaw, 'function');
  });

  if (typeof rigModule.calculateRigPose === 'function') {
    test('walk swings each arm opposite its matching leg', () => {
      const pose = rigModule.calculateRigPose({kind:'libi',state:'walk',timeSeconds:.19,speed:1,grounded:true});
      assert.ok(pose.joints.leftUpperArm.z * pose.joints.leftUpperLeg.z < 0);
      assert.ok(pose.joints.rightUpperArm.z * pose.joints.rightUpperLeg.z < 0);
      assert.ok(Math.abs(pose.joints.leftUpperArm.z) > .01);
    });

    test('run amplitude is greater than walk at the same phase', () => {
      const walk = rigModule.calculateRigPose({kind:'libi',state:'walk',timeSeconds:.19,speed:1,grounded:true});
      const run = rigModule.calculateRigPose({kind:'libi',state:'run',timeSeconds:.19,speed:1,grounded:true});
      assert.ok(Math.abs(run.joints.leftUpperArm.z) > Math.abs(walk.joints.leftUpperArm.z));
      assert.ok(Math.abs(run.joints.leftUpperLeg.z) > Math.abs(walk.joints.leftUpperLeg.z));
    });

    test('jump and crouch alter visual pose without owning world position', () => {
      const jump = rigModule.calculateRigPose({kind:'libi',state:'jump',timeSeconds:.3,speed:0,grounded:false});
      const crouch = rigModule.calculateRigPose({kind:'libi',state:'crouch',timeSeconds:.3,speed:0,grounded:true,crouching:true});
      assert.ok(Math.abs(jump.torso.rotationX) > 0 || Math.abs(jump.joints.leftUpperLeg.z) > 0);
      assert.ok(crouch.rootYOffset < 0);
      assert.ok(Math.abs(crouch.joints.leftLowerLeg.z) > .1);
      assert.equal('worldPosition' in jump, false);
      assert.equal('worldPosition' in crouch, false);
    });

    test('pose calculation resets from neutral and Dad/Libi use different motion amplitudes', () => {
      const run = rigModule.calculateRigPose({kind:'libi',state:'run',timeSeconds:.19,speed:1,grounded:true});
      const idle = rigModule.calculateRigPose({kind:'libi',state:'idle',timeSeconds:0,speed:0,grounded:true});
      assert.notEqual(run.joints.leftUpperArm.z, idle.joints.leftUpperArm.z);
      assert.ok(Math.abs(idle.joints.leftUpperLeg.z) < .001);
      const dadRun = rigModule.calculateRigPose({kind:'dad',state:'run',timeSeconds:.19,speed:1,grounded:true});
      assert.notEqual(Math.abs(dadRun.joints.leftUpperArm.z), Math.abs(run.joints.leftUpperArm.z));
    });
  }

  if (typeof rigModule.resolveReadableYaw === 'function') {
    test('readable yaw clamps extreme movement requests to plus or minus 25 degrees', () => {
      const limit = 25 * Math.PI / 180;
      const positive = rigModule.resolveReadableYaw({cameraFacingYaw:0,movementYaw:Math.PI/2,limitRadians:limit});
      const negative = rigModule.resolveReadableYaw({cameraFacingYaw:0,movementYaw:-Math.PI/2,limitRadians:limit});
      assert.ok(positive.visibleDelta <= limit + 1e-9 && positive.visibleDelta >= limit - 1e-9);
      assert.ok(negative.visibleDelta >= -limit - 1e-9 && negative.visibleDelta <= -limit + 1e-9);
    });

    test('readable yaw uses shortest angular delta across the plus/minus pi wrap', () => {
      const limit = 25 * Math.PI / 180;
      const result = rigModule.resolveReadableYaw({
        cameraFacingYaw: Math.PI - .08,
        movementYaw: -Math.PI + .08,
        limitRadians: limit,
      });
      assert.ok(Math.abs(result.visibleDelta) < limit);
      assert.ok(Math.abs(result.visibleDelta - .16) < .001);
    });
  }
}
