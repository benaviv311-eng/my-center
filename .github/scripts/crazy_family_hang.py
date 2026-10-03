from pathlib import Path
import subprocess

p=Path('crazy-family.html')
h=p.read_text(encoding='utf-8')

# RED: hanging does not exist yet.
assert 'id="hang"' not in h, 'RED failed: hang button already exists'
assert 'hanging:false' not in h, 'RED failed: hang state already exists'
assert "hang:{id:'hang'" not in h, 'RED failed: hang catalog already exists'
assert "if(e.key.toLowerCase()==='d'&&!e.repeat)toggleHang();" not in h, 'RED failed: D hang already exists'
assert "if(keys.ArrowRight||keys.d)dx++;" in h, 'RED setup failed: D is no longer movement input'
assert 'עולם הבית · חקירה חופשית · v0.18' in h, 'RED setup failed: expected v0.18'
print('RED confirmed: D hanging is not implemented')

repls=[
    ('עולם הבית · חקירה חופשית · v0.18','עולם הבית · חקירה חופשית · v0.19'),
    ('          <button class="abtn skill" id="roll">גלגול<br>X</button>\n',
     '          <button class="abtn skill" id="roll">גלגול<br>X</button>\n          <button class="abtn skill guard" id="hang">היתלות<br>D</button>\n'),
    ('rollStartedAt:0,rollUntil:0,rollCooldownUntil:0,rollDX:0,rollDY:1,inventory:',
     'rollStartedAt:0,rollUntil:0,rollCooldownUntil:0,rollDX:0,rollDY:1,hanging:false,hangAnchor:null,inventory:'),
    ("const libiDefenseCatalog={jump:{id:'jump',name:'קפיצה'},crouch:{id:'crouch',name:'התכופפות'},roll:{id:'roll',name:'גלגול'}};",
     "const libiDefenseCatalog={jump:{id:'jump',name:'קפיצה'},crouch:{id:'crouch',name:'התכופפות'},roll:{id:'roll',name:'גלגול'},hang:{id:'hang',name:'היתלות'}};"),
    ("function triggerJump(){const now=performance.now();if(player.lives<=0||now<player.jumpCooldownUntil||now<player.rollUntil)return false;player.jumpStartedAt=now;player.jumpUntil=now+650;player.jumpCooldownUntil=now+780;return true}\nfunction triggerRoll(){const now=performance.now();if(player.lives<=0||now<player.rollCooldownUntil||player.crouching||now<player.jumpUntil)return false;const dirs={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]},v=dirs[player.dir]||[0,1];player.rollDX=v[0];player.rollDY=v[1];player.rollStartedAt=now;player.rollUntil=now+360;player.rollCooldownUntil=now+900;return true}\n",
     "function triggerJump(){const now=performance.now();if(player.lives<=0||player.hanging||now<player.jumpCooldownUntil||now<player.rollUntil)return false;player.jumpStartedAt=now;player.jumpUntil=now+650;player.jumpCooldownUntil=now+780;return true}\nfunction triggerRoll(){const now=performance.now();if(player.lives<=0||player.hanging||now<player.rollCooldownUntil||player.crouching||now<player.jumpUntil)return false;const dirs={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]},v=dirs[player.dir]||[0,1];player.rollDX=v[0];player.rollDY=v[1];player.rollStartedAt=now;player.rollUntil=now+360;player.rollCooldownUntil=now+900;return true}\n"),
    ("worldOrder.forEach(s=>{items[s].forEach(i=>i.taken=false)});\n\nfunction msg(t)",
     "worldOrder.forEach(s=>{items[s].forEach(i=>i.taken=false)});\nconst hangAnchors={\n ground:[{x:180,y:84},{x:645,y:79},{x:205,y:404},{x:850,y:69}],\n floor1:[{x:165,y:94},{x:705,y:89},{x:155,y:389}],\n floor2:[{x:185,y:84},{x:715,y:84},{x:185,y:389}],\n basement:[{x:210,y:99},{x:665,y:104},{x:690,y:369}],\n yard:[{x:185,y:364},{x:765,y:114}],\n roof:[{x:175,y:364}]\n};\nfunction nearestHangAnchor(maxDist=54){let best=null,bestD=maxDist;for(const a of hangAnchors[player.scene]||[]){const d=Math.hypot(player.x-a.x,player.y-a.y);if(d<bestD){best=a;bestD=d}}return best}\nfunction toggleHang(){\n if(player.lives<=0)return false;\n if(player.hanging){player.hanging=false;player.hangAnchor=null;msg('ליבי שחררה את הקצה');return true}\n const a=nearestHangAnchor();if(!a){msg('אין כאן קצה להיתלות בו');return false}\n const now=performance.now();if(now<player.rollUntil||now<player.jumpUntil||player.crouching)return false;\n player.hanging=true;player.hangAnchor=a;player.x=a.x;player.y=a.y+34;player.moving=false;player.crouching=false;msg('ליבי נתפסה בקצה');return true\n}\n\nfunction msg(t)"),
    ("function transition(){if(!nearExit){msg('אין כאן מעבר');return}const e=nearExit;player.scene=e.to;player.x=e.spawn.x;player.y=e.spawn.y;nearExit=null;msg(scenes[player.scene].name);renderFloors()}",
     "function transition(){if(!nearExit){msg('אין כאן מעבר');return}const e=nearExit;player.hanging=false;player.hangAnchor=null;player.scene=e.to;player.x=e.spawn.x;player.y=e.spawn.y;nearExit=null;msg(scenes[player.scene].name);renderFloors()}"),
    (" let dx=0,dy=0;if(keys.ArrowLeft||keys.a)dx--;if(keys.ArrowRight||keys.d)dx++;if(keys.ArrowUp||keys.w)dy--;if(keys.ArrowDown||keys.s)dy++;\n if(performance.now()<dizzyUntil){dx*=-1;dy*=-1;}\n const now=performance.now(),rolling=now<player.rollUntil;\n player.crouching=!rolling&&!!(keys.c||player.crouchingTouch);\n let sprint=false;if(rolling){player.moving=true;player.x=clamp(player.x+player.rollDX*440*dt,28,932);player.y=clamp(player.y+player.rollDY*440*dt,28,572);walk+=dt*14}else{sprint=(keys.Shift||runTouch)&&!player.crouching;move(dx,dy,dt,sprint)}if(!sprint||(!dx&&!dy))player.stamina=Math.min(100,player.stamina+20*dt);",
     " let dx=0,dy=0;if(keys.ArrowLeft||keys.a)dx--;if(keys.ArrowRight)dx++;if(keys.ArrowUp||keys.w)dy--;if(keys.ArrowDown||keys.s)dy++;\n if(performance.now()<dizzyUntil){dx*=-1;dy*=-1;}\n const now=performance.now(),rolling=now<player.rollUntil;\n player.crouching=!player.hanging&&!rolling&&!!(keys.c||player.crouchingTouch);\n let sprint=false;if(player.hanging){player.moving=false;if(player.hangAnchor){player.x=player.hangAnchor.x;player.y=player.hangAnchor.y+34}}else if(rolling){player.moving=true;player.x=clamp(player.x+player.rollDX*440*dt,28,932);player.y=clamp(player.y+player.rollDY*440*dt,28,572);walk+=dt*14}else{sprint=(keys.Shift||runTouch)&&!player.crouching;move(dx,dy,dt,sprint)}if(!sprint||(!dx&&!dy))player.stamina=Math.min(100,player.stamina+20*dt);"),
    (" const now=performance.now();if(player.lives<=0||now<player.invulnerableUntil)return false;\n player.lives=Math.max(0,player.lives-amount);player.invulnerableUntil=now+1700;",
     " const now=performance.now();if(player.lives<=0||now<player.invulnerableUntil)return false;\n player.hanging=false;player.hangAnchor=null;player.lives=Math.max(0,player.lives-amount);player.invulnerableUntil=now+1700;"),
    ("function libi(){\n const now=performance.now(),jumping=now<player.jumpUntil,rolling=now<player.rollUntil,jumpP=jumping?Math.max(0,Math.min(1,(now-player.jumpStartedAt)/Math.max(1,player.jumpUntil-player.jumpStartedAt))):0,lift=jumping?Math.sin(jumpP*Math.PI)*18:0;\n const bob=player.moving?Math.sin(walk)*2:0;ctx.save();ctx.translate(player.x,player.y+bob-lift);if(rolling){const rp=Math.max(0,Math.min(1,(now-player.rollStartedAt)/360));ctx.rotate(rp*Math.PI*2*(player.rollDX<0?-1:1))}if(player.crouching)ctx.scale(1,.78);ctx.globalAlpha=1;",
     "function drawHangHint(){const a=player.hanging?player.hangAnchor:nearestHangAnchor(82);if(!a)return;ctx.save();ctx.strokeStyle=player.hanging?'#ffe169':'rgba(255,225,105,.62)';ctx.lineWidth=6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(a.x-22,a.y);ctx.lineTo(a.x+22,a.y);ctx.stroke();ctx.restore()}\nfunction libi(){\n const now=performance.now(),jumping=now<player.jumpUntil,rolling=now<player.rollUntil,jumpP=jumping?Math.max(0,Math.min(1,(now-player.jumpStartedAt)/Math.max(1,player.jumpUntil-player.jumpStartedAt))):0,lift=jumping?Math.sin(jumpP*Math.PI)*18:0;\n const bob=player.moving?Math.sin(walk)*2:0;ctx.save();ctx.translate(player.x,player.y+bob-lift);if(rolling){const rp=Math.max(0,Math.min(1,(now-player.rollStartedAt)/360));ctx.rotate(rp*Math.PI*2*(player.rollDX<0?-1:1))}if(player.crouching)ctx.scale(1,.78);ctx.globalAlpha=1;"),
    (" ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();ctx.ellipse(0,19,17,7,0,0,Math.PI*2);ctx.fill();\n ctx.fillStyle='#f49bb0';ctx.fillRect(-11,-2,22,21);",
     " if(!player.hanging){ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();ctx.ellipse(0,19,17,7,0,0,Math.PI*2);ctx.fill()}\n if(player.hanging){ctx.strokeStyle='#efc1a1';ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-8,-25);ctx.lineTo(-14,-39);ctx.moveTo(8,-25);ctx.lineTo(14,-39);ctx.stroke();ctx.fillStyle='#efc1a1';ctx.beginPath();ctx.arc(-14,-40,4,0,Math.PI*2);ctx.arc(14,-40,4,0,Math.PI*2);ctx.fill()}\n ctx.fillStyle='#f49bb0';ctx.fillRect(-11,-2,22,21);"),
    (" exits();pickups();drawDad();drawDadAttacks();libi();drawDizzyFX();",
     " exits();pickups();drawDad();drawDadAttacks();drawHangHint();libi();drawDizzyFX();"),
    ("addEventListener('keydown',e=>{startBgMusic();if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();keys[e.key]=true;keys[e.key.toLowerCase()]=true;if(e.key===' '&&!e.repeat)triggerJump();if(e.key.toLowerCase()==='x'&&!e.repeat)triggerRoll();if(e.key==='Enter'||e.key.toLowerCase()==='e')transition();",
     "addEventListener('keydown',e=>{startBgMusic();if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();keys[e.key]=true;keys[e.key.toLowerCase()]=true;if(e.key===' '&&!e.repeat)triggerJump();if(e.key.toLowerCase()==='x'&&!e.repeat)triggerRoll();if(e.key.toLowerCase()==='d'&&!e.repeat)toggleHang();if(e.key==='Enter'||e.key.toLowerCase()==='e')transition();"),
    ("document.getElementById('roll').onclick=triggerRoll;\nconst crouchBtn=document.getElementById('crouch');",
     "document.getElementById('roll').onclick=triggerRoll;\ndocument.getElementById('hang').onclick=toggleHang;\nconst crouchBtn=document.getElementById('crouch');")
]

