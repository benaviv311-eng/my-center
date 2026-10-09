from pathlib import Path

path = Path('crazy-family.html')
text = path.read_text(encoding='utf-8')


def replace_once(old, new, label):
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly one match, found {count}')
    text = text.replace(old, new, 1)

replace_once('עולם הבית · שלב 1: מפגש אבא · v0.29', 'עולם הבית · שלב 1: מפגש אבא · v0.30', 'version')

anchor = "let dadFacing=1;\n"
house_code = r'''

// HOUSE_PHYSICS_V030 — the ground floor behaves like a lived-in home, not a flat backdrop.
const houseZones=[
 {id:'rug',kind:'surface',x:26,y:154,w:410,h:134,speed:.86},
 {id:'sofa',kind:'softBlock',x:70,y:85,w:220,h:72},
 {id:'coffeeTable',kind:'underTable',x:250,y:188,w:138,h:58},
 {id:'toys',kind:'loose',x:320,y:228,w:112,h:58},
 {id:'doorway',kind:'transition',x:438,y:210,w:70,h:102},
 {id:'kitchenTile',kind:'surface',x:485,y:22,w:445,h:266,speed:1.035},
 {id:'diningTable',kind:'underTable',x:95,y:405,w:220,h:92},
 {id:'diningChairs',kind:'loose',x:56,y:362,w:310,h:180,speed:.91}
];
const houseFx={rugRipple:0,sofaSink:0,toyKick:0,chairNudge:0,doorGlow:0,dustBurst:0,stepPulse:0};
const houseToyPositions=[{x:348,y:252,r:9},{x:386,y:236,r:7},{x:414,y:266,r:8}];
let dadHouseState='idle',dadHouseUntil=0,dadRunHeat=0,dadIdleHeat=0,dadNextSneezeAt=performance.now()+9000;
function pointInHouseZone(z,x,y,pad=0){return x>=z.x-pad&&x<=z.x+z.w+pad&&y>=z.y-pad&&y<=z.y+z.h+pad}
function houseZone(id){return houseZones.find(z=>z.id===id)}
function houseSurfaceFactor(x,y){if(player.scene!=='ground')return 1;let f=1;for(const z of houseZones)if(z.kind==='surface'&&pointInHouseZone(z,x,y))f*=z.speed||1;if(pointInHouseZone(houseZone('diningChairs'),x,y))f*=houseZone('diningChairs').speed;return f}
function pushOutsideHouseRect(prevX,prevY,nx,ny,z,pad=16){const l=z.x-pad,r=z.x+z.w+pad,t=z.y-pad,b=z.y+z.h+pad;if(nx<l||nx>r||ny<t||ny>b)return{x:nx,y:ny,hit:false};if(prevX<=l)return{x:l,y:ny,hit:true};if(prevX>=r)return{x:r,y:ny,hit:true};if(prevY<=t)return{x:nx,y:t,hit:true};if(prevY>=b)return{x:nx,y:b,hit:true};const edges=[{d:Math.abs(nx-l),x:l,y:ny},{d:Math.abs(nx-r),x:r,y:ny},{d:Math.abs(ny-t),x:nx,y:t},{d:Math.abs(ny-b),x:nx,y:b}].sort((a,b)=>a.d-b.d);return{x:edges[0].x,y:edges[0].y,hit:true}}
function resolveHouseInteraction(prevX,prevY,nx,ny){if(player.scene!=='ground')return{x:nx,y:ny};const now=performance.now(),small=player.crouching||now<player.rollUntil,airborne=now<player.jumpUntil||now<player.vaultUntil;for(const id of ['sofa','coffeeTable','diningTable']){const z=houseZone(id);if(!pointInHouseZone(z,nx,ny,player.r))continue;if(id==='sofa'&&airborne){houseFx.sofaSink=1;continue}if((id==='coffeeTable'||id==='diningTable')&&small){houseFx.stepPulse=Math.max(houseFx.stepPulse,.8);continue}const out=pushOutsideHouseRect(prevX,prevY,nx,ny,z,player.r);nx=out.x;ny=out.y;if(id==='sofa')houseFx.sofaSink=Math.max(houseFx.sofaSink,.55)}const toys=houseZone('toys');if(pointInHouseZone(toys,nx,ny,10)){houseFx.toyKick=1;houseFx.stepPulse=1}const chairs=houseZone('diningChairs');if(pointInHouseZone(chairs,nx,ny,8))houseFx.chairNudge=Math.min(1,houseFx.chairNudge+.18);if(pointInHouseZone(houseZone('rug'),nx,ny)){houseFx.rugRipple=Math.min(1,houseFx.rugRipple+.12);houseFx.stepPulse=Math.min(1,houseFx.stepPulse+.1)}if(pointInHouseZone(houseZone('doorway'),nx,ny,16))houseFx.doorGlow=1;return{x:nx,y:ny}}
function resolveDadHouseInteraction(prevX,prevY,nx,ny){if(dad.scene!=='ground')return{x:nx,y:ny};for(const id of ['sofa','coffeeTable','diningTable']){const z=houseZone(id);if(!pointInHouseZone(z,nx,ny,dad.r))continue;const out=pushOutsideHouseRect(prevX,prevY,nx,ny,z,dad.r);nx=out.x;ny=out.y;if(id==='sofa')houseFx.sofaSink=Math.max(houseFx.sofaSink,.35)}if(pointInHouseZone(houseZone('diningChairs'),nx,ny,12))houseFx.chairNudge=1;if(pointInHouseZone(houseZone('toys'),nx,ny,14))houseFx.toyKick=1;return{x:nx,y:ny}}
function updateHouseObjects(dt){if(player.scene!=='ground'){for(const k of Object.keys(houseFx))houseFx[k]=Math.max(0,houseFx[k]-dt*2);return}houseFx.rugRipple=Math.max(0,houseFx.rugRipple-dt*1.8);houseFx.sofaSink=Math.max(0,houseFx.sofaSink-dt*2.3);houseFx.toyKick=Math.max(0,houseFx.toyKick-dt*1.6);houseFx.chairNudge=Math.max(0,houseFx.chairNudge-dt*2);houseFx.doorGlow=Math.max(0,houseFx.doorGlow-dt*2.2);houseFx.dustBurst=Math.max(0,houseFx.dustBurst-dt*1.4);houseFx.stepPulse=Math.max(0,houseFx.stepPulse-dt*2.8);if(Math.hypot(player.x-180,player.y-150)<82)houseFx.sofaSink=Math.max(houseFx.sofaSink,.08);if(Math.hypot(dad.x-210,dad.y-450)<115)houseFx.chairNudge=Math.max(houseFx.chairNudge,.12)}
function setDadHouseState(state,ms,now=performance.now()){dadHouseState=state;dadHouseUntil=now+ms;dad.targetX=dad.x;dad.targetY=dad.y;if(state==='sneeze'){houseFx.dustBurst=1;houseFx.rugRipple=Math.max(houseFx.rugRipple,.6)}}
function updateDadHouseBehavior(dt,now,dist,moving,songPlaying){if(dad.scene!=='ground')return false;if(now<dadHouseUntil){dad.targetX=dad.x;dad.targetY=dad.y;return true}if(dadHouseState!=='idle')dadHouseState='idle';if(songPlaying){dadRunHeat=Math.max(0,dadRunHeat-dt*.35);dadIdleHeat=0;return false}if(moving&&dist<350)dadRunHeat=Math.min(10,dadRunHeat+dt);else dadRunHeat=Math.max(0,dadRunHeat-dt*.55);if(dadRunHeat>6.6){dadRunHeat=0;setDadHouseState('pant',1850,now);return true}const dusty=pointInHouseZone(houseZone('rug'),dad.x,dad.y,32)||pointInHouseZone(houseZone('toys'),dad.x,dad.y,45);if(now>=dadNextSneezeAt){if(dusty){setDadHouseState('sneeze',920,now);dadNextSneezeAt=now+14000+Math.random()*8000;return true}dadNextSneezeAt=now+2500}if(!moving&&dist>235){dadIdleHeat+=dt;if(dadIdleHeat>5.2){dadIdleHeat=0;setDadHouseState('yawn',1700,now);return true}}else dadIdleHeat=Math.max(0,dadIdleHeat-dt);return false}
function drawHouseLife(){if(player.scene!=='ground')return;const now=performance.now();ctx.save();ctx.lineCap='round';const rug=houseZone('rug');if(houseFx.rugRipple>.02){ctx.globalAlpha=.16+.16*houseFx.rugRipple;ctx.strokeStyle='#fff2d4';ctx.lineWidth=2;for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(player.x,player.y+18,22+i*12+houseFx.rugRipple*10,6+i*2,0,0,Math.PI*2);ctx.stroke()}}if(houseFx.sofaSink>.02){ctx.globalAlpha=.15*houseFx.sofaSink;ctx.fillStyle='#ffd9c8';ctx.beginPath();ctx.ellipse(180,153,84+houseFx.sofaSink*8,10+houseFx.sofaSink*3,0,0,Math.PI*2);ctx.fill()}if(houseFx.toyKick>.02){for(let i=0;i<houseToyPositions.length;i++){const t=houseToyPositions[i],kick=houseFx.toyKick*(8+i*2);ctx.globalAlpha=.24*houseFx.toyKick;ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(t.x+Math.sin(now/90+i)*kick,t.y+Math.cos(now/110+i)*kick,t.r+5,0,Math.PI*2);ctx.stroke()}}if(houseFx.chairNudge>.02){ctx.globalAlpha=.22*houseFx.chairNudge;ctx.strokeStyle='#ffe4bb';ctx.lineWidth=3;for(let i=0;i<3;i++){const y=397+i*48;ctx.beginPath();ctx.moveTo(66+Math.sin(now/80+i)*5,y);ctx.lineTo(82+Math.sin(now/80+i)*5,y);ctx.stroke()}}if(houseFx.doorGlow>.02){ctx.globalAlpha=.11*houseFx.doorGlow;const g=ctx.createLinearGradient(438,0,508,0);g.addColorStop(0,'rgba(255,231,170,0)');g.addColorStop(.5,'rgba(255,231,170,.95)');g.addColorStop(1,'rgba(255,231,170,0)');ctx.fillStyle=g;ctx.fillRect(438,210,70,102)}if(houseFx.dustBurst>.02){ctx.globalAlpha=.48*houseFx.dustBurst;ctx.fillStyle='#fff6dc';for(let i=0;i<9;i++){const a=i*.7+now/900,r=18+i*3;ctx.beginPath();ctx.arc(dad.x+Math.cos(a)*r,dad.y-22+Math.sin(a)*r*.45,2+(i%3),0,Math.PI*2);ctx.fill()}}ctx.restore()}
function drawDadHouseStateFX(){if(player.scene!==dad.scene||dadHouseState==='idle')return;const now=performance.now();ctx.save();ctx.textAlign='center';ctx.font='900 18px Arial';ctx.fillStyle='#fff';ctx.shadowColor='#3b2932';ctx.shadowBlur=8;const bob=Math.sin(now/120)*2;if(dadHouseState==='pant'){ctx.fillText('הַף… הַף…',dad.x,dad.y-82+bob);ctx.globalAlpha=.3;ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(dad.x,dad.y-28,31+Math.sin(now/110)*4,0,Math.PI);ctx.stroke()}else if(dadHouseState==='yawn'){ctx.font='900 22px Arial';ctx.fillText('אַאאאה…',dad.x,dad.y-86+bob)}else if(dadHouseState==='sneeze'){ctx.font='900 24px Arial';ctx.fillText('אַפְּצ׳וּ!',dad.x,dad.y-88+bob)}ctx.restore()}
'''
if 'HOUSE_PHYSICS_V030' in text:
    raise SystemExit('house physics already present')
