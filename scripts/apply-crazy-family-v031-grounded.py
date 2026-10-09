from pathlib import Path
import re

p = Path('crazy-family.html')
s = p.read_text(encoding='utf-8')

if 'STAGE1_SIDE_SCROLL_V031' in s:
    print('v0.31 already applied')
    raise SystemExit(0)

if 'שלב 1: מפגש אבא · v0.30' not in s:
    raise SystemExit('v0.30 title anchor not found')
s = s.replace('שלב 1: מפגש אבא · v0.30', 'שלב 1: מפגש אבא · v0.31', 1)

# Keep approved art, change only movement/grounding architecture.
old_player = "inventory:[],capacity:3,selected:0,dir:'down',moving:false};"
if old_player not in s:
    raise SystemExit('player state anchor not found')
s = s.replace(
    old_player,
    "inventory:[],capacity:3,selected:0,dir:'down',moving:false,vx:0,z:0,vz:0,grounded:true,landSquashUntil:0};",
    1,
)
old_dad = "targetAt:0,singing:false,phrase:'לה לה לה!',phase:0};"
if old_dad not in s:
    raise SystemExit('dad state anchor not found')
s = s.replace(
    old_dad,
    "targetAt:0,singing:false,phrase:'לה לה לה!',phase:0,vx:0};",
    1,
)

anchor = "let dadFacing=1;"
insert = r'''

// STAGE1_SIDE_SCROLL_V031 — grounded side-scrolling movement with weight and a real floor.
// v0.30 house interactions remain underneath this grounded movement layer.
const STAGE1_FLOOR_Y=500;
const STAGE1_GRAVITY=-1850;
const STAGE1_JUMP_SPEED=690;
const STAGE1_ACCEL=1450;
const STAGE1_BRAKE=2050;
const stage1Occluders=[
 {x:116,y:456,w:186,h:78},
 {x:332,y:472,w:140,h:50},
 {x:678,y:456,w:190,h:84}
];
function approachValue(v,target,amount){if(v<target)return Math.min(target,v+amount);if(v>target)return Math.max(target,v-amount);return target}
function stage1HorizontalIntent(dx){return dx===0?0:(dx>0?1:-1)}
function updateStage1VerticalPhysics(dt){if(player.scene!=='ground')return;const wasAirborne=player.z>0||player.vz!==0;if(wasAirborne){player.vz+=STAGE1_GRAVITY*dt;player.z=Math.max(0,player.z+player.vz*dt);if(player.z<=0&&player.vz<0){player.z=0;player.vz=0;player.grounded=true;player.landSquashUntil=performance.now()+145;houseFx.stepPulse=1}}else{player.z=0;player.vz=0;player.grounded=true}player.y=STAGE1_FLOOR_Y}
function updateStage1Kinematics(dx,dt,sprint){const intent=stage1HorizontalIntent(dx),surface=houseSurfaceFactor(player.x,STAGE1_FLOOR_Y),boost=sprint&&player.stamina>0?1.62:1,target=intent*player.speed*boost*surface,rate=intent?STAGE1_ACCEL:STAGE1_BRAKE;player.vx=approachValue(player.vx,target,rate*dt);if(sprint&&intent&&player.stamina>0)player.stamina=Math.max(0,player.stamina-34*dt);const prevX=player.x,nx=clamp(prevX+player.vx*dt,28,932),pos=resolveHouseInteraction(prevX,STAGE1_FLOOR_Y,nx,STAGE1_FLOOR_Y);if(Math.abs(pos.x-nx)>.5)player.vx*=.12;player.x=clamp(pos.x,28,932);player.y=STAGE1_FLOOR_Y;player.moving=Math.abs(player.vx)>8;if(player.moving){player.dir=player.vx>0?'right':'left';walk+=dt*(3.6+Math.abs(player.vx)/55)}updateStage1VerticalPhysics(dt)}
function drawGroundShadow(x,groundY,height,r=24,alpha=.28){const h=Math.max(0,height),scale=Math.max(.46,1-h/210),a=alpha*Math.max(.28,1-h/240);ctx.save();ctx.globalAlpha=a;ctx.fillStyle='#241a20';ctx.beginPath();ctx.ellipse(x,groundY+22,r*scale,6*scale,0,0,Math.PI*2);ctx.fill();ctx.restore()}
function drawStage1Foreground(){if(player.scene!=='ground')return;const img=art.ground;if(img&&img.complete&&img.naturalWidth){for(const o of stage1Occluders){ctx.save();ctx.beginPath();ctx.rect(o.x,o.y,o.w,o.h);ctx.clip();drawStage1Panorama(img);ctx.restore()}}const g=ctx.createLinearGradient(0,520,0,H);g.addColorStop(0,'rgba(28,20,24,0)');g.addColorStop(1,'rgba(28,20,24,.15)');ctx.fillStyle=g;ctx.fillRect(0,520,W,80)}
'''
if anchor not in s:
    raise SystemExit('dadFacing anchor not found')