for old,new in repls:
    count=h.count(old)
    if count!=1:
        raise SystemExit(f'expected one occurrence, got {count}: {old[:160]!r}')
    h=h.replace(old,new,1)

p.write_text(h,encoding='utf-8')
g=p.read_text(encoding='utf-8')

required=[
    'עולם הבית · חקירה חופשית · v0.19',
    'id="hang">היתלות<br>D',
    'hanging:false,hangAnchor:null',
    "hang:{id:'hang',name:'היתלות'}",
    'const hangAnchors={',
    'function nearestHangAnchor(maxDist=54)',
    'function toggleHang()',
    "if(e.key.toLowerCase()==='d'&&!e.repeat)toggleHang();",
    "document.getElementById('hang').onclick=toggleHang;",
    'if(player.hanging){player.moving=false;',
    'player.x=player.hangAnchor.x;player.y=player.hangAnchor.y+34',
    'function drawHangHint()',
    "if(keys.ArrowRight)dx++;",
    "if(e.key.toLowerCase()==='x'&&!e.repeat)triggerRoll();",
    "if(e.key===' '&&!e.repeat)triggerJump();",
    'id="crouch">התכופפות<br>C'
]
missing=[x for x in required if x not in g]
if missing:
    raise SystemExit('GREEN failed, missing: '+repr(missing))

# D is now reserved for hanging, not rightward movement.
if 'if(keys.ArrowRight||keys.d)dx++;' in g:
    raise SystemExit('GREEN failed: D still moves right')

# No unrelated old abilities return.
for forbidden in ['id="dash"','id="hide"','id="pushDad"','function triggerDash()','function toggleHide()','function pushDadAway()']:
    if forbidden in g:
        raise SystemExit('GREEN failed, unrelated ability returned: '+forbidden)

js=g.split('<script>',1)[1].split('</script>',1)[0]
Path('/tmp/crazy-family.js').write_text(js,encoding='utf-8')
subprocess.run(['node','--check','/tmp/crazy-family.js'],check=True)
print('GREEN passed: D toggles hanging at nearby anchors, movement locks while hanging, and prior abilities remain')
