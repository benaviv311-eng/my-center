import * as THREE from 'three';

// CINEMATIC_LIVING_ROOM_V038 — authored home-set dressing layered over the verified v0.37 gameplay world.
// Character assets, navigation geometry and interaction coordinates stay untouched; this module only improves how the room is rendered.
// REFERENCE_QUALITY_HOME_V040 — environment-only visual upgrade based on the approved warm cinematic home reference.
// No character art is replaced here. Libi and Dad continue to use the approved canonical sprite assets.

function material(color, roughness = 0.72, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.02, ...extra });
}

function createProceduralTexture(kind, base = '#ffffff', repeatX = 1, repeatY = 1){
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

function rememberBase(mesh){
  mesh.userData.movieSetBase={
    position:mesh.position.clone(),
    rotation:mesh.rotation.clone(),
    scale:mesh.scale.clone(),
  };
  return mesh;
}

function semantic(object, id){
  object.name=id;
  object.userData.semanticId=id;
  return object;
}

function shadows(object, {cast=true, receive=true}={}){
  object.traverse(node=>{
    if(!node.isMesh)return;
    node.castShadow=cast;
    node.receiveShadow=receive;
  });
  return object;
}

function addPart(group, geometry, mat, {x=0,y=0,z=0,rx=0,ry=0,rz=0,id=null}={}){
  const mesh=new THREE.Mesh(geometry,mat);
  mesh.position.set(x,y,z);
  mesh.rotation.set(rx,ry,rz);
  if(id)semantic(mesh,id);
  group.add(mesh);
  return mesh;
}

function createBoxMesh(def) {
  const geometry = new THREE.BoxGeometry(def.width, def.height, def.depth);
  const mesh = new THREE.Mesh(geometry, material(def.color ?? 0x9b765f));
  semantic(mesh,def.id);
  mesh.position.set(def.x, def.y, def.z);
  mesh.castShadow = def.id !== 'floor' && def.id !== 'rug';
  mesh.receiveShadow = true;
  return rememberBase(mesh);
}

function createWoodFloor(def){
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
}

function createRug(def) {
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
}

function createSoftSofa(def){
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
}

function createCushion(def,index){
  const group=semantic(new THREE.Group(),def.id);
  const colors=['#eab493','#6f9994'];
  group.position.set(def.x,.80,def.z-.04);
  const mat=material(0xffffff,.97,{map:createProceduralTexture('fabric',colors[index%colors.length],6,6)});
  softEllipsoid(group,{w:def.width*.57,h:.28,d:.12,rz:index?-.10:.09,mat,id:`${def.id}-body`});
  shadows(group);rememberBase(group);return group;
}

function createCoffeeTableSet(def){
  const group=semantic(new THREE.Group(),'coffee-table');
  group.position.set(def.x,0,def.z);
  const topMat=material(0xa96f49,0.66);
  const legMat=material(0x6e4935,0.74);
  addPart(group,new THREE.BoxGeometry(def.width,.13,def.depth),topMat,{y:def.height-.065,id:'coffee-table-top'});
  const legX=def.width*.38,legZ=def.depth*.34;
  let n=0;
  for(const x of [-legX,legX])for(const z of [-legZ,legZ]){
    addPart(group,new THREE.BoxGeometry(.14,def.height-.13,.14),legMat,{x,y:(def.height-.13)/2,z,id:`coffee-table-leg-${++n}`});
  }
  addPart(group,new THREE.BoxGeometry(def.width*.72,.055,def.depth*.66),material(0x86593f,0.8),{y:.18,id:'coffee-table-lower-shelf'});
  shadows(group);
  rememberBase(group);
  return group;
}

function createToyBall(def){
  const group=semantic(new THREE.Group(),'toy-ball');
  group.position.set(def.x,def.height/2,def.z);
  const ball=addPart(group,new THREE.SphereGeometry(def.width/2,24,16),material(0xf0ba48,0.55),{id:'toy-ball-body'});
  addPart(group,new THREE.TorusGeometry(def.width*.37,.018,8,32),material(0xd55f55,0.5),{rx:Math.PI/2,ry:.3,id:'toy-ball-stripe'});
  shadows(group);
  rememberBase(group);
  return group;
}

function createDoorway(def){
  const group=semantic(new THREE.Group(),'doorway');
  group.position.set(def.x,0,def.z);
  const frameMat=material(def.color??0x79543f,0.72);
  const postW=.16;
  addPart(group,new THREE.BoxGeometry(postW,def.height,.18),frameMat,{x:-def.width/2+postW/2,y:def.height/2,id:'doorway-post-left'});
  addPart(group,new THREE.BoxGeometry(postW,def.height,.18),frameMat,{x:def.width/2-postW/2,y:def.height/2,id:'doorway-post-right'});
  addPart(group,new THREE.BoxGeometry(def.width,.17,.2),frameMat,{y:def.height-.085,id:'doorway-lintel'});
  addPart(group,new THREE.BoxGeometry(def.width*.92,.035,.28),material(0xb4865f,0.85),{y:.018,z:.02,id:'doorway-threshold'}).receiveShadow=true;
  shadows(group);
  rememberBase(group);
  return group;
}

function createSideTable(def){
  const group=semantic(new THREE.Group(),'side-table');
  group.position.set(def.x,0,def.z);
  const topMat=material(0x986448,0.68),legMat=material(0x674434,0.76);
  addPart(group,new THREE.CylinderGeometry(def.width*.5,def.width*.5,.12,24),topMat,{y:def.height-.06,id:'side-table-top'});
  addPart(group,new THREE.CylinderGeometry(.09,.12,def.height-.12,14),legMat,{y:(def.height-.12)/2,id:'side-table-pedestal'});
  addPart(group,new THREE.CylinderGeometry(.3,.36,.07,18),legMat,{y:.04,id:'side-table-foot'});
  shadows(group);
  rememberBase(group);
  return group;
}

function createLampSet(def){
  const group=semantic(new THREE.Group(),'lamp');
  group.position.set(def.x,0,def.z);
  const metal=material(0x806552,0.42,{metalness:.25});
  const shade=material(0xf0cf91,0.88,{emissive:0x8b4b21,emissiveIntensity:.14});
  addPart(group,new THREE.CylinderGeometry(.16,.21,.08,20),metal,{y:.04,id:'lamp-base'});
  addPart(group,new THREE.CylinderGeometry(.027,.027,1.22,12),metal,{y:.66,id:'lamp-pole'});
  addPart(group,new THREE.CylinderGeometry(.25,.42,.48,24,1,true),shade,{y:1.43,id:'lamp-shade'});
  addPart(group,new THREE.SphereGeometry(.07,14,10),material(0xffd99c,.35,{emissive:0xffa84c,emissiveIntensity:2.1}),{y:1.34,id:'lamp-bulb'});
  shadows(group);
  rememberBase(group);
  return group;
}

function createToyBlocks(def){
  const group=semantic(new THREE.Group(),'toy-blocks');
  group.position.set(def.x,0,def.z);
  const colors=[0x6ba6b8,0xe7896e,0xe1bd56,0x7eb178,0x9a78b5];
  const positions=[[-.28,.11,-.12],[.02,.1,.14],[.28,.12,-.04],[-.05,.31,-.1],[.22,.31,.15]];
  positions.forEach((p,i)=>{
    addPart(group,new THREE.BoxGeometry(.22+i%2*.03,.2,.22),material(colors[i],.86),{x:p[0],y:p[1],z:p[2],ry:i*.21,id:`toy-block-${i+1}`});
  });
  shadows(group);
  rememberBase(group);
  return group;
}

function addWalls(scene) {
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
}

function createGoldenHourWindow(scene){
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
}

function createFamilyLifeDetails(scene){
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
}

export function createLivingRoomScene({ canvas, world }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2.25));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.16;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xb88668);
  scene.fog = new THREE.Fog(0xc39778, 15, 29);

  const camera = new THREE.PerspectiveCamera(48, 16 / 10, 0.05, 60);
  camera.position.set(2.35, 3.97, 5.75);
  camera.lookAt(0, 0.82, 0);

  const hemi = new THREE.HemisphereLight(0xfff0d8, 0x4e5960, 1.22);
  scene.add(hemi);

  // warm-window-light: cinematic late-afternoon key shared by room and characters.
  const windowLight = new THREE.DirectionalLight(0xffc07d, 3.65);
  windowLight.name = 'warm-window-light';
  windowLight.userData.semanticId = 'warm-window-light';
  windowLight.position.set(-4.7, 6.4, 3.2);
  windowLight.castShadow = true;
  windowLight.shadow.mapSize.set(2048, 2048);
  windowLight.shadow.camera.left = -8;
  windowLight.shadow.camera.right = 8;
  windowLight.shadow.camera.top = 8;
  windowLight.shadow.camera.bottom = -8;
  windowLight.shadow.bias=-0.0006;
  scene.add(windowLight);

  const windowBounce=new THREE.PointLight(0xffd5aa,5.4,8.5,2);
  windowBounce.position.set(-3.8,2.5,-3.9);
  windowBounce.userData.semanticId='window-bounce-light';
  scene.add(windowBounce);

  // warm-practical-light: lamp glow creates the inhabited-home feel.
  const practical = new THREE.PointLight(0xffa85a, 12.5, 7, 2);
  practical.name = 'warm-practical-light';
  practical.userData.semanticId = 'warm-practical-light';
  practical.position.set(-5.0, 1.45, 0.25);
  practical.castShadow = false;
  scene.add(practical);

  const objectsById = new Map();
  for (const def of world.objects) {
    let object=null;
    if(def.id==='floor')object=createWoodFloor(def);
    else if(def.id==='rug')object=createRug(def);
    else if(def.id==='sofa')object=createSoftSofa(def);
    else if(def.id==='coffee-table')object=createCoffeeTableSet(def);
    else if(def.id==='toy-ball')object=createToyBall(def);
    else if(def.id==='doorway')object=createDoorway(def);
    else if(def.id==='side-table')object=createSideTable(def);
    else if(def.id==='lamp')object=createLampSet(def);
    else if(def.id==='cushion-a')object=createCushion(def,0);
    else if(def.id==='cushion-b')object=createCushion(def,1);
    else if(def.id==='toy-blocks')object=createToyBlocks(def);
    else object=createBoxMesh(def);
    scene.add(object);
    objectsById.set(def.id, object);
  }

  addWalls(scene);
  createGoldenHourWindow(scene);
  createFamilyLifeDetails(scene);
  createReferenceKitchenDepth(scene);

  const headphonesGroup = new THREE.Group();
  headphonesGroup.name = 'headphones';
  headphonesGroup.userData.semanticId = 'headphones';
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.035, 8, 24, Math.PI), material(0x30445a, 0.35));
  band.rotation.z = Math.PI;
  band.position.y = 0.09;
  const cupGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.08, 16);
  const cupMat = material(0x243343, 0.32);
  const cupL = new THREE.Mesh(cupGeo, cupMat);
  const cupR = new THREE.Mesh(cupGeo, cupMat);
  cupL.rotation.z = Math.PI / 2;
  cupR.rotation.z = Math.PI / 2;
  cupL.position.set(-0.18, 0, 0);
  cupR.position.set(0.18, 0, 0);
  headphonesGroup.add(band, cupL, cupR);
  headphonesGroup.position.set(-4.15, 1.02, 0.1);
  headphonesGroup.rotation.y = -0.35;
  headphonesGroup.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  rememberBase(headphonesGroup);
  scene.add(headphonesGroup);
  objectsById.set('headphones', headphonesGroup);

  let faded = new Set();

  function resize(width, height) {
    const w = Math.max(1, Math.floor(width));
    const h = Math.max(1, Math.floor(height));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function setObjectOpacity(id, value) {
    const object = objectsById.get(id) || scene.getObjectByName(id);
    if (!object) return false;
    const opacity = Math.max(0, Math.min(1, value));
    object.traverse(node => {
      if (!node.isMesh || !node.material) return;
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      for (const mat of materials) {
        mat.transparent = opacity < 0.999;
        mat.opacity = opacity;
        mat.depthWrite = opacity >= 0.999;
      }
    });
    return true;
  }

  function applyCameraPose(pose, shake = 0, now = 0) {
    if (!pose) return camera;
    const sx=Math.sin(now*.041)*shake*.08,sy=Math.cos(now*.053)*shake*.055,sz=Math.sin(now*.067+.8)*shake*.07;
    camera.position.set(pose.position.x+sx, pose.position.y+sy, pose.position.z+sz);
    camera.fov = pose.fov;
    camera.updateProjectionMatrix();
    camera.lookAt(pose.target.x, pose.target.y, pose.target.z);
    return camera;
  }

  function setOccluders(ids = []) {
    const next = new Set(ids);
    for (const id of faded) if (!next.has(id)) setObjectOpacity(id, 1);
    for (const id of next) setObjectOpacity(id, 0.75);
    faded = next;
  }

  function applyReactiveTransforms(controller){
    if(!controller?.transforms)return;
    for(const [id,t] of Object.entries(controller.transforms)){
      const object=objectsById.get(id);if(!object)continue;
      const base=object.userData.movieSetBase;if(!base)continue;
      object.position.set(base.position.x+(t.x||0),base.position.y+(t.y||0),base.position.z+(t.z||0));
      object.rotation.set(base.rotation.x+(t.rotX||0),base.rotation.y+(t.rotY||0),base.rotation.z+(t.rotZ||0));
      object.scale.set(base.scale.x,base.scale.y*(t.scaleY??1),base.scale.z);
    }
  }

  return {
    scene,
    renderer,
    camera,
    objectsById,
    render(cameraLike = camera) {
      if (cameraLike?.isCamera) renderer.render(scene, cameraLike);
      else renderer.render(scene, camera);
    },
    resize,
    setObjectOpacity,
    applyCameraPose,
    setOccluders,
    applyReactiveTransforms,
    dispose() {
      for (const id of faded) setObjectOpacity(id, 1);
      scene.traverse(object => {
        if (object.geometry) object.geometry.dispose?.();
        const mats = object.material ? (Array.isArray(object.material) ? object.material : [object.material]) : [];
        for (const mat of mats) mat.dispose?.();
      });
      renderer.dispose();
    },
  };
}
