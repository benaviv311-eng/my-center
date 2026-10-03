from pathlib import Path
import subprocess

p=Path('crazy-family.html')
h=p.read_text(encoding='utf-8')

# RED: roll does not exist yet.
assert 'id="roll"' not in h, 'RED failed: roll button already exists'
assert 'rollUntil:' not in h, 'RED failed: roll state already exists'
assert "roll:{id:'roll'" not in h, 'RED failed: roll catalog already exists'
assert "if(e.key===' '&&!e.repeat)triggerJump();" in h, 'RED setup failed: Space jump missing'
assert 'id="crouch">התכופפות<br>C' in h, 'RED setup failed: crouch missing'
print('RED confirmed: roll is not implemented')

repls=[
    ('עולם הבית · חקירה חופשית · v0.17','עולם הבית · חקירה חופשית · v0.18'),
    ('          <button class="abtn skill guard" id="crouch">התכופפות<br>C</button>\n',
     '          <button class="abtn skill guard" id="crouch">התכופפות<br>C</button>\n          <button class="abtn skill" id="roll">גלגול<br>X</button>\n'),
    ('jumpStartedAt:0,jumpUntil:0,jumpCooldownUntil:0,crouching:false,crouchingTouch:false,inventory:',
     'jumpStartedAt:0,jumpUntil:0,jumpCooldownUntil:0,crouching:false,crouchingTouch:false,rollStartedAt:0,rollUntil:0,rollCooldownUntil:0,rollDX:0,rollDY:1,inventory:'),
    ("const libiDefenseCatalog={jump:{id:'jump',name:'קפיצה'},crouch:{id:'crouch',name:'התכופפות'}};",
     "const libiDefenseCatalog={jump:{id:'jump',name:'קפיצה'},crouch:{id:'crouch',name:'התכופפות'},roll:{id:'roll',name:'גלגול'}};"),
    ("function triggerJump(){const now=performance.now();if(player.lives<=0||now<player.jumpCooldownUntil)return false;player.jumpStartedAt=now;player.jumpUntil=now+650;player.jumpCooldownUntil=now+780;return true}\n",
     "function triggerJump(){const now=performance.now();if(player.lives<=0||now<player.jumpCooldownUntil||now<player.rollUntil)return false;player.jumpStartedAt=now;player.jumpUntil=now+650;player.jumpCooldownUntil=now+780;return true}\nfunction triggerRoll(){const now=performance.now();if(player.lives<=0||now<player.rollCooldownUntil||player.crouching||now<player.jumpUntil)return false;const dirs={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]},v=dirs[player.dir]||[0,1];player.rollDX=v[0];player.rollDY=v[1];player.rollStartedAt=now;player.rollUntil=now+360;player.rollCooldownUntil=now+900;return true}\n"),
    ("function attackDefended(a){const now=performance.now();return (a.height==='low'&&now<player.jumpUntil)||(a.height==='high'&&player.crouching)}",
     "function attackDefended(a){const now=performance.now();return (a.height==='low'&&now<player.jumpUntil)||(a.height==='high'&&player.crouching)||(a.height==='mid'&&now<player.rollUntil)}"),
    (" if(player.scene===dad.scene&&activeDadAbilities.has('contact')&&Math.hypot(player.x-dad.x,player.y-dad.y)<=player.r+dad.r+4)damageLibi(1,'נגיעה באבא');",
     " if(player.scene===dad.scene&&activeDadAbilities.has('contact')&&now>=player.rollUntil&&Math.hypot(player.x-dad.x,player.y-dad.y)<=player.r+dad.r+4)damageLibi(1,'נגיעה באבא');"),
    (" if(performance.now()<dizzyUntil){dx*=-1;dy*=-1;}\n player.crouching=!!(keys.c||player.crouchingTouch);\n const sprint=(keys.Shift||runTouch)&&!player.crouching;move(dx,dy,dt,sprint);if(!sprint||(!dx&&!dy))player.stamina=Math.min(100,player.stamina+20*dt);",
     " if(performance.now()<dizzyUntil){dx*=-1;dy*=-1;}\n const now=performance.now(),rolling=now<player.rollUntil;\n player.crouching=!rolling&&!!(keys.c||player.crouchingTouch);\n let sprint=false;if(rolling){player.moving=true;player.x=clamp(player.x+player.rollDX*440*dt,28,932);player.y=clamp(player.y+player.rollDY*440*dt,28,572);walk+=dt*14}else{sprint=(keys.Shift||runTouch)&&!player.crouching;move(dx,dy,dt,sprint)}if(!sprint||(!dx&&!dy))player.stamina=Math.min(100,player.stamina+20*dt);"),
    ("const now=performance.now(),jumping=now<player.jumpUntil,jumpP=jumping?Math.max(0,Math.min(1,(now-player.jumpStartedAt)/Math.max(1,player.jumpUntil-player.jumpStartedAt))):0,lift=jumping?Math.sin(jumpP*Math.PI)*18:0;",
     "const now=performance.now(),jumping=now<player.jumpUntil,rolling=now<player.rollUntil,jumpP=jumping?Math.max(0,Math.min(1,(now-player.jumpStartedAt)/Math.max(1,player.jumpUntil-player.jumpStartedAt))):0,lift=jumping?Math.sin(jumpP*Math.PI)*18:0;"),
    ("ctx.save();ctx.translate(player.x,player.y+bob-lift);if(player.crouching)ctx.scale(1,.78);ctx.globalAlpha=1;",
     "ctx.save();ctx.translate(player.x,player.y+bob-lift);if(rolling){const rp=Math.max(0,Math.min(1,(now-player.rollStartedAt)/360));ctx.rotate(rp*Math.PI*2*(player.rollDX<0?-1:1))}if(player.crouching)ctx.scale(1,.78);ctx.globalAlpha=1;"),
    ("document.getElementById('jump').onclick=triggerJump;\nconst crouchBtn=document.getElementById('crouch');",
     "document.getElementById('jump').onclick=triggerJump;\ndocument.getElementById('roll').onclick=triggerRoll;\nconst crouchBtn=document.getElementById('crouch');"),
    ("if(e.key===' '&&!e.repeat)triggerJump();if(e.key==='Enter'||e.key.toLowerCase()==='e')transition();",
     "if(e.key===' '&&!e.repeat)triggerJump();if(e.key.toLowerCase()==='x'&&!e.repeat)triggerRoll();if(e.key==='Enter'||e.key.toLowerCase()==='e')transition();")
]

