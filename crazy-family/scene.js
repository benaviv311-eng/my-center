import * as THREE from 'three';
import { createCinematicSet } from './cinematic-set.js';
import { createContactEffects } from './contact-effects.js';
import { projectWorldToCinematicStage } from './cinematic-projection.js';

// REFERENCE_GAME_RENDER_V043 — authored environment art is the primary visible home.
// Gameplay geometry stays authoritative and invisible; visible actors are projected into
// the fixed cinematic frame so the room keeps the approved reference composition.
const CINEMATIC_MANIFEST_URL='assets/crazy-family/cinematic-home-v043/manifest.json';

function material(color,roughness=.75,extra={}){return new THREE.MeshStandardMaterial({color,roughness,metalness:.02,...extra});}
function semantic(object,id){object.name=id;object.userData.semanticId=id;return object;}
function rememberBase(object){object.userData.movieSetBase={position:object.position.clone(),rotation:object.rotation.clone(),scale:object.scale.clone()};return object;}

function createDebugObject(def,visible){
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(Math.max(.03,def.width),Math.max(.03,def.height),Math.max(.03,def.depth)),material(def.color??0x9b765f,.88,{transparent:true,opacity:visible?.34:0,wireframe:visible}));
  semantic(mesh,def.id);mesh.position.set(def.x,def.y,def.z);mesh.visible=Boolean(visible);mesh.userData.debugProcedural=true;mesh.castShadow=false;mesh.receiveShadow=false;return rememberBase(mesh);
}

function createToyBall(def){
  const group=semantic(new THREE.Group(),'toy-ball');
  const ball=new THREE.Mesh(new THREE.SphereGeometry(.18,24,18),material(0xf3b84b,.48));ball.castShadow=true;group.add(ball);
  const stripe=new THREE.Mesh(new THREE.TorusGeometry(.13,.015,8,32),material(0xd25d59,.46));stripe.rotation.x=Math.PI/2;group.add(stripe);
  group.userData.logicalPosition={x:def.x,y:def.height/2,z:def.z};return group;
}

function createHeadphones(){
  const group=semantic(new THREE.Group(),'headphones');const dark=material(0x263a4c,.36),accent=material(0x456b84,.42);
  const band=new THREE.Mesh(new THREE.TorusGeometry(.18,.035,10,28,Math.PI),dark);band.rotation.z=Math.PI;band.position.y=.09;group.add(band);
  for(const side of [-1,1]){const cup=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.08,18),side<0?dark:accent);cup.rotation.z=Math.PI/2;cup.position.set(side*.18,0,0);group.add(cup);}
  group.traverse(node=>{if(node.isMesh)node.castShadow=true;});return group;
}

function setProjectedObject(object,projected,{scaleMultiplier=1}={}){
  if(!object||!projected)return;
  object.position.set(projected.x,projected.y,projected.z);
  const scale=projected.scale*scaleMultiplier;object.scale.set(scale,scale,scale);
  object.userData.projectedBase={position:object.position.clone(),rotation:object.rotation.clone(),scale:object.scale.clone()};
  object.userData.movieSetBase={position:object.position.clone(),rotation:object.rotation.clone(),scale:object.scale.clone()};
}

function applyProjectedReaction(object,t){
  if(!object||!t)return;const base=object.userData.projectedBase||object.userData.movieSetBase;if(!base)return;
  object.position.set(base.position.x+(t.x||0)*.7,base.position.y+(t.y||0)-(t.z||0)*.45,base.position.z);
  object.rotation.set(base.rotation?.x||0,(base.rotation?.y||0)+(t.rotY||0),(base.rotation?.z||0)+(t.rotZ||0));
  object.scale.set(base.scale.x,base.scale.y*(t.scaleY??1),base.scale.z);
}

