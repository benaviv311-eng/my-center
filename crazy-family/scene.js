import * as THREE from 'three';

// CINEMATIC_LIVING_ROOM_V038 — authored home-set dressing layered over the verified v0.37 gameplay world.
// Character assets, navigation geometry and interaction coordinates stay untouched; this module only improves how the room is rendered.

function material(color, roughness = 0.72, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.02, ...extra });
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
  const base=addPart(group,new THREE.BoxGeometry(def.width,0.1,def.depth),material(0x5f3f2f,0.82),{y:-0.06,id:'wood-floor-base'});
  base.receiveShadow=true;base.castShadow=false;

  const cols=6,rows=15;
const plankW=def.width/cols-0.055;
const plankD=def.depth/rows-0.035;
const plankColors=[0x9f714d,0x956746,0xaa7950,0x8e6144];
const plankGeometry=new THREE.BoxGeometry(plankW,0.022,plankD);
const plankMaterial=material(0xffffff,0.76);
const planks=new THREE.InstancedMesh(plankGeometry,plankMaterial,cols*rows);
semantic(planks,'wood-floor-planks');
const dummy=new THREE.Object3D();
let instance=0;
for(let row=0;row<rows;row++){
  for(let col=0;col<cols;col++){
    dummy.position.set(
      -def.width/2+plankW/2+0.04+col*(def.width/cols),
      0.006,
      -def.depth/2+plankD/2+0.025+row*(def.depth/rows)
    );
    dummy.rotation.set(0,0,0);
    dummy.updateMatrix();
    planks.setMatrixAt(instance,dummy.matrix);
    planks.setColorAt(instance,new THREE.Color(plankColors[(row*3+col)%plankColors.length]));
    instance++;
  }
}
planks.instanceMatrix.needsUpdate=true;
if(planks.instanceColor)planks.instanceColor.needsUpdate=true;
planks.receiveShadow=true;
planks.castShadow=false;
group.add(planks);
rememberBase(group);
  return group;
}

function createRug(def) {
  const group=semantic(new THREE.Group(),'rug');
  group.position.set(def.x,0.026,def.z);
  const baseMat=material(def.color,0.98);
  const trimMat=material(0xe0aa86,0.98);
  const innerMat=material(0x8d4c49,0.98);
  addPart(group,new THREE.BoxGeometry(def.width,def.height,def.depth),baseMat,{id:'rug-base'}).receiveShadow=true;
  const inset=.13,h=.014;
  addPart(group,new THREE.BoxGeometry(def.width-inset*2,h,.055),trimMat,{y:.02,z:def.depth/2-inset,id:'rug-border-top'});
  addPart(group,new THREE.BoxGeometry(def.width-inset*2,h,.055),trimMat,{y:.02,z:-def.depth/2+inset,id:'rug-border-bottom'});
  addPart(group,new THREE.BoxGeometry(.055,h,def.depth-inset*2),trimMat,{y:.02,x:def.width/2-inset,id:'rug-border-right'});
  addPart(group,new THREE.BoxGeometry(.055,h,def.depth-inset*2),trimMat,{y:.02,x:-def.width/2+inset,id:'rug-border-left'});
  for(let i=-2;i<=2;i++)addPart(group,new THREE.BoxGeometry(.045,h,def.depth*.62),innerMat,{x:i*.72,y:.021,rz:i*.012});
  shadows(group,{cast:false,receive:true});
  rememberBase(group);
  return group;
}

function createSofaSet(def){
  const group=semantic(new THREE.Group(),'sofa');
  group.position.set(def.x,0,def.z);
  const upholstery=material(def.color ?? 0xc97e78,0.92);
  const upholsteryDark=material(0xa85f5c,0.94);
  const wood=material(0x5b4032,0.72);
  const w=def.width,d=def.depth;

  addPart(group,new THREE.BoxGeometry(w*.94,.34,d*.9),upholsteryDark,{y:.26,z:.02,id:'sofa-base'});
  addPart(group,new THREE.BoxGeometry(w*.78,.24,d*.68),upholstery,{y:.53,z:.09,id:'sofa-seat'});
  addPart(group,new THREE.BoxGeometry(w*.92,.78,.22),upholstery,{y:.86,z:-d*.41,rx:-.04,id:'sofa-back'});
  addPart(group,new THREE.BoxGeometry(.28,.7,d*.88),upholstery,{x:-w*.43,y:.57,z:.04,id:'sofa-arm-left'});
  addPart(group,new THREE.BoxGeometry(.28,.7,d*.88),upholstery,{x:w*.43,y:.57,z:.04,id:'sofa-arm-right'});
  for(const x of [-w*.35,w*.35])for(const z of [-d*.31,d*.31]){
    const foot=addPart(group,new THREE.CylinderGeometry(.055,.075,.18,10),wood,{x,y:.09,z});
    foot.castShadow=true;
  }
  const blanket=addPart(group,new THREE.BoxGeometry(w*.42,.035,d*.54),material(0xe7c894,0.98),{x:.36,y:.69,z:.18,rx:.04,rz:-.055,id:'sofa-blanket'});
  blanket.castShadow=true;
  shadows(group);
  rememberBase(group);
  return group;
}

