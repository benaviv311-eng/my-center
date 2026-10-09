from pathlib import Path

p = Path('crazy-family.html')
s = p.read_text(encoding='utf-8')

a = s.index('function drawDadAttacks(){')
b = s.index('configureDadAbilities', a)
renderer = """// SOUND_FX_RENDERER_V028 — layered luminous sound instead of flat purple lines.
function soundColor(a){if(a.height==='low')return ['#ff4fa3','#ff9bcf'];if(a.height==='high')return ['#42d9ff','#b7f4ff'];if(a.height==='mid')return ['#9a63ff','#e1c9ff'];return ['#ffb84f','#ffe3a0']}
function neonStroke(c1,c2,width,alpha=.9){const g=ctx.createLinearGradient(0,0,W,H);g.addColorStop(0,c1);g.addColorStop(1,c2);ctx.strokeStyle=g;ctx.globalAlpha=alpha;ctx.lineWidth=width;ctx.shadowColor=c1;ctx.shadowBlur=22}
function drawDadAttacks(){const now=performance.now();ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 for(const a of dadAttacks){if(a.scene!==player.scene)continue;const colors=soundColor(a),pulse=.86+.14*Math.sin(now/90+(a.born||0));
  if(a.type==='wave'){
   const warning=now<a.warningUntil,cx=warning?a.originX:a.x,cy=warning?a.originY:a.y,half=a.width/2;ctx.save();ctx.translate(cx,cy);ctx.rotate(a.angle);const phase=(now-(a.born||now))/85;
   for(let layer=0;layer<3;layer++){
    neonStroke(colors[0],colors[1],warning?3+layer*2:(a.thickness*(1-layer*.22)),warning?.18+layer*.08:.22+layer*.18);ctx.beginPath();const amp=(warning?4:8)+(2-layer)*3;
    for(let y=-half;y<=half;y+=12){const x=Math.sin(y/28+phase+layer*.7)*amp;if(y===-half)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.stroke();
   }
   if(!warning){ctx.globalAlpha=.12;ctx.fillStyle=colors[0];ctx.beginPath();ctx.ellipse(0,0,a.thickness*1.8,half*.78,0,0,Math.PI*2);ctx.fill()}
   ctx.restore();ctx.globalAlpha=1;ctx.shadowBlur=0;
  }
  else if(a.type==='ring'||a.type==='echo'){
   for(let i=0;i<3;i++){const rr=Math.max(1,a.radius-i*9);neonStroke(colors[0],colors[1],Math.max(3,a.thickness-i*6),(.18+i*.22)*pulse);ctx.setLineDash(a.type==='echo'?[18,12]:[]);ctx.beginPath();ctx.arc(a.x,a.y,rr,0,Math.PI*2);ctx.stroke()}ctx.setLineDash([]);ctx.shadowBlur=0;ctx.globalAlpha=1;
  }
  else if(a.type==='note'){
   const lift=a.bounce?Math.abs(Math.sin((now-a.born)/135))*18:0;ctx.save();ctx.translate(a.x,a.y-lift);ctx.shadowColor=a.homing?'#ff4fa3':'#9a63ff';ctx.shadowBlur=24;ctx.fillStyle=a.homing?'#ff7ab9':'#b985ff';ctx.beginPath();ctx.arc(0,0,20,0,Math.PI*2);ctx.globalAlpha=.18;ctx.fill();ctx.globalAlpha=1;ctx.font='bold 34px Arial';ctx.textAlign='center';ctx.fillStyle='#fff4ff';ctx.fillText(a.homing?'♫':'♪',0,11);ctx.restore();
  }
  else if(a.type==='beam'){
   const warning=now<a.warningUntil,x2=a.x+Math.cos(a.angle)*a.length,y2=a.y+Math.sin(a.angle)*a.length;ctx.save();neonStroke('#ff4fa3','#42d9ff',warning?7:a.width+16,warning?.2:.24);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(x2,y2);ctx.stroke();if(!warning){neonStroke('#fff5ff','#ffffff',Math.max(5,a.width*.28),.92);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(x2,y2);ctx.stroke()}ctx.restore();ctx.globalAlpha=1;
  }
  else if(a.type==='boom'){
   const warning=now<a.warningUntil,life=warning?Math.max(0,1-(a.warningUntil-now)/900):1;ctx.save();ctx.translate(a.x,a.y);for(let i=0;i<4;i++){const r=a.radius*(warning?(.35+.65*life):1)-i*13;neonStroke(i%2?'#ff4fa3':'#ffbd4a','#fff0b0',warning?4:10-i*1.5,warning?.22:.45);ctx.beginPath();ctx.arc(0,0,Math.max(8,r),0,Math.PI*2);ctx.stroke()}if(!warning){ctx.globalAlpha=.12;const rg=ctx.createRadialGradient(0,0,10,0,0,a.radius);rg.addColorStop(0,'#fff4c7');rg.addColorStop(1,'rgba(255,79,163,0)');ctx.fillStyle=rg;ctx.beginPath();ctx.arc(0,0,a.radius,0,Math.PI*2);ctx.fill()}ctx.restore();ctx.globalAlpha=1;
  }
 }ctx.restore()}
"""
s = s[:a] + renderer + s[b:]
p.write_text(s, encoding='utf-8')
