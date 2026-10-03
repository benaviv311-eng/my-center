from pathlib import Path
import subprocess

P = Path('crazy-family.html')
h = P.read_text(encoding='utf-8')

REQUIRED = [
    'v0.13', 'id="lives"', 'maxLives:3,lives:3', 'const dadAbilityCatalog=',
    "wave:{id:'wave'", "burst:{id:'burst'", "wideWave:{id:'wideWave'", "beam:{id:'beam'",
    "ring:{id:'ring'", "echo:{id:'echo'", "bouncingNote:{id:'bouncingNote'", "homingNote:{id:'homingNote'",
    "chorusBoom:{id:'chorusBoom'", "surpriseShout:{id:'surpriseShout'", "chaseSong:{id:'chaseSong'", "contact:{id:'contact'",
    'const libiDefenseCatalog=', 'function damageLibi(', 'function healLibi(', 'function triggerDash(', 'function triggerJump(',
    'function toggleHide(', 'function pushDadAway(', 'function spawnDadAttack(', 'function updateDadAttackSystem(',
    'function drawDadAttacks(', 'function configureDadAbilities(', 'let activeDadAbilities=new Set();',
    'updateDadAttackSystem(dt);', 'drawDadAttacks();', 'id="dash"', 'id="jump"', 'id="crouch"', 'id="hide"', 'id="pushDad"'
]

missing_before = [x for x in REQUIRED if x not in h]
if not missing_before:
    raise SystemExit('RED did not fail: ability engine already present')
print('RED confirmed:', len(missing_before), 'new capability markers missing')

def one(old, new, label):
    global h
    n = h.count(old)
    if n != 1:
        raise SystemExit(f'{label}: expected 1 anchor, got {n}')
    h = h.replace(old, new)

one('עולם הבית · חקירה חופשית · v0.12', 'עולם הבית · חקירה חופשית · v0.13', 'version')
one('.actions{display:flex;gap:9px}.abtn{', '.actions{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end;max-width:390px}.abtn{', 'actions css')
one('.abtn.pressed{transform:translateY(5px);box-shadow:none}', '.abtn.pressed{transform:translateY(5px);box-shadow:none}.abtn.skill{width:62px;height:62px;font-size:11px;background:linear-gradient(#d9f3ff,#9dd9f4);box-shadow:0 5px 0 #6b9db5}.abtn.skill.guard{background:linear-gradient(#e6dcff,#bca5ef);box-shadow:0 5px 0 #8168b6}', 'skill css')
one('<div class="meters">\n      <div class="pill meterbox"><div class="label">כוח לריצה</div>', '<div class="meters">\n      <div class="pill meterbox"><div class="label">חיים</div><div id="lives" style="font-size:20px;letter-spacing:2px;margin-top:2px">❤️❤️❤️</div></div>\n      <div class="pill meterbox"><div class="label">כוח לריצה</div>', 'lives ui')
one('          <button class="abtn" id="run">ריצה<br>⚡</button>\n        </div>', '          <button class="abtn" id="run">ריצה<br>⚡</button>\n          <button class="abtn skill" id="dash">דאש<br>Space</button>\n          <button class="abtn skill" id="jump">קפיצה<br>J</button>\n          <button class="abtn skill guard" id="crouch">התכופפות<br>C</button>\n          <button class="abtn skill guard" id="hide">התחבאות<br>H</button>\n          <button class="abtn skill guard" id="pushDad">דחיפה<br>X</button>\n        </div>', 'defense buttons')
one("const toast=document.getElementById('toast'),staminaEl=document.getElementById('stamina'),shieldEl=document.getElementById('shield'),dizzyMeterEl=document.getElementById('dizzyMeter');", "const toast=document.getElementById('toast'),livesEl=document.getElementById('lives'),staminaEl=document.getElementById('stamina'),shieldEl=document.getElementById('shield'),dizzyMeterEl=document.getElementById('dizzyMeter');", 'lives dom')
one("const player={scene:'ground',x:820,y:500,r:15,speed:175,stamina:100,shield:0,inventory:[],capacity:3,selected:0,ability:null,abilityUntil:0,invisible:false,dir:'down',moving:false};", "const player={scene:'ground',x:820,y:500,r:15,speed:175,stamina:100,shield:0,maxLives:3,lives:3,invulnerableUntil:0,dashUntil:0,dashCooldownUntil:0,jumpStartedAt:0,jumpUntil:0,jumpCooldownUntil:0,crouching:false,crouchingTouch:false,hidden:false,pushCooldownUntil:0,inventory:[],capacity:3,selected:0,ability:null,abilityUntil:0,invisible:false,dir:'down',moving:false};", 'player life state')