for old,new in repls:
    count=h.count(old)
    if count!=1:
        raise SystemExit(f'expected one occurrence, got {count}: {old[:140]!r}')
    h=h.replace(old,new,1)

p.write_text(h,encoding='utf-8')
g=p.read_text(encoding='utf-8')

required=[
    'עולם הבית · חקירה חופשית · v0.18',
    'id="roll">גלגול<br>X',
    'rollStartedAt:0,rollUntil:0,rollCooldownUntil:0,rollDX:0,rollDY:1',
    "roll:{id:'roll',name:'גלגול'}",
    'function triggerRoll()',
    'player.rollUntil=now+360',
    'player.rollCooldownUntil=now+900',
    'player.rollDX*440*dt',
    "a.height==='mid'&&now<player.rollUntil",
    "now>=player.rollUntil&&Math.hypot(player.x-dad.x,player.y-dad.y)",
    "if(e.key.toLowerCase()==='x'&&!e.repeat)triggerRoll();",
    "document.getElementById('roll').onclick=triggerRoll;",
    "if(e.key===' '&&!e.repeat)triggerJump();",
    'id="crouch">התכופפות<br>C'
]
missing=[x for x in required if x not in g]
if missing:
    raise SystemExit('GREEN failed, missing: '+repr(missing))

# Roll is not full immunity: low/high attacks are still handled by jump/crouch only.
if "a.height==='low'&&now<player.rollUntil" in g or "a.height==='high'&&now<player.rollUntil" in g:
    raise SystemExit('GREEN failed: roll became full-height immunity')

# No unrelated abilities are reintroduced.
for forbidden in ['id="dash"','id="hide"','id="pushDad"','function triggerDash()','function toggleHide()','function pushDadAway()']:
    if forbidden in g:
        raise SystemExit('GREEN failed, unrelated ability returned: '+forbidden)

js=g.split('<script>',1)[1].split('</script>',1)[0]
Path('/tmp/crazy-family.js').write_text(js,encoding='utf-8')
subprocess.run(['node','--check','/tmp/crazy-family.js'],check=True)
print('GREEN passed: X roll is directional, timed, cooldown-limited, and only dodges contact + mid attacks')
