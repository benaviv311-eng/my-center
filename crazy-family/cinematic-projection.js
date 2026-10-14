const DEFAULT_BOUNDS=Object.freeze({minX:-6,maxX:6,minZ:-4.6,maxZ:4.6});

// CHARACTER_INTEGRATION_V044 — project logical room movement onto the approved cinematic floor.
function clamp01(value){return Math.max(0,Math.min(1,value));}

export function projectWorldToCinematicStage(point,{bounds=DEFAULT_BOUNDS}={}){
  const minZ=Number(bounds.minZ)??-4.6;
  const maxZ=Number(bounds.maxZ)??4.6;
  const spanZ=Math.max(.001,maxZ-minZ);
  const depth=clamp01(((Number(point?.z)||0)-minZ)/spanZ);
  const perspective=.60+depth*.40;
  const x=(Number(point?.x)||0)*perspective*.96;
  const groundY=.95-depth*4.72;
  const jumpY=(Number(point?.y)||0)*.94;
  const scale=1.44+depth*.88;
  return {x,y:groundY+jumpY,groundY,z:-4.65+depth*1.75,scale,depth};
}

export function projectScaleForCinematicStage(point,options){return projectWorldToCinematicStage(point,options).scale;}