function createCushion(def,index){
  const group=semantic(new THREE.Group(),def.id);
  const colors=[0xe7b18f,0x86b5ad];
  group.position.set(def.x,.79,def.z-.03);
  const cushion=addPart(group,new THREE.BoxGeometry(def.width,.5,.2),material(colors[index%colors.length],0.98),{rz:index?-.08:.07,id:`${def.id}-body`});
  cushion.scale.set(1,.86,1.05);
  shadows(group);
  rememberBase(group);
  return group;
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
  const wallMat = material(0xf0ddc4,0.93);
  const back = new THREE.Mesh(new THREE.BoxGeometry(12.4, 3.7, 0.16), wallMat);
  back.position.set(0, 1.85, -4.62);
  back.receiveShadow = true;
  back.userData.semanticId = 'back-wall';
  back.userData.cameraBlocker = true;
  scene.add(back);

  const left = new THREE.Mesh(new THREE.BoxGeometry(0.16, 3.7, 9.2), wallMat);
  left.position.set(-6.08, 1.85, 0);
  left.receiveShadow = true;
  left.userData.semanticId = 'left-wall';
  left.userData.cameraBlocker = true;
  scene.add(left);

  const rightRear = new THREE.Mesh(new THREE.BoxGeometry(0.16, 3.7, 3.6), wallMat);
  rightRear.position.set(6.08, 1.85, 2.7);
  rightRear.receiveShadow = true;
  rightRear.userData.semanticId = 'right-wall';
  rightRear.userData.cameraBlocker = true;
  scene.add(rightRear);
}

function createWindowSet(scene){
  const group=semantic(new THREE.Group(),'window-set');
  group.position.set(-3.75,2.22,-4.515);
  const frame=material(0xf6ead8,0.82);
  const glass=new THREE.MeshPhysicalMaterial({color:0xb9d9e7,roughness:.12,metalness:0,transparent:true,opacity:.38,transmission:.16,depthWrite:false});
  const w=2.45,h=1.42,bar=.105;
  addPart(group,new THREE.BoxGeometry(w,h,.035),glass,{z:.015,id:'window-glass'});
  addPart(group,new THREE.BoxGeometry(w,bar,.11),frame,{y:h/2,id:'window-frame-top'});
  addPart(group,new THREE.BoxGeometry(w,bar,.11),frame,{y:-h/2,id:'window-frame-bottom'});
  addPart(group,new THREE.BoxGeometry(bar,h,.11),frame,{x:-w/2,id:'window-frame-left'});
  addPart(group,new THREE.BoxGeometry(bar,h,.11),frame,{x:w/2,id:'window-frame-right'});
  addPart(group,new THREE.BoxGeometry(bar*.72,h,.09),frame,{id:'window-frame-center'});
  addPart(group,new THREE.BoxGeometry(w,bar*.7,.09),frame,{id:'window-frame-cross'});
  semantic(group,'window-frame');
  addPart(group,new THREE.BoxGeometry(w+.28,.11,.34),material(0xd7c2a8,0.9),{y:-h/2-.12,z:.12,id:'window-sill'});

  const curtainMat=material(0xc88f79,0.98);
  for(const side of [-1,1]){
    const curtain=semantic(new THREE.Group(),side<0?'curtain-left':'curtain-right');
    curtain.position.set(side*(w/2+.35),-.02,.14);
    for(let i=0;i<4;i++){
      addPart(curtain,new THREE.BoxGeometry(.13,h*1.35,.09),curtainMat,{x:(i-1.5)*.1,y:-.14,z:Math.sin(i)*.018,rz:side*.018*(i-1.5)});
    }
    group.add(curtain);
  }
  shadows(group,{cast:true,receive:true});
  scene.add(group);
  return group;
}