s = s.replace(anchor, anchor + insert, 1)

# Re-map ground floor interactions into one physical floor band.
s, n = re.subn(
    r"const houseZones=\[.*?\];\nconst houseFx=",
    """const houseZones=[\n {id:'rug',kind:'surface',x:30,y:438,w:270,h:92,speed:.88},\n {id:'sofa',kind:'softBlock',x:122,y:398,w:176,h:92},\n {id:'coffeeTable',kind:'underTable',x:335,y:440,w:132,h:72},\n {id:'toys',kind:'loose',x:474,y:452,w:98,h:70},\n {id:'doorway',kind:'transition',x:570,y:382,w:72,h:140},\n {id:'kitchenTile',kind:'surface',x:575,y:430,w:350,h:112,speed:1.025},\n {id:'diningTable',kind:'underTable',x:690,y:420,w:164,h:94},\n {id:'diningChairs',kind:'loose',x:648,y:410,w:230,h:128,speed:.93}\n];\nconst houseFx=""",
    s,
    count=1,
    flags=re.S,
)
if n != 1:
    raise SystemExit('houseZones anchor not found')

s, n = re.subn(
    r"const houseToyPositions=\[.*?\];",
    "const houseToyPositions=[{x:495,y:486,r:9},{x:528,y:474,r:7},{x:554,y:492,r:8}];",
    s,
    count=1,
)
if n != 1:
    raise SystemExit('houseToyPositions anchor not found')

# Natural placement: pickups sit on/near furniture instead of floating in the room.
s, n = re.subn(
    r"const items=\{ground:\[.*?\],basement:",
    "const items={ground:[{x:410,y:463,id:'headphones',name:'אוזניות',icon:'🎧'},{x:610,y:458,id:'mirror',name:'מראה',icon:'🪞'},{x:844,y:462,id:'pan',name:'מחבת',icon:'🍳'}],basement:",
    s,
    count=1,
)
if n != 1:
    raise SystemExit('ground items anchor not found')

# Free 2D roaming becomes horizontal acceleration/braking on the actual floor.
old_move = re.search(r"function move\(dx,dy,dt,sprint\)\{.*?\}\nfunction collect", s, re.S)
if not old_move:
    raise SystemExit('move function not found')
new_move = """function move(dx,dy,dt,sprint){if(player.scene==='ground'){updateStage1Kinematics(dx,dt,sprint);return}const len=Math.hypot(dx,dy);player.moving=!!len;if(!len)return;dx/=len;dy/=len;if(Math.abs(dx)>Math.abs(dy))player.dir=dx>0?'right':'left';else player.dir=dy>0?'down':'up';let m=1;if(player.crouching)m*=.58;if(sprint&&player.stamina>0){m*=1.7;player.stamina=Math.max(0,player.stamina-34*dt)}player.x=clamp(player.x+dx*player.speed*m*dt,28,932);player.y=clamp(player.y+dy*player.speed*m*dt,28,572);walk+=dt*m*8}\nfunction collect"""
s = s[:old_move.start()] + new_move + s[old_move.end():]