dad_anchor = "const dad={scene:'ground',x:320,y:180,r:18,speed:70,targetX:320,targetY:180,targetAt:0,singing:false,phrase:'לה לה לה!',phase:0};"
engine = r'''const dad={scene:'ground',x:320,y:180,r:18,speed:70,targetX:320,targetY:180,targetAt:0,singing:false,phrase:'לה לה לה!',phase:0};

// Ability bank only. Stage 1 has not been configured yet.
const dadAbilityCatalog={
 wave:{id:'wave',name:'גל קול',cooldown:1850,kind:'ring',speed:180,maxRadius:350,thickness:16,height:'low'},
 burst:{id:'burst',name:'פרץ גלים',cooldown:2600,kind:'burst',speed:245,height:'mid'},
 wideWave:{id:'wideWave',name:'גל רחב',cooldown:3000,kind:'ring',speed:105,maxRadius:390,thickness:46,height:'low'},
 beam:{id:'beam',name:'קרן קול',cooldown:2700,kind:'beam',width:30,warning:380,duration:900,height:'high'},
 ring:{id:'ring',name:'טבעת קול',cooldown:3000,kind:'ring',speed:230,maxRadius:430,thickness:20,height:'low'},
 echo:{id:'echo',name:'הד חוזר',cooldown:3600,kind:'echo',speed:175,maxRadius:340,thickness:18,height:'mid'},
 bouncingNote:{id:'bouncingNote',name:'תו קופץ',cooldown:2800,kind:'projectile',speed:195,bounce:true,height:'mid'},
 homingNote:{id:'homingNote',name:'תו רודף',cooldown:3800,kind:'projectile',speed:125,homing:true,height:'mid'},
 chorusBoom:{id:'chorusBoom',name:'בום של פזמון',cooldown:4300,kind:'boom',warning:720,radius:140,height:'mid'},
 surpriseShout:{id:'surpriseShout',name:'צעקת הפתעה',cooldown:3300,kind:'beam',width:52,warning:180,duration:650,height:'high'},
 chaseSong:{id:'chaseSong',name:'רדיפה תוך כדי שירה',cooldown:0,kind:'movement'},
 contact:{id:'contact',name:'מגע באבא',cooldown:0,kind:'contact'}
};
const libiDefenseCatalog={
 run:{id:'run',name:'ריצה'},dash:{id:'dash',name:'דאש'},jump:{id:'jump',name:'קפיצה'},crouch:{id:'crouch',name:'התכופפות'},hide:{id:'hide',name:'התחבאות'},postHitIFrames:{id:'postHitIFrames',name:'חסינות אחרי פגיעה'},pushback:{id:'pushback',name:'דחיפה נגדית'},invisibility:{id:'invisibility',name:'בלתי נראות'},speed:{id:'speed',name:'מהירות'},headphones:{id:'headphones',name:'אוזניות'},radio:{id:'radio',name:'רדיו'},cover:{id:'cover',name:'מחסה'}
};
let activeDadAbilities=new Set();
let dadAttacks=[],dadAbilityReady={};
function configureDadAbilities(ids=[]){activeDadAbilities=new Set(ids.filter(id=>dadAbilityCatalog[id]));dadAbilityReady={};dadAttacks=[]}
function renderLives(){if(livesEl)livesEl.textContent='❤️'.repeat(player.lives)+'🖤'.repeat(Math.max(0,player.maxLives-player.lives))}
function damageLibi(amount=1,source='פגיעה'){
 const now=performance.now();if(player.lives<=0||now<player.invulnerableUntil||now<player.dashUntil)return false;
 player.lives=Math.max(0,player.lives-amount);player.invulnerableUntil=now+1700;
 const dx=player.x-dad.x,dy=player.y-dad.y,d=Math.hypot(dx,dy)||1;player.x=clamp(player.x+dx/d*42,28,932);player.y=clamp(player.y+dy/d*42,28,572);
 renderLives();msg(player.lives?('💔 '+source+' — נשארו '+player.lives+' לבבות'):'💔 לליבי נגמרו הלבבות — עדיין לא הגדרנו מה קורה מכאן');return true
}
function healLibi(amount=1){const before=player.lives;player.lives=Math.min(player.maxLives,player.lives+amount);renderLives();return player.lives>before}
function directionVector(){return player.dir==='left'?[-1,0]:player.dir==='right'?[1,0]:player.dir==='up'?[0,-1]:[0,1]}
function triggerDash(){const now=performance.now();if(player.lives<=0||now<player.dashCooldownUntil)return false;const [dx,dy]=directionVector();player.dashCooldownUntil=now+900;player.dashUntil=now+290;player.invulnerableUntil=Math.max(player.invulnerableUntil,player.dashUntil);player.hidden=false;player.x=clamp(player.x+dx*105,28,932);player.y=clamp(player.y+dy*105,28,572);return true}
function triggerJump(){const now=performance.now();if(player.lives<=0||now<player.jumpCooldownUntil)return false;player.jumpStartedAt=now;player.jumpUntil=now+650;player.jumpCooldownUntil=now+780;player.hidden=false;return true}
function toggleHide(){if(player.moving){player.hidden=false;msg('כדי להתחבא צריך לעצור ליד מחסה');return false}player.hidden=!player.hidden;if(player.hidden)player.crouching=true;msg(player.hidden?'🙈 מצב התחבאות מוכן — את נקודות המחסה נחבר כשנבנה את השלב':'ליבי יצאה מהמחבוא');return player.hidden}
function pushDadAway(){const now=performance.now();if(now<player.pushCooldownUntil||player.scene!==dad.scene)return false;const dx=dad.x-player.x,dy=dad.y-player.y,d=Math.hypot(dx,dy)||1;if(d>78){msg('אבא רחוק מדי לדחיפה');return false}player.pushCooldownUntil=now+2200;dad.x=clamp(dad.x+dx/d*85,28,932);dad.y=clamp(dad.y+dy/d*85,28,572);msg('✋ ליבי הרחיקה את אבא');return true}
function aimedAngle(){return Math.atan2(player.y-dad.y,player.x-dad.x)}
function addNote(angle,speed,opts={}){dadAttacks.push({type:'note',scene:dad.scene,x:dad.x,y:dad.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,r:15,bounce:!!opts.bounce,homing:!!opts.homing,height:'mid',born:performance.now(),life:5200,hit:false})}
function spawnDadAttack(id){const def=dadAbilityCatalog[id];if(!def||player.scene!==dad.scene)return false;const now=performance.now(),a=aimedAngle();
 if(id==='burst'){[-.22,0,.22].forEach(o=>addNote(a+o,def.speed));return true}
 if(id==='bouncingNote'){addNote(a,def.speed,{bounce:true});return true}
 if(id==='homingNote'){addNote(a,def.speed,{homing:true});return true}
 if(def.kind==='ring'||def.kind==='echo'){dadAttacks.push({type:def.kind,scene:dad.scene,x:dad.x,y:dad.y,radius:10,speed:def.speed,maxRadius:def.maxRadius,thickness:def.thickness,height:def.height,born:now,hit:false});return true}
 if(def.kind==='beam'){dadAttacks.push({type:'beam',scene:dad.scene,x:dad.x,y:dad.y,angle:a,length:560,width:def.width,height:def.height,warningUntil:now+def.warning,deadAt:now+def.warning+def.duration,hit:false});return true}
 if(def.kind==='boom'){dadAttacks.push({type:'boom',scene:dad.scene,x:dad.x,y:dad.y,radius:def.radius,height:def.height,warningUntil:now+def.warning,deadAt:now+def.warning+360,hit:false});return true}
 return false}
function attackDefended(a){const now=performance.now();if(now<player.dashUntil)return true;if(a.height==='low'&&now<player.jumpUntil)return true;if(a.height==='high'&&player.crouching)return true;if(player.hidden&&(a.type==='beam'||a.homing))return true;return false}
function beamHits(a){const px=player.x-a.x,py=player.y-a.y,dx=Math.cos(a.angle),dy=Math.sin(a.angle),t=Math.max(0,Math.min(a.length,px*dx+py*dy)),cx=a.x+dx*t,cy=a.y+dy*t;return Math.hypot(player.x-cx,player.y-cy)<=a.width/2+player.r}
function updateDadAttackSystem(dt){const now=performance.now();
 if(player.scene===dad.scene&&activeDadAbilities.has('contact')&&Math.hypot(player.x-dad.x,player.y-dad.y)<=player.r+dad.r+4)damageLibi(1,'נגיעה באבא');
 if(player.scene===dad.scene&&activeDadAbilities.has('chaseSong')&&dadSongPlaying()&&!player.hidden){dad.targetX=player.x;dad.targetY=player.y}
 if(player.scene===dad.scene&&dadSongPlaying()){for(const id of activeDadAbilities){const def=dadAbilityCatalog[id];if(!def||def.kind==='contact'||def.kind==='movement')continue;if(now>=(dadAbilityReady[id]||0)){spawnDadAttack(id);dadAbilityReady[id]=now+def.cooldown}}}
 for(const a of dadAttacks){if(a.scene!==player.scene)continue;
  if(a.type==='ring'||a.type==='echo'){a.radius+=a.speed*dt;if(a.type==='echo'&&a.speed>0&&a.radius>=a.maxRadius)a.speed=-Math.abs(a.speed);if((a.type==='ring'&&a.radius>a.maxRadius)||(a.type==='echo'&&a.radius<=0))a.dead=true;const d=Math.hypot(player.x-a.x,player.y-a.y);if(!a.hit&&Math.abs(d-a.radius)<=a.thickness/2+player.r&&!attackDefended(a)){a.hit=damageLibi(1,a.type==='echo'?'ההד החוזר של אבא':'גל הקול של אבא')}}
  else if(a.type==='note'){if(a.homing&&!player.hidden){const ang=Math.atan2(player.y-a.y,player.x-a.x),sp=Math.hypot(a.vx,a.vy);a.vx=a.vx*.93+Math.cos(ang)*sp*.07;a.vy=a.vy*.93+Math.sin(ang)*sp*.07}a.x+=a.vx*dt;a.y+=a.vy*dt;if(a.bounce){if(a.x<20||a.x>940)a.vx*=-1;if(a.y<20||a.y>580)a.vy*=-1}if(now-a.born>a.life||a.x<-60||a.x>1020||a.y<-60||a.y>660)a.dead=true;if(!a.hit&&Math.hypot(player.x-a.x,player.y-a.y)<=player.r+a.r&&!attackDefended(a)){a.hit=damageLibi(1,a.homing?'התו הרודף של אבא':'תו הקול של אבא');a.dead=true}}
  else if(a.type==='beam'){if(now>=a.deadAt)a.dead=true;else if(now>=a.warningUntil&&!a.hit&&beamHits(a)&&!attackDefended(a))a.hit=damageLibi(1,'קרן הקול של אבא')}
  else if(a.type==='boom'){if(now>=a.deadAt)a.dead=true;else if(now>=a.warningUntil&&!a.hit&&Math.hypot(player.x-a.x,player.y-a.y)<=a.radius+player.r&&!attackDefended(a))a.hit=damageLibi(1,'בום הפזמון של אבא')}
 }
 dadAttacks=dadAttacks.filter(a=>!a.dead)
}
function drawDadAttacks(){const now=performance.now();ctx.save();ctx.lineCap='round';
 for(const a of dadAttacks){if(a.scene!==player.scene)continue;ctx.strokeStyle='rgba(155,73,206,.86)';ctx.fillStyle='rgba(188,117,232,.22)';
  if(a.type==='ring'||a.type==='echo'){ctx.lineWidth=a.thickness;ctx.setLineDash(a.type==='echo'?[12,9]:[]);ctx.beginPath();ctx.arc(a.x,a.y,Math.max(1,a.radius),0,Math.PI*2);ctx.stroke();ctx.setLineDash([])}
  else if(a.type==='note'){ctx.font='30px Arial';ctx.textAlign='center';ctx.fillStyle='#8e49bd';ctx.fillText('♪',a.x,a.y+10)}
  else if(a.type==='beam'){const warning=now<a.warningUntil;ctx.globalAlpha=warning?.34:.9;ctx.lineWidth=warning?5:a.width;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(a.x+Math.cos(a.angle)*a.length,a.y+Math.sin(a.angle)*a.length);ctx.stroke();ctx.globalAlpha=1}
  else if(a.type==='boom'){ctx.globalAlpha=now<a.warningUntil?.25:.65;ctx.lineWidth=now<a.warningUntil?5:24;ctx.beginPath();ctx.arc(a.x,a.y,a.radius,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1}
 }ctx.restore()}
'''
one(dad_anchor, engine, 'ability engine')

