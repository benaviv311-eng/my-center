function baseTransform(){return {x:0,y:0,z:0,rotX:0,rotY:0,rotZ:0,scaleY:1};}

function ensure(controller,id){
  if(!controller.transforms[id])controller.transforms[id]=baseTransform();
  return controller.transforms[id];
}

function nudge(controller,id,{x=0,y=0,z=0,rotX=0,rotY=0,rotZ=0,scaleY=1}={}){
  const t=ensure(controller,id);
  t.x+=x;t.y+=y;t.z+=z;t.rotX+=rotX;t.rotY+=rotY;t.rotZ+=rotZ;
  if(scaleY!==1)t.scaleY=Math.min(t.scaleY,scaleY);
}

export function createReactivePropController(world){
  const transforms={};
  for(const object of world?.objects||[])transforms[object.id]=baseTransform();
  return {transforms,cameraShake:0,lastEvent:null,surfaceCue:null};
}

export function triggerRoomReaction(controller,event,payload={}){
  controller.lastEvent=event;
  if(event==='toy-kick'){
    const id=payload.id||'toy-ball',dir=payload.direction||{x:1,z:0};
    const len=Math.hypot(dir.x||0,dir.z||0)||1;
    nudge(controller,id,{x:(dir.x||0)/len*.42,y:.08,z:(dir.z||0)/len*.42,rotX:.45,rotZ:.35});
  }else if(event==='sofa-compress'){
    nudge(controller,'sofa',{y:-.035,scaleY:.94});
  }else if(event==='dad-pant-near-furniture'){
    if(payload.nearId==='sofa'){nudge(controller,'sofa',{y:-.025,scaleY:.955});nudge(controller,'cushion-a',{x:-.025,rotZ:-.05});}
  }else if(event==='sneeze-small'){
    nudge(controller,'toy-ball',{x:.14,y:.04,z:.08,rotX:.18});
    nudge(controller,'cushion-a',{x:-.04,y:.025,rotZ:-.07});
    nudge(controller,'cushion-b',{x:.035,y:.02,rotZ:.06});
    controller.cameraShake=Math.max(controller.cameraShake,.14);
  }else if(event==='sneeze-mega'){
    nudge(controller,'toy-ball',{x:.72,y:.2,z:.38,rotX:.85,rotZ:.65});
    nudge(controller,'toy-blocks',{x:.28,y:.12,z:-.24,rotY:.5,rotZ:.32});
    nudge(controller,'cushion-a',{x:-.34,y:.18,z:.12,rotZ:-.38});
    nudge(controller,'cushion-b',{x:.31,y:.17,z:-.08,rotZ:.34});
    nudge(controller,'sofa',{y:-.045,scaleY:.93});
    controller.cameraShake=Math.max(controller.cameraShake,.62);
  }
  return controller;
}

export function stepRoomReactions(controller,dt){
  const alpha=1-Math.exp(-5.2*Math.max(0,dt));
  for(const t of Object.values(controller.transforms)){
    t.x+=(0-t.x)*alpha;t.y+=(0-t.y)*alpha;t.z+=(0-t.z)*alpha;
    t.rotX+=(0-t.rotX)*alpha;t.rotY+=(0-t.rotY)*alpha;t.rotZ+=(0-t.rotZ)*alpha;
    t.scaleY+=(1-t.scaleY)*alpha;
  }
  controller.cameraShake+=(0-controller.cameraShake)*(1-Math.exp(-6.5*Math.max(0,dt)));
  return controller;
}

export function surfaceCueFor(surfaceKind){
  return ({rug:'footstep-soft-thump',wood:'footstep-wood-tap',tile:'footstep-tile-clack',sofa:'footstep-cushion-puff'})[surfaceKind]||'footstep-wood-tap';
}
