from pathlib import Path
import re

SCENE = Path('crazy-family/scene.js')
HTML = Path('crazy-family.html')
CAMERA = Path('crazy-family/camera.js')

scene = SCENE.read_text(encoding='utf-8')
html = HTML.read_text(encoding='utf-8')
camera = CAMERA.read_text(encoding='utf-8')

if 'REFERENCE_QUALITY_HOME_V040' in scene:
    print('v0.40 reference room already applied')
    raise SystemExit(0)

scene = scene.replace(
"// CINEMATIC_LIVING_ROOM_V038 — authored home-set dressing layered over the verified v0.37 gameplay world.\n// Character assets, navigation geometry and interaction coordinates stay untouched; this module only improves how the room is rendered.\n",
"// CINEMATIC_LIVING_ROOM_V038 — authored home-set dressing layered over the verified v0.37 gameplay world.\n// Character assets, navigation geometry and interaction coordinates stay untouched; this module only improves how the room is rendered.\n// REFERENCE_QUALITY_HOME_V040 — environment-only visual upgrade based on the approved warm cinematic home reference.\n// No character art is replaced here. Libi and Dad continue to use the approved canonical sprite assets.\n"
)

needle = "function rememberBase(mesh){"
helpers = r'''function createProceduralTexture(kind, base = '#ffffff', repeatX = 1, repeatY = 1){
  const canvas=document.createElement('canvas');
  canvas.width=512;canvas.height=512;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle=base;ctx.fillRect(0,0,512,512);
  const pseudo=(x,y)=>((x*92837111+y*689287499+kind.length*283923481)>>>0)%997/997;
  if(kind==='wood'){
    const grad=ctx.createLinearGradient(0,0,512,0);
    grad.addColorStop(0,'rgba(70,35,18,.16)');grad.addColorStop(.5,'rgba(255,214,156,.08)');grad.addColorStop(1,'rgba(78,36,16,.13)');
    ctx.fillStyle=grad;ctx.fillRect(0,0,512,512);
    for(let y=8;y<512;y+=30){ctx.strokeStyle='rgba(73,39,21,.24)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,y);for(let x=0;x<=512;x+=18)ctx.lineTo(x,y+Math.sin(x*.038+y*.02)*3);ctx.stroke();}
    for(let i=0;i<18;i++){const x=pseudo(i,2)*512,y=pseudo(i,7)*512;ctx.strokeStyle='rgba(61,31,18,.22)';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,10+pseudo(i,9)*18,3+pseudo(i,11)*5,pseudo(i,13),0,Math.PI*2);ctx.stroke();}
  } else if(kind==='fabric'){
    for(let x=0;x<512;x+=4){ctx.strokeStyle=x%8?'rgba(255,255,255,.035)':'rgba(68,45,42,.045)';ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,512);ctx.stroke();}
    for(let y=0;y<512;y+=4){ctx.strokeStyle=y%8?'rgba(255,255,255,.03)':'rgba(68,45,42,.04)';ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(512,y);ctx.stroke();}
  } else if(kind==='rug'){
    ctx.strokeStyle='rgba(84,58,53,.22)';ctx.lineWidth=16;ctx.strokeRect(18,18,476,476);
    ctx.strokeStyle='rgba(238,194,145,.52)';ctx.lineWidth=5;ctx.strokeRect(39,39,434,434);
    for(let row=0;row<5;row++)for(let col=0;col<7;col++){
      const x=62+col*64,y=70+row*88,s=17+(row+col)%3*4;
      ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI/4);ctx.fillStyle=(row+col)%2?'rgba(60,112,112,.42)':'rgba(151,74,64,.42)';ctx.fillRect(-s/2,-s/2,s,s);ctx.restore();
    }
  } else if(kind==='plaster'){
    for(let i=0;i<1800;i++){const x=pseudo(i,3)*512,y=pseudo(i,5)*512,a=.012+pseudo(i,13)*.025;ctx.fillStyle=`rgba(95,67,55,${a})`;ctx.fillRect(x,y,1.2,1.2);}
  } else if(kind==='sunset'){
    const g=ctx.createLinearGradient(0,0,0,512);g.addColorStop(0,'#8ab5ca');g.addColorStop(.42,'#f1b37d');g.addColorStop(1,'#e48658');ctx.fillStyle=g;ctx.fillRect(0,0,512,512);
    const rg=ctx.createRadialGradient(125,305,8,125,305,105);rg.addColorStop(0,'rgba(255,244,188,.98)');rg.addColorStop(.18,'rgba(255,197,105,.78)');rg.addColorStop(1,'rgba(255,167,89,0)');ctx.fillStyle=rg;ctx.fillRect(0,0,512,512);
    ctx.fillStyle='rgba(73,91,72,.46)';for(let i=0;i<12;i++){const x=i*52-22,h=35+pseudo(i,17)*95;ctx.beginPath();ctx.arc(x,445-h*.25,48+pseudo(i,19)*28,0,Math.PI*2);ctx.fill();}
  }
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.repeat.set(repeatX,repeatY);
  texture.anisotropy=8;
  return texture;
}

function softEllipsoid(group,{w,h,d,x=0,y=0,z=0,rx=0,ry=0,rz=0,mat,id}){
  const mesh=addPart(group,new THREE.SphereGeometry(.5,28,18),mat,{x,y,z,rx,ry,rz,id});
  mesh.scale.set(w,h,d);
  return mesh;
}

'''
if needle not in scene:
    raise SystemExit('rememberBase anchor not found')
