import * as THREE from 'three';
import { createContactEffects } from './contact-effects.js';
import { buildGrayboxDescriptors } from './scene-3d-descriptors.js';

function materialFor(def){
  const colors={floor:0xb98c70,wall:0xe8d9ca,furniture:0x9f806f,surface:0xc7776f,doorway:0x79543f,dressing:0xb59b86,prop:0xe7b84d};
  return new THREE.MeshStandardMaterial({color:def.color??colors[def.kind]??0xa58a78,roughness:def.kind==='surface'?.92:.78,metalness:0});
}
function boxMesh(def){
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(def.width,def.height,def.depth),materialFor(def));
  mesh.name=def.id;mesh.userData.semanticId=def.id;mesh.position.set(def.x,def.y,def.z);mesh.castShadow=!['floor','rug','wall'].includes(def.kind)&&!String(def.id).startsWith('wall-');mesh.receiveShadow=true;
  mesh.userData.baseTransform={position:mesh.position.clone(),rotation:mesh.rotation.clone(),scale:mesh.scale.clone()};return mesh;
}
function createToyBall(){const mesh=new THREE.Mesh(new THREE.SphereGeometry(.19,24,18),new THREE.MeshStandardMaterial({color:0xf0ba48,roughness:.5}));mesh.name='toy-ball';mesh.userData.semanticId='toy-ball';mesh.castShadow=true;mesh.receiveShadow=true;return mesh;}
function createHeadphones(){const group=new THREE.Group();group.name='headphones';group.userData.semanticId='headphones';const mat=new THREE.MeshStandardMaterial({color:0x334c61,roughness:.42});const band=new THREE.Mesh(new THREE.TorusGeometry(.18,.035,10,28,Math.PI),mat);band.rotation.z=Math.PI;band.position.y=.09;group.add(band);for(const side of[-1,1]){const cup=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.08,18),mat);cup.rotation.z=Math.PI/2;cup.position.x=side*.18;group.add(cup);}group.traverse(n=>{if(n.isMesh)n.castShadow=true;});return group;}
function setOpacity(object,value){const opacity=Math.max(0,Math.min(1,Number(value)));object.traverse(node=>{if(!node.isMesh||!node.material)return;for(const mat of(Array.isArray(node.material)?node.material:[node.material])){mat.transparent=opacity<.999;mat.opacity=opacity;mat.needsUpdate=true;}});}

export async function createLivingRoom3DScene({canvas,world}){
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio||1,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x8b7165);
  const camera=new THREE.PerspectiveCamera(50,16/10,.08,60);camera.position.set(1.35,2.13,3.2);scene.add(camera);
  const visualStage=new THREE.Group();visualStage.name='world3d-stage';scene.add(visualStage);
  scene.add(new THREE.HemisphereLight(0xfff0df,0x5d5362,1.6));
  const key=new THREE.DirectionalLight(0xffc88d,2.1);key.position.set(-4,7,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.near=.1;key.shadow.camera.far=24;scene.add(key);
  const objectsById=new Map();
  for(const def of buildGrayboxDescriptors(world)){
    if(def.id==='toy-ball')continue;
    const mesh=boxMesh(def);visualStage.add(mesh);objectsById.set(def.id,mesh);
  }
  const ballDef=world.objects.find(o=>o.id==='toy-ball');
  if(ballDef){const ball=createToyBall();ball.position.set(ballDef.x,ballDef.height/2,ballDef.z);ball.userData.baseTransform={position:ball.position.clone(),rotation:ball.rotation.clone(),scale:ball.scale.clone()};visualStage.add(ball);objectsById.set('toy-ball',ball);}
  const headphones=createHeadphones();visualStage.add(headphones);objectsById.set('headphones',headphones);
  const contactEffects=createContactEffects(visualStage,{THREE,screenStage:false});
  const renderPosition=position=>({x:Number(position?.x)||0,y:Number(position?.y)||0,z:Number(position?.z)||0});
  function resize(width,height){const w=Math.max(1,Math.floor(width)),h=Math.max(1,Math.floor(height));camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);}
  function applyCameraPose(pose,shake=0,now=0){if(!pose)return camera;const sx=Math.sin(now*.041)*shake*.02,sy=Math.cos(now*.053)*shake*.012;camera.position.set(pose.position.x+sx,pose.position.y+sy,pose.position.z);camera.fov=pose.fov||50;camera.updateProjectionMatrix();camera.lookAt(pose.target.x,pose.target.y,pose.target.z);return camera;}
  function setObjectOpacity(id,value){const object=objectsById.get(id)||scene.getObjectByName(id);if(!object)return false;setOpacity(object,value);return true;}
  function applyReactiveTransforms(controller){if(!controller?.transforms)return;for(const[id,t]of Object.entries(controller.transforms)){const object=objectsById.get(id);if(!object)continue;const base=object.userData.baseTransform;if(!base)continue;object.position.set(base.position.x+(t.x||0),base.position.y+(t.y||0),base.position.z+(t.z||0));object.rotation.set(base.rotation.x,base.rotation.y+(t.rotY||0),base.rotation.z+(t.rotZ||0));object.scale.set(base.scale.x,base.scale.y*(t.scaleY??1),base.scale.z);}}
  return {scene,renderer,camera,visualStage,objectsById,cinematicSet:null,contactEffects,visualMode:'world3d',visualEnvelope:null,proceduralGroup:visualStage,screenStage:false,renderPosition,projectWorld:renderPosition,
    render(){renderer.render(scene,camera);},resize,setObjectOpacity,applyCameraPose,setOccluders(){},applyReactiveTransforms,
    projectObject(object,logicalPosition){if(!object)return null;const p=renderPosition(logicalPosition);object.position.set(p.x,p.y,p.z);object.scale.set(1,1,1);object.userData.baseTransform={position:object.position.clone(),rotation:object.rotation.clone(),scale:object.scale.clone()};return p;},
    dispose(){contactEffects.dispose();scene.traverse(object=>{object.geometry?.dispose?.();const mats=object.material?(Array.isArray(object.material)?object.material:[object.material]):[];for(const mat of mats)mat?.dispose?.();});renderer.dispose();}
  };
}
