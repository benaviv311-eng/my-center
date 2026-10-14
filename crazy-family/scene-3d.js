import * as THREE from 'three';
import { createContactEffects } from './contact-effects.js';
import { buildGrayboxDescriptors } from './graybox-layout.js';

function materialFor(def){
  let color=def.color;
  if(!Number.isFinite(color)){
    if(def.kind==='wall')color=0xd9cfc5;
    else if(def.id==='floor')color=0x9d7157;
    else if(def.id==='rug')color=0xb95f55;
    else color=0x9b765f;
  }
  return new THREE.MeshStandardMaterial({color,roughness:def.kind==='floor'?.82:.72,metalness:.01});
}

function makeBox(def){
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(def.width,def.height,def.depth),materialFor(def));
  mesh.name=def.id;mesh.userData.semanticId=def.id;mesh.position.set(def.x,def.y,def.z);
  mesh.castShadow=!['floor','rug','wall'].includes(def.kind)&&def.id!=='doorway';
  mesh.receiveShadow=true;
  mesh.userData.worldBase={position:mesh.position.clone(),rotation:mesh.rotation.clone(),scale:mesh.scale.clone()};
  return mesh;
}

function makeToyBall(def){
  const group=new THREE.Group();group.name=def.id;group.userData.semanticId=def.id;group.position.set(def.x,def.y,def.z);
  const sphere=new THREE.Mesh(new THREE.SphereGeometry(def.width*.48,20,14),materialFor(def));sphere.castShadow=true;sphere.receiveShadow=true;group.add(sphere);
  group.userData.worldBase={position:group.position.clone(),rotation:group.rotation.clone(),scale:group.scale.clone()};
  return group;
}

function makeHeadphones(){
  const group=new THREE.Group();group.name='headphones';group.userData.semanticId='headphones';
  const dark=new THREE.MeshStandardMaterial({color:0x263a4c,roughness:.38});
  const accent=new THREE.MeshStandardMaterial({color:0x456b84,roughness:.42});
  const band=new THREE.Mesh(new THREE.TorusGeometry(.18,.035,10,28,Math.PI),dark);band.rotation.z=Math.PI;band.position.y=.09;group.add(band);
  for(const side of [-1,1]){const cup=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.08,18),side<0?dark:accent);cup.rotation.z=Math.PI/2;cup.position.set(side*.18,0,0);group.add(cup);}
  group.traverse(node=>{if(node.isMesh)node.castShadow=true;});
  group.userData.worldBase={position:group.position.clone(),rotation:group.rotation.clone(),scale:group.scale.clone()};
  return group;
}

function setWorldObject(object,position,{scaleMultiplier=1}={}){
  if(!object||!position)return;
  object.position.set(Number(position.x)||0,Number(position.y)||0,Number(position.z)||0);
  object.scale.setScalar(scaleMultiplier);
  object.userData.worldBase={position:object.position.clone(),rotation:object.rotation.clone(),scale:object.scale.clone()};
}

function applyWorldReaction(object,t){
  const base=object?.userData?.worldBase;if(!base||!t)return;
  object.position.set(base.position.x+(t.x||0),base.position.y+(t.y||0),base.position.z+(t.z||0));
  object.rotation.set(base.rotation.x,base.rotation.y+(t.rotY||0),base.rotation.z+(t.rotZ||0));
  object.scale.set(base.scale.x,base.scale.y*(t.scaleY??1),base.scale.z);
}

export async function createLivingRoom3DScene({canvas,world}){
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio||1,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;

  const scene=new THREE.Scene();scene.background=new THREE.Color(0xc6b0a1);
  const camera=new THREE.PerspectiveCamera(50,16/10,.08,60);camera.position.set(1.35,2.13,2.75);scene.add(camera);
  const worldStage=new THREE.Group();worldStage.name='world3d-stage';scene.add(worldStage);
  worldStage.add(new THREE.HemisphereLight(0xffeee2,0x6b5d68,1.35));
  const key=new THREE.DirectionalLight(0xffc88f,2.1);key.position.set(-4.5,7,5.5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);worldStage.add(key);

  const objectsById=new Map();
  for(const def of buildGrayboxDescriptors(world)){
    const object=def.id==='toy-ball'?makeToyBall(def):makeBox(def);worldStage.add(object);objectsById.set(def.id,object);
  }
  const headphones=makeHeadphones();worldStage.add(headphones);objectsById.set('headphones',headphones);
  const contactEffects=createContactEffects(worldStage,{THREE,screenStage:false});
  const renderPosition=position=>({x:Number(position?.x)||0,y:Number(position?.y)||0,z:Number(position?.z)||0});

  function resize(width,height){const w=Math.max(1,Math.floor(width)),h=Math.max(1,Math.floor(height));camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);}
  function applyCameraPose(pose){if(!pose)return camera;camera.position.set(pose.position.x,pose.position.y,pose.position.z);camera.fov=pose.fov;camera.updateProjectionMatrix();camera.lookAt(pose.target.x,pose.target.y,pose.target.z);return camera;}
  function setObjectOpacity(id,value){const object=objectsById.get(id)||scene.getObjectByName(id);if(!object)return false;const opacity=Math.max(0,Math.min(1,value));object.traverse(node=>{if(!node.isMesh||!node.material)return;for(const mat of (Array.isArray(node.material)?node.material:[node.material])){mat.transparent=opacity<1;mat.opacity=opacity;mat.needsUpdate=true;}});return true;}
  function applyReactiveTransforms(controller){if(!controller?.transforms)return;for(const [id,t] of Object.entries(controller.transforms)){const object=objectsById.get(id);if(object)applyWorldReaction(object,t);}}

  return {
    scene,renderer,camera,visualStage:worldStage,objectsById,contactEffects,visualMode:'world3d',screenStage:false,visualEnvelope:null,renderPosition,
    render(){renderer.render(scene,camera);},resize,applyCameraPose,setObjectOpacity,applyReactiveTransforms,setOccluders(){},
    projectWorld:renderPosition,
    projectObject(object,logicalPosition,options){setWorldObject(object,logicalPosition,options);return renderPosition(logicalPosition);},
    dispose(){contactEffects.dispose();scene.traverse(object=>{object.geometry?.dispose?.();const mats=object.material?(Array.isArray(object.material)?object.material:[object.material]):[];for(const mat of mats)mat?.dispose?.();});renderer.dispose();},
  };
}