scene = scene.replace(needle, helpers + needle, 1)

wood_floor = r'''function createWoodFloor(def){
  const group=semantic(new THREE.Group(),'floor');
  group.position.set(def.x,0,def.z);
  const woodTex=createProceduralTexture('wood','#a86e46',3.2,7.4);
  const baseMat=material(0xffffff,.66,{map:woodTex});
  const base=addPart(group,new THREE.BoxGeometry(def.width,.095,def.depth),baseMat,{y:-.048,id:'wood-floor-base'});
  base.receiveShadow=true;base.castShadow=false;
  const seamMat=material(0x5d3927,.9);
  const seamGeo=new THREE.BoxGeometry(.012,.006,def.depth*.992);
  const seams=new THREE.InstancedMesh(seamGeo,seamMat,5);
  const dummy=new THREE.Object3D();
  for(let i=0;i<5;i++){dummy.position.set(-def.width/2+(i+1)*def.width/6,.005,0);dummy.updateMatrix();seams.setMatrixAt(i,dummy.matrix);}
  seams.instanceMatrix.needsUpdate=true;seams.receiveShadow=true;seams.castShadow=false;semantic(seams,'wood-floor-seams');group.add(seams);
  rememberBase(group);
  return group;
}'''
scene, n = re.subn(r"function createWoodFloor\(def\)\{.*?\n\}\n\nfunction createRug", wood_floor + "\n\nfunction createRug", scene, count=1, flags=re.S)
if n != 1: raise SystemExit(f'wood floor patch count={n}')

rug = r'''function createRug(def) {
  const group=semantic(new THREE.Group(),'rug');
  group.position.set(def.x,0.03,def.z);
  const rugTex=createProceduralTexture('rug','#b9685d',1,1);
  const base=addPart(group,new THREE.BoxGeometry(def.width,.038,def.depth),material(0xffffff,.98,{map:rugTex}),{id:'rug-base'});
  base.receiveShadow=true;
  const fringeMat=material(0xe3c39f,.98);
  const fringeGeo=new THREE.BoxGeometry(.035,.012,.15);
  const count=36,fringes=new THREE.InstancedMesh(fringeGeo,fringeMat,count);
  const dummy=new THREE.Object3D();
  for(let i=0;i<count;i++){
    const side=i<count/2?-1:1,j=i%(count/2);
    dummy.position.set(-def.width/2+.18+j*(def.width-.36)/(count/2-1),.008,side*(def.depth/2+.065));dummy.rotation.set(0,0,(j%3-1)*.08);dummy.updateMatrix();fringes.setMatrixAt(i,dummy.matrix);
  }
  fringes.instanceMatrix.needsUpdate=true;fringes.castShadow=false;fringes.receiveShadow=true;semantic(fringes,'rug-fringe');group.add(fringes);
  shadows(group,{cast:false,receive:true});rememberBase(group);return group;
}'''
scene, n = re.subn(r"function createRug\(def\) \{.*?\n\}\n\nfunction createSofaSet", rug + "\n\nfunction createSofaSet", scene, count=1, flags=re.S)
if n != 1: raise SystemExit(f'rug patch count={n}')