# Real jump impulse/gravity on ground; preserve old movement elsewhere.
m = re.search(r"function triggerJump\(\)\{.*?\}\nfunction triggerRoll", s, re.S)
if not m:
    raise SystemExit('triggerJump function not found')
new_jump = """function triggerJump(){const now=performance.now();if(player.lives<=0||player.hanging||keys.c||player.crouchingTouch||now<player.jumpCooldownUntil||now<player.rollUntil||now<player.vaultUntil)return false;if(player.scene==='ground'){if(player.z>1||!player.grounded)return false;player.jumpStartedAt=now;player.jumpUntil=now+760;player.jumpCooldownUntil=now+820;player.vz=STAGE1_JUMP_SPEED;player.grounded=false;houseFx.stepPulse=.9;return true}if(triggerVault())return true;player.jumpStartedAt=now;player.jumpUntil=now+650;player.jumpCooldownUntil=now+780;return true}\nfunction triggerRoll"""
s = s[:m.start()] + new_jump + s[m.end():]

# Dad patrol targets stay on the same floor instead of wandering vertically through the picture.
s, n = re.subn(
    r"function chooseDadTarget\(now\)\{.*?\}\nfunction updateDad",
    "function chooseDadTarget(now){if(now<dad.targetAt)return;dad.targetAt=now+1800+Math.random()*2500;const pts=[[110,STAGE1_FLOOR_Y],[275,STAGE1_FLOOR_Y],[455,STAGE1_FLOOR_Y],[625,STAGE1_FLOOR_Y],[790,STAGE1_FLOOR_Y],[900,STAGE1_FLOOR_Y]];const p=pts[Math.floor(Math.random()*pts.length)];dad.targetX=p[0];dad.targetY=p[1]}\nfunction updateDad",
    s,
    count=1,
    flags=re.S,
)
if n != 1:
    raise SystemExit('chooseDadTarget anchor not found')

# Dad keeps the v0.30 pant/yawn/sneeze pause logic, but movement itself becomes horizontal inertia.
dad_motion = re.search(
    r"const vx=dad\.targetX-dad\.x,vy=dad\.targetY-dad\.y,len=Math\.hypot\(vx,vy\),dadHousePaused=updateDadHouseBehavior\(dt,now,distToPlayer,len>5,activeSong\);if\(len>5&&!dadHousePaused\)\{.*?\}dad\.phase\+=dt\*\(activeSong\?8:dadHouseState==='idle'\?3:1\.8\);",
    s,
    re.S,
)
if not dad_motion:
    raise SystemExit('current v0.30 dad movement block not found')
new_dad_motion = "const vx=dad.targetX-dad.x,vy=dad.targetY-dad.y,len=Math.hypot(vx,vy),dadHousePaused=updateDadHouseBehavior(dt,now,distToPlayer,len>5,activeSong);if(dad.scene==='ground'){const desired=dadHousePaused?0:(Math.abs(vx)>6?Math.sign(vx)*dad.speed*(activeSong?1.08:1):0);dad.vx=approachValue(dad.vx,desired,(desired?560:820)*dt);const px=dad.x,nx=clamp(dad.x+dad.vx*dt,28,932),resolved=resolveDadHouseInteraction(px,STAGE1_FLOOR_Y,nx,STAGE1_FLOOR_Y);if(Math.abs(resolved.x-nx)>.5)dad.vx*=.08;dad.x=resolved.x;dad.y=STAGE1_FLOOR_Y}else if(len>5&&!dadHousePaused){const prevX=dad.x,prevY=dad.y,nx=dad.x+vx/len*dad.speed*dt,ny=dad.y+vy/len*dad.speed*dt,resolved=resolveDadHouseInteraction(prevX,prevY,nx,ny);dad.x=resolved.x;dad.y=resolved.y}dad.phase+=dt*(activeSong?8:dadHouseState==='idle'?3:1.8);"
s = s[:dad_motion.start()] + new_dad_motion + s[dad_motion.end():]

