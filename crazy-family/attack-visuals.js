import * as THREE from 'three';

const HEIGHT_COLORS={low:0xff4fa3,high:0x42d9ff,mid:0x9a63ff,space:0xffb84f};

function makeMaterial(height){return new THREE.MeshBasicMaterial({color:HEIGHT_COLORS[height]||0xffb84f,transparent:true,opacity:.72,blending:THREE.AdditiveBlending,depthWrite:false});}

function makeVisual(attack){
  const group=new THREE.Group();
  group.name=`attack-${attack.id}`;
  group.userData.attackId=attack.id;
  const mat=makeMaterial(attack.height);
  if(attack.type==='wave'||attack.type==='ring'||attack.type==='echo'||attack.type==='boom'){
    const radius=Math.max(.16,attack.radius||.3);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(radius*1.45,Math.max(.025,radius*.12),8,36),mat);
    ring.rotation.x=Math.PI/2;
    group.add(ring);
    if(attack.type==='boom'){
      const halo=new THREE.Mesh(new THREE.RingGeometry(radius*.7,radius*1.65,36),mat.clone());
      halo.rotation.x=-Math.PI/2;halo.material.opacity=.24;group.add(halo);
    }
  }else if(attack.type==='beam'){
    const core=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,.8,12),mat);
    core.rotation.x=Math.PI/2;group.add(core);
  }else{
    const orb=new THREE.Mesh(new THREE.SphereGeometry(Math.max(.12,attack.radius*.65),14,10),mat);
    group.add(orb);
    const note=new THREE.Mesh(new THREE.TorusGeometry(Math.max(.1,attack.radius*.45),.025,6,20),mat.clone());
    note.rotation.x=Math.PI/2;group.add(note);
  }
  group.traverse(o=>{if(o.isMesh)o.renderOrder=4;});
  return group;
}

export function createAttackVisualSystem(scene){
  const visuals=new Map();
  function sync(attacks=[]){
    const live=new Set();
    for(const attack of attacks){
      if(attack.dead)continue;
      live.add(attack.id);
      let visual=visuals.get(attack.id);
      if(!visual){visual=makeVisual(attack);visuals.set(attack.id,visual);scene.add(visual);}
      visual.position.set(attack.position.x,attack.position.y,attack.position.z);
      const pulse=1+.12*Math.sin((performance.now?.()||0)/90);
      visual.scale.setScalar(pulse);
      if(attack.type==='beam')visual.rotation.y=Math.atan2(attack.forward.x,attack.forward.z);
    }
    for(const [id,visual] of visuals){
      if(live.has(id))continue;
      scene.remove(visual);
      visual.traverse(o=>{o.geometry?.dispose?.();const mats=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];for(const m of mats)m.dispose?.();});
      visuals.delete(id);
    }
  }
  return {sync,dispose(){sync([]);}};
}
