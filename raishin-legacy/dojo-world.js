(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.RaishinDojoWorld=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const WORLD_WIDTH=1600,WORLD_HEIGHT=900;
const WALKABLE_POLYGON=[{x:150,y:825},{x:150,y:600},{x:300,y:365},{x:1285,y:365},{x:1455,y:585},{x:1455,y:830}];
const COLLISIONS=[
 {id:'training-bag',type:'circle',x:360,y:560,radius:58},
 {id:'weapons-rack',type:'rect',x:1160,y:350,width:285,height:92},
 {id:'left-column',type:'circle',x:250,y:455,radius:42},
 {id:'right-column',type:'circle',x:1350,y:470,radius:46},
 {id:'rear-furniture',type:'rect',x:650,y:370,width:300,height:92}
];
const INTERACTIONS=[
 {id:'training-bag',label:'Training Bag',x:360,y:650,radius:145,prompt:'Practice',type:'practice'},
 {id:'weapons-wall',label:'Weapons Wall',x:1210,y:505,radius:150,prompt:'Examine',type:'examine'},
 {id:'training-center',label:'Training Center',x:800,y:655,radius:135,prompt:'Begin Drill',type:'training'},
 {id:'courtyard-exit',label:'Courtyard Exit',x:1360,y:590,radius:140,prompt:'Go to Courtyard',type:'transition'},
 {id:'seika-point',label:'Seika Meditation Point',x:300,y:725,radius:130,prompt:'Focus',type:'seika'}
];
function pointInPolygon(point,polygon){let inside=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];const crosses=((a.y>point.y)!==(b.y>point.y))&&(point.x<(b.x-a.x)*(point.y-a.y)/((b.y-a.y)||1e-9)+a.x);if(crosses)inside=!inside;}return inside;}
function isInsideCollision(point,radius,collision){radius=radius||0;if(collision.type==='circle')return Math.hypot(point.x-collision.x,point.y-collision.y)<=(collision.radius+radius);if(collision.type==='rect')return point.x>=collision.x-radius&&point.x<=collision.x+collision.width+radius&&point.y>=collision.y-radius&&point.y<=collision.y+collision.height+radius;return false;}
function footprintInsidePolygon(point,radius){if(!pointInPolygon(point,WALKABLE_POLYGON))return false;if(!radius)return true;for(let i=0;i<8;i++){const a=i*Math.PI/4;if(!pointInPolygon({x:point.x+Math.cos(a)*radius,y:point.y+Math.sin(a)*radius},WALKABLE_POLYGON))return false;}return true;}
function isWalkable(point,radius=24){if(!footprintInsidePolygon(point,radius))return false;return !COLLISIONS.some(c=>isInsideCollision(point,radius,c));}
function resolvePlayerMotion(current,proposed,radius=24){if(isWalkable(proposed,radius))return{x:proposed.x,y:proposed.y};const xOnly={x:proposed.x,y:current.y};if(isWalkable(xOnly,radius))return xOnly;const yOnly={x:current.x,y:proposed.y};if(isWalkable(yOnly,radius))return yOnly;return{x:current.x,y:current.y};}
function nearestInteraction(point,maxDistance=Infinity){let winner=null,best=Infinity;for(const item of INTERACTIONS){const d=Math.hypot(point.x-item.x,point.y-item.y);if(d<=item.radius&&d<=maxDistance&&d<best){winner=item;best=d;}}return winner;}
function clamp01(v){return Math.max(0,Math.min(1,v));}
function worldToMinimap(point){return{x:clamp01(point.x/WORLD_WIDTH),y:clamp01(point.y/WORLD_HEIGHT)};}
return{WORLD_WIDTH,WORLD_HEIGHT,WALKABLE_POLYGON,COLLISIONS,INTERACTIONS,pointInPolygon,isInsideCollision,isWalkable,resolvePlayerMotion,nearestInteraction,worldToMinimap};
});
