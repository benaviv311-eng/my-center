from pathlib import Path

p = Path('crazy-family.html')
s = p.read_text(encoding='utf-8')

if 'PLANTED_FEET_V032' in s:
    print('Crazy Family v0.32 planted-feet pass already applied')
    raise SystemExit(0)

# Version label: keep the previous v0.31 marker in a lineage comment so its
# regression contract remains verifiable while the visible game advances.
s = s.replace('שלב 1: מפגש אבא · v0.31', 'שלב 1: מפגש אבא · v0.32', 1)

anchor = "const STAGE1_BRAKE=2050;"
insert = """const STAGE1_BRAKE=2050;

// PLANTED_FEET_V032 — visual feet, shadows and sprite alpha bottoms share one contact plane.
// v0.31 grounded physics remains active underneath this visible-contact pass.
const STAGE1_FOOT_CONTACT_Y=535;
const LIBI_OPAQUE_BOTTOM=408;
const DAD_OPAQUE_BOTTOM=[396,396,396,396,396,383,383,382,383,378];"""
if anchor not in s:
    raise SystemExit('v0.31 stage constants anchor not found')
s = s.replace(anchor, insert, 1)

old_shadow = "function drawGroundShadow(x,groundY,height,r=24,alpha=.28){const h=Math.max(0,height),scale=Math.max(.46,1-h/210),a=alpha*Math.max(.28,1-h/240);ctx.save();ctx.globalAlpha=a;ctx.fillStyle='#241a20';ctx.beginPath();ctx.ellipse(x,groundY+22,r*scale,6*scale,0,0,Math.PI*2);ctx.fill();ctx.restore()}"
new_shadow = "function drawGroundShadow(x,contactY,height,r=24,alpha=.28){const h=Math.max(0,height),scale=Math.max(.46,1-h/210),a=alpha*Math.max(.28,1-h/240);ctx.save();ctx.globalAlpha=a;ctx.fillStyle='#241a20';ctx.beginPath();ctx.ellipse(x,contactY,r*scale,6*scale,0,0,Math.PI*2);ctx.fill();ctx.restore()}"
if old_shadow not in s:
    raise SystemExit('ground-shadow renderer anchor not found')
s = s.replace(old_shadow, new_shadow, 1)

old_dad = "function drawDad(){if(player.scene!==dad.scene)return;const bob=Math.sin(dad.phase)*1.8,frame=dadVisualFrame();if(dad.targetX<dad.x-4)dadFacing=-1;else if(dad.targetX>dad.x+4)dadFacing=1;ctx.save();ctx.translate(dad.x,(dad.scene==='ground'?STAGE1_FLOOR_Y:dad.y)+bob);ctx.scale(dadFacing,1);ctx.save();ctx.globalAlpha=.24;ctx.fillStyle='#2b1c25';ctx.beginPath();ctx.ellipse(0,31,31,8,0,0,Math.PI*2);ctx.fill();ctx.restore();if(dadSprite.complete&&dadSprite.naturalWidth){const cols=5,rows=2,sw=dadSprite.naturalWidth/cols,sh=dadSprite.naturalHeight/rows,sx=(frame%cols)*sw,sy=Math.floor(frame/cols)*sh;const dh=dad.singing?126:116,dw=dh*(sw/sh);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';if(dad.singing){ctx.shadowColor='#ff5ca8';ctx.shadowBlur=18+8*Math.abs(Math.sin(dad.phase))}ctx.drawImage(dadSprite,sx,sy,sw,sh,-dw/2,-dh+35,dw,dh);ctx.shadowBlur=0}else{ctx.font='64px system-ui';ctx.textAlign='center';ctx.fillText('👨',0,-10)}if(dad.singing){ctx.scale(dadFacing,1);ctx.textAlign='center';ctx.font='bold 27px Arial';ctx.shadowColor='#ff55b0';ctx.shadowBlur=16;ctx.fillStyle='#fff6ff';ctx.fillText('♪',-37,-82);ctx.fillStyle='#77e9ff';ctx.fillText('♫',35,-94);ctx.shadowBlur=0}ctx.restore()}"
new_dad = "function drawDad(){if(player.scene!==dad.scene)return;const bob=dad.scene==='ground'?0:Math.sin(dad.phase)*1.8,frame=dadVisualFrame();if(dad.targetX<dad.x-4)dadFacing=-1;else if(dad.targetX>dad.x+4)dadFacing=1;const grounded=dad.scene==='ground';ctx.save();ctx.translate(dad.x,grounded?STAGE1_FOOT_CONTACT_Y:dad.y+bob);ctx.scale(dadFacing,1);if(!grounded){ctx.save();ctx.globalAlpha=.24;ctx.fillStyle='#2b1c25';ctx.beginPath();ctx.ellipse(0,31,31,8,0,0,Math.PI*2);ctx.fill();ctx.restore()}if(dadSprite.complete&&dadSprite.naturalWidth){const cols=5,rows=2,sw=dadSprite.naturalWidth/cols,sh=dadSprite.naturalHeight/rows,sx=(frame%cols)*sw,sy=Math.floor(frame/cols)*sh;const dh=dad.singing?126:116,dw=dh*(sw/sh),sourceBottom=DAD_OPAQUE_BOTTOM[frame]??sh,groundDy=-(sourceBottom/sh)*dh,dy=grounded?groundDy:-dh+35;ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';if(dad.singing){ctx.shadowColor='#ff5ca8';ctx.shadowBlur=18+8*Math.abs(Math.sin(dad.phase))}ctx.drawImage(dadSprite,sx,sy,sw,sh,-dw/2,dy,dw,dh);ctx.shadowBlur=0}else{ctx.font='64px system-ui';ctx.textAlign='center';ctx.fillText('👨',0,grounded?-34:-10)}if(dad.singing){ctx.scale(dadFacing,1);ctx.textAlign='center';ctx.font='bold 27px Arial';ctx.shadowColor='#ff55b0';ctx.shadowBlur=16;ctx.fillStyle='#fff6ff';ctx.fillText('♪',-37,-117);ctx.fillStyle='#77e9ff';ctx.fillText('♫',35,-129);ctx.shadowBlur=0}ctx.restore()}"
if old_dad not in s:
    raise SystemExit('Dad renderer anchor not found')
