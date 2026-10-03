from pathlib import Path
import subprocess

p=Path('crazy-family.html')
h=p.read_text(encoding='utf-8')

# RED: approved mobility extensions are not present yet.
assert 'עולם הבית · חקירה חופשית · v0.19' in h, 'RED setup failed: expected v0.19'
assert 'vaultStartedAt:' not in h, 'RED failed: vault state already exists'
assert 'function triggerVault()' not in h, 'RED failed: vault already exists'
assert 'function climbHang()' not in h, 'RED failed: climb already exists'
assert 'a.span' not in h, 'RED failed: sideways hang already exists'
print('RED confirmed: climb, sideways hanging and vault are not implemented')

repls=[
    ('עולם הבית · חקירה חופשית · v0.19','עולם הבית · חקירה חופשית · v0.20'),
    ('rollStartedAt:0,rollUntil:0,rollCooldownUntil:0,rollDX:0,rollDY:1,hanging:false,hangAnchor:null,inventory:',
     'rollStartedAt:0,rollUntil:0,rollCooldownUntil:0,rollDX:0,rollDY:1,hanging:false,hangAnchor:null,vaultStartedAt:0,vaultUntil:0,vaultCooldownUntil:0,vaultStartX:0,vaultStartY:0,vaultEndX:0,vaultEndY:0,inventory:'),
    ("function triggerJump(){const now=performance.now();if(player.lives<=0||player.hanging||now<player.jumpCooldownUntil||now<player.rollUntil)return false;player.jumpStartedAt=now;player.jumpUntil=now+650;player.jumpCooldownUntil=now+780;return true}",
     "function triggerJump(){const now=performance.now();if(player.lives<=0||player.hanging||now<player.jumpCooldownUntil||now<player.rollUntil||now<player.vaultUntil)return false;if(triggerVault())return true;player.jumpStartedAt=now;player.jumpUntil=now+650;player.jumpCooldownUntil=now+780;return true}"),
    ("const hangAnchors={\n ground:[{x:180,y:84},{x:645,y:79},{x:205,y:404},{x:850,y:69}],\n floor1:[{x:165,y:94},{x:705,y:89},{x:155,y:389}],\n floor2:[{x:185,y:84},{x:715,y:84},{x:185,y:389}],\n basement:[{x:210,y:99},{x:665,y:104},{x:690,y:369}],\n yard:[{x:185,y:364},{x:765,y:114}],\n roof:[{x:175,y:364}]\n};\nfunction nearestHangAnchor(maxDist=54){let best=null,bestD=maxDist;for(const a of hangAnchors[player.scene]||[]){const d=Math.hypot(player.x-a.x,player.y-a.y);if(d<bestD){best=a;bestD=d}}return best}\nfunction toggleHang(){\n if(player.lives<=0)return false;\n if(player.hanging){player.hanging=false;player.hangAnchor=null;msg('ליבי שחררה את הקצה');return true}\n const a=nearestHangAnchor();if(!a){msg('אין כאן קצה להיתלות בו');return false}\n const now=performance.now();if(now<player.rollUntil||now<player.jumpUntil||player.crouching)return false;\n player.hanging=true;player.hangAnchor=a;player.x=a.x;player.y=a.y+34;player.moving=false;player.crouching=false;msg('ליבי נתפסה בקצה');return true\n}\n",
     "const hangAnchors={\n ground:[{x:180,y:84,span:100},{x:645,y:79,span:85},{x:205,y:404,span:100},{x:850,y:69,span:35}],\n floor1:[{x:165,y:94,span:80},{x:705,y:89,span:85},{x:155,y:389,span:60}],\n floor2:[{x:185,y:84,span:95},{x:715,y:84,span:95},{x:185,y:389,span:85}],\n basement:[{x:210,y:99,span:120},{x:665,y:104,span:70},{x:690,y:369,span:80}],\n yard:[{x:185,y:364,span:80},{x:765,y:114,span:65}],\n roof:[{x:175,y:364,span:85}]\n};\nfunction nearestHangAnchor(maxDist=54){let best=null,bestD=maxDist;for(const a of hangAnchors[player.scene]||[]){const grabX=clamp(player.x,a.x-a.span,a.x+a.span),d=Math.hypot(player.x-grabX,player.y-a.y);if(d<bestD){best={anchor:a,grabX};bestD=d}}return best}\nfunction releaseHang(message='ליבי שחררה את הקצה'){player.hanging=false;player.hangAnchor=null;player.moving=false;if(message)msg(message)}\nfunction climbHang(){if(!player.hanging||!player.hangAnchor)return false;const a=player.hangAnchor;player.y=clamp(a.y-32,28,572);releaseHang('ליבי עלתה למעלה');return true}\nfunction dropHang(){if(!player.hanging||!player.hangAnchor)return false;const a=player.hangAnchor;player.y=clamp(a.y+52,28,572);releaseHang('ליבי שחררה למטה');return true}\nfunction toggleHang(){\n if(player.lives<=0)return false;\n if(player.hanging){releaseHang();return true}\n const hit=nearestHangAnchor();if(!hit){msg('אין כאן קצה להיתלות בו');return false}\n const now=performance.now();if(now<player.rollUntil||now<player.jumpUntil||now<player.vaultUntil||player.crouching)return false;\n const a=hit.anchor;player.hanging=true;player.hangAnchor=a;player.x=hit.grabX;player.y=a.y+34;player.moving=false;player.crouching=false;msg('ליבי נתפסה בקצה');return true\n}\nconst vaultObstacles={\n ground:[{x:70,y:85,w:220,h:72},{x:550,y:80,w:190,h:80},{x:95,y:405,w:220,h:92}],\n floor1:[{x:75,y:95,w:180,h:100},{x:610,y:90,w:190,h:110}],\n floor2:[{x:80,y:85,w:210,h:105},{x:610,y:85,w:210,h:105},{x:90,y:390,w:190,h:105}],\n basement:[{x:80,y:100,w:260,h:120},{x:600,y:370,w:180,h:70}],\n yard:[{x:95,y:365,w:180,h:85}],\n roof:[{x:80,y:365,w:190,h:80}]\n};\nfunction findVaultTarget(maxGap=58){\n for(const o of vaultObstacles[player.scene]||[]){\n  if(player.dir==='right'&&player.x<=o.x&&o.x-player.x<=maxGap&&player.y>=o.y-20&&player.y<=o.y+o.h+20)return{x:clamp(o.x+o.w+30,28,932),y:clamp(player.y,28,572)};\n  if(player.dir==='left'&&player.x>=o.x+o.w&&player.x-(o.x+o.w)<=maxGap&&player.y>=o.y-20&&player.y<=o.y+o.h+20)return{x:clamp(o.x-30,28,932),y:clamp(player.y,28,572)};\n  if(player.dir==='down'&&player.y<=o.y&&o.y-player.y<=maxGap&&player.x>=o.x-20&&player.x<=o.x+o.w+20)return{x:clamp(player.x,28,932),y:clamp(o.y+o.h+30,28,572)};\n  if(player.dir==='up'&&player.y>=o.y+o.h&&player.y-(o.y+o.h)<=maxGap&&player.x>=o.x-20&&player.x<=o.x+o.w+20)return{x:clamp(player.x,28,932),y:clamp(o.y-30,28,572)};\n }\n return null\n}\nfunction triggerVault(){\n const now=performance.now();if(player.lives<=0||player.hanging||player.crouching||now<player.vaultCooldownUntil||now<player.rollUntil||now<player.jumpUntil)return false;\n const target=findVaultTarget();if(!target)return false;\n player.vaultStartedAt=now;player.vaultUntil=now+420;player.vaultCooldownUntil=now+620;player.jumpCooldownUntil=now+620;player.vaultStartX=player.x;player.vaultStartY=player.y;player.vaultEndX=target.x;player.vaultEndY=target.y;player.moving=true;return true\n}\n"),
    (" const now=performance.now(),rolling=now<player.rollUntil;\n player.crouching=!player.hanging&&!rolling&&!!(keys.c||player.crouchingTouch);\n let sprint=false;if(player.hanging){player.moving=false;if(player.hangAnchor){player.x=player.hangAnchor.x;player.y=player.hangAnchor.y+34}}else if(rolling){player.moving=true;player.x=clamp(player.x+player.rollDX*440*dt,28,932);player.y=clamp(player.y+player.rollDY*440*dt,28,572);walk+=dt*14}else{sprint=(keys.Shift||runTouch)&&!player.crouching;move(dx,dy,dt,sprint)}if(!sprint||(!dx&&!dy))player.stamina=Math.min(100,player.stamina+20*dt);",
     " const now=performance.now();if(player.vaultUntil&&now>=player.vaultUntil){player.x=player.vaultEndX;player.y=player.vaultEndY;player.vaultUntil=0}const rolling=now<player.rollUntil,vaulting=now<player.vaultUntil;\n player.crouching=!player.hanging&&!rolling&&!vaulting&&!!(keys.c||player.crouchingTouch);\n let sprint=false;if(player.hanging){player.moving=false;const a=player.hangAnchor;if(a){if(dy<0)climbHang();else if(dy>0)dropHang();else{player.x=clamp(player.x+dx*112*dt,a.x-a.span,a.x+a.span);player.y=a.y+34;player.moving=!!dx}}}else if(vaulting){const vp=Math.max(0,Math.min(1,(now-player.vaultStartedAt)/Math.max(1,player.vaultUntil-player.vaultStartedAt))),ease=vp<.5?2*vp*vp:1-Math.pow(-2*vp+2,2)/2;player.moving=true;player.x=player.vaultStartX+(player.vaultEndX-player.vaultStartX)*ease;player.y=player.vaultStartY+(player.vaultEndY-player.vaultStartY)*ease;walk+=dt*12}else if(rolling){player.moving=true;player.x=clamp(player.x+player.rollDX*440*dt,28,932);player.y=clamp(player.y+player.rollDY*440*dt,28,572);walk+=dt*14}else{sprint=(keys.Shift||runTouch)&&!player.crouching;move(dx,dy,dt,sprint)}if(!sprint||(!dx&&!dy))player.stamina=Math.min(100,player.stamina+20*dt);"),
    ("function drawHangHint(){const a=player.hanging?player.hangAnchor:nearestHangAnchor(82);if(!a)return;ctx.save();ctx.strokeStyle=player.hanging?'#ffe169':'rgba(255,225,105,.62)';ctx.lineWidth=6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(a.x-22,a.y);ctx.lineTo(a.x+22,a.y);ctx.stroke();ctx.restore()}",
     "function drawHangHint(){const hit=player.hanging?{anchor:player.hangAnchor}:nearestHangAnchor(82),a=hit&&hit.anchor;if(!a)return;ctx.save();ctx.strokeStyle=player.hanging?'#ffe169':'rgba(255,225,105,.62)';ctx.lineWidth=6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(a.x-a.span,a.y);ctx.lineTo(a.x+a.span,a.y);ctx.stroke();ctx.restore()}"),
    (" const now=performance.now(),jumping=now<player.jumpUntil,rolling=now<player.rollUntil,jumpP=jumping?Math.max(0,Math.min(1,(now-player.jumpStartedAt)/Math.max(1,player.jumpUntil-player.jumpStartedAt))):0,lift=jumping?Math.sin(jumpP*Math.PI)*18:0;",
     " const now=performance.now(),jumping=now<player.jumpUntil,rolling=now<player.rollUntil,vaulting=now<player.vaultUntil,jumpP=jumping?Math.max(0,Math.min(1,(now-player.jumpStartedAt)/Math.max(1,player.jumpUntil-player.jumpStartedAt))):0,vaultP=vaulting?Math.max(0,Math.min(1,(now-player.vaultStartedAt)/Math.max(1,player.vaultUntil-player.vaultStartedAt))):0,lift=jumping?Math.sin(jumpP*Math.PI)*18:(vaulting?Math.sin(vaultP*Math.PI)*20:0);"),
]

