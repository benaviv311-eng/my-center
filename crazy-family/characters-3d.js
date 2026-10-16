import * as THREE from 'three';

export const CHARACTER_3D_PROFILES = Object.freeze({
  libi: Object.freeze({
    height: 1.34,
    turnSpeed: 13,
    colors: Object.freeze({ skin:0xf0b38f, hair:0x6a3c2a, coral:0xf06f70, teal:0x38a8a5, pink:0xf05b91, sock:0xf6e8dd, stripe:0xe86b86 }),
  }),
  dad: Object.freeze({
    height: 1.92,
    turnSpeed: 7.2,
    colors: Object.freeze({ skin:0xd99a78, hair:0x4a3028, teal:0x267f7c, shirt:0xe8dfcf, pants:0x8b6b86, slipper:0x6b4934, beard:0x5a4037 }),
  }),
});

function mat(color, roughness=.74){ return new THREE.MeshStandardMaterial({color,roughness,metalness:0.015}); }
function name(node,id){ node.name=id; node.userData.semanticId=id; return node; }
function mesh(geometry,material,id){
  const value=name(new THREE.Mesh(geometry,material),id);
  value.castShadow=true; value.receiveShadow=false;
  return value;
}
function limb(id,material,{radius=.075,length=.42}={}){
  const group=name(new THREE.Group(),id);
  const part=mesh(new THREE.CylinderGeometry(radius,radius*.9,length,10),material,`${id}-mesh`);
  part.position.y=-length*.5;
  group.add(part);
  return group;
}
function shoe(id,material,{w=.19,h=.10,d=.31}={}){
  const value=mesh(new THREE.BoxGeometry(w,h,d),material,id);
  value.position.z=.055;
  return value;
}
function addHairPuff(parent,material,x,y,z,scale=1){
  const puff=mesh(new THREE.SphereGeometry(.13*scale,14,10),material,'hair-puff');
  puff.position.set(x,y,z); parent.add(puff); return puff;
}
function flower(material){
  const group=name(new THREE.Group(),'flower-clip');
  for(let i=0;i<5;i++){
    const petal=mesh(new THREE.SphereGeometry(.035,8,6),material,`flower-petal-${i}`);
    const a=i*Math.PI*2/5; petal.position.set(Math.cos(a)*.045,Math.sin(a)*.045,0); group.add(petal);
  }
  return group;
}

function buildLibi(root,profile){
  const c=profile.colors;
  const skin=mat(c.skin,.72),hair=mat(c.hair,.86),coral=mat(c.coral,.68),teal=mat(c.teal,.62),pink=mat(c.pink,.58),sock=mat(c.sock,.9),stripe=mat(c.stripe,.7);
  const torso=mesh(new THREE.BoxGeometry(.42,.46,.25),coral,'torso'); torso.position.y=.88; root.add(torso);
  const overalls=mesh(new THREE.BoxGeometry(.38,.33,.27),teal,'overalls'); overalls.position.y=.70; overalls.position.z=.01; root.add(overalls);
  const head=mesh(new THREE.SphereGeometry(.225,18,14),skin,'head'); head.position.y=1.22; root.add(head);
  const hairCap=mesh(new THREE.SphereGeometry(.238,18,12),hair,'hair'); hairCap.position.set(0,1.28,-.025); hairCap.scale.set(1.04,.82,1.03); root.add(hairCap);
  addHairPuff(root,hair,-.25,1.27,-.01,1.0); addHairPuff(root,hair,.25,1.27,-.01,1.0);
  const clip=flower(pink); clip.position.set(.17,1.36,.19); root.add(clip);

  const leftArm=limb('left-arm',coral,{radius:.062,length:.39}); leftArm.position.set(-.26,1.02,0); root.add(leftArm);
  const rightArm=limb('right-arm',coral,{radius:.062,length:.39}); rightArm.position.set(.26,1.02,0); root.add(rightArm);
  const leftHand=mesh(new THREE.SphereGeometry(.07,10,8),skin,'left-hand'); leftHand.position.set(-.26,.61,0); root.add(leftHand);
  const rightHand=mesh(new THREE.SphereGeometry(.07,10,8),skin,'right-hand'); rightHand.position.set(.26,.61,0); root.add(rightHand);

  const leftLeg=limb('left-leg',sock,{radius:.073,length:.42}); leftLeg.position.set(-.115,.55,0); root.add(leftLeg);
  const rightLeg=limb('right-leg',sock,{radius:.073,length:.42}); rightLeg.position.set(.115,.55,0); root.add(rightLeg);
  const leftStripe=mesh(new THREE.TorusGeometry(.074,.012,6,14),stripe,'left-sock-stripe'); leftStripe.rotation.x=Math.PI/2; leftStripe.position.set(-.115,.29,0); root.add(leftStripe);
  const rightStripe=mesh(new THREE.TorusGeometry(.074,.012,6,14),stripe,'right-sock-stripe'); rightStripe.rotation.x=Math.PI/2; rightStripe.position.set(.115,.29,0); root.add(rightStripe);
  const leftShoe=shoe('left-shoe',pink); leftShoe.position.set(-.115,.075,.035); root.add(leftShoe);
  const rightShoe=shoe('right-shoe',pink); rightShoe.position.set(.115,.075,.035); root.add(rightShoe);
  root.userData.identityCues=['pigtails','flower-clip','coral-top','teal-overalls','striped-socks','pink-high-tops'];
}

