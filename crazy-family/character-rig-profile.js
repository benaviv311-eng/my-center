export const CHARACTER_RIG_PART_NAMES = Object.freeze([
  'torso','head',
  'leftUpperArm','leftLowerArm','rightUpperArm','rightLowerArm',
  'leftUpperLeg','leftLowerLeg','rightUpperLeg','rightLowerLeg',
]);

const DEG_25 = 25 * Math.PI / 180;

function part(crop, pivot, depth, overlap, zOrder) {
  return Object.freeze({
    crop: Object.freeze(crop),
    pivot: Object.freeze(pivot),
    depth,
    overlap: Object.freeze(overlap),
    zOrder,
  });
}

const libiParts = Object.freeze({
  head: part({x:.24,y:.01,width:.52,height:.31},{x:.50,y:.92},.12,{x:.035,y:.035},8),
  torso: part({x:.27,y:.27,width:.46,height:.34},{x:.50,y:.91},.14,{x:.045,y:.045},5),
  leftUpperArm: part({x:.13,y:.31,width:.22,height:.25},{x:.78,y:.91},.095,{x:.05,y:.055},4),
  leftLowerArm: part({x:.08,y:.49,width:.23,height:.24},{x:.72,y:.90},.085,{x:.05,y:.06},3),
  rightUpperArm: part({x:.65,y:.31,width:.22,height:.25},{x:.22,y:.91},.095,{x:.05,y:.055},4),
  rightLowerArm: part({x:.69,y:.49,width:.23,height:.24},{x:.28,y:.90},.085,{x:.05,y:.06},3),
  leftUpperLeg: part({x:.29,y:.56,width:.23,height:.24},{x:.56,y:.94},.11,{x:.045,y:.06},2),
  leftLowerLeg: part({x:.27,y:.74,width:.25,height:.25},{x:.55,y:.94},.10,{x:.045,y:.06},1),
  rightUpperLeg: part({x:.48,y:.56,width:.23,height:.24},{x:.44,y:.94},.11,{x:.045,y:.06},2),
  rightLowerLeg: part({x:.48,y:.74,width:.25,height:.25},{x:.45,y:.94},.10,{x:.045,y:.06},1),
});

const dadParts = Object.freeze({
  head: part({x:.26,y:.01,width:.48,height:.27},{x:.50,y:.93},.17,{x:.035,y:.04},8),
  torso: part({x:.24,y:.24,width:.52,height:.37},{x:.50,y:.92},.21,{x:.05,y:.05},5),
  leftUpperArm: part({x:.08,y:.29,width:.25,height:.27},{x:.80,y:.91},.14,{x:.055,y:.06},4),
  leftLowerArm: part({x:.04,y:.49,width:.27,height:.25},{x:.73,y:.91},.13,{x:.055,y:.06},3),
  rightUpperArm: part({x:.67,y:.29,width:.25,height:.27},{x:.20,y:.91},.14,{x:.055,y:.06},4),
  rightLowerArm: part({x:.69,y:.49,width:.27,height:.25},{x:.27,y:.91},.13,{x:.055,y:.06},3),
  leftUpperLeg: part({x:.25,y:.57,width:.27,height:.23},{x:.56,y:.95},.16,{x:.05,y:.065},2),
  leftLowerLeg: part({x:.22,y:.73,width:.30,height:.27},{x:.56,y:.95},.15,{x:.05,y:.065},1),
  rightUpperLeg: part({x:.48,y:.57,width:.27,height:.23},{x:.44,y:.95},.16,{x:.05,y:.065},2),
  rightLowerLeg: part({x:.48,y:.73,width:.30,height:.27},{x:.44,y:.95},.15,{x:.05,y:.065},1),
});

const libiMotion = Object.freeze({
  idle: Object.freeze({breath:.012,head:.018,arm:.035,frequency:1.9}),
  walk: Object.freeze({armSwing:.36,legSwing:.40,kneeBend:.20,torsoTwist:.07,frequency:7.1}),
  run: Object.freeze({armSwing:.58,legSwing:.62,kneeBend:.31,torsoTwist:.11,lean:.10,frequency:10.2}),
  jump: Object.freeze({armLift:.34,legTuck:.27,torsoLean:.06}),
  crouch: Object.freeze({hipDrop:.18,kneeBend:.58,torsoLean:.12}),
});

const dadMotion = Object.freeze({
  idle: Object.freeze({breath:.017,head:.013,arm:.025,frequency:1.45}),
  walk: Object.freeze({armSwing:.31,legSwing:.34,kneeBend:.16,torsoTwist:.055,frequency:5.8}),
  run: Object.freeze({armSwing:.50,legSwing:.53,kneeBend:.25,torsoTwist:.09,lean:.12,frequency:8.2}),
  jump: Object.freeze({armLift:.25,legTuck:.20,torsoLean:.08}),
  crouch: Object.freeze({hipDrop:.15,kneeBend:.48,torsoLean:.14}),
});

export const CHARACTER_RIG_PROFILES = Object.freeze({
  libi: Object.freeze({
    kind: 'libi',
    sourceFrame: 0,
    readableYawLimitRadians: DEG_25,
    parts: libiParts,
    motion: libiMotion,
  }),
  dad: Object.freeze({
    kind: 'dad',
    sourceFrame: 0,
    readableYawLimitRadians: DEG_25,
    parts: dadParts,
    motion: dadMotion,
  }),
});

export function getCharacterRigProfile(kind) {
  const profile = CHARACTER_RIG_PROFILES[kind];
  if (!profile) throw new Error(`Unknown Crazy Family rig profile: ${kind}`);
  return profile;
}