one(" let m=1;if(player.ability==='speed'&&performance.now()<player.abilityUntil)m*=1.6;if(sprint&&player.stamina>0){m*=1.7;player.stamina=Math.max(0,player.stamina-34*dt)}", " let m=1;if(player.crouching)m*=.58;if(player.ability==='speed'&&performance.now()<player.abilityUntil)m*=1.6;if(sprint&&player.stamina>0){m*=1.7;player.stamina=Math.max(0,player.stamina-34*dt)}", 'crouch movement')
one(" let dx=0,dy=0;if(keys.ArrowLeft||keys.a)dx--;if(keys.ArrowRight||keys.d)dx++;if(keys.ArrowUp||keys.w)dy--;if(keys.ArrowDown||keys.s)dy++;\n if(performance.now()<dizzyUntil){dx*=-1;dy*=-1;}", " let dx=0,dy=0;if(keys.ArrowLeft||keys.a)dx--;if(keys.ArrowRight||keys.d)dx++;if(keys.ArrowUp||keys.w)dy--;if(keys.ArrowDown||keys.s)dy++;\n player.crouching=!!(keys.c||keys.Control||player.crouchingTouch||player.hidden);if((dx||dy)&&player.hidden)player.hidden=false;\n if(performance.now()<dizzyUntil){dx*=-1;dy*=-1;}", 'defense state')
one(' updateDad(dt);\n collect();findExit();', ' updateDad(dt);\n updateDadAttackSystem(dt);\n collect();findExit();', 'attack update')
one(" staminaEl.style.width=player.stamina+'%';shieldEl.style.width=player.shield+'%';dizzyMeterEl.style.width=Math.min(100,dizzyCharge)+'%';", " renderLives();staminaEl.style.width=player.stamina+'%';shieldEl.style.width=player.shield+'%';dizzyMeterEl.style.width=Math.min(100,dizzyCharge)+'%';", 'life render')
one("function libi(){\n const bob=player.moving?Math.sin(walk)*2:0;ctx.save();ctx.translate(player.x,player.y+bob);ctx.globalAlpha=player.invisible?.35:1;", "function libi(){\n const now=performance.now(),jumping=now<player.jumpUntil,jumpP=jumping?Math.max(0,Math.min(1,(now-player.jumpStartedAt)/Math.max(1,player.jumpUntil-player.jumpStartedAt))):0,lift=jumping?Math.sin(jumpP*Math.PI)*18:0;\n const bob=player.moving?Math.sin(walk)*2:0;ctx.save();ctx.translate(player.x,player.y+bob-lift);if(player.crouching)ctx.scale(1,.78);ctx.globalAlpha=player.invisible?.35:(player.hidden?.18:1);if(player.invulnerableUntil>now&&Math.floor(now/90)%2===0)ctx.globalAlpha*=.35;", 'libi visual')
one(' exits();pickups();drawDad();libi();drawDizzyFX();', ' exits();pickups();drawDad();drawDadAttacks();libi();drawDizzyFX();', 'attack draw')

