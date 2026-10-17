import * as THREE from 'three';
import { createContactEffects } from './contact-effects.js';
import { createLivingRoomMaterialSystem } from './living-room-materials.js';
import { createLivingRoomArt } from './living-room-art.js';
import { createLivingRoomLighting } from './living-room-lighting.js';

function createHeadphones(){
  const group=new THREE.Group();group.name='headphones';group.userData.semanticId='headphones';group.userData.artMode='stylized-final-v1';
  const mat=new THREE.MeshStandardMaterial({color:0x334c61,roughness:.42,metalness:.08});
  const band=new THREE.Mesh(new THREE.TorusGeometry(.18,.035,10,28,Math.PI),mat);band.rotation.z=Math.PI;band.position.y=.09;group.add(band);
  for(const side of[-1,1]){const cup=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.08,18),mat);cup.rotation.z=Math.PI/2;cup.position.x=side*.18;group.add(cup);}
  group.traverse(n=>{if(n.isMesh){n.castShadow=true;n.receiveShadow=true;}});return group;
}
function disposeStandaloneObject(object){
  const materials=new Set();object?.traverse?.(node=>{node.geometry?.dispose?.();if(node.material){for(const mat of(Array.isArray(node.material)?node.material:[node.material]))materials.add(mat);}});for(const mat of materials)mat?.dispose?.();
}
function setOpacity(object,value){const opacity=Math.max(0,Math.min(1,Number(value)));object.traverse(node=>{if(!node.isMesh||!node.material)return;for(const mat of(Array.isArray(node.material)?node.material:[node.material])){mat.transparent=opacity<.999;mat.opacity=opacity;mat.needsUpdate=true;}});}
function applyFinalArtSurfaceOffsets(objectsById){
  const rug=objectsById.get('rug');
  const rugSurface=rug?.children?.[0];
  if(rugSurface)rugSurface.position.y=.085;
}

export async function createLivingRoom3DScene({canvas,world}){
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio||1,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.04;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const scene=new THREE.Scene();scene.background=new THREE.Color(0xb7aaa3);
  const camera=new THREE.PerspectiveCamera(50,16/10,.08,60);camera.position.set(1.4,2.36,3.35);scene.add(camera);
  const visualStage=new THREE.Group();visualStage.name='world3d-stage';scene.add(visualStage);
  const characterLayer=new THREE.Group();characterLayer.name='world3d-characters';visualStage.add(characterLayer);

  const anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy?.()||4);
  const materialSystem=createLivingRoomMaterialSystem({THREE,anisotropy});
  const art=await createLivingRoomArt({THREE,world,materials:materialSystem,quality:'high'});
  visualStage.add(art.root);
  const objectsById=art.objectsById;
  applyFinalArtSurfaceOffsets(objectsById);
  const lighting=createLivingRoomLighting({THREE,scene,world,quality:'high'});

  const headphones=createHeadphones();visualStage.add(headphones);objectsById.set('headphones',headphones);
  const contactEffects=createContactEffects(visualStage,{THREE,screenStage:false});
  const renderPosition=position=>({x:Number(position?.x)||0,y:Number(position?.y)||0,z:Number(position?.z)||0});
  function resize(width,height){const w=Math.max(1,Math.floor(width)),h=Math.max(1,Math.floor(height));camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);}
  function applyCameraPose(pose,shake=0,now=0){if(!pose)return camera;const sx=Math.sin(now*.041)*shake*.02,sy=Math.cos(now*.053)*shake*.012;camera.position.set(pose.position.x+sx,pose.position.y+sy,pose.position.z);camera.fov=pose.fov||50;camera.updateProjectionMatrix();camera.lookAt(pose.target.x,pose.target.y,pose.target.z);return camera;}
  function setObjectOpacity(id,value){const object=objectsById.get(id)||scene.getObjectByName(id);if(!object)return false;setOpacity(object,value);return true;}
  function applyReactiveTransforms(controller){if(!controller?.transforms)return;for(const[id,t]of Object.entries(controller.transforms)){const object=objectsById.get(id);if(!object)continue;const base=object.userData.baseTransform;if(!base)continue;object.position.set(base.position.x+(t.x||0),base.position.y+(t.y||0),base.position.z+(t.z||0));object.rotation.set(base.rotation.x,base.rotation.y+(t.rotY||0),base.rotation.z+(t.rotZ||0));object.scale.set(base.scale.x,base.scale.y*(t.scaleY??1),base.scale.z);}}
  return {scene,renderer,camera,visualStage,characterLayer,objectsById,cinematicSet:null,contactEffects,visualMode:'world3d',visualEnvelope:null,proceduralGroup:visualStage,screenStage:false,renderPosition,projectWorld:renderPosition,
    render(){renderer.render(scene,camera);},resize,setObjectOpacity,applyCameraPose,setOccluders(){},applyReactiveTransforms,
    projectObject(object,logicalPosition){if(!object)return null;const p=renderPosition(logicalPosition);object.position.set(p.x,p.y,p.z);object.scale.set(1,1,1);object.userData.baseTransform={position:object.position.clone(),rotation:object.rotation.clone(),scale:object.scale.clone()};return p;},
    dispose(){contactEffects.dispose();disposeStandaloneObject(headphones);art.dispose();lighting.dispose();materialSystem.dispose();renderer.dispose();}
  };
}
