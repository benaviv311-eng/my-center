import { createCharacter3D } from './characters-3d.js';

function clockNow(){ return globalThis.performance?.now?.() ?? Date.now(); }
function clonePosition(position){return{x:Number(position?.x)||0,y:Number(position?.y)||0,z:Number(position?.z)||0};}
function stateFor(kind,state,speed){
  if(kind==='libi'){
    if(state==='jump'||state==='crouch')return state;
    if(speed>.12)return speed>4.4?'run':'walk';
    return 'ground';
  }
  if(['sing','pant','yawn','sneeze','chase'].includes(state))return state;
  return speed>.12?'chase':'idle';
}

export function createWorld3DCharacterVisual({scene,kind}){
  const native=createCharacter3D({scene,kind});
  const root=native.root;
  const rawScaleSet=root.scale.set.bind(root.scale);
  root.scale.set=(x=1,y=1,z=1)=>{
    const keepCrouch=root.userData.state==='crouch'?root.scale.y:Math.abs(Number(y)||1);
    return rawScaleSet(Math.abs(Number(x)||1),keepCrouch,Math.abs(Number(z)||1));
  };

  let lastPosition=null,lastAt=null,lastFacing=0;
  return {
    mesh:root,
    root,
    isVolumetric3D:true,
    approvedAssetUrl:null,
    setPose({position,facing:legacyFacing=1,jumpHeight=0,state='idle'}={}){
      const now=clockNow();
      const next=clonePosition(position);
      next.y+=(Number(jumpHeight)||0);
      let speed=0;
      if(lastPosition){
        const dx=next.x-lastPosition.x,dz=next.z-lastPosition.z;
        const distance=Math.hypot(dx,dz);
        const dt=Math.max(.001,Math.min(.1,(now-(lastAt??now))/1000||.016));
        speed=distance/dt;
        if(distance>.0005)lastFacing=Math.atan2(dx,dz);
      }else if(Number.isFinite(legacyFacing)){
        lastFacing=legacyFacing<0?-Math.PI/2:Math.PI/2;
      }
      const mappedState=stateFor(kind,state,speed);
      native.setTransform({position:next,facing:lastFacing,state:mappedState,speed,grounded:mappedState!=='jump'});
      native.update(lastAt==null?1/60:Math.max(0,Math.min(.033,(now-lastAt)/1000)),now);
      lastPosition=next;lastAt=now;
    },
    faceCamera() {},
    setFrame() {},
    setVisible(value){native.setVisible(value);},
    dispose(){native.dispose();},
  };
}
