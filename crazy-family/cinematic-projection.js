const DEFAULT_BOUNDS=Object.freeze({minX:-6,maxX:6,minZ:-4.6,maxZ:4.6});

// REFERENCE_FLOOR_V043 — project the logical 3D room onto the photographed-style floor plane.
function clamp01(value){return Math.max(0,Math.min(1,value));}

export function projectWorldToCinematicStage(point,{bounds=DEFAULT_BOUNDS}={}){
  const minZ=Number(bounds.minZ)??-4.6;
  const maxZ=Number(bounds.maxZ)??4.6;
  const spanZ=Math.max(.001,maxZ-minZ);
  const depth=clamp01(((Number(point?.z)||0)-minZ)/spanZ);
  const perspective=.56+depth*.44;
  const x=(Number(point?.x)||0)*perspective*.96;
  const floorY=.95-depth*4.72;
  const jumpY=(Number(point?.y)||0)*.94;
  return {x,y:floorY+jumpY,z:-4.65+depth*1.75,scale:.54+depth*.62,depth};
}

export function projectScaleForCinematicStage(point,options){return projectWorldToCinematicStage(point,options).scale;}
