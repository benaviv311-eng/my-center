import * as THREE from 'three';
import { createCinematicSet } from './cinematic-set.js';
import { createContactEffects } from './contact-effects.js';

// HYBRID_CINEMATIC_SET_V042 — authored environment art is the primary visible home.
// Gameplay geometry stays authoritative and invisible in cinematic mode.
const CINEMATIC_MANIFEST_URL='assets/crazy-family/cinematic-home-v042/manifest.json';

function material(color,roughness=.75,extra={}){
  return new THREE.MeshStandardMaterial({color,roughness,metalness:.02,...extra});
}

function rememberBase(object){
  object.userData.movieSetBase={
    position:object.position.clone(),
    rotation:object.rotation.clone(),
    scale:object.scale.clone(),
  };
  return object;
}

function semantic(object,id){
  object.name=id;
  object.userData.semanticId=id;
  return object;
}

function createDebugObject(def,visible){
  const mesh=new THREE.Mesh(
    new THREE.BoxGeometry(Math.max(.03,def.width),Math.max(.03,def.height),Math.max(.03,def.depth)),
    material(def.color??0x9b765f,.88,{transparent:true,opacity:visible?.34:0,wireframe:visible}),
  );
  semantic(mesh,def.id);
  mesh.position.set(def.x,def.y,def.z);
  mesh.visible=Boolean(visible);
  mesh.userData.debugProcedural=true;
  mesh.castShadow=false;
  mesh.receiveShadow=false;
  return rememberBase(mesh);
}

function createToyBall(def){
  const group=semantic(new THREE.Group(),'toy-ball');
  group.position.set(def.x,def.height/2,def.z);
  const ball=new THREE.Mesh(new THREE.SphereGeometry(def.width/2,24,18),material(0xf3b84b,.48));
  ball.castShadow=true;ball.receiveShadow=true;group.add(ball);
  const stripe=new THREE.Mesh(new THREE.TorusGeometry(def.width*.36,.016,8,32),material(0xd25d59,.46));
  stripe.rotation.x=Math.PI/2;stripe.castShadow=true;group.add(stripe);
  return rememberBase(group);
}

function createHeadphones(){
  const group=semantic(new THREE.Group(),'headphones');
  const dark=material(0x263a4c,.36),accent=material(0x456b84,.42);
  const band=new THREE.Mesh(new THREE.TorusGeometry(.18,.035,10,28,Math.PI),dark);
  band.rotation.z=Math.PI;band.position.y=.09;group.add(band);
  for(const side of [-1,1]){
    const cup=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.08,18),side<0?dark:accent);
    cup.rotation.z=Math.PI/2;cup.position.set(side*.18,0,0);group.add(cup);
  }
  group.traverse(node=>{if(node.isMesh){node.castShadow=true;node.receiveShadow=true;}});
  group.position.set(-4.15,1.08,.1);
  group.rotation.y=-.35;
  return rememberBase(group);
}

function applyTransform(object,t){
  if(!object||!t)return;
  const base=object.userData.movieSetBase||object.userData.cinematicBase;
  if(!base)return;
  const bp=base.position;
  const br=base.rotation;
  const bs=base.scale;
  object.position.set(bp.x+(t.x||0),bp.y+(t.y||0),bp.z+(t.z||0));
  object.rotation.set((br.x||0)+(t.rotX||0),(br.y||0)+(t.rotY||0),(br.z||0)+(t.rotZ||0));
  object.scale.set(bs.x||1,(bs.y||1)*(t.scaleY??1),bs.z||1);
}

