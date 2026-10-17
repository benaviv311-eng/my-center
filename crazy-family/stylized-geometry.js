function clamp(value,min,max){return Math.max(min,Math.min(max,value));}

export function createRoundedBoxGeometry(THREE,{width,height,depth,radius=.06,bevel=.015,curveSegments=4}={}){
  const w=Math.max(.01,Number(width)||.01),h=Math.max(.01,Number(height)||.01),d=Math.max(.01,Number(depth)||.01);
  const maxRadius=Math.max(.001,Math.min(w,h,d)*.495);
  const r=clamp(Number(radius)||0,.001,maxRadius);
  const segments=Math.max(2,Math.min(8,Math.round(Number(curveSegments)||4)));
  const geometry=new THREE.BoxGeometry(w,h,d,segments,segments,segments);
  const position=geometry.attributes?.position;
  if(position?.count){
    const hx=w/2,hy=h/2,hz=d/2;
    const cx=Math.max(0,hx-r),cy=Math.max(0,hy-r),cz=Math.max(0,hz-r);
    for(let i=0;i<position.count;i++){
      const x=position.getX(i),y=position.getY(i),z=position.getZ(i);
      const coreX=clamp(x,-cx,cx),coreY=clamp(y,-cy,cy),coreZ=clamp(z,-cz,cz);
      const dx=x-coreX,dy=y-coreY,dz=z-coreZ;
      const len=Math.hypot(dx,dy,dz);
      if(len>1e-8)position.setXYZ(i,coreX+dx/len*r,coreY+dy/len*r,coreZ+dz/len*r);
    }
    position.needsUpdate=true;
  }
  geometry.computeVertexNormals?.();
  geometry.computeBoundingBox?.();
  geometry.userData={...(geometry.userData||{}),stylizedRoundedBox:true,width:w,height:h,depth:d,radius:r,bevel:Math.max(0,Number(bevel)||0),curveSegments:segments};
  return geometry;
}