old_key = "addEventListener('keydown',e=>{startBgMusic();if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();keys[e.key]=true;keys[e.key.toLowerCase()]=true;if(e.key==='Enter'||e.key.toLowerCase()==='e')transition();if(e.key.toLowerCase()==='q')useSelectedItem();if(['1','2','3','4'].includes(e.key)){player.selected=Math.min(+e.key-1,player.capacity-1);renderInv()}},{passive:false});\naddEventListener('keyup',e=>{keys[e.key]=false;keys[e.key.toLowerCase()]=false});"
new_key = "addEventListener('keydown',e=>{startBgMusic();if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();keys[e.key]=true;keys[e.key.toLowerCase()]=true;if(e.key===' '&&!e.repeat)triggerDash();if(e.key.toLowerCase()==='j'&&!e.repeat)triggerJump();if(e.key.toLowerCase()==='h'&&!e.repeat)toggleHide();if(e.key.toLowerCase()==='x'&&!e.repeat)pushDadAway();if(e.key==='Enter'||e.key.toLowerCase()==='e')transition();if(e.key.toLowerCase()==='q')useSelectedItem();if(['1','2','3','4'].includes(e.key)){player.selected=Math.min(+e.key-1,player.capacity-1);renderInv()}},{passive:false});\naddEventListener('keyup',e=>{keys[e.key]=false;keys[e.key.toLowerCase()]=false;if(e.key.toLowerCase()==='c'||e.key==='Control')player.crouching=false});"
one(old_key, new_key, 'keyboard defenses')

