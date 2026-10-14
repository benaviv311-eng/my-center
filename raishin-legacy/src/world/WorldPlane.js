(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.RaishinV2=root.RaishinV2||{};root.RaishinV2.WorldPlane=api;}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const lerp=(a,b,t)=>a+(b-a)*t;
  function create(config){
    if(!config||!config.floor)throw new Error('WorldPlane requires dojo layout');
    const width=Number(config.WORLD_WIDTH),height=Number(config.WORLD_HEIGHT),floor=config.floor;
    if(!(width>0&&height>0))throw new Error('WorldPlane requires positive world dimensions');
    function edgesAt(t){
      return{
        left:lerp(floor.farLeft.x,floor.nearLeft.x,t),
        right:lerp(floor.farRight.x,floor.nearRight.x,t),
        y:lerp(floor.farLeft.y,floor.nearLeft.y,t),
        scale:lerp(floor.farScale,floor.nearScale,t)
      };
    }
    function project(point){
      const t=Number(point.y)/height,edges=edgesAt(t),ratio=Number(point.x)/width;
      const x=lerp(edges.left,edges.right,ratio),y=edges.y;
      return{x,y,scale:edges.scale,depth:y};
    }
    function unproject(point){
      const farY=floor.farLeft.y,nearY=floor.nearLeft.y,t=(Number(point.y)-farY)/(nearY-farY),edges=edgesAt(t);
      const ratio=(Number(point.x)-edges.left)/(edges.right-edges.left);
      return{x:ratio*width,y:t*height};
    }
    function contains(point,radius=0){
      const r=Math.max(0,Number(radius)||0),x=Number(point.x),y=Number(point.y);
      return x>=r&&x<=width-r&&y>=r&&y<=height-r;
    }
    return Object.freeze({project,unproject,contains,width,height});
  }
  return Object.freeze({create});
});