s = s.replace(old_dad, new_dad, 1)

old_libi = "function libi(){const now=performance.now(),jumping=player.scene==='ground'?player.z>1:now<player.jumpUntil,rolling=now<player.rollUntil,vaulting=now<player.vaultUntil;const jumpP=jumping&&player.scene!=='ground'?Math.max(0,Math.min(1,(now-player.jumpStartedAt)/Math.max(1,player.jumpUntil-player.jumpStartedAt))):0;const vaultP=vaulting?Math.max(0,Math.min(1,(now-player.vaultStartedAt)/Math.max(1,player.vaultUntil-player.vaultStartedAt))):0;const lift=player.scene==='ground'?player.z:(jumping?Math.sin(jumpP*Math.PI)*25:(vaulting?Math.sin(vaultP*Math.PI)*27:0));const pose=libiPose(now,jumping,rolling,vaulting),frame=libiFrame(pose),sx=(frame%LIBI_COLS)*LIBI_CELL_W,sy=Math.floor(frame/LIBI_COLS)*LIBI_CELL_H;if(player.dir==='left')libiFacing=-1;else if(player.dir==='right')libiFacing=1;const sprint=pose==='run',speedBob=player.scene==='ground'?Math.min(1,Math.abs(player.vx)/Math.max(1,player.speed)):1,bob=player.moving?Math.sin(walk*1.7)*(sprint?2.3:1.35)*speedBob:Math.sin(now/430)*.4;let dh=98;if(pose==='hang')dh=108;else if(pose==='crouch')dh=88;else if(pose==='roll')dh=90;else if(pose==='vault')dh=103;let dw=dh*(LIBI_CELL_W/LIBI_CELL_H);if(pose==='roll')dw*=1.12;const renderY=player.scene==='ground'?STAGE1_FLOOR_Y:player.y,landing=player.scene==='ground'&&now<player.landSquashUntil,syScale=landing?.91:1,sxScale=landing?1.06:1;ctx.save();ctx.translate(player.x,renderY+bob-lift);ctx.scale(libiFacing*sxScale,syScale);if(player.invulnerableUntil>now&&Math.floor(now/90)%2===0)ctx.globalAlpha=.35;if(pose!=='hang'&&player.scene!=='ground'){ctx.save();ctx.globalAlpha*=.22;ctx.fillStyle='#2a1f29';ctx.beginPath();ctx.ellipse(0,24+lift*.08,sprint?27:23,sprint?7:6,0,0,Math.PI*2);ctx.fill();ctx.restore()}if(libiSprite.complete&&libiSprite.naturalWidth){ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';const lean=sprint?.055:(pose==='vault'?.04:0);if(lean)ctx.rotate(lean);const dx=-dw/2,dy=-dh+27;ctx.drawImage(libiSprite,sx,sy,LIBI_CELL_W,LIBI_CELL_H,dx,dy,dw,dh)}else{ctx.font='54px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('👧',0,-18)}ctx.restore()}"
new_libi = "function libi(){const now=performance.now(),jumping=player.scene==='ground'?player.z>1:now<player.jumpUntil,rolling=now<player.rollUntil,vaulting=now<player.vaultUntil;const jumpP=jumping&&player.scene!=='ground'?Math.max(0,Math.min(1,(now-player.jumpStartedAt)/Math.max(1,player.jumpUntil-player.jumpStartedAt))):0;const vaultP=vaulting?Math.max(0,Math.min(1,(now-player.vaultStartedAt)/Math.max(1,player.vaultUntil-player.vaultStartedAt))):0;const lift=player.scene==='ground'?player.z:(jumping?Math.sin(jumpP*Math.PI)*25:(vaulting?Math.sin(vaultP*Math.PI)*27:0));const pose=libiPose(now,jumping,rolling,vaulting),frame=libiFrame(pose),sx=(frame%LIBI_COLS)*LIBI_CELL_W,sy=Math.floor(frame/LIBI_COLS)*LIBI_CELL_H;if(player.dir==='left')libiFacing=-1;else if(player.dir==='right')libiFacing=1;const sprint=pose==='run',speedBob=player.scene==='ground'?Math.min(1,Math.abs(player.vx)/Math.max(1,player.speed)):1;const groundedBob=player.scene==='ground'?0:(player.moving?Math.sin(walk*1.7)*(sprint?2.3:1.35)*speedBob:Math.sin(now/430)*.4);let dh=98;if(pose==='hang')dh=108;else if(pose==='crouch')dh=88;else if(pose==='roll')dh=90;else if(pose==='vault')dh=103;let dw=dh*(LIBI_CELL_W/LIBI_CELL_H);if(pose==='roll')dw*=1.12;const renderY=player.scene==='ground'?STAGE1_FOOT_CONTACT_Y-lift:player.y+groundedBob-lift,landing=player.scene==='ground'&&now<player.landSquashUntil,syScale=landing?.91:1,sxScale=landing?1.06:1;ctx.save();ctx.translate(player.x,renderY);ctx.scale(libiFacing*sxScale,syScale);if(player.invulnerableUntil>now&&Math.floor(now/90)%2===0)ctx.globalAlpha=.35;if(pose!=='hang'&&player.scene!=='ground'){ctx.save();ctx.globalAlpha*=.22;ctx.fillStyle='#2a1f29';ctx.beginPath();ctx.ellipse(0,24+lift*.08,sprint?27:23,sprint?7:6,0,0,Math.PI*2);ctx.fill();ctx.restore()}if(libiSprite.complete&&libiSprite.naturalWidth){ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';const lean=sprint?.055:(pose==='vault'?.04:0);if(lean)ctx.rotate(lean);const dx=-dw/2,groundDy=-(LIBI_OPAQUE_BOTTOM/LIBI_CELL_H)*dh,dy=player.scene==='ground'?groundDy:-dh+27;ctx.drawImage(libiSprite,sx,sy,LIBI_CELL_W,LIBI_CELL_H,dx,dy,dw,dh)}else{ctx.font='54px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('👧',0,player.scene==='ground'?-35:-18)}ctx.restore()}"
if old_libi not in s:
    raise SystemExit('Libi renderer anchor not found')
s = s.replace(old_libi, new_libi, 1)

old_draw = "if(player.scene==='ground'){drawGroundShadow(dad.x,STAGE1_FLOOR_Y,0,31,.24);drawGroundShadow(player.x,STAGE1_FLOOR_Y,player.z,player.moving?25:23,.3)}"
new_draw = "if(player.scene==='ground'){drawGroundShadow(dad.x,STAGE1_FOOT_CONTACT_Y,0,31,.24);drawGroundShadow(player.x,STAGE1_FOOT_CONTACT_Y,player.z,player.moving?25:23,.3)}"
if old_draw not in s:
    raise SystemExit('ground shadow call anchor not found')
s = s.replace(old_draw, new_draw, 1)

# Rug contact feedback should happen at the same visible feet plane, not above it.
s = s.replace("ctx.ellipse(player.x,player.y+18,22+i*12+houseFx.rugRipple*10,6+i*2,0,0,Math.PI*2);", "ctx.ellipse(player.x,STAGE1_FOOT_CONTACT_Y,22+i*12+houseFx.rugRipple*10,6+i*2,0,0,Math.PI*2);", 1)

p.write_text(s, encoding='utf-8')
print('Applied Crazy Family v0.32 planted-feet ground contact')
