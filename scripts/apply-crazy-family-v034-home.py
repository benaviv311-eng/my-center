from pathlib import Path
import re

path = Path('crazy-family.html')
s = path.read_text(encoding='utf-8')

if 'CINEMATIC_HOME_DIORAMA_V034' in s:
    print('v0.34 cinematic home already applied')
    raise SystemExit(0)

# Add the depth model beside the existing Stage 1 physics constants.
needle = "const STAGE1_BRAKE=2050;"
insert = """const STAGE1_BRAKE=2050;

// CINEMATIC_HOME_DIORAMA_V034 — the house is a floor plane: X=sideways, Y=depth, Z=jump height.
const STAGE1_DEPTH_FAR=350,STAGE1_DEPTH_NEAR=535;
function stage1DepthScale(y){
 const t=clamp((y-STAGE1_DEPTH_FAR)/(STAGE1_DEPTH_NEAR-STAGE1_DEPTH_FAR),0,1);
 return .80+t*.25;
}
"""
if needle not in s:
    raise SystemExit('missing STAGE1_BRAKE anchor')
s = s.replace(needle, insert, 1)

# Ground physics: keep the floor contact point in X/Y, use Z only for jump height.
pattern = re.compile(r"function updateStage1VerticalPhysics\(dt\)\{.*?\}\nfunction updateStage1Kinematics\(dx,dt,sprint\)\{.*?\}\nfunction drawGroundShadow", re.S)
replacement = """function updateStage1VerticalPhysics(dt){if(player.scene!=='ground')return;const wasAirborne=player.z>0||player.vz!==0;if(wasAirborne){player.vz+=STAGE1_GRAVITY*dt;player.z=Math.max(0,player.z+player.vz*dt);if(player.z<=0&&player.vz<0){player.z=0;player.vz=0;player.grounded=true;player.landSquashUntil=performance.now()+145;houseFx.stepPulse=1}}else{player.z=0;player.vz=0;player.grounded=true}}
function updateStage1Kinematics(dx,dy,dt,sprint){
 let len=Math.hypot(dx,dy);if(len>1){dx/=len;dy/=len}
 if(!Number.isFinite(player.vy))player.vy=0;
 const surface=houseSurfaceFactor(player.x,player.y),boost=sprint&&player.stamina>0?1.62:1;
 const targetVX=dx*player.speed*boost*surface,targetVY=dy*player.speed*.72*boost*surface;
 player.vx=approachValue(player.vx,targetVX,(dx?STAGE1_ACCEL:STAGE1_BRAKE)*dt);
 player.vy=approachValue(player.vy,targetVY,(dy?STAGE1_ACCEL:STAGE1_BRAKE)*dt);
 if(sprint&&(dx||dy)&&player.stamina>0)player.stamina=Math.max(0,player.stamina-34*dt);
 const prevX=player.x,prevY=player.y,nx=clamp(prevX+player.vx*dt,28,932),ny=clamp(prevY+player.vy*dt,STAGE1_DEPTH_FAR,STAGE1_DEPTH_NEAR);
 const pos=resolveHouseInteraction(prevX,prevY,nx,ny);
 if(Math.abs(pos.x-nx)>.5)player.vx*=.12;if(Math.abs(pos.y-ny)>.5)player.vy*=.12;
 player.x=clamp(pos.x,28,932);player.y=clamp(pos.y,STAGE1_DEPTH_FAR,STAGE1_DEPTH_NEAR);
 const speed=Math.hypot(player.vx,player.vy);player.moving=speed>8;
 if(player.moving){if(Math.abs(player.vx)>7)player.dir=player.vx>0?'right':'left';walk+=dt*(3.6+speed/55)}
 updateStage1VerticalPhysics(dt)
}
function drawGroundShadow"""
s, n = pattern.subn(replacement, s, count=1)
if n != 1:
    raise SystemExit(f'ground physics replacement count={n}')

# Pass vertical/depth intent into Stage 1 kinematics.
s = s.replace("updateStage1Kinematics(dx,dt,sprint)", "updateStage1Kinematics(dx,dy,dt,sprint)")

# Remove legacy forced-Y assignments that made sprites look pasted to one horizontal rail.
s = s.replace("player.y=STAGE1_FLOOR_Y", "player.y=clamp(player.y,STAGE1_DEPTH_FAR,STAGE1_DEPTH_NEAR)")
s = s.replace("dad.y=STAGE1_FLOOR_Y", "dad.y=clamp(dad.y,STAGE1_DEPTH_FAR,STAGE1_DEPTH_NEAR)")

