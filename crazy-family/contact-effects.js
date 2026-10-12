export function contactState({position={y:0},grounded=true,surfaceKind='wood',visible=true,scale=1}={}){
  if(!visible)return {visible:false,opacity:0,scaleX:0,scaleZ:0,y:.018};
  const height=Math.max(0,Number(position.y)||0);
  const baseOpacity=surfaceKind==='rug'?.19:.24;
  const opacity=grounded?baseOpacity:Math.max(.045,baseOpacity/(1+height*1.65));
  const expansion=grounded?1:1+Math.min(.75,height*.24);
  const baseScale=Math.max(.12,Number(scale)||1);
  return {visible:true,opacity,scaleX:baseScale*.52*expansion,scaleZ:baseScale*.28*expansion,y:.018};
}

function makeShadow(THREE,size=.7,screenStage=false){
  const geometry=new THREE.CircleGeometry(size,28);
  const material=new THREE.MeshBasicMaterial({color:0x2a1917,transparent:true,opacity:.2,depthWrite:false,depthTest:true,toneMapped:false});
  const mesh=new THREE.Mesh(geometry,material);
  if(!screenStage)mesh.rotation.x=-Math.PI/2;
  mesh.renderOrder=6;mesh.frustumCulled=false;return mesh;
}

export function createContactEffects(scene,{THREE,screenStage=false}={}){
  if(!scene||!THREE)throw new Error('contact effects require scene and THREE');
  const shadows=new Map();
  function ensure(id,size){
    if(shadows.has(id))return shadows.get(id);
    const mesh=makeShadow(THREE,size,screenStage);mesh.name=`contact-shadow-${id}`;mesh.userData.semanticId=mesh.name;scene.add(mesh);shadows.set(id,mesh);return mesh;
  }
  function sync(id,{position,logicalHeight=position?.y||0,grounded=true,surfaceKind='wood',scale=1,visible=true,size=.7}={}){
    const mesh=ensure(id,size);const state=contactState({position:{y:logicalHeight},grounded,surfaceKind,visible,scale});mesh.visible=state.visible;mesh.material.opacity=state.opacity;
    if(screenStage){
      mesh.position.set(position?.x||0,(position?.y||0)-.33*scale,(position?.z||0)-.08);
      mesh.scale.set(state.scaleX,state.scaleZ,1);
    }else{
      mesh.position.set(position?.x||0,state.y,position?.z||0);mesh.scale.set(state.scaleX,1,state.scaleZ);
    }
    return state;
  }
  return {
    syncActor(id,args){return sync(id,{...args,size:.78});},
    syncItem(id,{position,logicalHeight=0,visible=true,scale=.42,surfaceKind='wood'}={}){return sync(`item-${id}`,{position,logicalHeight,visible,scale,surfaceKind,grounded:true,size:.46});},
    dispose(){for(const mesh of shadows.values()){scene.remove(mesh);mesh.geometry?.dispose?.();mesh.material?.dispose?.();}shadows.clear();},
  };
}
