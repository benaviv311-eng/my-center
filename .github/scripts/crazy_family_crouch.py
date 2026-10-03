from pathlib import Path
import subprocess

p=Path('crazy-family.html')
h=p.read_text(encoding='utf-8')

# RED: crouch does not exist yet.
assert 'id="crouch"' not in h, 'RED failed: crouch button already exists'
assert 'player.crouching' not in h, 'RED failed: crouch state already exists'
assert "crouch:{id:'crouch'" not in h, 'RED failed: crouch catalog already exists'
assert "if(e.key===' '&&!e.repeat)triggerJump();" in h, 'RED setup failed: Space jump missing'
print('RED confirmed: crouch is not implemented')

repls=[
    ('עולם הבית · חקירה חופשית · v0.16','עולם הבית · חקירה חופשית · v0.17'),
    ('          <button class="abtn skill" id="jump">קפיצה<br>Space</button>\n',
     '          <button class="abtn skill" id="jump">קפיצה<br>Space</button>\n          <button class="abtn skill guard" id="crouch">התכופפות<br>C</button>\n'),
    ('jumpStartedAt:0,jumpUntil:0,jumpCooldownUntil:0,inventory:',
     'jumpStartedAt:0,jumpUntil:0,jumpCooldownUntil:0,crouching:false,crouchingTouch:false,inventory:'),
    ("const libiDefenseCatalog={jump:{id:'jump',name:'קפיצה'}};",
     "const libiDefenseCatalog={jump:{id:'jump',name:'קפיצה'},crouch:{id:'crouch',name:'התכופפות'}};"),
    ("function attackDefended(a){const now=performance.now();return a.height==='low'&&now<player.jumpUntil}",
     "function attackDefended(a){const now=performance.now();return (a.height==='low'&&now<player.jumpUntil)||(a.height==='high'&&player.crouching)}"),
    (' let m=1;if(sprint&&player.stamina>0){m*=1.7;player.stamina=Math.max(0,player.stamina-34*dt)}',
     ' let m=1;if(player.crouching)m*=.58;if(sprint&&player.stamina>0){m*=1.7;player.stamina=Math.max(0,player.stamina-34*dt)}'),
    (' if(performance.now()<dizzyUntil){dx*=-1;dy*=-1;}\n const sprint=keys.Shift||runTouch;move(dx,dy,dt,sprint);',
     ' if(performance.now()<dizzyUntil){dx*=-1;dy*=-1;}\n player.crouching=!!(keys.c||player.crouchingTouch);\n const sprint=(keys.Shift||runTouch)&&!player.crouching;move(dx,dy,dt,sprint);'),
    ('ctx.save();ctx.translate(player.x,player.y+bob-lift);ctx.globalAlpha=1;',
     'ctx.save();ctx.translate(player.x,player.y+bob-lift);if(player.crouching)ctx.scale(1,.78);ctx.globalAlpha=1;'),
    ("document.getElementById('jump').onclick=triggerJump;\n",
     "document.getElementById('jump').onclick=triggerJump;\nconst crouchBtn=document.getElementById('crouch');crouchBtn.onpointerdown=e=>{e.preventDefault();player.crouchingTouch=true;crouchBtn.classList.add('pressed')};['pointerup','pointercancel','pointerleave'].forEach(ev=>crouchBtn.addEventListener(ev,e=>{e.preventDefault();player.crouchingTouch=false;crouchBtn.classList.remove('pressed')}));\n")
]

for old,new in repls:
    count=h.count(old)
    if count!=1:
        raise SystemExit(f'expected one occurrence, got {count}: {old[:120]!r}')
    h=h.replace(old,new,1)

p.write_text(h,encoding='utf-8')
g=p.read_text(encoding='utf-8')

# GREEN: crouch is hold-C, slows movement, blocks high attacks, and jump remains Space.
required=[
    'עולם הבית · חקירה חופשית · v0.17',
    'id="crouch">התכופפות<br>C',
    'crouching:false,crouchingTouch:false',
    "crouch:{id:'crouch',name:'התכופפות'}",
    "player.crouching=!!(keys.c||player.crouchingTouch);",
    "const sprint=(keys.Shift||runTouch)&&!player.crouching;",
    "if(player.crouching)m*=.58",
    "a.height==='high'&&player.crouching",
    'if(player.crouching)ctx.scale(1,.78)',
    "if(e.key===' '&&!e.repeat)triggerJump();",
    "const crouchBtn=document.getElementById('crouch')"
]
missing=[x for x in required if x not in g]
if missing:
    raise SystemExit('GREEN failed, missing: '+repr(missing))

# No unrelated abilities are reintroduced.
for forbidden in ['id="dash"','id="hide"','id="pushDad"','function triggerDash()','function toggleHide()','function pushDadAway()']:
    if forbidden in g:
        raise SystemExit('GREEN failed, unrelated ability returned: '+forbidden)

js=g.split('<script>',1)[1].split('</script>',1)[0]
Path('/tmp/crazy-family.js').write_text(js,encoding='utf-8')
subprocess.run(['node','--check','/tmp/crazy-family.js'],check=True)
print('GREEN passed: C crouches while held, slows movement, and avoids high attacks')