# Keep rolling on the player's current depth lane instead of snapping to the old floor line.
s = s.replace(
    "resolveHouseInteraction(player.x,STAGE1_FLOOR_Y,clamp(player.x+player.vx*dt,28,932),STAGE1_FLOOR_Y)",
    "resolveHouseInteraction(player.x,player.y,clamp(player.x+player.vx*dt,28,932),player.y)"
)

# Mega sneeze knockback also respects the current depth lane.
s = s.replace(
    "resolveHouseInteraction(player.x,STAGE1_FLOOR_Y,target,STAGE1_FLOOR_Y)",
    "resolveHouseInteraction(player.x,player.y,target,player.y)"
)

# Dad now wanders and chases on the same depth plane.
s = s.replace(
    "const pts=[[110,STAGE1_FLOOR_Y],[275,STAGE1_FLOOR_Y],[455,STAGE1_FLOOR_Y],[625,STAGE1_FLOOR_Y],[790,STAGE1_FLOOR_Y],[900,STAGE1_FLOOR_Y]];",
    "const pts=[[110,455],[275,510],[455,405],[625,485],[790,430],[900,505]];"
)
old_dad_ground = """if(dad.scene==='ground'){const desired=dadHousePaused?0:(Math.abs(vx)>6?Math.sign(vx)*dad.speed*(activeSong?1.08:1):0);dad.vx=approachValue(dad.vx,desired,(desired?560:820)*dt);const px=dad.x,nx=clamp(dad.x+dad.vx*dt,28,932),resolved=resolveDadHouseInteraction(px,STAGE1_FLOOR_Y,nx,STAGE1_FLOOR_Y);if(Math.abs(resolved.x-nx)>.5)dad.vx*=.08;dad.x=resolved.x;dad.y=clamp(dad.y,STAGE1_DEPTH_FAR,STAGE1_DEPTH_NEAR)}else if(len>5&&!dadHousePaused)"""
new_dad_ground = """if(dad.scene==='ground'){if(!Number.isFinite(dad.vy))dad.vy=0;const mult=activeSong?1.08:1,desiredX=dadHousePaused?0:(Math.abs(vx)>6?vx/Math.max(1,len)*dad.speed*mult:0),desiredY=dadHousePaused?0:(Math.abs(vy)>6?vy/Math.max(1,len)*dad.speed*.72*mult:0);dad.vx=approachValue(dad.vx,desiredX,(desiredX?560:820)*dt);dad.vy=approachValue(dad.vy,desiredY,(desiredY?560:820)*dt);const px=dad.x,py=dad.y,nx=clamp(dad.x+dad.vx*dt,28,932),ny=clamp(dad.y+dad.vy*dt,STAGE1_DEPTH_FAR,STAGE1_DEPTH_NEAR),resolved=resolveDadHouseInteraction(px,py,nx,ny);if(Math.abs(resolved.x-nx)>.5)dad.vx*=.08;if(Math.abs(resolved.y-ny)>.5)dad.vy*=.08;dad.x=resolved.x;dad.y=clamp(resolved.y,STAGE1_DEPTH_FAR,STAGE1_DEPTH_NEAR)}else if(len>5&&!dadHousePaused)"""
if old_dad_ground not in s:
    raise SystemExit('missing Dad ground movement anchor')
s = s.replace(old_dad_ground, new_dad_ground, 1)

# Natural in-home placement; no bobbing/glowing token treatment on the ground floor.
old_items = "const items={ground:[{x:410,y:463,id:'headphones',name:'אוזניות',icon:'🎧'},{x:610,y:458,id:'mirror',name:'מראה',icon:'🪞'},{x:844,y:462,id:'pan',name:'מחבת',icon:'🍳'}]"
new_items = "// HOME_PICKUPS_V034 — ground-floor objects sit in the room instead of floating as tokens.\nconst items={ground:[{x:410,y:448,id:'headphones',name:'אוזניות',icon:'🎧'},{x:610,y:402,id:'mirror',name:'מראה',icon:'🪞'},{x:844,y:468,id:'pan',name:'מחבת',icon:'🍳'}]"
if old_items not in s:
    raise SystemExit('missing ground items anchor')
s = s.replace(old_items, new_items, 1)

# Hide the old debug-like dashed exit rectangles on the playable home floor.
s = s.replace("function exits(){for(const e of scenes[player.scene].exits)", "function exits(){if(player.scene==='ground')return;for(const e of scenes[player.scene].exits)", 1)

