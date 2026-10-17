import * as THREE from 'three';
import { createContactEffects } from './contact-effects.js';
import { buildGrayboxDescriptors } from './scene-3d-descriptors.js';

function makeCanvasTexture(size,draw,repeatX=1,repeatY=1,anisotropy=4){
  const canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;
  const ctx=canvas.getContext('2d');draw(ctx,size);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=THREE.RepeatWrapping;texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(repeatX,repeatY);texture.anisotropy=anisotropy;texture.needsUpdate=true;return texture;
}
function createGroundTextures(anisotropy=4){
  const wood=makeCanvasTexture(512,(ctx,size)=>{
    const boards=['#b98c70','#ad7d60','#c19679','#a97457','#be8d6e','#b17f61','#c49778','#aa7659'];
    const boardW=size/8;ctx.fillStyle=boards[0];ctx.fillRect(0,0,size,size);
    for(let i=0;i<8;i++){
      ctx.fillStyle=boards[i%boards.length];ctx.fillRect(i*boardW,0,boardW,size);
      ctx.strokeStyle='rgba(76,43,30,.30)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(i*boardW+.5,0);ctx.lineTo(i*boardW+.5,size);ctx.stroke();
      for(let y=22+(i%3)*13;y<size;y+=58){ctx.strokeStyle='rgba(255,241,224,.10)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(i*boardW+8,y);ctx.bezierCurveTo(i*boardW+boardW*.32,y-4,i*boardW+boardW*.66,y+4,(i+1)*boardW-8,y);ctx.stroke();}
    }
    ctx.strokeStyle='rgba(61,34,25,.18)';ctx.lineWidth=1;for(let y=0;y<size;y+=128){ctx.beginPath();ctx.moveTo(0,y+.5);ctx.lineTo(size,y+.5);ctx.stroke();}
  },6,4.6,anisotropy);
  wood.name='canonical-wood';
  const rug=makeCanvasTexture(512,(ctx,size)=>{
    ctx.fillStyle='#b95f55';ctx.fillRect(0,0,size,size);
    ctx.strokeStyle='rgba(252,220,190,.42)';ctx.lineWidth=8;ctx.strokeRect(16,16,size-32,size-32);
    ctx.strokeStyle='rgba(111,57,52,.40)';ctx.lineWidth=3;ctx.strokeRect(31,31,size-62,size-62);
    ctx.lineWidth=3;ctx.strokeStyle='rgba(255,226,194,.24)';
    const step=72;for(let y=-step;y<size+step;y+=step){for(let x=-step;x<size+step;x+=step){ctx.beginPath();ctx.moveTo(x,y+step/2);ctx.lineTo(x+step/2,y);ctx.lineTo(x+step,y+step/2);ctx.lineTo(x+step/2,y+step);ctx.closePath();ctx.stroke();}}
    ctx.strokeStyle='rgba(77,40,44,.12)';ctx.lineWidth=1;for(let y=0;y<size;y+=8){ctx.beginPath();ctx.moveTo(0,y+.5);ctx.lineTo(size,y+.5);ctx.stroke();}
  },2.2,1.25,anisotropy);
  rug.name='canonical-rug';
  return{wood,rug};
}
function materialFor(def,groundTextures){
  if(def.id==='floor'||def.kind==='floor'||def.material==='wood')return new THREE.MeshStandardMaterial({map:groundTextures.wood,color:0xffffff,roughness:.74,metalness:0});
  if(def.id==='rug'||def.material==='rug')return new THREE.MeshStandardMaterial({map:groundTextures.rug,color:0xffffff,roughness:.94,metalness:0});
  const colors={wall:0xe8d9ca,furniture:0x9f806f,doorway:0x79543f,dressing:0xb59b86,prop:0xe7b84d};
  return new THREE.MeshStandardMaterial({color:def.color??colors[def.kind]??0xa58a78,roughness:def.kind==='surface'?.92:.78,metalness:0});
}
function boxMesh(def,groundTextures){
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(def.width,def.height,def.depth),materialFor(def,groundTextures));
  mesh.name=def.id;mesh.userData.semanticId=def.id;mesh.position.set(def.x,def.y,def.z);mesh.castShadow=!['floor','surface','wall'].includes(def.kind)&&!String(def.id).startsWith('wall-');mesh.receiveShadow=true;
  if(def.id==='floor'||def.kind==='floor'||def.material==='wood')mesh.userData.groundStyle='canonical-wood';
  if(def.id==='rug'||def.material==='rug')mesh.userData.groundStyle='canonical-rug';
  mesh.userData.baseTransform={position:mesh.position.clone(),rotation:mesh.rotation.clone(),scale:mesh.scale.clone()};return mesh;
}
function createToyBall(){const mesh=new THREE.Mesh(new THREE.SphereGeometry(.19,24,18),new THREE.MeshStandardMaterial({color:0xf0ba48,roughness:.5}));mesh.name='toy-ball';mesh.userData.semanticId='toy-ball';mesh.castShadow=true;mesh.receiveShadow=true;return mesh;}
function createHeadphones(){const group=new THREE.Group();group.name='headphones';group.userData.semanticId='headphones';const mat=new THREE.MeshStandardMaterial({color:0x334c61,roughness:.42});const band=new THREE.Mesh(new THREE.TorusGeometry(.18,.035,10,28,Math.PI),mat);band.rotation.z=Math.PI;band.position.y=.09;group.add(band);for(const side of[-1,1]){const cup=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.08,18),mat);cup.rotation.z=Math.PI/2;cup.position.x=side*.18;group.add(cup);}group.traverse(n=>{if(n.isMesh)n.castShadow=true;});return group;}
function setOpacity(object,value){const opacity=Math.max(0,Math.min(1,Number(value)));object.traverse(node=>{if(!node.isMesh||!node.material)return;for(const mat of(Array.isArray(node.material)?node.material:[node.material])){mat.transparent=opacity<.999;mat.opacity=opacity;mat.needsUpdate=true;}});}

export async function createLivingRoom3DScene({canvas,world}){
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio||1,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x8b7165);
  const camera=new THREE.PerspectiveCamera(50,16/10,.08,60);camera.position.set(1.4,2.36,3.35);scene.add(camera);
  const visualStage=new THREE.Group();visualStage.name='world3d-stage';scene.add(visualStage);
  scene.add(new THREE.HemisphereLight(0xfff0df,0x5d5362,1.6));
  const key=new THREE.DirectionalLight(0xffc88d,2.1);key.position.set(-4,7,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.near=.1;key.shadow.camera.far=24;scene.add(key);
  const groundTextures=createGroundTextures(Math.min(8,renderer.capabilities.getMaxAnisotropy?.()||4));
  const objectsById=new Map();
  for(const def of buildGrayboxDescriptors(world)){
    if(def.id==='toy-ball')continue;
    const mesh=boxMesh(def,groundTextures);visualStage.add(mesh);objectsById.set(def.id,mesh);
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
    dispose(){contactEffects.dispose();scene.traverse(object=>{object.geometry?.dispose?.();const mats=object.material?(Array.isArray(object.material)?object.material:[object.material]):[];for(const mat of mats)mat?.dispose?.();});groundTextures.wood.dispose();groundTextures.rug.dispose();renderer.dispose();}
  };
}