replace_once(anchor, anchor + house_code, 'house physics insertion')

old_move = "function move(dx,dy,dt,sprint){const len=Math.hypot(dx,dy);player.moving=!!len;if(!len)return;dx/=len;dy/=len;if(Math.abs(dx)>Math.abs(dy))player.dir=dx>0?'right':'left';else player.dir=dy>0?'down':'up';let m=1;if(player.crouching)m*=.58;if(sprint&&player.stamina>0){m*=1.7;player.stamina=Math.max(0,player.stamina-34*dt)}player.x=clamp(player.x+dx*player.speed*m*dt,28,932);player.y=clamp(player.y+dy*player.speed*m*dt,28,572);walk+=dt*m*8}"
new_move = "function move(dx,dy,dt,sprint){const len=Math.hypot(dx,dy);player.moving=!!len;if(!len)return;dx/=len;dy/=len;if(Math.abs(dx)>Math.abs(dy))player.dir=dx>0?'right':'left';else player.dir=dy>0?'down':'up';let m=houseSurfaceFactor(player.x,player.y);if(player.crouching)m*=.58;if(sprint&&player.stamina>0){m*=1.7;player.stamina=Math.max(0,player.stamina-34*dt)}const prevX=player.x,prevY=player.y,nx=clamp(player.x+dx*player.speed*m*dt,28,932),ny=clamp(player.y+dy*player.speed*m*dt,28,572),resolved=resolveHouseInteraction(prevX,prevY,nx,ny);player.x=resolved.x;player.y=resolved.y;walk+=dt*m*8}"
replace_once(old_move, new_move, 'movement physics')