export async function createLivingRoomScene({canvas,world,visualMode='cinematic'}){
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio||1,2));
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.06;

  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0x6f5145);

  const camera=new THREE.PerspectiveCamera(48,16/10,.05,60);
  camera.position.set(1.35,2.13,4.1);
  camera.lookAt(0,.68,0);

  scene.add(new THREE.HemisphereLight(0xffefd9,0x4d5663,1.18));
  const key=new THREE.DirectionalLight(0xffbd78,3.25);
  key.name='warm-window-light';key.userData.semanticId='warm-window-light';
  key.position.set(-5.2,6.2,3.7);key.castShadow=true;
  key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-8;key.shadow.camera.right=8;key.shadow.camera.top=8;key.shadow.camera.bottom=-8;
  scene.add(key);
  const fill=new THREE.PointLight(0xffd2a1,3.8,9,2);fill.position.set(-3.8,2.7,-2.8);scene.add(fill);

  const objectsById=new Map();
  const proceduralGroup=semantic(new THREE.Group(),'debug-procedural-room');
  proceduralGroup.userData.visualMode='debug-procedural';
  const debugVisible=visualMode==='debug-procedural';

  for(const def of world.objects){
    let object;
    if(def.id==='toy-ball')object=createToyBall(def);
    else object=createDebugObject(def,debugVisible);
    if(def.id==='toy-ball')scene.add(object);else proceduralGroup.add(object);
    objectsById.set(def.id,object);
  }
  scene.add(proceduralGroup);

  const headphones=createHeadphones();
  scene.add(headphones);
  objectsById.set('headphones',headphones);

  let cinematicSet=null;
  if(visualMode==='cinematic'){
    cinematicSet=await createCinematicSet({scene,world,THREE,manifestUrl:CINEMATIC_MANIFEST_URL});
    proceduralGroup.visible=false;
  }else{
    proceduralGroup.visible=true;
  }

  const contactEffects=createContactEffects(scene,{THREE});

  function resize(width,height){
    const w=Math.max(1,Math.floor(width)),h=Math.max(1,Math.floor(height));
    renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
  }

  function setObjectOpacity(id,value){
    const object=objectsById.get(id)||cinematicSet?.layersById?.get(id)||scene.getObjectByName(id);
    if(!object)return false;
    const opacity=Math.max(0,Math.min(1,value));
    object.traverse(node=>{
      if(!node.isMesh||!node.material)return;
      for(const mat of (Array.isArray(node.material)?node.material:[node.material])){
        mat.transparent=opacity<.999||Boolean(mat.map?.image?.src?.includes?.('cinematic-home-v042'));
        mat.opacity=opacity;
        mat.needsUpdate=true;
      }
    });
    return true;
  }

  function applyCameraPose(pose,shake=0,now=0){
    if(!pose)return camera;
    const sx=Math.sin(now*.041)*shake*.055,sy=Math.cos(now*.053)*shake*.035,sz=Math.sin(now*.067+.8)*shake*.045;
    camera.position.set(pose.position.x+sx,pose.position.y+sy,pose.position.z+sz);
    camera.fov=pose.fov;camera.updateProjectionMatrix();camera.lookAt(pose.target.x,pose.target.y,pose.target.z);
    return camera;
  }

  function setOccluders(ids=[]){
    // Legacy world occluder API remains callable; cinematic depth is handled by cinematic-occlusion.js.
    proceduralGroup.userData.legacyOccluders=[...ids];
  }

  function applyReactiveTransforms(controller){
    if(!controller?.transforms)return;
    for(const [id,t] of Object.entries(controller.transforms)){
      applyTransform(objectsById.get(id),t);
      for(const layer of cinematicSet?.anchorsByWorldId?.get(id)||[])applyTransform(layer,t);
    }
  }

  return {
    scene,
    renderer,
    camera,
    objectsById,
    cinematicSet,
    contactEffects,
    visualMode,
    visualEnvelope:cinematicSet?.visualEnvelope||null,
    proceduralGroup,
    render(cameraLike=camera){renderer.render(scene,cameraLike?.isCamera?cameraLike:camera);},
    resize,
    setObjectOpacity,
    applyCameraPose,
    setOccluders,
    applyReactiveTransforms,
    dispose(){
      contactEffects.dispose();
      cinematicSet?.dispose?.();
      scene.traverse(object=>{
        object.geometry?.dispose?.();
        const mats=object.material?(Array.isArray(object.material)?object.material:[object.material]):[];
        for(const mat of mats)mat?.dispose?.();
      });
      renderer.dispose();
    },
  };
}
