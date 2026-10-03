from pathlib import Path
import subprocess

p=Path('crazy-family.html')
h=p.read_text(encoding='utf-8')

# RED: the old extra Libi abilities must still exist before this change.
red_markers=[
    'id="dash"','id="crouch"','id="hide"','id="pushDad"',
    'function triggerDash()','function toggleHide()','function pushDadAway()',
    'player.crouching=','player.hidden',"if(e.key.toLowerCase()==='h'&&!e.repeat)toggleHide()",
    "if(e.key.toLowerCase()==='x'&&!e.repeat)pushDadAway()"
]
missing=[m for m in red_markers if m not in h]
if missing:
    raise SystemExit('RED setup failed, missing old markers: '+repr(missing))
if "if(e.key===' '&&!e.repeat)triggerJump();" not in h:
    raise SystemExit('RED setup failed: Space jump mapping missing')
print('RED confirmed: extra Libi abilities are still active')

repls=[
 ('עולם הבית · חקירה חופשית · v0.14','עולם הבית · חקירה חופשית · v0.15'),
 ('          <button class="abtn skill" id="dash">דאש<br>כפתור</button>\n',''),
 ('          <button class="abtn skill guard" id="crouch">התכופפות<br>C</button>\n',''),
 ('          <button class="abtn skill guard" id="hide">התחבאות<br>H</button>\n',''),
 ('          <button class="abtn skill guard" id="pushDad">דחיפה<br>X</button>\n',''),
 ("maxLives:3,lives:3,invulnerableUntil:0,dashUntil:0,dashCooldownUntil:0,jumpStartedAt:0,jumpUntil:0,jumpCooldownUntil:0,crouching:false,crouchingTouch:false,hidden:false,pushCooldownUntil:0,inventory:",
  "maxLives:3,lives:3,invulnerableUntil:0,jumpStartedAt:0,jumpUntil:0,jumpCooldownUntil:0,inventory:"),
 ("const libiDefenseCatalog={\n run:{id:'run',name:'ריצה'},dash:{id:'dash',name:'דאש'},jump:{id:'jump',name:'קפיצה'},crouch:{id:'crouch',name:'התכופפות'},hide:{id:'hide',name:'התחבאות'},postHitIFrames:{id:'postHitIFrames',name:'חסינות אחרי פגיעה'},pushback:{id:'pushback',name:'דחיפה נגדית'},invisibility:{id:'invisibility',name:'בלתי נראות'},speed:{id:'speed',name:'מהירות'},headphones:{id:'headphones',name:'אוזניות'},radio:{id:'radio',name:'רדיו'},cover:{id:'cover',name:'מחסה'}\n};",
  "const libiDefenseCatalog={jump:{id:'jump',name:'קפיצה'}};"),
 (" const now=performance.now();if(player.lives<=0||now<player.invulnerableUntil||now<player.dashUntil)return false;",
  " const now=performance.now();if(player.lives<=0||now<player.invulnerableUntil)return false;"),
 ("function directionVector(){return player.dir==='left'?[-1,0]:player.dir==='right'?[1,0]:player.dir==='up'?[0,-1]:[0,1]}\n",''),
 ("function triggerDash(){const now=performance.now();if(player.lives<=0||now<player.dashCooldownUntil)return false;const [dx,dy]=directionVector();player.dashCooldownUntil=now+900;player.dashUntil=now+290;player.invulnerableUntil=Math.max(player.invulnerableUntil,player.dashUntil);player.hidden=false;player.x=clamp(player.x+dx*105,28,932);player.y=clamp(player.y+dy*105,28,572);return true}\n",''),
 ("function triggerJump(){const now=performance.now();if(player.lives<=0||now<player.jumpCooldownUntil)return false;player.jumpStartedAt=now;player.jumpUntil=now+650;player.jumpCooldownUntil=now+780;player.hidden=false;return true}",
  "function triggerJump(){const now=performance.now();if(player.lives<=0||now<player.jumpCooldownUntil)return false;player.jumpStartedAt=now;player.jumpUntil=now+650;player.jumpCooldownUntil=now+780;return true}"),
 ("function toggleHide(){if(player.moving){player.hidden=false;msg('כדי להתחבא צריך לעצור ליד מחסה');return false}player.hidden=!player.hidden;if(player.hidden)player.crouching=true;msg(player.hidden?'🙈 מצב התחבאות מוכן — את נקודות המחסה נחבר כשנבנה את השלב':'ליבי יצאה מהמחבוא');return player.hidden}\n",''),
 ("function pushDadAway(){const now=performance.now();if(now<player.pushCooldownUntil||player.scene!==dad.scene)return false;const dx=dad.x-player.x,dy=dad.y-player.y,d=Math.hypot(dx,dy)||1;if(d>78){msg('אבא רחוק מדי לדחיפה');return false}player.pushCooldownUntil=now+2200;dad.x=clamp(dad.x+dx/d*85,28,932);dad.y=clamp(dad.y+dy/d*85,28,572);msg('✋ ליבי הרחיקה את אבא');return true}\n",''),
 ("function attackDefended(a){const now=performance.now();if(now<player.dashUntil)return true;if(a.height==='low'&&now<player.jumpUntil)return true;if(a.height==='high'&&player.crouching)return true;if(player.hidden&&(a.type==='beam'||a.homing))return true;return false}",
  "function attackDefended(a){const now=performance.now();return a.height==='low'&&now<player.jumpUntil}"),
 ("activeDadAbilities.has('chaseSong')&&dadSongPlaying()&&!player.hidden","activeDadAbilities.has('chaseSong')&&dadSongPlaying()&&!player.invisible"),
 ("if(a.homing&&!player.hidden)","if(a.homing&&!player.invisible)"),
 (" let m=1;if(player.crouching)m*=.58;if(player.ability==='speed'", " let m=1;if(player.ability==='speed'"),
 (" player.crouching=!!(keys.c||keys.Control||player.crouchingTouch||player.hidden);if((dx||dy)&&player.hidden)player.hidden=false;\n",''),
 ("ctx.save();ctx.translate(player.x,player.y+bob-lift);if(player.crouching)ctx.scale(1,.78);ctx.globalAlpha=player.invisible?.35:(player.hidden?.18:1);",
  "ctx.save();ctx.translate(player.x,player.y+bob-lift);ctx.globalAlpha=player.invisible?.35:1;"),
 ("if(e.key.toLowerCase()==='h'&&!e.repeat)toggleHide();",''),
 ("if(e.key.toLowerCase()==='x'&&!e.repeat)pushDadAway();",''),
 ("addEventListener('keyup',e=>{keys[e.key]=false;keys[e.key.toLowerCase()]=false;if(e.key.toLowerCase()==='c'||e.key==='Control')player.crouching=false});",
  "addEventListener('keyup',e=>{keys[e.key]=false;keys[e.key.toLowerCase()]=false});"),
 ("document.getElementById('dash').onclick=triggerDash;document.getElementById('jump').onclick=triggerJump;document.getElementById('hide').onclick=toggleHide;document.getElementById('pushDad').onclick=pushDadAway;const crouchBtn=document.getElementById('crouch');crouchBtn.onpointerdown=e=>{e.preventDefault();player.crouchingTouch=true;crouchBtn.classList.add('pressed')};['pointerup','pointercancel','pointerleave'].forEach(ev=>crouchBtn.addEventListener(ev,e=>{e.preventDefault();player.crouchingTouch=false;crouchBtn.classList.remove('pressed')}));",
  "document.getElementById('jump').onclick=triggerJump;")
]