# Grounded Dad drawing with perspective scale tied to depth.
pattern = re.compile(r"function drawDad\(\)\{.*?\}\nfunction drawDizzyFX", re.S)
new_draw_dad = """function drawDad(){if(player.scene!==dad.scene)return;const bob=dad.scene==='ground'?0:Math.sin(dad.phase)*1.8,frame=dadVisualFrame();if(dad.targetX<dad.x-4)dadFacing=-1;else if(dad.targetX>dad.x+4)dadFacing=1;const grounded=dad.scene==='ground',depth=grounded?stage1DepthScale(dad.y):1;ctx.save();ctx.translate(dad.x,grounded?dad.y:dad.y+bob);ctx.scale(dadFacing*depth,depth);if(!grounded){ctx.save();ctx.globalAlpha=.24;ctx.fillStyle='#2b1c25';ctx.beginPath();ctx.ellipse(0,31,31,8,0,0,Math.PI*2);ctx.fill();ctx.restore()}if(dadSprite.complete&&dadSprite.naturalWidth){const cols=5,rows=2,sw=dadSprite.naturalWidth/cols,sh=dadSprite.naturalHeight/rows,sx=(frame%cols)*sw,sy=Math.floor(frame/cols)*sh;const dh=dad.singing?126:116,dw=dh*(sw/sh),sourceBottom=DAD_OPAQUE_BOTTOM[frame]??sh,groundDy=-(sourceBottom/sh)*dh,dy=grounded?groundDy:-dh+35;ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';if(dad.singing){ctx.shadowColor='#ff5ca8';ctx.shadowBlur=18+8*Math.abs(Math.sin(dad.phase))}ctx.drawImage(dadSprite,sx,sy,sw,sh,-dw/2,dy,dw,dh);ctx.shadowBlur=0}else{ctx.font='64px system-ui';ctx.textAlign='center';ctx.fillText('👨',0,grounded?-34:-10)}if(dad.singing){ctx.scale(dadFacing,1);ctx.textAlign='center';ctx.font='bold 27px Arial';ctx.shadowColor='#ff55b0';ctx.shadowBlur=16;ctx.fillStyle='#fff6ff';ctx.fillText('♪',-37,-117);ctx.fillStyle='#77e9ff';ctx.fillText('♫',35,-129);ctx.shadowBlur=0}ctx.restore()}
function drawDizzyFX"""
s, n = pattern.subn(new_draw_dad, s, count=1)
if n != 1:
    raise SystemExit(f'Dad draw replacement count={n}')

# Libi keeps her approved art; only her transform changes so her feet live on the floor plane.
pattern = re.compile(r"function libi\(\)\{.*?\}\nfunction drawStage1Panorama", re.S)
new_libi = """function libi(){const now=performance.now(),jumping=player.scene==='ground'?player.z>1:now<player.jumpUntil,rolling=now<player.rollUntil,vaulting=now<player.vaultUntil;const jumpP=jumping&&player.scene!=='ground'?Math.max(0,Math.min(1,(now-player.jumpStartedAt)/Math.max(1,player.jumpUntil-player.jumpStartedAt))):0;const vaultP=vaulting?Math.max(0,Math.min(1,(now-player.vaultStartedAt)/Math.max(1,player.vaultUntil-player.vaultStartedAt))):0;const lift=player.scene==='ground'?player.z:(jumping?Math.sin(jumpP*Math.PI)*25:(vaulting?Math.sin(vaultP*Math.PI)*27:0));const pose=libiPose(now,jumping,rolling,vaulting),frame=libiFrame(pose),sx=(frame%LIBI_COLS)*LIBI_CELL_W,sy=Math.floor(frame/LIBI_COLS)*LIBI_CELL_H;if(player.dir==='left')libiFacing=-1;else if(player.dir==='right')libiFacing=1;const sprint=pose==='run',groundSpeed=Math.hypot(player.vx||0,player.vy||0),speedBob=player.scene==='ground'?Math.min(1,groundSpeed/Math.max(1,player.speed)):1;const groundedBob=player.scene==='ground'?0:(player.moving?Math.sin(walk*1.7)*(sprint?2.3:1.35)*speedBob:Math.sin(now/430)*.4);let dh=98;if(pose==='hang')dh=108;else if(pose==='crouch')dh=88;else if(pose==='roll')dh=90;else if(pose==='vault')dh=103;let dw=dh*(LIBI_CELL_W/LIBI_CELL_H);if(pose==='roll')dw*=1.12;const renderY=player.scene==='ground'?player.y-lift:player.y+groundedBob-lift,landing=player.scene==='ground'&&now<player.landSquashUntil,syScale=landing?.91:1,sxScale=landing?1.06:1,depth=player.scene==='ground'?stage1DepthScale(player.y):1;ctx.save();ctx.translate(player.x,renderY);ctx.scale(libiFacing*sxScale*depth,syScale*depth);if(player.invulnerableUntil>now&&Math.floor(now/90)%2===0)ctx.globalAlpha=.35;if(pose!=='hang'&&player.scene!=='ground'){ctx.save();ctx.globalAlpha*=.22;ctx.fillStyle='#2a1f29';ctx.beginPath();ctx.ellipse(0,24+lift*.08,sprint?27:23,sprint?7:6,0,0,Math.PI*2);ctx.fill();ctx.restore()}if(libiSprite.complete&&libiSprite.naturalWidth){ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';const lean=sprint?.055:(pose==='vault'?.04:0);if(lean)ctx.rotate(lean);const dx=-dw/2,groundDy=-(LIBI_OPAQUE_BOTTOM/LIBI_CELL_H)*dh,dy=player.scene==='ground'?groundDy:-dh+27;ctx.drawImage(libiSprite,sx,sy,LIBI_CELL_W,LIBI_CELL_H,dx,dy,dw,dh)}else{ctx.font='54px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('👧',0,player.scene==='ground'?-35:-18)}ctx.restore()}
function drawStage1Panorama"""
s, n = pattern.subn(new_libi, s, count=1)
if n != 1:
    raise SystemExit(f'Libi draw replacement count={n}')

