import * as THREE from 'three';

const HEIGHT_COLORS={low:0xff4fa3,high:0x42d9ff,mid:0x9a63ff,space:0xffb84f};
// DAD_LOW_WAVE_VISUAL_V044 — ability 1 has a low, wide, floor-readable signature in the cinematic runtime.
const LOW_WAVE_TELEGRAPH_MS=420;

function makeMaterial(height){return new THREE.MeshBasicMaterial({color:HEIGHT_COLORS[height]||0xffb84f,transparent:true,opacity:.72,blending:THREE.AdditiveBlending,depthWrite:false});}
function makeLowWaveMaterial(color=0xff4fa3,opacity=.72){return new THREE.MeshBasicMaterial({color,transparent:true,opacity,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});}
function makeLowWaveLineMaterial(color=0xff4fa3,opacity=.58){return new THREE.LineBasicMaterial({color,transparent:true,opacity,blending:THREE.AdditiveBlending,depthWrite:false});}

function makeLowWaveVisual(attack,screenStage=false){
  const group=new THREE.Group();
  group.name=`attack-${attack.id}`;
  group.userData.attackId=attack.id;
  group.userData.lowWave=true;

  const guide=new THREE.Mesh(new THREE.PlaneGeometry(1.08,.055),makeLowWaveMaterial(0xff6aae,.20));
  guide.name='low-wave-floor-guide';
  guide.position.y=-.035;
  group.add(guide);

  const core=new THREE.Mesh(new THREE.PlaneGeometry(.88,.045),makeLowWaveMaterial(0xfff1b8,.88));
  core.name='low-wave-core';
  group.add(core);

  for(let layer=0;layer<3;layer++){
    const points=[];
    const half=.51-layer*.035;
    const amp=.035+layer*.012;
    for(let i=0;i<=28;i++){
      const t=i/28;
      points.push(new THREE.Vector3(-half+t*half*2,Math.sin(t*Math.PI*4+layer*.75)*amp+(layer-1)*.025,0));
    }
    const crest=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),makeLowWaveLineMaterial(layer===1?0xfff1b8:0xff4fa3,.68-layer*.12));
    crest.name='low-wave-crest';
    group.add(crest);
  }

  for(let i=0;i<3;i++){
    const note=new THREE.Group();
    note.name='low-wave-note';
    note.userData.noteIndex=i;
    const head=new THREE.Mesh(new THREE.SphereGeometry(.027,10,8),makeLowWaveMaterial(i===1?0xfff1b8:0xff6aae,.92));
    head.scale.y=.72;
    const stem=new THREE.Mesh(new THREE.PlaneGeometry(.012,.105),makeLowWaveMaterial(i===1?0xfff1b8:0xff6aae,.78));
    stem.position.set(.032,.052,0);
    note.add(head,stem);
    note.position.set((i-1)*.27,.055+(i%2)*.025,.01);
    group.add(note);
  }

  if(!screenStage){
    group.rotation.x=-Math.PI/2;
  }
  group.traverse(o=>{if(o.isMesh||o.isLine)o.renderOrder=5;});
  return group;
}

function makeVisual(attack,screenStage=false){
  if(attack.definitionId==='wave-low')return makeLowWaveVisual(attack,screenStage);
  const group=new THREE.Group();group.name=`attack-${attack.id}`;group.userData.attackId=attack.id;const mat=makeMaterial(attack.height);
  if(attack.type==='wave'||attack.type==='ring'||attack.type==='echo'||attack.type==='boom'){
    const radius=Math.max(.16,attack.radius||.3);const ring=new THREE.Mesh(new THREE.TorusGeometry(radius*1.45,Math.max(.025,radius*.12),8,36),mat);
    if(!screenStage)ring.rotation.x=Math.PI/2;group.add(ring);
    if(attack.type==='boom'){const halo=new THREE.Mesh(new THREE.RingGeometry(radius*.7,radius*1.65,36),mat.clone());if(!screenStage)halo.rotation.x=-Math.PI/2;halo.material.opacity=.24;group.add(halo);}
  }else if(attack.type==='beam'){
    const core=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,.8,12),mat);if(!screenStage)core.rotation.x=Math.PI/2;group.add(core);
  }else{
    const orb=new THREE.Mesh(new THREE.SphereGeometry(Math.max(.12,attack.radius*.65),14,10),mat);group.add(orb);
    const note=new THREE.Mesh(new THREE.TorusGeometry(Math.max(.1,attack.radius*.45),.025,6,20),mat.clone());if(!screenStage)note.rotation.x=Math.PI/2;group.add(note);
  }
  group.traverse(o=>{if(o.isMesh)o.renderOrder=4;});return group;
}

export function createAttackVisualSystem(scene,{projectPosition=(position)=>position,screenStage=false}={}){
  const visuals=new Map();
  function sync(attacks=[]){
    const live=new Set();
    const now=performance.now?.()||0;
    for(const attack of attacks){
      if(attack.dead)continue;live.add(attack.id);let visual=visuals.get(attack.id);
      if(!visual){visual=makeVisual(attack,screenStage);visuals.set(attack.id,visual);scene.add(visual);}
      const projected=projectPosition(attack.position)||attack.position;visual.position.set(projected.x,projected.y,projected.z);
      if(attack.definitionId==='wave-low'){
        const pulse=(1+.055*Math.sin(now/105))*(Number(projected.scale)||1);
        visual.scale.setScalar(pulse);
        const leadWorld={x:attack.position.x+(attack.forward?.x||0),y:attack.position.y,z:attack.position.z+(attack.forward?.z||0)};
        const lead=projectPosition(leadWorld)||leadWorld;
        if(screenStage)visual.rotation.z=Math.atan2(lead.y-projected.y,lead.x-projected.x)+Math.PI/2;
        else visual.rotation.y=Math.atan2(attack.forward?.x||0,attack.forward?.z||-1);
        const age=Math.max(0,now-(attack.born||now));
        const guide=visual.getObjectByName('low-wave-floor-guide');
        const core=visual.getObjectByName('low-wave-core');
        if(guide?.material)guide.material.opacity=age<LOW_WAVE_TELEGRAPH_MS ? .32 : .10;
        if(core?.material)core.material.opacity=age<LOW_WAVE_TELEGRAPH_MS ? .55 : .92;
        for(const note of visual.children.filter(child=>child.name==='low-wave-note')){
          const idx=note.userData.noteIndex||0;
          note.position.x=((idx-1)*.27)+Math.sin(now/190+idx*1.9)*.035;
          note.position.y=.055+(idx%2)*.025+Math.sin(now/150+idx)*.018;
        }
      }else{
        const pulse=(1+.12*Math.sin(now/90))*(Number(projected.scale)||1);visual.scale.setScalar(pulse);
        if(attack.type==='beam'&&!screenStage)visual.rotation.y=Math.atan2(attack.forward.x,attack.forward.z);
      }
    }
    for(const [id,visual] of visuals){if(live.has(id))continue;scene.remove(visual);visual.traverse(o=>{o.geometry?.dispose?.();const mats=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];for(const m of mats)m.dispose?.();});visuals.delete(id);}
  }
  return {sync,dispose(){sync([]);}};
}