function buildDad(root,profile){
  const c=profile.colors;
  const skin=mat(c.skin,.74),hair=mat(c.hair,.86),teal=mat(c.teal,.66),shirt=mat(c.shirt,.83),pants=mat(c.pants,.78),slipper=mat(c.slipper,.88),beard=mat(c.beard,.92);
  const torso=mesh(new THREE.BoxGeometry(.62,.65,.34),teal,'torso'); torso.position.y=1.25; root.add(torso);
  const undershirt=mesh(new THREE.BoxGeometry(.38,.50,.355),shirt,'undershirt'); undershirt.position.set(0,1.24,.012); root.add(undershirt);
  const head=mesh(new THREE.SphereGeometry(.27,18,14),skin,'head'); head.position.y=1.72; root.add(head);
  const hairMass=mesh(new THREE.SphereGeometry(.285,16,12),hair,'hair'); hairMass.position.set(0,1.81,-.035); hairMass.scale.set(1.05,.72,1.0); root.add(hairMass);
  addHairPuff(root,hair,-.16,1.93,-.02,.8); addHairPuff(root,hair,.03,1.96,-.01,.9); addHairPuff(root,hair,.18,1.91,-.02,.75);
  const stubble=mesh(new THREE.BoxGeometry(.28,.10,.025),beard,'stubble'); stubble.position.set(0,1.62,.255); root.add(stubble);

  const leftArm=limb('left-arm',teal,{radius:.085,length:.55}); leftArm.position.set(-.38,1.49,0); root.add(leftArm);
  const rightArm=limb('right-arm',teal,{radius:.085,length:.55}); rightArm.position.set(.38,1.49,0); root.add(rightArm);
  const leftHand=mesh(new THREE.SphereGeometry(.085,10,8),skin,'left-hand'); leftHand.position.set(-.38,.92,0); root.add(leftHand);
  const rightHand=mesh(new THREE.SphereGeometry(.085,10,8),skin,'right-hand'); rightHand.position.set(.38,.92,0); root.add(rightHand);

  const leftLeg=limb('left-leg',pants,{radius:.11,length:.66}); leftLeg.position.set(-.17,.78,0); root.add(leftLeg);
  const rightLeg=limb('right-leg',pants,{radius:.11,length:.66}); rightLeg.position.set(.17,.78,0); root.add(rightLeg);
  const leftShoe=shoe('left-shoe',slipper,{w:.25,h:.11,d:.38}); leftShoe.position.set(-.17,.08,.055); root.add(leftShoe);
  const rightShoe=shoe('right-shoe',slipper,{w:.25,h:.11,d:.38}); rightShoe.position.set(.17,.08,.055); root.add(rightShoe);
  const mic=mesh(new THREE.CylinderGeometry(.035,.045,.38,10),beard,'singing-prop'); mic.rotation.z=-.35; mic.position.set(.42,1.05,.15); root.add(mic);
  root.userData.identityCues=['tousled-hair','stubble','teal-overshirt','light-undershirt','pajama-pants','brown-slippers','singing-prop'];
}