# Insert the dedicated home renderer immediately before the legacy draw function.
anchor = "function draw(){const shake=roomShakeOffset();"
if anchor not in s:
    raise SystemExit('missing draw anchor')
home_renderer = r"""
function drawStage1FloorDepthGuide(){
 const g=ctx.createLinearGradient(0,315,0,H);g.addColorStop(0,'rgba(255,232,195,0)');g.addColorStop(.38,'rgba(255,225,177,.025)');g.addColorStop(1,'rgba(65,39,28,.10)');ctx.fillStyle=g;ctx.fillRect(0,315,W,H-315);
}
function drawHomePickupV034(p){
 const scale=stage1DepthScale(p.y),size=(p.id==='pan'?48:52)*scale;ctx.save();ctx.translate(p.x,p.y);ctx.globalAlpha=.24;ctx.fillStyle='#2c2022';ctx.beginPath();ctx.ellipse(0,4,16*scale,4*scale,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.translate(0,-size*.38);if(!drawCollectibleArt(p,size)){ctx.font=(34*scale)+'px Arial';ctx.textAlign='center';ctx.fillText(p.icon,0,10)}ctx.restore()
}
function drawStage1DepthScene(){
 const shake=roomShakeOffset();ctx.save();ctx.translate(shake.x,shake.y);const img=art.ground;if(img&&img.complete&&img.naturalWidth){drawStage1Panorama(img);const shade=ctx.createLinearGradient(0,0,0,H);shade.addColorStop(0,'rgba(28,18,19,.015)');shade.addColorStop(1,'rgba(28,18,19,.09)');ctx.fillStyle=shade;ctx.fillRect(0,0,W,H)}else{drawBase('ground');furniture('ground')}
 drawStage1FloorDepthGuide();drawHouseLife();drawMegaSneezeRoomFX();
 drawGroundShadow(dad.x,dad.y,0,31*stage1DepthScale(dad.y),.22);drawGroundShadow(player.x,player.y,player.z,(player.moving?25:23)*stage1DepthScale(player.y),.28);
 const layers=[];for(const p of items.ground)if(!p.taken)layers.push({y:p.y,draw:()=>drawHomePickupV034(p)});layers.push({y:dad.y,draw:()=>{drawDad();drawDadHouseStateFX()}});layers.push({y:player.y,draw:()=>libi()});layers.sort((a,b)=>a.y-b.y);for(const layer of layers)layer.draw();
 drawDadAttacks();drawHangHint();drawDizzyFX();
 const edge=ctx.createLinearGradient(0,520,0,H);edge.addColorStop(0,'rgba(30,19,20,0)');edge.addColorStop(1,'rgba(30,19,20,.13)');ctx.fillStyle=edge;ctx.fillRect(0,520,W,80);ctx.restore()
}
"""
s = s.replace(anchor, home_renderer + "\nfunction draw(){if(player.scene==='ground'){drawStage1DepthScene();return}const shake=roomShakeOffset();", 1)

# Fix the house-life ripple so it follows the actual depth position rather than the obsolete rail.
s = s.replace("ctx.ellipse(player.x,STAGE1_FOOT_CONTACT_Y,", "ctx.ellipse(player.x,player.y,")

# Version label can already be v0.34 from parallel game work; keep it on the same release train.
s = s.replace('שלב 1: מפגש אבא · v0.33', 'שלב 1: מפגש אבא · v0.34')

path.write_text(s, encoding='utf-8')
print('applied cinematic 2.5D home diorama v0.34')
