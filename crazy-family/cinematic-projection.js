const DEFAULT_BOUNDS=Object.freeze({minX:-6,maxX:6,minZ:-4.6,maxZ:4.6});

function clamp01(value){return Math.max(0,Math.min(1,value));}

export function projectWorldToCinematicStage(point,{bounds=DEFAULT_BOUNDS}={}){
  const minZ=Number(bounds.minZ)??-4.6;
  const maxZ=Number(bounds.maxZ)??4.6;
  const spanZ=Math.max(.001,maxZ-minZ);
  const depth=clamp01(((Number(point?.z)||0)-minZ)/spanZ);
  const widthScale=.82+depth*.18;
  const x=(Number(point?.x)||0)*widthScale;
  const floorY=2.15-depth*5.25;
  const jumpY=(Number(point?.y)||0)*.9;
  return {
    x,
    y:floorY+jumpY,
    z:-4.7+depth*1.8,
    scale:.72+depth*.36,
    depth,
  };
}

export function projectScaleForCinematicStage(point,options){
  return projectWorldToCinematicStage(point,options).scale;
}