replace_once("if(!sprint||(!dx&&!dy))player.stamina=Math.min(100,player.stamina+20*dt);updateDad(dt);updateDadAttackSystem(dt);collect();", "if(!sprint||(!dx&&!dy))player.stamina=Math.min(100,player.stamina+20*dt);updateDad(dt);updateDadAttackSystem(dt);updateHouseObjects(dt);collect();", 'house update loop')

old_dad_move = "const vx=dad.targetX-dad.x,vy=dad.targetY-dad.y,len=Math.hypot(vx,vy);if(len>5){dad.x+=vx/len*dad.speed*dt;dad.y+=vy/len*dad.speed*dt}dad.phase+=dt*(activeSong?8:3);"
new_dad_move = "const vx=dad.targetX-dad.x,vy=dad.targetY-dad.y,len=Math.hypot(vx,vy),dadHousePaused=updateDadHouseBehavior(dt,now,distToPlayer,len>5,activeSong);if(len>5&&!dadHousePaused){const prevX=dad.x,prevY=dad.y,nx=dad.x+vx/len*dad.speed*dt,ny=dad.y+vy/len*dad.speed*dt,resolved=resolveDadHouseInteraction(prevX,prevY,nx,ny);dad.x=resolved.x;dad.y=resolved.y}dad.phase+=dt*(activeSong?8:dadHouseState==='idle'?3:1.8);"
replace_once(old_dad_move, new_dad_move, 'Dad furniture navigation')

old_camera = "const camera=Math.max(0,Math.min(1,player.x/W));const sx=maxSx*camera;"
new_camera = "const lookAhead=player.dir==='right'?.055:player.dir==='left'?-.055:0,camera=Math.max(0,Math.min(1,player.x/W+lookAhead));const sx=maxSx*camera;"
replace_once(old_camera, new_camera, 'camera lookahead')

old_draw = "}else{drawBase(player.scene);furniture(player.scene)}exits();pickups();drawDad();drawDadAttacks();drawHangHint();libi();drawDizzyFX()}"
new_draw = "}else{drawBase(player.scene);furniture(player.scene)}drawHouseLife();exits();pickups();drawDad();drawDadHouseStateFX();drawDadAttacks();drawHangHint();libi();drawDizzyFX()}"
replace_once(old_draw, new_draw, 'house life rendering')

path.write_text(text, encoding='utf-8')
print('Applied Crazy Family v0.30 house interactions')