soft_sofa = r'''function createSoftSofa(def){
  const group=semantic(new THREE.Group(),'sofa');
  group.position.set(def.x,0,def.z);
  const fabricTex=createProceduralTexture('fabric','#d4a58f',7,5);
  const fabric=material(0xffffff,.94,{map:fabricTex});
  const fabricDark=material(0xb77e6e,.96,{map:createProceduralTexture('fabric','#b77e6e',7,5)});
  const cream=material(0xe5cab2,.96,{map:createProceduralTexture('fabric','#e5cab2',7,5)});
  const teal=material(0x668f8d,.95,{map:createProceduralTexture('fabric','#668f8d',7,5)});
  const wood=material(0x65412e,.68,{map:createProceduralTexture('wood','#65412e',2,3)});
  const w=def.width,d=def.depth;
  addPart(group,new THREE.BoxGeometry(w*.92,.27,d*.78),fabricDark,{y:.23,z:.04,id:'sofa-base'});
  const seatW=w*.225;
  [-.27,0,.27].forEach((p,i)=>softEllipsoid(group,{w:seatW,h:.17,d:d*.29,x:p*w*.78,y:.53,z:.10,mat:fabric,id:`sofa-seat-${i+1}`}));
  [-.29,0,.29].forEach((p,i)=>softEllipsoid(group,{w:w*.22,h:.34,d:.12,x:p*w*.72,y:.89,z:-d*.35,rx:-.12,mat:i===1?cream:fabric,id:`sofa-back-cushion-${i+1}`}));
  for(const side of [-1,1]){
    const arm=addPart(group,new THREE.CapsuleGeometry(.18,.52,8,16),fabric,{x:side*w*.44,y:.59,z:.02,rx:Math.PI/2,id:side<0?'sofa-arm-left':'sofa-arm-right'});arm.scale.z=1.55;
  }
  for(const x of [-w*.34,w*.34])for(const z of [-d*.28,d*.28])addPart(group,new THREE.CylinderGeometry(.045,.065,.16,12),wood,{x,y:.08,z});
  softEllipsoid(group,{w:.35,h:.25,d:.12,x:-.58,y:.86,z:-.19,rz:.15,mat:teal,id:'sofa-accent-cushion'});
  const blanketMat=material(0xc77767,.98,{map:createProceduralTexture('fabric','#c77767',9,7)});
  const blanket=addPart(group,new THREE.PlaneGeometry(w*.46,d*.52,12,10),blanketMat,{x:.58,y:.706,z:.19,rx:-Math.PI/2-.04,rz:-.08,id:'sofa-blanket'});blanket.castShadow=true;
  shadows(group);rememberBase(group);return group;
}'''
scene, n = re.subn(r"function createSofaSet\(def\)\{.*?\n\}\n\nfunction createCushion", soft_sofa + "\n\nfunction createCushion", scene, count=1, flags=re.S)
if n != 1: raise SystemExit(f'sofa patch count={n}')

# Make loose cushions soft as well.
scene, n = re.subn(
    r"function createCushion\(def,index\)\{.*?\n\}",
    r'''function createCushion(def,index){
  const group=semantic(new THREE.Group(),def.id);
  const colors=['#eab493','#6f9994'];
  group.position.set(def.x,.80,def.z-.04);
  const mat=material(0xffffff,.97,{map:createProceduralTexture('fabric',colors[index%colors.length],6,6)});
  softEllipsoid(group,{w:def.width*.57,h:.28,d:.12,rz:index?-.10:.09,mat,id:`${def.id}-body`});
  shadows(group);rememberBase(group);return group;
}''',
    scene,count=1,flags=re.S)
if n != 1: raise SystemExit(f'cushion patch count={n}')

walls = r'''function addWalls(scene) {
  const wallTex=createProceduralTexture('plaster','#e9cdb7',2.2,1.4);
  const wallMat=material(0xffffff,.96,{map:wallTex});
  const makeWall=(id,w,h,x,y,z,d=.16)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),wallMat);m.position.set(x,y,z);m.receiveShadow=true;m.userData.semanticId=id;m.userData.cameraBlocker=true;scene.add(m);return m;};
  // Real opening at the doorway: the old prototype drew one solid back wall behind the frame.
  const leftEdge=-6.2,doorLeft=4.15,doorRight=5.65,rightEdge=6.2;
  makeWall('back-wall-left',doorLeft-leftEdge,3.7,(leftEdge+doorLeft)/2,1.85,-4.62);
  makeWall('back-wall-right',rightEdge-doorRight,3.7,(doorRight+rightEdge)/2,1.85,-4.62);
  makeWall('back-wall-over-door',doorRight-doorLeft,1.25,(doorLeft+doorRight)/2,3.075,-4.62);
  const left=new THREE.Mesh(new THREE.BoxGeometry(.16,3.7,9.2),wallMat);left.position.set(-6.08,1.85,0);left.receiveShadow=true;left.userData.semanticId='left-wall';left.userData.cameraBlocker=true;scene.add(left);
  const rightRear=new THREE.Mesh(new THREE.BoxGeometry(.16,3.7,3.6),wallMat);rightRear.position.set(6.08,1.85,2.7);rightRear.receiveShadow=true;rightRear.userData.semanticId='right-wall';rightRear.userData.cameraBlocker=true;scene.add(rightRear);
}'''
scene, n = re.subn(r"function addWalls\(scene\) \{.*?\n\}\n\nfunction createWindowSet", walls + "\n\nfunction createWindowSet", scene, count=1, flags=re.S)
if n != 1: raise SystemExit(f'walls patch count={n}')