for old,new in repls:
    count=h.count(old)
    if count!=1:
        raise SystemExit(f'expected one occurrence, got {count}: {old[:180]!r}')
    h=h.replace(old,new,1)

p.write_text(h,encoding='utf-8')
g=p.read_text(encoding='utf-8')

required=[
    'עולם הבית · חקירה חופשית · v0.20',
    'vaultStartedAt:0,vaultUntil:0,vaultCooldownUntil:0',
    'function climbHang()',
    'function dropHang()',
    'player.x=clamp(player.x+dx*112*dt,a.x-a.span,a.x+a.span)',
    'const vaultObstacles={',
    'function findVaultTarget(maxGap=58)',
    'function triggerVault()',
    'if(triggerVault())return true;',
    'player.vaultUntil=now+420',
    'player.vaultEndX-player.vaultStartX',
    'vaulting?Math.sin(vaultP*Math.PI)*20:0',
    "if(e.key.toLowerCase()==='d'&&!e.repeat)toggleHang();",
    "if(e.key.toLowerCase()==='x'&&!e.repeat)triggerRoll();",
    "id=\"crouch\">התכופפות<br>C",
]
missing=[x for x in required if x not in g]
if missing:
    raise SystemExit('GREEN failed, missing: '+repr(missing))

# D remains reserved for hanging, not movement.
if 'if(keys.ArrowRight||keys.d)dx++;' in g:
    raise SystemExit('GREEN failed: D returned as movement input')

# No unrelated removed abilities return.
for forbidden in ['id="dash"','id="hide"','id="pushDad"','function triggerDash()','function toggleHide()','function pushDadAway()']:
    if forbidden in g:
        raise SystemExit('GREEN failed, unrelated ability returned: '+forbidden)

js=g.split('<script>',1)[1].split('</script>',1)[0]
Path('/tmp/crazy-family.js').write_text(js,encoding='utf-8')
subprocess.run(['node','--check','/tmp/crazy-family.js'],check=True)
print('GREEN passed: hang climb/drop, sideways traversal and Space vault are implemented')