function angleDelta(from,to){
  let d=(to-from)%(Math.PI*2);
  if(d>Math.PI)d-=Math.PI*2;
  if(d<-Math.PI)d+=Math.PI*2;
  return d;
}
function setLimbPose(parts,state,speed,now,kind){
  const moving=['walk','run','chase','ground'].includes(state)&&speed>.08;
  const runish=state==='run'||state==='chase';
  const phase=(now||0)*(runish?.011:.0075);
  const amp=moving?(runish?.72:.42):0;
  const swing=Math.sin(phase)*amp;
  parts.leftArm.rotation.x=swing; parts.rightArm.rotation.x=-swing;
  parts.leftLeg.rotation.x=-swing*.72; parts.rightLeg.rotation.x=swing*.72;
  parts.root.rotation.z=0;
  parts.root.scale.y=1;
  if(state==='jump'){
    parts.leftArm.rotation.x=-.72; parts.rightArm.rotation.x=-.72;
    parts.leftLeg.rotation.x=.30; parts.rightLeg.rotation.x=.30;
  } else if(state==='crouch'){
    parts.root.scale.y=.78;
  } else if(kind==='dad'&&state==='sing'){
    parts.root.rotation.z=Math.sin((now||0)*.006)*.055;
    parts.leftArm.rotation.x=.25; parts.rightArm.rotation.x=-.55;
  } else if(kind==='dad'&&state==='pant'){
    parts.root.rotation.x=.09+Math.sin((now||0)*.018)*.035;
  } else if(kind==='dad'&&state==='yawn'){
    parts.rightArm.rotation.x=-1.1;
  } else if(kind==='dad'&&state==='sneeze'){
    parts.root.rotation.x=.24;
    parts.leftArm.rotation.x=-.45; parts.rightArm.rotation.x=-.45;
  } else {
    parts.root.rotation.x=0;
  }
}

export function createCharacter3D({scene,kind}){
  if(!scene)throw new Error('scene is required');
  if(!CHARACTER_3D_PROFILES[kind])throw new Error(`unsupported character kind: ${kind}`);
  const profile=CHARACTER_3D_PROFILES[kind];
  const root=name(new THREE.Group(),kind==='dad'?'dad-character-3d':'libi-character-3d');
  root.userData.identity=kind;
  root.userData.height=profile.height;
  root.userData.renderMode='native3d';
  if(kind==='dad')buildDad(root,profile);else buildLibi(root,profile);
  scene.add(root);

  const parts={root};
  root.traverse(node=>{if(node.name==='left-arm')parts.leftArm=node;if(node.name==='right-arm')parts.rightArm=node;if(node.name==='left-leg')parts.leftLeg=node;if(node.name==='right-leg')parts.rightLeg=node;});
  let state='idle',speed=0,grounded=true,targetFacing=0,lastFacing=0;

  return {
    root,
    profile,
    setTransform({position,facing=lastFacing,state:nextState='idle',speed:nextSpeed=0,grounded:nextGrounded=true}={}){
      const p=position||{x:0,y:0,z:0};
      root.position.set(Number(p.x)||0,Number(p.y)||0,Number(p.z)||0);
      if(Number.isFinite(facing)){targetFacing=facing;lastFacing=facing;}
      state=nextState||'idle';speed=Math.max(0,Number(nextSpeed)||0);grounded=Boolean(nextGrounded);
      root.userData.state=state;root.userData.speed=speed;root.userData.grounded=grounded;
    },
    update(dt=0,now=0){
      const t=Math.min(1,Math.max(0,dt)*profile.turnSpeed);
      root.rotation.y+=angleDelta(root.rotation.y,targetFacing)*t;
      setLimbPose(parts,state,speed,now,kind);
    },
    setVisible(value){root.visible=Boolean(value);},
    dispose(){
      const parent=root.parent;
      if(parent?.remove)parent.remove(root);
      else if(parent?.children){const index=parent.children.indexOf(root);if(index>=0)parent.children.splice(index,1);}
      root.traverse(node=>{node.geometry?.dispose?.();const materials=node.material?(Array.isArray(node.material)?node.material:[node.material]):[];for(const material of materials)material?.dispose?.();});
    },
  };
}