window = r'''function createGoldenHourWindow(scene){
  const group=semantic(new THREE.Group(),'window-set');
  group.position.set(-3.75,2.18,-4.515);
  const frame=material(0xf8ead7,.78);
  const viewTex=createProceduralTexture('sunset','#efad76',1,1);
  const viewMat=new THREE.MeshBasicMaterial({map:viewTex,toneMapped:false});
  const w=2.55,h=1.52,bar=.10;
  addPart(group,new THREE.PlaneGeometry(w,h),viewMat,{z:.016,id:'window-sunset-view'});
  addPart(group,new THREE.BoxGeometry(w,bar,.10),frame,{y:h/2,id:'window-frame-top'});
  addPart(group,new THREE.BoxGeometry(w,bar,.10),frame,{y:-h/2,id:'window-frame-bottom'});
  addPart(group,new THREE.BoxGeometry(bar,h,.10),frame,{x:-w/2,id:'window-frame-left'});
  addPart(group,new THREE.BoxGeometry(bar,h,.10),frame,{x:w/2,id:'window-frame-right'});
  addPart(group,new THREE.BoxGeometry(bar*.65,h,.08),frame,{id:'window-frame-center'});
  addPart(group,new THREE.BoxGeometry(w,bar*.65,.08),frame,{id:'window-frame-cross'});
  addPart(group,new THREE.BoxGeometry(w+.32,.12,.38),material(0xd8bfa6,.88),{y:-h/2-.13,z:.13,id:'window-sill'});
  const curtainMat=material(0xffffff,.99,{map:createProceduralTexture('fabric','#d99c83',10,5),side:THREE.DoubleSide});
  for(const side of [-1,1]){
    const geo=new THREE.PlaneGeometry(.7,h*1.42,8,18);
    const pos=geo.attributes.position;
    for(let i=0;i<pos.count;i++){const yy=pos.getY(i),xx=pos.getX(i);pos.setZ(i,Math.sin((xx+.35)*18+yy*2.7)*.045);}
    pos.needsUpdate=true;geo.computeVertexNormals();
    const curtain=new THREE.Mesh(geo,curtainMat);semantic(curtain,side<0?'curtain-left':'curtain-right');curtain.position.set(side*(w/2+.33),-.08,.18);curtain.rotation.y=side*.08;group.add(curtain);
  }
  shadows(group,{cast:true,receive:true});scene.add(group);return group;
}'''
scene, n = re.subn(r"function createWindowSet\(scene\)\{.*?\n\}\n\nfunction createRoomDetails", window + "\n\nfunction createRoomDetails", scene, count=1, flags=re.S)
if n != 1: raise SystemExit(f'window patch count={n}')