# Ground rolling is horizontal; vertical screen drift is removed.
roll = re.search(r"\}else if\(rolling\)\{player\.moving=true;.*?walk\+=dt\*14\}else\{sprint=", s, re.S)
if not roll:
    raise SystemExit('rolling branch not found')
new_roll = "}else if(rolling){player.moving=true;if(player.scene==='ground'){const rollDir=player.rollDX||((player.dir==='left')?-1:1);player.vx=rollDir*440;const pos=resolveHouseInteraction(player.x,STAGE1_FLOOR_Y,clamp(player.x+player.vx*dt,28,932),STAGE1_FLOOR_Y);player.x=pos.x;player.y=STAGE1_FLOOR_Y;updateStage1VerticalPhysics(dt)}else{player.x=clamp(player.x+player.rollDX*440*dt,28,932);player.y=clamp(player.y+player.rollDY*440*dt,28,572)}walk+=dt*14}else{sprint="
s = s[:roll.start()] + new_roll + s[roll.end():]

# Ground room labels follow horizontal travel, matching the side-scrolling layout.
s, n = re.subn(
    r"function roomAt\(s,x,y\)\{.*?\}",
    "function roomAt(s,x,y){if(s==='ground'){if(x<450)return{name:'סלון'};if(x<640)return{name:'מעבר'};if(x<790)return{name:'פינת אוכל'};return{name:'מטבח'}}return scenes[s].rooms.find(r=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h)||scenes[s].rooms[0]}",
    s,
    count=1,
)
if n != 1:
    raise SystemExit('roomAt anchor not found')

# Grounded character rendering: body rises, shadow stays on floor, landing squashes briefly.
m = re.search(r"function libi\(\)\{.*?\}\nfunction drawStage1Panorama", s, re.S)
if not m:
    raise SystemExit('libi render function not found')
new_libi = r'''function libi(){const now=performance.now(),jumping=player.scene==='ground'?player.z>1:now<player.jumpUntil,rolling=now<player.rollUntil,vaulting=now<player.vaultUntil;const jumpP=jumping&&player.scene!=='ground'?Math.max(0,Math.min(1,(now-player.jumpStartedAt)/Math.max(1,player.jumpUntil-player.jumpStartedAt))):0;const vaultP=vaulting?Math.max(0,Math.min(1,(now-player.vaultStartedAt)/Math.max(1,player.vaultUntil-player.vaultStartedAt))):0;const lift=player.scene==='ground'?player.z:(jumping?Math.sin(jumpP*Math.PI)*25:(vaulting?Math.sin(vaultP*Math.PI)*27:0));const pose=libiPose(now,jumping,rolling,vaulting),frame=libiFrame(pose),sx=(frame%LIBI_COLS)*LIBI_CELL_W,sy=Math.floor(frame/LIBI_COLS)*LIBI_CELL_H;if(player.dir==='left')libiFacing=-1;else if(player.dir==='right')libiFacing=1;const sprint=pose==='run',speedBob=player.scene==='ground'?Math.min(1,Math.abs(player.vx)/Math.max(1,player.speed)):1,bob=player.moving?Math.sin(walk*1.7)*(sprint?2.3:1.35)*speedBob:Math.sin(now/430)*.4;let dh=98;if(pose==='hang')dh=108;else if(pose==='crouch')dh=88;else if(pose==='roll')dh=90;else if(pose==='vault')dh=103;let dw=dh*(LIBI_CELL_W/LIBI_CELL_H);if(pose==='roll')dw*=1.12;const renderY=player.scene==='ground'?STAGE1_FLOOR_Y:player.y,landing=player.scene==='ground'&&now<player.landSquashUntil,syScale=landing?.91:1,sxScale=landing?1.06:1;ctx.save();ctx.translate(player.x,renderY+bob-lift);ctx.scale(libiFacing*sxScale,syScale);if(player.invulnerableUntil>now&&Math.floor(now/90)%2===0)ctx.globalAlpha=.35;if(pose!=='hang'&&player.scene!=='ground'){ctx.save();ctx.globalAlpha*=.22;ctx.fillStyle='#2a1f29';ctx.beginPath();ctx.ellipse(0,24+lift*.08,sprint?27:23,sprint?7:6,0,0,Math.PI*2);ctx.fill();ctx.restore()}if(libiSprite.complete&&libiSprite.naturalWidth){ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';const lean=sprint?.055:(pose==='vault'?.04:0);if(lean)ctx.rotate(lean);const dx=-dw/2,dy=-dh+27;ctx.drawImage(libiSprite,sx,sy,LIBI_CELL_W,LIBI_CELL_H,dx,dy,dw,dh)}else{ctx.font='54px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('👧',0,-18)}ctx.restore()}
function drawStage1Panorama'''
s = s[:m.start()] + new_libi + s[m.end():]

