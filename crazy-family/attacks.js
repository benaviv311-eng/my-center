export const WORLD_ATTACK_DEFINITIONS = Object.freeze([
  {id:'wave-low',name:'גל נמוך',type:'wave',height:'low',speed:5.5,radius:.28,range:8,damage:1},
  {id:'wave-high',name:'גל גבוה',type:'wave',height:'high',speed:5.2,radius:.28,range:8,damage:1},
  {id:'wave-mid',name:'גל אמצע',type:'wave',height:'mid',speed:5.7,radius:.3,range:8,damage:1},
  {id:'note-bounce',name:'תו קופץ',type:'note',height:'mid',speed:4.7,radius:.3,range:9,damage:1},
  {id:'note-homing',name:'תו רודף',type:'note',height:'mid',speed:4.25,radius:.32,range:10,damage:1},
  {id:'wave-wide',name:'גל רחב',type:'wave',height:'mid',speed:4.8,radius:.52,range:8,damage:1},
  {id:'sound-beam',name:'קרן קול',type:'beam',height:'mid',speed:7.2,radius:.2,range:11,damage:1},
  {id:'sound-ring',name:'טבעת קול',type:'ring',height:'mid',speed:4.4,radius:.4,range:9,damage:1},
  {id:'echo-return',name:'הד חוזר',type:'echo',height:'mid',speed:5,radius:.3,range:10,damage:1},
  {id:'chorus-boom',name:'בום של פזמון',type:'boom',height:'space',speed:3.8,radius:.65,range:7,damage:1},
]);

function heightY(height){if(height==='low')return .24;if(height==='high')return 1.05;if(height==='mid')return .65;return .55;}

export function createWorldAttack(definition,origin,forward,now=performance.now?.()||0){
  const length=Math.hypot(forward?.x||0,forward?.z||0)||1;
  const fx=(forward?.x||0)/length,fz=(forward?.z||-1)/length;
  return {
    id:`${definition.id}-${now}`,
    definitionId:definition.id,name:definition.name,type:definition.type,height:definition.height,
    origin:{x:origin.x,y:origin.y,z:origin.z},
    position:{x:origin.x,y:heightY(definition.height),z:origin.z},
    forward:{x:fx,z:fz},velocity:{x:fx*definition.speed,z:fz*definition.speed},
    speed:definition.speed,radius:definition.radius,range:definition.range,damage:definition.damage,
    travelled:0,born:now,dead:false,
  };
}

export function stepWorldAttack(attack,dt,world){
  if(attack.dead)return attack;
  const next={...attack,position:{...attack.position},velocity:{...attack.velocity}};
  const from={...next.position};
  const to={x:from.x+next.velocity.x*dt,y:from.y,z:from.z+next.velocity.z*dt};
  const hit=world?.traceAttackSegment?.(from,to,next);
  next.position=hit?.point?{...hit.point}:to;
  next.travelled+=Math.hypot(next.position.x-from.x,next.position.z-from.z);
  if(hit||next.travelled>=next.range)next.dead=true;
  return next;
}

export function attackHitsPlayer(attack,playerCapsule){
  if(attack.dead)return false;
  const p=playerCapsule.position||{x:0,y:0,z:0};
  const horizontal=Math.hypot(attack.position.x-p.x,attack.position.z-p.z);
  if(horizontal>(attack.radius+(playerCapsule.radius||.3)))return false;
  const bottom=p.y;
  const top=bottom+(playerCapsule.height||1.15);
  const verticalRadius=Math.max(.08,attack.radius*.55);
  return attack.position.y+verticalRadius>=bottom && attack.position.y-verticalRadius<=top;
}

export function dadForward(dad,player){
  const dx=player.x-dad.x,dz=player.z-dad.z,len=Math.hypot(dx,dz)||1;
  return {x:dx/len,z:dz/len};
}
