from pathlib import Path

path=Path('crazy-family.html')
s=path.read_text(encoding='utf-8')
start=s.find('// LIBI_VISUAL_V24')
end=s.find('function draw(){', start)
if start < 0 or end < 0:
    raise SystemExit('Could not locate Libi v0.24 renderer block')

asset='https://d2jqrm6oza8nb6.cloudfront.net/datasets/12ade51f-3dc9-4308-906a-d89c14b0a9c2.png?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiYmM1YzU1YjJiYjUyYTVmOCIsImJ1Y2tldCI6InJ1bndheS1kYXRhc2V0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MTY3ODI1OH0.4a_tBDm-OsmCKzHIEjRYw6Y4JJoaQ1f_SJGWLYZFzjI'

new_block=f'''// LIBI_SPRITE_RENDERER_V025 — real high-quality art asset, wired to gameplay states.
const LIBI_SPRITE_URL='{asset}';
const LIBI_CELL_W=280,LIBI_CELL_H=420,LIBI_COLS=5;
const libiSprite=new Image();
libiSprite.decoding='async';
libiSprite.src=LIBI_SPRITE_URL;
let libiFacing=1;

function libiPose(now,jumping,rolling,vaulting){{
 if(player.hanging)return 'hang';
 if(rolling)return 'roll';
 if(player.crouching)return 'crouch';
 if(vaulting)return 'vault';
 if(jumping)return 'jump';
 if(player.moving&&((keys.Shift||runTouch)&&player.stamina>0))return 'run';
 if(player.moving)return 'walk';
 return 'idle';
}}
function libiFrame(pose){{
 const walkFrame=(Math.floor(walk*0.72)&1)?2:1;
 const runFrame=(Math.floor(walk*1.12)&1)?4:3;
 if(pose==='walk')return walkFrame;
 if(pose==='run')return runFrame;
 return ({{idle:0,jump:5,crouch:6,roll:7,hang:8,vault:9}})[pose]??0;
}}
function libi(){{
 const now=performance.now(),jumping=now<player.jumpUntil,rolling=now<player.rollUntil,vaulting=now<player.vaultUntil;
 const jumpP=jumping?Math.max(0,Math.min(1,(now-player.jumpStartedAt)/Math.max(1,player.jumpUntil-player.jumpStartedAt))):0;
 const vaultP=vaulting?Math.max(0,Math.min(1,(now-player.vaultStartedAt)/Math.max(1,player.vaultUntil-player.vaultStartedAt))):0;
 const lift=jumping?Math.sin(jumpP*Math.PI)*25:(vaulting?Math.sin(vaultP*Math.PI)*27:0);
 const pose=libiPose(now,jumping,rolling,vaulting),frame=libiFrame(pose),sx=(frame%LIBI_COLS)*LIBI_CELL_W,sy=Math.floor(frame/LIBI_COLS)*LIBI_CELL_H;
 if(player.dir==='left')libiFacing=-1;else if(player.dir==='right')libiFacing=1;
 const sprint=pose==='run',bob=player.moving?Math.sin(walk*1.7)*(sprint?2.3:1.35):Math.sin(now/430)*.65;
 let dh=98;if(pose==='hang')dh=108;else if(pose==='crouch')dh=88;else if(pose==='roll')dh=90;else if(pose==='vault')dh=103;
 let dw=dh*(LIBI_CELL_W/LIBI_CELL_H);if(pose==='roll')dw*=1.12;
 ctx.save();ctx.translate(player.x,player.y+bob-lift);ctx.scale(libiFacing,1);
 if(player.invulnerableUntil>now&&Math.floor(now/90)%2===0)ctx.globalAlpha=.35;
 if(pose!=='hang'){{
   ctx.save();ctx.globalAlpha*=.22;ctx.fillStyle='#2a1f29';ctx.beginPath();ctx.ellipse(0,24+lift*.08,sprint?27:23,sprint?7:6,0,0,Math.PI*2);ctx.fill();ctx.restore();
 }}
 if(libiSprite.complete&&libiSprite.naturalWidth){{
   ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
   const lean=sprint?.055:(pose==='vault'?.04:0);if(lean)ctx.rotate(lean);
   const dx=-dw/2,dy=-dh+27;
   ctx.drawImage(libiSprite,sx,sy,LIBI_CELL_W,LIBI_CELL_H,dx,dy,dw,dh);
 }}else{{
   ctx.font='54px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('👧',0,-18);
 }}
 ctx.restore();
}}
'''

s=s[:start]+new_block+s[end:]
s=s.replace('עולם הבית · חקירה חופשית · v0.24','עולם הבית · חקירה חופשית · v0.25',1)
path.write_text(s,encoding='utf-8')
print('Patched crazy-family.html to Libi sprite renderer v0.25')
