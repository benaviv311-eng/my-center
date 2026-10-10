from pathlib import Path
import re

p=Path('crazy-family/scene.js')
s=p.read_text(encoding='utf-8')

replacement=r'''function createReferenceKitchenDepth(scene){
  const group=semantic(new THREE.Group(),'reference-kitchen-depth-v040');
  // The approved image is a visual reference only: the live set stays real 3D.
  // This open-plan dining/kitchen continuation sits beyond the actual doorway gap.
  const wood=material(0xffffff,.72,{map:createProceduralTexture('wood','#8f5b3e',2,5)});
  const sage=material(0x6f8169,.82);
  const sageDark=material(0x536451,.86);
  const cream=material(0xe9d8c1,.93,{map:createProceduralTexture('plaster','#e9d8c1',2,2)});
  const brass=material(0x8a6845,.38,{metalness:.28});
  const stone=material(0xc7b39c,.58);

  const hallFloor=addPart(group,new THREE.BoxGeometry(1.65,.055,3.45),wood,{x:4.9,y:-.025,z:-5.73,id:'hall-floor-continuation'});hallFloor.receiveShadow=true;hallFloor.castShadow=false;
  addPart(group,new THREE.BoxGeometry(2.95,3.25,.11),cream,{x:4.9,y:1.625,z:-7.42,id:'kitchen-back-wall'}).receiveShadow=true;

  // Sage cabinetry and warm stone counter, inspired by the reference background.
  for(let i=0;i<4;i++){
    addPart(group,new THREE.BoxGeometry(.58,.72,.48),i%2?sageDark:sage,{x:3.92+i*.63,y:.36,z:-7.1,id:`kitchen-lower-${i+1}`});
    addPart(group,new THREE.BoxGeometry(.58,.64,.32),i%2?sage:sageDark,{x:3.92+i*.63,y:2.08,z:-7.28,id:`kitchen-upper-${i+1}`});
  }
  addPart(group,new THREE.BoxGeometry(2.55,.10,.62),stone,{x:4.86,y:.77,z:-7.04,id:'kitchen-counter'});
  addPart(group,new THREE.BoxGeometry(.72,1.86,.55),material(0xd5d1c7,.46,{metalness:.14}),{x:6.0,y:.93,z:-6.92,id:'kitchen-fridge'});
  addPart(group,new THREE.BoxGeometry(.28,.025,.18),material(0x4d5253,.3,{metalness:.42}),{x:6.0,y:1.04,z:-6.62,id:'fridge-handle'});

  // Dining table and chairs create actual parallax behind the doorway.
  const dining=semantic(new THREE.Group(),'dining-depth-set');dining.position.set(4.78,0,-5.55);
  addPart(dining,new THREE.BoxGeometry(1.45,.10,.78),wood,{y:.76,id:'dining-depth-table-top'});
  for(const x of [-.58,.58])for(const z of [-.25,.25])addPart(dining,new THREE.CylinderGeometry(.035,.055,.70,10),wood,{x,y:.35,z});
  const chairMat=material(0x8b5d40,.76,{map:createProceduralTexture('wood','#8b5d40',2,3)});
  for(const side of [-1,1]){
    const chair=semantic(new THREE.Group(),`dining-depth-chair-${side<0?'l':'r'}`);chair.position.set(side*1.05,0,.02);
    addPart(chair,new THREE.BoxGeometry(.48,.07,.45),chairMat,{y:.48});
    addPart(chair,new THREE.BoxGeometry(.48,.66,.08),chairMat,{y:.82,z:-.18});
    for(const x of [-.18,.18])for(const z of [-.15,.15])addPart(chair,new THREE.CylinderGeometry(.025,.035,.46,8),chairMat,{x,y:.23,z});
    dining.add(chair);
  }
  group.add(dining);

  // Pendant lights give the continuation the same golden-hour warmth as the reference.
  for(const x of [4.25,5.35]){
    addPart(group,new THREE.CylinderGeometry(.025,.025,.74,10),brass,{x,y:2.82,z:-5.85});
    addPart(group,new THREE.CylinderGeometry(.18,.34,.24,24,1,true),material(0x4b4038,.5),{x,y:2.38,z:-5.85});
    const bulb=addPart(group,new THREE.SphereGeometry(.055,12,10),material(0xffd09a,.3,{emissive:0xff9f45,emissiveIntensity:2.3}),{x,y:2.33,z:-5.85});bulb.castShadow=false;
  }
  const warm=new THREE.PointLight(0xffb56f,5.2,5.5,2);warm.position.set(4.8,2.35,-5.65);warm.userData.semanticId='kitchen-depth-warm-light';group.add(warm);

  // Small life details: flowers, jars and a runner rug.
  const vase=semantic(new THREE.Group(),'kitchen-vase');vase.position.set(4.6,.83,-6.78);addPart(vase,new THREE.CylinderGeometry(.07,.10,.26,14),material(0xc8a47e,.7),{y:.13});for(let i=0;i<5;i++){addPart(vase,new THREE.CylinderGeometry(.009,.009,.34,6),material(0x55704e,.92),{x:(i-2)*.025,y:.39,rz:(i-2)*.09});softEllipsoid(vase,{w:.055,h:.055,d:.055,x:(i-2)*.055,y:.56,z:(i%2)*.02,mat:material(i%2?0xe2a25f:0xd88978,.9)});}group.add(vase);
  const runnerTex=createProceduralTexture('rug','#a75f54',1,2);addPart(group,new THREE.BoxGeometry(1.05,.022,1.85),material(0xffffff,.98,{map:runnerTex}),{x:4.92,y:.012,z:-6.22,id:'hall-runner'}).receiveShadow=true;

  shadows(group,{cast:true,receive:true});scene.add(group);return group;
}'''

s,n=re.subn(r"function createReferenceKitchenDepth\(scene\)\{.*?\n\}",replacement,s,count=1,flags=re.S)
if n!=1:
    raise SystemExit(f'reference depth replacement count={n}')

# Ensure the generated reference image is not used as an in-game texture; it remains reference-only.
s=s.replace("  const loader=new THREE.TextureLoader();\n","")
s=s.replace("assets/crazy-family/reference-room-v040.webp","")
p.write_text(s,encoding='utf-8')
print('converted v0.40 reference depth to authored 3D set')