# Keep floor visually stable. Camera only has a tiny velocity look-ahead, not position-driven sliding under feet.
m = re.search(r"function drawStage1Panorama\(img\)\{.*?\}\nfunction draw\(\)", s, re.S)
if not m:
    raise SystemExit('stage1 panorama function not found')
new_pan = r'''function drawStage1Panorama(img){const targetAspect=W/H,srcAspect=img.naturalWidth/img.naturalHeight;if(srcAspect>targetAspect){const sw=img.naturalHeight*targetAspect,maxSx=Math.max(0,img.naturalWidth-sw),look=clamp((player.vx||0)/Math.max(1,player.speed*1.6),-1,1),sx=maxSx*clamp(.5+look*.055,0,1);ctx.drawImage(img,sx,0,sw,img.naturalHeight,0,0,W,H)}else{const sh=img.naturalWidth/targetAspect,sy=Math.max(0,(img.naturalHeight-sh)*.5);ctx.drawImage(img,0,sy,img.naturalWidth,sh,0,0,W,H)}}
function draw()'''
s = s[:m.start()] + new_pan + s[m.end():]

# Draw grounded shadows before characters and redraw foreground slices after them for occlusion.
m = re.search(r"function draw\(\)\{.*?\}\nfunction renderInv", s, re.S)
if not m:
    raise SystemExit('draw function not found')
new_draw = r'''function draw(){const img=art[player.scene];if(img&&img.complete&&img.naturalWidth){if(player.scene==='ground')drawStage1Panorama(img);else ctx.drawImage(img,0,0,W,H);const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'rgba(20,16,20,.03)');g.addColorStop(1,'rgba(20,16,20,.12)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H)}else{drawBase(player.scene);furniture(player.scene)}exits();drawHouseLife();pickups();if(player.scene==='ground'){drawGroundShadow(dad.x,STAGE1_FLOOR_Y,0,31,.24);drawGroundShadow(player.x,STAGE1_FLOOR_Y,player.z,player.moving?25:23,.3)}drawDad();drawDadHouseStateFX();drawDadAttacks();drawHangHint();libi();drawDizzyFX();drawStage1Foreground()}
function renderInv'''
s = s[:m.start()] + new_draw + s[m.end():]

# Dad art itself sits on the floor line on the ground scene.
if "ctx.translate(dad.x,dad.y+bob);" not in s:
    raise SystemExit('Dad render anchor not found')
s = s.replace(
    "ctx.translate(dad.x,dad.y+bob);",
    "ctx.translate(dad.x,(dad.scene==='ground'?STAGE1_FLOOR_Y:dad.y)+bob);",
    1,
)

# Verify the patch changed the intended architecture while preserving approved Libi art.
for token in [
    'STAGE1_SIDE_SCROLL_V031',
    "const LIBI_SPRITE_URL='assets/libi-sprites-v025.png'",
    'updateStage1Kinematics',
    'drawStage1Foreground()',
]:
    if token not in s:
        raise SystemExit(f'post-patch verification failed: {token}')

p.write_text(s, encoding='utf-8')
print('Applied Crazy Family v0.31 grounded side-scroll movement')