family_details = r'''function createFamilyLifeDetails(scene){
  const details=semantic(new THREE.Group(),'room-details');
  const baseboardMat=material(0xf0dac2,.88);
  addPart(details,new THREE.BoxGeometry(10.15,.17,.09),baseboardMat,{x:-.925,y:.09,z:-4.49,id:'baseboard-back-left'});
  addPart(details,new THREE.BoxGeometry(.09,.17,9.0),baseboardMat,{x:-5.97,y:.09,id:'baseboard-left'});

  const plant=semantic(new THREE.Group(),'plant');plant.position.set(-5.18,0,-3.62);
  addPart(plant,new THREE.CylinderGeometry(.23,.31,.45,20),material(0xb96f4d,.92),{y:.225,id:'plant-pot'});
  const leafMat=material(0x527951,.9);for(let i=0;i<10;i++){const a=i*.9,r=.12+(i%3)*.08;const leaf=new THREE.Mesh(new THREE.SphereGeometry(.22,16,10),leafMat);leaf.position.set(Math.cos(a)*r,.58+(i%5)*.11,Math.sin(a)*r);leaf.scale.set(.7,1.55,.28);leaf.rotation.z=Math.cos(a)*.45;plant.add(leaf);}details.add(plant);

  const shelf=semantic(new THREE.Group(),'family-shelf');shelf.position.set(-.95,0,-4.40);
  const wood=material(0x80563c,.72,{map:createProceduralTexture('wood','#80563c',2,2)});
  addPart(shelf,new THREE.BoxGeometry(2.05,.11,.28),wood,{y:1.62,id:'shelf-top'});addPart(shelf,new THREE.BoxGeometry(2.05,.09,.28),wood,{y:.93,id:'shelf-mid'});
  for(const x of [-.95,.95])addPart(shelf,new THREE.BoxGeometry(.1,1.5,.26),wood,{x,y:.92});
  const bookColors=[0x587f88,0xb86755,0xd0a350,0x6d8d66,0x8a6c94];for(let i=0;i<12;i++)addPart(shelf,new THREE.BoxGeometry(.1+.03*(i%2),.34+.05*(i%3),.19),material(bookColors[i%bookColors.length],.88),{x:-.72+i*.13,y:.28+(i%2)*.64,z:.02,rz:(i%3-1)*.04,id:`shelf-book-${i}`});
  details.add(shelf);

  const gallery=semantic(new THREE.Group(),'family-gallery');gallery.position.set(-.2,0,-4.49);
  const frames=[[-1.1,2.68,.66,.48],[0,2.73,.86,.6],[1.05,2.55,.62,.76],[1.78,2.72,.46,.56]];
  frames.forEach((f,i)=>{const g=semantic(new THREE.Group(),`family-frame-${i+1}`);g.position.set(f[0],f[1],0);addPart(g,new THREE.BoxGeometry(f[2],f[3],.055),material(i%2?0x6d4a35:0x8e6547,.66));addPart(g,new THREE.BoxGeometry(f[2]-.12,f[3]-.12,.032),material([0xd9aa87,0x8ca7a2,0xdcc48a,0xb98579][i],.92),{z:.035});gallery.add(g);});details.add(gallery);

  const drawingMat=material(0xf9edc9,.98);const crayon=[0xd5685e,0x5b9ab3,0x78a66c,0xe3b85c];for(let i=0;i<4;i++){const drawing=semantic(new THREE.Group(),`child-drawing-${i+1}`);drawing.position.set(1.9+i*.48,1.92+(i%2)*.25,-4.495);addPart(drawing,new THREE.BoxGeometry(.39,.31,.025),drawingMat);addPart(drawing,new THREE.TorusGeometry(.075,.015,6,18),material(crayon[i],.9),{z:.022,ry:.1*i});details.add(drawing);}

  const basket=semantic(new THREE.Group(),'toy-basket');basket.position.set(4.45,0,3.47);addPart(basket,new THREE.CylinderGeometry(.43,.36,.44,20,1,true),material(0xb98c61,.96),{y:.22,id:'toy-basket-body'});addPart(basket,new THREE.TorusGeometry(.28,.035,8,24,Math.PI),material(0x8f6748,.82),{y:.47,rx:Math.PI/2,id:'toy-basket-handle'});details.add(basket);

  const plush=semantic(new THREE.Group(),'plush-bear');plush.position.set(2.15,0,2.55);const plushMat=material(0xba7f55,.98,{map:createProceduralTexture('fabric','#ba7f55',7,7)});softEllipsoid(plush,{w:.23,h:.28,d:.18,y:.3,mat:plushMat});softEllipsoid(plush,{w:.18,h:.18,d:.15,y:.61,mat:plushMat});softEllipsoid(plush,{w:.07,h:.08,d:.05,x:-.14,y:.73,mat:plushMat});softEllipsoid(plush,{w:.07,h:.08,d:.05,x:.14,y:.73,mat:plushMat});details.add(plush);

  shadows(details);scene.add(details);return details;
}

function createReferenceKitchenDepth(scene){
  const group=semantic(new THREE.Group(),'reference-kitchen-depth-v040');
  const loader=new THREE.TextureLoader();
  const texture=loader.load('assets/crazy-family/reference-room-v040.webp');
  texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.ClampToEdgeWrapping;texture.repeat.set(.44,.82);texture.offset.set(.50,.08);texture.anisotropy=8;
  const matte=new THREE.Mesh(new THREE.PlaneGeometry(2.7,2.48),new THREE.MeshBasicMaterial({map:texture,toneMapped:false}));
  matte.position.set(4.9,1.24,-5.35);semantic(matte,'reference-kitchen-matte');group.add(matte);
  const floorTex=createProceduralTexture('wood','#9d633f',2,4);const floor=new THREE.Mesh(new THREE.PlaneGeometry(1.62,2.1),material(0xffffff,.72,{map:floorTex,side:THREE.DoubleSide}));floor.rotation.x=-Math.PI/2;floor.position.set(4.9,.006,-5.24);floor.receiveShadow=true;semantic(floor,'hall-floor-continuation');group.add(floor);
  const warm=new THREE.PointLight(0xffb56f,4.6,4.2,2);warm.position.set(4.65,2.15,-4.9);warm.userData.semanticId='kitchen-depth-warm-light';group.add(warm);
  scene.add(group);return group;
}'''
scene, n = re.subn(r"function createRoomDetails\(scene\)\{.*?\n\}\n\nexport function createLivingRoomScene", family_details + "\n\nexport function createLivingRoomScene", scene, count=1, flags=re.S)
if n != 1: raise SystemExit(f'details patch count={n}')

