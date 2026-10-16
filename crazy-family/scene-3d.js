import * as THREE from 'three';

function material(color,roughness=.82){return new THREE.MeshStandardMaterial({color,roughness,metalness:.02});}
function semantic(node,id){node.name=id;node.userData.semanticId=id;return node;}

export function createLivingRoomScene3D({canvas,world}={}){
  if(!canvas)throw new Error('canvas is required');
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio||1,2));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;

  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0x6b5147);
  const camera=new THREE.PerspectiveCamera(49,16/9,.1,60);
  scene.add(camera);

  const characterLayer=semantic(new THREE.Group(),'native3d-character-layer');
  scene.add(characterLayer);

  const hemi=semantic(new THREE.HemisphereLight(0xffeadb,0x5f5967,1.7),'native3d-hemi');
  scene.add(hemi);
  const key=semantic(new THREE.DirectionalLight(0xffbd78,2.35),'native3d-warm-key');
  key.position.set(-5,7,5);
  key.castShadow=true;
  scene.add(key);

  const bounds=world?.bounds||{minX:-6,maxX:6,minZ:-4.6,maxZ:4.6};
  const width=Math.max(.1,(Number(bounds.maxX)||6)-(Number(bounds.minX)||-6));
  const depth=Math.max(.1,(Number(bounds.maxZ)||4.6)-(Number(bounds.minZ)||-4.6));
  const centerX=((Number(bounds.minX)||-6)+(Number(bounds.maxX)||6))*.5;
  const centerZ=((Number(bounds.minZ)||-4.6)+(Number(bounds.maxZ)||4.6))*.5;
  const floor=semantic(new THREE.Mesh(new THREE.BoxGeometry(width,.08,depth),material(0x8f6a4f,.9)),'native3d-floor');
  floor.position.set(centerX,-.04,centerZ);
  floor.receiveShadow=true;
  scene.add(floor);

  const backWall=semantic(new THREE.Mesh(new THREE.BoxGeometry(width,3.2,.10),material(0xb99a82,.88)),'native3d-back-wall');
  backWall.position.set(centerX,1.6,Number(bounds.minZ)||-4.6);
  backWall.receiveShadow=true;
  scene.add(backWall);

  function resize(widthValue,heightValue){
    const w=Math.max(1,Math.floor(Number(widthValue)||1));
    const h=Math.max(1,Math.floor(Number(heightValue)||1));
    camera.aspect=w/h;
    camera.updateProjectionMatrix();
    renderer.setSize(w,h,false);
  }

  function applyCameraPose(pose){
    if(!pose)return camera;
    const p=pose.position||{x:0,y:2,z:5};
    const t=pose.target||{x:0,y:1,z:0};
    camera.position.set(Number(p.x)||0,Number(p.y)||0,Number(p.z)||0);
    if(Number.isFinite(pose.fov))camera.fov=pose.fov;
    camera.lookAt(Number(t.x)||0,Number(t.y)||0,Number(t.z)||0);
    camera.updateProjectionMatrix();
    return camera;
  }

  function dispose(){
    scene.traverse(node=>{
      node.geometry?.dispose?.();
      const materials=node.material?(Array.isArray(node.material)?node.material:[node.material]):[];
      for(const mat of materials)mat?.dispose?.();
    });
    renderer.dispose();
  }

  return {
    scene,renderer,camera,characterLayer,
    resize,applyCameraPose,
    render(){renderer.render(scene,camera);},
    dispose,
  };
}