function createRoomDetails(scene){
  const details=semantic(new THREE.Group(),'room-details');
  const baseboardMat=material(0xe9d5bc,0.9);
  addPart(details,new THREE.BoxGeometry(12.05,.16,.09),baseboardMat,{y:.09,z:-4.49,id:'baseboard-back'});
  addPart(details,new THREE.BoxGeometry(.09,.16,9.0),baseboardMat,{x:-5.97,y:.09,id:'baseboard-left'});

  const plant=semantic(new THREE.Group(),'plant');
  plant.position.set(-5.22,0,-3.75);
  addPart(plant,new THREE.CylinderGeometry(.24,.31,.46,18),material(0xb66f4d,0.92),{y:.23,id:'plant-pot'});
  const leafMat=material(0x64805a,0.9);
  const leafPositions=[[-.16,.67,0,.22,.36],[.13,.73,.04,.18,.42],[0,.86,-.03,.23,.46],[-.23,.85,.03,.17,.34],[.22,.94,-.02,.18,.36]];
  const leaves=semantic(new THREE.Group(),'plant-leaves');
  for(const [x,y,z,sx,sy] of leafPositions){
    const leaf=new THREE.Mesh(new THREE.SphereGeometry(.25,14,10),leafMat);
    leaf.position.set(x,y,z);leaf.scale.set(sx/.25,sy/.5,.34);leaf.rotation.z=x*1.7;leaves.add(leaf);
  }
  plant.add(leaves);shadows(plant);details.add(plant);

  const books=semantic(new THREE.Group(),'books-stack');
  books.position.set(-5.05,.73,.38);
  const bookDefs=[[0x5f8391,.05,.33],[0xb06b58,.10,.28],[0xd0a65c,.15,.35]];
  bookDefs.forEach((b,i)=>addPart(books,new THREE.BoxGeometry(b[2],.055,.22),material(b[0],.88),{y:i*.06,ry:(i-1)*.08,id:`book-${i+1}`}));
  details.add(books);

  const frame=semantic(new THREE.Group(),'family-photo-frame');
  frame.position.set(-.9,2.42,-4.49);
  addPart(frame,new THREE.BoxGeometry(1.42,.92,.06),material(0x73503e,0.72),{id:'family-photo-frame-wood'});
  addPart(frame,new THREE.BoxGeometry(1.16,.68,.035),material(0xd7b491,0.9),{z:.035,id:'family-photo-image'});
  details.add(frame);

  const drawingMat=material(0xf7e9b9,0.95);
  const crayon=[0xd8685e,0x5a96b1,0x79a46d];
  for(let i=0;i<3;i++){
    const drawing=semantic(new THREE.Group(),`child-drawing-${i+1}`);
    drawing.position.set(.25+i*.58,2.13+(i%2)*.13,-4.495);
    addPart(drawing,new THREE.BoxGeometry(.46,.37,.025),drawingMat);
    addPart(drawing,new THREE.BoxGeometry(.25,.035,.015),material(crayon[i],.9),{y:.03,z:.022,rz:(i-1)*.28});
    details.add(drawing);
  }

  const basket=semantic(new THREE.Group(),'toy-basket');
  basket.position.set(4.55,0,3.55);
  addPart(basket,new THREE.CylinderGeometry(.42,.36,.42,18,1,true),material(0xb98b5f,0.96),{y:.22,id:'toy-basket-body'});
  addPart(basket,new THREE.TorusGeometry(.28,.035,8,20,Math.PI),material(0x8f6748,0.8),{y:.46,rx:Math.PI/2,id:'toy-basket-handle'});
  details.add(basket);

  shadows(details);
  scene.add(details);
  return details;
}

export function createLivingRoomScene({ canvas, world }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd9c4aa);
  scene.fog = new THREE.Fog(0xd9c4aa, 13, 26);

  const camera = new THREE.PerspectiveCamera(48, 16 / 10, 0.05, 60);
  camera.position.set(2.35, 3.97, 5.75);
  camera.lookAt(0, 0.82, 0);

  const hemi = new THREE.HemisphereLight(0xfff4dc, 0x59606b, 1.08);
  scene.add(hemi);

  // warm-window-light: cinematic late-afternoon key shared by room and characters.
  const windowLight = new THREE.DirectionalLight(0xffc486, 3.35);
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

  const windowBounce=new THREE.PointLight(0xffddb6,7.5,8.5,2);
  windowBounce.position.set(-3.8,2.5,-3.9);
  windowBounce.userData.semanticId='window-bounce-light';
  scene.add(windowBounce);

  // warm-practical-light: lamp glow creates the inhabited-home feel.
  const practical = new THREE.PointLight(0xffad58, 19, 7, 2);
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
    else if(def.id==='sofa')object=createSofaSet(def);
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
  createWindowSet(scene);
  createRoomDetails(scene);

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
