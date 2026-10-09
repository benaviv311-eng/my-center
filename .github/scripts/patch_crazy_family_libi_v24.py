from pathlib import Path

path = Path('crazy-family.html')
text = path.read_text(encoding='utf-8')

if 'LIBI_VISUAL_V24' in text:
    raise SystemExit('Libi v0.24 renderer already applied')

text = text.replace('עולם הבית · חקירה חופשית · v0.23', 'עולם הבית · חקירה חופשית · v0.24', 1)

start = text.find('function libi(){')
end = text.find('function draw(){', start)
if start < 0 or end < 0:
    raise SystemExit('Could not locate existing Libi renderer block')

replacement = r'''// LIBI_VISUAL_V24 — premium animated-cartoon renderer, matched to gameplay states.
function libiPose(now,jumping,rolling,vaulting){
 return player.hanging?'hang':rolling?'roll':player.crouching?'crouch':vaulting?'vault':jumping?'jump':player.moving&&((keys.Shift||runTouch)&&player.stamina>0)?'run':player.moving?'walk':'idle'
}
function libiRoundRect(x,y,w,h,r,fill,stroke,line=2){
 const rr=Math.min(r,Math.abs(w)/2,Math.abs(h)/2);ctx.beginPath();ctx.moveTo(x+rr,y);ctx.lineTo(x+w-rr,y);ctx.quadraticCurveTo(x+w,y,x+w,y+rr);ctx.lineTo(x+w,y+h-rr);ctx.quadraticCurveTo(x+w,y+h,x+w-rr,y+h);ctx.lineTo(x+rr,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-rr);ctx.lineTo(x,y+rr);ctx.quadraticCurveTo(x,y,x+rr,y);ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=line;ctx.stroke()}
}
function libiLimb(x1,y1,x2,y2,x3,y3,width,skin='#f3b590'){
 ctx.strokeStyle='#7d4b3c';ctx.lineWidth=width+2;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.lineTo(x3,y3);ctx.stroke();ctx.strokeStyle=skin;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.lineTo(x3,y3);ctx.stroke()
}
function libiShoe(x,y,angle=0){ctx.save();ctx.translate(x,y);ctx.rotate(angle);libiRoundRect(-8,-4,18,9,4,'#ff5c91','#7b3f54',2);ctx.fillStyle='rgba(255,255,255,.82)';ctx.fillRect(-3,-2,8,2);ctx.restore()}
function libi(){
 const now=performance.now(),jumping=now<player.jumpUntil,rolling=now<player.rollUntil,vaulting=now<player.vaultUntil;
 const jumpP=jumping?Math.max(0,Math.min(1,(now-player.jumpStartedAt)/Math.max(1,player.jumpUntil-player.jumpStartedAt))):0;
 const vaultP=vaulting?Math.max(0,Math.min(1,(now-player.vaultStartedAt)/Math.max(1,player.vaultUntil-player.vaultStartedAt))):0;
 const lift=jumping?Math.sin(jumpP*Math.PI)*22:(vaulting?Math.sin(vaultP*Math.PI)*24:0),pose=libiPose(now,jumping,rolling,vaulting);
 const step=player.moving?Math.sin(walk):0,fast=pose==='run',bob=player.moving?Math.sin(walk*2)*(fast?2.4:1.5):Math.sin(now/420)*.7;
 ctx.save();ctx.translate(player.x,player.y+bob-lift);
 if(player.dir==='left')ctx.scale(-1,1);
 if(pose==='roll'){const rp=Math.max(0,Math.min(1,(now-player.rollStartedAt)/360));ctx.rotate(rp*Math.PI*2);ctx.scale(.9,.9)}
 if(player.invulnerableUntil>now&&Math.floor(now/90)%2===0)ctx.globalAlpha=.36;

 // Soft film-style grounding shadow.
 if(pose!=='hang'){ctx.save();ctx.globalAlpha*=.22;ctx.fillStyle='#2f2430';ctx.beginPath();ctx.ellipse(0,25+lift*.18,fast?25:21,fast?7:6,0,0,Math.PI*2);ctx.fill();ctx.restore()}

 const crouch=pose==='crouch',hang=pose==='hang',air=pose==='jump'||pose==='vault';
 const bodyY=crouch?1:(hang?5:0),headY=crouch?-18:(hang?-17:-28);
 const lean=fast?-0.11:(pose==='vault'?-0.08:0);
 ctx.rotate(lean);

 // Legs — readable walk/run cycle, tucked in air, dangling while hanging.
 let lKneeX=-5,lKneeY=16,lFootX=-8,lFootY=29,rKneeX=6,rKneeY=16,rFootX=9,rFootY=29;
 if(pose==='walk'){lKneeX=-7-step*3;lFootX=-10-step*7;rKneeX=7+step*3;rFootX=10+step*7}
 if(pose==='run'){lKneeX=-8-step*6;lKneeY=14-Math.max(0,step)*4;lFootX=-13-step*12;lFootY=26-Math.max(0,step)*7;rKneeX=8+step*6;rKneeY=14-Math.max(0,-step)*4;rFootX=13+step*12;rFootY=26-Math.max(0,-step)*7}
 if(air){lKneeX=-10;lKneeY=10;lFootX=-16;lFootY=17;rKneeX=11;rKneeY=11;rFootX=17;rFootY=18}
 if(crouch){lKneeX=-11;lKneeY=12;lFootX=-15;lFootY=19;rKneeX=10;rKneeY=12;rFootX=15;rFootY=19}
 if(hang){lKneeX=-7;lKneeY=17;lFootX=-10;lFootY=31;rKneeX=7;rKneeY=17;rFootX=11;rFootY=31}
 libiLimb(-5,bodyY+10,lKneeX,lKneeY,lFootX,lFootY,6,'#f3b590');libiLimb(5,bodyY+10,rKneeX,rKneeY,rFootX,rFootY,6,'#f3b590');
 libiShoe(lFootX,lFootY+2,fast?-.12:0);libiShoe(rFootX,rFootY+2,fast?.1:0);

 // Coral shirt under turquoise short overalls.
 libiRoundRect(-13,bodyY-9,26,24,9,'#ff6f7f','#76474b',2.4);
 libiRoundRect(-11,bodyY-3,22,22,7,'#22bfc5','#315e63',2.4);
 ctx.fillStyle='#73e0e2';ctx.beginPath();ctx.arc(-5,bodyY+3,2.1,0,Math.PI*2);ctx.arc(5,bodyY+3,2.1,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle='#315e63';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-8,bodyY-5);ctx.lineTo(-5,bodyY+1);ctx.moveTo(8,bodyY-5);ctx.lineTo(5,bodyY+1);ctx.stroke();
 ctx.fillStyle='rgba(255,255,255,.28)';libiRoundRect(-7,bodyY+7,14,5,2,'rgba(255,255,255,.22)',null);

 // Arms adapt to action state.
 let la=[-12,bodyY-5,-18,bodyY+3,-20,bodyY+11],ra=[12,bodyY-5,18,bodyY+3,20,bodyY+11];
 if(fast){la=[-11,bodyY-5,-19,bodyY-1,-25,bodyY-8];ra=[11,bodyY-5,19,bodyY+3,25,bodyY+10]}
 if(air){la=[-11,bodyY-5,-18,bodyY-12,-21,bodyY-19];ra=[11,bodyY-5,18,bodyY-11,21,bodyY-18]}
 if(crouch){la=[-11,bodyY-5,-17,bodyY+3,-13,bodyY+12];ra=[11,bodyY-5,17,bodyY+3,13,bodyY+12]}
 if(hang){la=[-9,bodyY-6,-13,bodyY-19,-16,bodyY-34];ra=[9,bodyY-6,13,bodyY-19,16,bodyY-34]}
 libiLimb(...la,5.2);libiLimb(...ra,5.2);

 // Head with warm feature-film proportions.
 ctx.save();ctx.translate(0,headY);
 ctx.fillStyle='#f5bc98';ctx.strokeStyle='#7d4b3c';ctx.lineWidth=2.4;ctx.beginPath();ctx.ellipse(0,0,15.8,16.8,0,0,Math.PI*2);ctx.fill();ctx.stroke();
 ctx.fillStyle='rgba(255,132,145,.23)';ctx.beginPath();ctx.ellipse(-9,5,4.2,2.2,0,0,Math.PI*2);ctx.ellipse(9,5,4.2,2.2,0,0,Math.PI*2);ctx.fill();
 // Hair cap and two iconic pigtails.
 ctx.fillStyle='#51352f';ctx.beginPath();ctx.arc(0,-5,16.1,Math.PI,Math.PI*2);ctx.lineTo(15,-1);ctx.quadraticCurveTo(10,-13,0,-15);ctx.quadraticCurveTo(-10,-13,-15,-1);ctx.closePath();ctx.fill();
 ctx.strokeStyle='#3a2724';ctx.lineWidth=2;ctx.stroke();
 const ponyBounce=player.moving?Math.sin(walk*1.5)*2:Math.sin(now/330)*.8;
 ctx.fillStyle='#51352f';ctx.beginPath();ctx.ellipse(-15.8,-9+ponyBounce,7.2,8.5,-.45,0,Math.PI*2);ctx.ellipse(15.8,-9-ponyBounce,7.2,8.5,.45,0,Math.PI*2);ctx.fill();
 // Flower hair clip.
 ctx.fillStyle='#ffd45d';for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ctx.beginPath();ctx.arc(10.5+Math.cos(a)*3.1,-12+Math.sin(a)*3.1,2.2,0,Math.PI*2);ctx.fill()}ctx.fillStyle='#ff8a58';ctx.beginPath();ctx.arc(10.5,-12,2,0,Math.PI*2);ctx.fill();
 // Eyes, brows, nose and smile.
 const eyeY=0,blink=(Math.floor(now/2600)%9===0&&now%2600<120);
 ctx.strokeStyle='#402d2d';ctx.lineWidth=1.8;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-9,-5);ctx.quadraticCurveTo(-5,-7,-2,-5);ctx.moveTo(2,-5);ctx.quadraticCurveTo(5,-7,9,-5);ctx.stroke();
 if(blink){ctx.beginPath();ctx.moveTo(-8,eyeY);ctx.lineTo(-3,eyeY);ctx.moveTo(3,eyeY);ctx.lineTo(8,eyeY);ctx.stroke()}else{ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(-5.5,eyeY,3.7,4.3,0,0,Math.PI*2);ctx.ellipse(5.5,eyeY,3.7,4.3,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#4c332d';ctx.beginPath();ctx.arc(-4.8,.4,2.2,0,Math.PI*2);ctx.arc(6.2,.4,2.2,0,Math.PI*2);ctx.fill();ctx.fillStyle='#111';ctx.beginPath();ctx.arc(-4.5,.6,1.05,0,Math.PI*2);ctx.arc(6.5,.6,1.05,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-3.8,-.2,.65,0,Math.PI*2);ctx.arc(7.2,-.2,.65,0,Math.PI*2);ctx.fill()}
 ctx.strokeStyle='#bc765f';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(.2,2);ctx.quadraticCurveTo(-.5,4,.8,4.2);ctx.stroke();
 ctx.strokeStyle='#8a4e50';ctx.lineWidth=1.8;ctx.beginPath();ctx.arc(0,5.2,5.2,.18*Math.PI,.82*Math.PI);ctx.stroke();
 // Soft highlight for dimensionality.
 ctx.fillStyle='rgba(255,255,255,.22)';ctx.beginPath();ctx.ellipse(-6,-9,4,2.2,-.4,0,Math.PI*2);ctx.fill();
 ctx.restore();

 // Small action accents improve readability without changing mechanics.
 if(fast){ctx.save();ctx.globalAlpha=.22;ctx.strokeStyle='#fff';ctx.lineWidth=3;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-31-i*6,-7+i*7);ctx.lineTo(-22-i*5,-7+i*7);ctx.stroke()}ctx.restore()}
 if(pose==='jump'||pose==='vault'){ctx.save();ctx.globalAlpha=.28;ctx.strokeStyle='#fff';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(0,8,27,.2*Math.PI,.8*Math.PI);ctx.stroke();ctx.restore()}
 ctx.restore()
}
'''

text = text[:start] + replacement + '\n' + text[end:]
path.write_text(text, encoding='utf-8')
print('Applied Libi v0.24 visual renderer')