scene = scene.replace("renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));","renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2.25));",1)
scene = scene.replace("renderer.toneMappingExposure = 1.08;","renderer.toneMappingExposure = 1.16;",1)
scene = scene.replace("scene.background = new THREE.Color(0xd9c4aa);","scene.background = new THREE.Color(0xb88668);",1)
scene = scene.replace("scene.fog = new THREE.Fog(0xd9c4aa, 13, 26);","scene.fog = new THREE.Fog(0xc39778, 15, 29);",1)
scene = scene.replace("const hemi = new THREE.HemisphereLight(0xfff4dc, 0x59606b, 1.08);","const hemi = new THREE.HemisphereLight(0xfff0d8, 0x4e5960, 1.22);",1)
scene = scene.replace("const windowLight = new THREE.DirectionalLight(0xffc486, 3.35);","const windowLight = new THREE.DirectionalLight(0xffc07d, 3.65);",1)
scene = scene.replace("const windowBounce=new THREE.PointLight(0xffddb6,7.5,8.5,2);","const windowBounce=new THREE.PointLight(0xffd5aa,5.4,8.5,2);",1)
scene = scene.replace("const practical = new THREE.PointLight(0xffad58, 19, 7, 2);","const practical = new THREE.PointLight(0xffa85a, 12.5, 7, 2);",1)
scene = scene.replace("else if(def.id==='sofa')object=createSofaSet(def);","else if(def.id==='sofa')object=createSoftSofa(def);",1)
scene = scene.replace("  createWindowSet(scene);\n  createRoomDetails(scene);","  createGoldenHourWindow(scene);\n  createFamilyLifeDetails(scene);\n  createReferenceKitchenDepth(scene);",1)

if 'createSoftSofa(def)' not in scene or 'createReferenceKitchenDepth(scene)' not in scene:
    raise SystemExit('v0.40 scene wiring failed')

html = re.sub(r"(עולם הבית · שלב 1: מפגש אבא · )v0\.\d+", r"\1v0.40", html, count=1)

camera = camera.replace("exploreOffset: { x: 2.35, y: 3.15, z: 5.75 },","exploreOffset: { x: 1.9, y: 2.05, z: 4.5 },",1)
camera = camera.replace("chaseOffset: { x: 2.9, y: 3.65, z: 7.25 },","chaseOffset: { x: 2.35, y: 2.55, z: 5.85 },",1)
camera = camera.replace("interactionOffset: { x: 1.75, y: 2.7, z: 4.55 },","interactionOffset: { x: 1.45, y: 1.82, z: 3.75 },",1)
camera = camera.replace("cinematicOffset: { x: -2.6, y: 3.3, z: 5.8 },","cinematicOffset: { x: -2.15, y: 2.35, z: 4.9 },",1)
camera = camera.replace("targetHeight: 0.82,","targetHeight: 0.72,",1)

SCENE.write_text(scene,encoding='utf-8')
HTML.write_text(html,encoding='utf-8')
CAMERA.write_text(camera,encoding='utf-8')
print('applied Crazy Family v0.40 reference-quality room')