export async function createLivingRoomScene({canvas,world,visualMode='cinematic'}){
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio||1,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;

  const scene=new THREE.Scene();scene.background=new THREE.Color(0x6b4a3d);
  const camera=new THREE.OrthographicCamera(-8,8,5,-5,.1,50);camera.position.set(0,0,20);camera.lookAt(0,0,0);scene.add(camera);
  const visualStage=semantic(new THREE.Group(),'cinematic-visual-stage');visualStage.userData.cinematicStage=true;scene.add(visualStage);
  const debugWorld=semantic(new THREE.Group(),'debug-procedural-room');debugWorld.userData.visualMode='debug-procedural';scene.add(debugWorld);

  visualStage.add(new THREE.HemisphereLight(0xffeddf,0x66586b,1.45));
  const key=new THREE.DirectionalLight(0xffbd78,2.5);key.name='warm-window-light';key.position.set(-5,7,8);visualStage.add(key);
  const fill=new THREE.PointLight(0xffd2a1,2.2,20,2);fill.name='warm-practical-light';fill.position.set(-4,2,6);visualStage.add(fill);

  const projectWorld=(position)=>projectWorldToCinematicStage(position,{bounds:world.bounds});
  const objectsById=new Map();const debugVisible=visualMode==='debug-procedural';
  for(const def of world.objects){
    const debug=createDebugObject(def,debugVisible);debugWorld.add(debug);
    if(def.id==='toy-ball'){
      const ball=createToyBall(def);setProjectedObject(ball,projectWorld({x:def.x,y:def.height/2,z:def.z}),{scaleMultiplier:.8});visualStage.add(ball);objectsById.set(def.id,ball);
    }else objectsById.set(def.id,debug);
  }
  debugWorld.visible=debugVisible;

  const headphones=createHeadphones();visualStage.add(headphones);objectsById.set('headphones',headphones);
  let cinematicSet=null;
  if(visualMode==='cinematic')cinematicSet=await createCinematicSet({scene,parent:visualStage,world,THREE,manifestUrl:CINEMATIC_MANIFEST_URL});
  const contactEffects=createContactEffects(visualStage,{THREE,screenStage:true});

  function resize(width,height){
    const w=Math.max(1,Math.floor(width)),h=Math.max(1,Math.floor(height)),aspect=w/h;
    const halfWidth=8,halfHeight=halfWidth/aspect;camera.left=-halfWidth;camera.right=halfWidth;camera.top=halfHeight;camera.bottom=-halfHeight;camera.updateProjectionMatrix();renderer.setSize(w,h,false);
  }

  function setObjectOpacity(id,value){
    const object=objectsById.get(id)||cinematicSet?.layersById?.get(id)||scene.getObjectByName(id);if(!object)return false;
    const opacity=Math.max(0,Math.min(1,value));object.traverse(node=>{if(!node.isMesh||!node.material)return;for(const mat of (Array.isArray(node.material)?node.material:[node.material])){mat.transparent=true;mat.opacity=opacity;mat.needsUpdate=true;}});return true;
  }

  function applyCameraPose(pose,shake=0,now=0){
    visualStage.position.x=Math.sin(now*.041)*shake*.045;visualStage.position.y=Math.cos(now*.053)*shake*.028;
    visualStage.userData.logicalCameraPose=pose?{position:{...pose.position},target:{...pose.target},fov:pose.fov}:null;return camera;
  }

  function setOccluders(ids=[]){debugWorld.userData.legacyOccluders=[...ids];}
  function applyReactiveTransforms(controller){if(!controller?.transforms)return;for(const [id,t] of Object.entries(controller.transforms)){const object=objectsById.get(id);if(object?.parent===visualStage)applyProjectedReaction(object,t);}}

  return {
    scene,renderer,camera,visualStage,objectsById,cinematicSet,contactEffects,visualMode,visualEnvelope:cinematicSet?.visualEnvelope||null,proceduralGroup:debugWorld,
    screenStage:true,projectWorld,
    render(){renderer.render(scene,camera);},resize,setObjectOpacity,applyCameraPose,setOccluders,applyReactiveTransforms,
    projectObject(object,logicalPosition,options){const projected=projectWorld(logicalPosition);setProjectedObject(object,projected,options);return projected;},
    dispose(){contactEffects.dispose();cinematicSet?.dispose?.();scene.traverse(object=>{object.geometry?.dispose?.();const mats=object.material?(Array.isArray(object.material)?object.material:[object.material]):[];for(const mat of mats)mat?.dispose?.();});renderer.dispose();},
  };
}
