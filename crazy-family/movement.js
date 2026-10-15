const GRAVITY = -20;
function approach(current,target,maxDelta){if(current<target)return Math.min(target,current+maxDelta);if(current>target)return Math.max(target,current-maxDelta);return target;}
function cloneState(state){return {...state,position:{...state.position},velocity:{...state.velocity},capsule:{...state.capsule}};}
function normalizeAngle(a){while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;return a;}
function rotateToward(current,target,maxDelta){const delta=normalizeAngle(target-current);if(Math.abs(delta)<=maxDelta)return normalizeAngle(target);return normalizeAngle(current+Math.sign(delta)*maxDelta);}
export function createCharacterState({ position, maxSpeed, acceleration, braking, radius, height, heading=0, turnRate=8.5 }) {
 return {position:{x:position.x,y:position.y,z:position.z},velocity:{x:0,y:0,z:0},maxSpeed,acceleration,braking,capsule:{radius,height},grounded:true,heading:Number.isFinite(heading)?heading:0,turnRate:Number.isFinite(turnRate)?turnRate:8.5,locomotionState:'idle'};
}
export function jumpCharacter(state, impulse) {if(!state.grounded)return state;const next=cloneState(state);next.velocity.y=impulse;next.grounded=false;next.locomotionState='airborne';return next;}
export function stepCharacter(state,intent,dt,world,options={}){
 const next=cloneState(state);const safeDt=Math.max(0,Number(dt)||0);const ix=Number(intent?.x)||0,iz=Number(intent?.z)||0,moving=Math.hypot(ix,iz)>1e-6,rate=moving?next.acceleration:next.braking;
 next.heading=Number.isFinite(next.heading)?next.heading:0;next.turnRate=Number.isFinite(next.turnRate)?next.turnRate:8.5;
 if(moving){const desiredHeading=Math.atan2(ix,-iz);next.heading=rotateToward(next.heading,desiredHeading,next.turnRate*safeDt);}
 next.velocity.x=approach(next.velocity.x,ix*next.maxSpeed,rate*safeDt);next.velocity.z=approach(next.velocity.z,iz*next.maxSpeed,rate*safeDt);
 const wasGrounded=Boolean(next.grounded);const floorBefore=world.groundHeightAt(next.position.x,next.position.z);if(next.grounded&&next.position.y<=floorBefore+1e-6){next.position.y=floorBefore;next.velocity.y=0;}else next.velocity.y+=GRAVITY*safeDt;
 const desired={x:next.position.x+next.velocity.x*safeDt,y:next.position.y+next.velocity.y*safeDt,z:next.position.z+next.velocity.z*safeDt};const resolved=world.resolveCharacterMove(next.position,desired,next.capsule)||desired;next.position={x:resolved.x,y:resolved.y,z:resolved.z};const floor=world.groundHeightAt(next.position.x,next.position.z);if(next.position.y<=floor){next.position.y=floor;next.velocity.y=0;next.grounded=true;}else next.grounded=false;
 const speed=Math.hypot(next.velocity.x,next.velocity.z);if(!next.grounded)next.locomotionState='airborne';else if(!wasGrounded&&next.grounded)next.locomotionState='landing';else if(options.crouching)next.locomotionState='crouch';else if(options.sprinting&&speed>.05)next.locomotionState='sprint';else if(speed>.05)next.locomotionState='run';else next.locomotionState='idle';return next;
}
export const LIBI_MOVEMENT_DEFAULTS=Object.freeze({maxSpeed:4.6,acceleration:16,braking:22,radius:.32,height:1.15,turnRate:8.5});