for old,new in repls:
    count=h.count(old)
    if count!=1:
        raise SystemExit(f'expected one occurrence, got {count}: {old[:120]!r}')
    h=h.replace(old,new)

p.write_text(h,encoding='utf-8')

g=p.read_text(encoding='utf-8')
# GREEN: only jump remains as Libi's explicit defensive ability/control.
required=[
    'עולם הבית · חקירה חופשית · v0.15',
    'id="jump">קפיצה<br>Space',
    "if(e.key===' '&&!e.repeat)triggerJump();",
    "const libiDefenseCatalog={jump:{id:'jump',name:'קפיצה'}};",
    'function triggerJump()',
    "document.getElementById('jump').onclick=triggerJump"
]
missing=[m for m in required if m not in g]
if missing:
    raise SystemExit('GREEN failed, missing: '+repr(missing))
for forbidden in [
    'id="dash"','id="crouch"','id="hide"','id="pushDad"',
    'function triggerDash()','function toggleHide()','function pushDadAway()',
    'player.crouching','player.hidden','player.dashUntil','player.dashCooldownUntil','player.pushCooldownUntil',
    "e.key.toLowerCase()==='h'","e.key.toLowerCase()==='x'"
]:
    if forbidden in g:
        raise SystemExit('GREEN failed, forbidden marker remains: '+forbidden)

js=g.split('<script>',1)[1].split('</script>',1)[0]
Path('/tmp/crazy-family.js').write_text(js,encoding='utf-8')
subprocess.run(['node','--check','/tmp/crazy-family.js'],check=True)
print('GREEN passed: Libi controls are movement, run and Space jump; extra abilities removed')