run_anchor = "const run=document.getElementById('run');run.onpointerdown=e=>{e.preventDefault();runTouch=true;run.classList.add('pressed')};['pointerup','pointercancel','pointerleave'].forEach(ev=>run.addEventListener(ev,e=>{e.preventDefault();runTouch=false;run.classList.remove('pressed')}));"
run_new = run_anchor + "\ndocument.getElementById('dash').onclick=triggerDash;document.getElementById('jump').onclick=triggerJump;document.getElementById('hide').onclick=toggleHide;document.getElementById('pushDad').onclick=pushDadAway;const crouchBtn=document.getElementById('crouch');crouchBtn.onpointerdown=e=>{e.preventDefault();player.crouchingTouch=true;crouchBtn.classList.add('pressed')};['pointerup','pointercancel','pointerleave'].forEach(ev=>crouchBtn.addEventListener(ev,e=>{e.preventDefault();player.crouchingTouch=false;crouchBtn.classList.remove('pressed')}));"
one(run_anchor, run_new, 'mobile defenses')
one('ברגע ששיר התחיל הוא תמיד מתנגן עד הסוף, גם אם ליבי מתרחקת; רק השפעת הסחרחורת תלויה במרחק.', 'ברגע ששיר התחיל הוא תמיד מתנגן עד הסוף, גם אם ליבי מתרחקת; רק השפעת הסחרחורת תלויה במרחק.<br><strong>מערכת יכולות:</strong> מאגר ההתקפות של אבא וההגנות של ליבי בנוי במנוע, אבל עדיין לא שייכנו סט התקפות לשלב הראשון.', 'hint')

P.write_text(h, encoding='utf-8')
missing_after = [x for x in REQUIRED if x not in h]
if missing_after:
    raise SystemExit('GREEN failed: ' + repr(missing_after))
print('GREEN markers passed:', len(REQUIRED))

script = h.split('<script>', 1)[1].rsplit('</script>', 1)[0]
Path('/tmp/crazy-family.js').write_text(script, encoding='utf-8')
subprocess.run(['node', '--check', '/tmp/crazy-family.js'], check=True)
print('GREEN JavaScript syntax passed')
