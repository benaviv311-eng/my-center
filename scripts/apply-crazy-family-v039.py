from pathlib import Path
import re

path = Path('crazy-family.html')
s = path.read_text(encoding='utf-8')

if 'DAD_ABILITIES_V039' in s:
    print('v0.39 Dad abilities already applied')
    raise SystemExit(0)


def replace_once(old: str, new: str, label: str) -> None:
    global s
    if old not in s:
        raise SystemExit(f'missing anchor: {label}')
    s = s.replace(old, new, 1)


def regex_once(pattern: str, repl: str, label: str) -> None:
    global s
    s, count = re.subn(pattern, repl, s, count=1, flags=re.S)
    if count != 1:
        raise SystemExit(f'{label} replacement count={count}')


replace_once('עולם הבית · שלב 1: מפגש אבא · v0.38', 'עולם הבית · שלב 1: מפגש אבא · v0.39', 'page version')

# Add the two approved ambient abilities and the fixed song->ability contract.
replace_once(
    " chorusBoom:{id:'chorusBoom',name:'בום של פזמון',cooldown:4800,kind:'boom',warning:900,radius:190,height:'area'},\n chaseSong:",
    " chorusBoom:{id:'chorusBoom',name:'בום של פזמון',cooldown:4800,kind:'boom',warning:900,radius:190,height:'area'},\n noteBarrage:{id:'noteBarrage',name:'מטר תווים',cooldown:0,kind:'ambientNotes'},\n randomNoteVolley:{id:'randomNoteVolley',name:'מטח תווים בזווית',cooldown:0,kind:'ambientNotes'},\n chaseSong:",
    'ambient ability catalog',
)
replace_once(
    "const dadStage1AbilityIds=['lowWave','highWave','midWave','bouncingNote','homingNote','wideWave','beam','ring','echo','chorusBoom'];",
    """const dadStage1AbilityIds=['lowWave','highWave','midWave','bouncingNote','homingNote','wideWave','beam','ring','echo','chorusBoom'];
// DAD_ABILITIES_V039 — songs 1-10 use fixed signature attacks; speech and breath use abilities 11-12.
const dadAmbientAbilityIds=['noteBarrage','randomNoteVolley'];
const DAD_SONG_ABILITY_MAP=['lowWave','echo','wideWave','highWave','beam','homingNote','ring','chorusBoom','midWave','bouncingNote'];
const DAD_SONG_ATTACK_PHASES=[.12,.5,.86];
const DAD_NOTE_LANES=[-72,0,72];
let dadSongAttackStep=0,dadSongAttackStartedAt=0;""",
    'song ability mapping',
)

# Give active notes a pose and a lane origin. Ability 11 fires 1-3 waves; ability 12 fires 1-3 notes down one random lane/angle.
regex_once(
    r"function addNote\(angle,speed,opts=\{\}\)\{dadAttacks\.push\(\{type:'note'.*?\}\)\}\nfunction sneezeNoteBlockedByFurniture",
    """function notePoseHeight(notePose){return notePose==='lying'?'low':notePose==='floating'?'high':'space'}
function randomAttackNotePose(){return ['standing','lying','floating'][Math.floor(Math.random()*3)]}
function addNote(angle,speed,opts={}){const notePose=opts.notePose||'',startX=Number.isFinite(opts.startX)?opts.startX:dad.x,startY=Number.isFinite(opts.startY)?opts.startY:dad.y;dadAttacks.push({type:'note',name:opts.name||'תו של אבא',scene:dad.scene,x:startX,y:startY,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,r:15,bounce:!!opts.bounce,homing:!!opts.homing,sneezeTier:opts.sneezeTier||0,notePose,height:opts.height||notePoseHeight(notePose),born:performance.now(),life:opts.life||5200,hit:false})}
function shuffledDadNoteLanes(){const lanes=[...DAD_NOTE_LANES];for(let i=lanes.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[lanes[i],lanes[j]]=[lanes[j],lanes[i]]}return lanes}
function fireDadLaneVolley(){if(player.scene!==dad.scene||dadSongPlaying())return false;const angle=aimedAngle(),sideX=-Math.sin(angle),sideY=Math.cos(angle),count=1+Math.floor(Math.random()*3),lanes=shuffledDadNoteLanes().slice(0,count);for(let i=0;i<lanes.length;i++){const offset=lanes[i],notePose=randomAttackNotePose();addNote(angle,220+i*10,{name:'מטר תווים',notePose,startX:dad.x+sideX*offset,startY:dad.y+sideY*offset,life:3600})}return true}
function fireDadLaneBarrage(){if(player.scene!==dad.scene||dadSongPlaying())return false;const waves=1+Math.floor(Math.random()*3);for(let wave=0;wave<waves;wave++)setTimeout(()=>{if(!dadSongPlaying()&&player.scene===dad.scene)fireDadLaneVolley()},wave*430);return true}
function fireDadRandomAngleVolley(){if(player.scene!==dad.scene||dadSongPlaying())return false;const base=aimedAngle(),lane=DAD_NOTE_LANES[Math.floor(Math.random()*DAD_NOTE_LANES.length)],angle=base+(Math.random()-.5)*.9,count=1+Math.floor(Math.random()*3),sideX=-Math.sin(base),sideY=Math.cos(base),notePose=randomAttackNotePose();for(let i=0;i<count;i++){const back=i*30;addNote(angle,235,{name:'מטח תווים בזווית',notePose,startX:dad.x+sideX*lane-Math.cos(angle)*back,startY:dad.y+sideY*lane-Math.sin(angle)*back,life:3800})}return true}
function triggerDadAmbientAttack(kind){if(dadSongPlaying()||player.scene!==dad.scene)return false;if(kind==='talk'&&activeDadAbilities.has('noteBarrage'))return fireDadLaneBarrage();if(kind==='breath'&&activeDadAbilities.has('randomNoteVolley'))return fireDadRandomAngleVolley();return false}
function sneezeNoteBlockedByFurniture""",
    'active-note system',
)

# Echo is explicitly two opposite-height travelling waves: one out, one back.
replace_once(
    "function spawnDadAttack(id){const def=dadAbilityCatalog[id];if(!def||player.scene!==dad.scene)return false;const now=performance.now(),a=aimedAngle();",
    """function spawnReturningEchoAttack(def){const now=performance.now(),angle=aimedAngle(),firstLow=Math.random()<.5,firstHeight=firstLow?'low':'high',returnHeight=firstLow?'high':'low',distance=580,speed=260,warning=360,returnAt=now+warning+distance/speed*1000+240,endX=dad.x+Math.cos(angle)*distance,endY=dad.y+Math.sin(angle)*distance;dadAttacks.push({type:'wave',name:'הד חוזר — הלוך',scene:dad.scene,originX:dad.x,originY:dad.y,x:dad.x,y:dad.y,angle,distance:0,speed,width:230,thickness:22,maxDistance:distance,height:firstHeight,warningUntil:now+warning,born:now,hit:false});dadAttacks.push({type:'wave',name:'הד חוזר — חזור',scene:dad.scene,originX:endX,originY:endY,x:endX,y:endY,angle:angle+Math.PI,distance:0,speed,width:230,thickness:22,maxDistance:distance,height:returnHeight,warningUntil:returnAt,born:now,hit:false});return true}
function spawnDadAttack(id){const def=dadAbilityCatalog[id];if(!def||player.scene!==dad.scene)return false;const now=performance.now(),a=aimedAngle();""",
    'echo helper',
)
replace_once(
    " if(id==='homingNote'){addNote(a,def.speed,{homing:true,name:def.name});return true}\n if(def.kind==='wave')",
    " if(id==='homingNote'){addNote(a,def.speed,{homing:true,name:def.name});return true}\n if(id==='echo')return spawnReturningEchoAttack(def);\n if(def.kind==='wave')",
    'echo dispatch',
)
replace_once(
    " if(def.kind==='ring'||def.kind==='echo'){dadAttacks.push({type:def.kind,name:def.name,scene:dad.scene,x:dad.x,y:dad.y,radius:10,speed:def.speed,maxRadius:def.maxRadius,thickness:def.thickness,height:'area',born:now,hit:false});return true}",
    " if(def.kind==='ring'){dadAttacks.push({type:'ring',name:def.name,scene:dad.scene,x:dad.x,y:dad.y,radius:10,speed:def.speed,maxRadius:def.maxRadius,thickness:def.thickness,height:'area',born:now,hit:false});return true}",
    'ring dispatch',
)

# Approved dodge rules and environmental counters.
regex_once(
    r"function attackDefended\(a\)\{.*?\}\nfunction waveHits",
    """function attackDefended(a){const now=performance.now();if(a.type==='note'&&a.notePose){if(a.notePose==='lying')return player.z>24||now<player.jumpUntil;if(a.notePose==='floating')return player.crouching;if(a.notePose==='standing')return false}if(a.type==='note'&&a.homing&&now<player.rollUntil)return true;if(a.type==='wave'||(a.type==='note'&&a.sneezeTier))return (a.height==='low'&&(player.z>24||now<player.jumpUntil))||(a.height==='high'&&player.crouching)||(a.height==='mid'&&now<player.rollUntil);return false}
function playerSafeFromGroundRing(){const now=performance.now();return player.hanging||player.z>18||now<player.vaultUntil}
function wideWaveBlockedByFurniture(a){if(a.name!=='גל רחב'||player.scene!=='ground')return false;for(const id of ['sofa','coffeeTable','diningTable']){const z=houseZone(id);if(!z)continue;for(let i=1;i<24;i++){const t=i/24,x=a.originX+(player.x-a.originX)*t,y=a.originY+(player.y-a.originY)*t;if(pointInHouseZone(z,x,y,5))return true}}return false}
function waveHits""",
    'defense helpers',
)

# Singing no longer picks a random ability bag. The current song owns the attack schedule.
replace_once(
    "function beamHits(a){const px=player.x-a.x,py=player.y-a.y,dx=Math.cos(a.angle),dy=Math.sin(a.angle),t=Math.max(0,Math.min(a.length,px*dx+py*dy)),cx=a.x+dx*t,cy=a.y+dy*t;return Math.hypot(player.x-cx,player.y-cy)<=a.width/2+player.r}\nfunction updateDadAttackSystem(dt){const now=performance.now();",
    """function beamHits(a){const px=player.x-a.x,py=player.y-a.y,dx=Math.cos(a.angle),dy=Math.sin(a.angle),t=Math.max(0,Math.min(a.length,px*dx+py*dy)),cx=a.x+dx*t,cy=a.y+dy*t;return Math.hypot(player.x-cx,player.y-cy)<=a.width/2+player.r}
function dadSongAbilityProgress(now){const a=dadSongAudio;if(a&&Number.isFinite(a.duration)&&a.duration>0)return clamp(a.currentTime/a.duration,0,1);return clamp((now-dadSongAttackStartedAt)/3400,0,1)}
function updateDadSongAbilitySchedule(now){if(!dadSongPlaying()||player.scene!==dad.scene)return;const id=DAD_SONG_ABILITY_MAP[dadSongIndex];if(!id||dadSongAttackStep>=DAD_SONG_ATTACK_PHASES.length)return;const progress=dadSongAbilityProgress(now);if(progress<DAD_SONG_ATTACK_PHASES[dadSongAttackStep])return;if(activeDadAbilities.has(id))spawnDadAttack(id);dadSongAttackStep++}
function updateDadAttackSystem(dt){const now=performance.now();""",
    'song schedule helpers',
)
regex_once(
    r" if\(player\.scene===dad\.scene&&dadSongPlaying\(\)\)\{\n  if\(!dadNextAttackAt\).*?\n \}else dadNextAttackAt=now\+900;",
    " if(player.scene===dad.scene&&dadSongPlaying())updateDadSongAbilitySchedule(now);\n else dadSongAttackStep=0;",
    'random song attack loop',
)
replace_once(
    "if(!a.hit&&waveHits(a)&&!attackDefended(a)){a.hit=damageLibi(1,a.name||'התקפה של אבא')}",
    "if(!a.hit&&waveHits(a)&&!attackDefended(a)&&!wideWaveBlockedByFurniture(a)){a.hit=damageLibi(1,a.name||'התקפה של אבא')}",
    'wide wave cover',
)
replace_once(
    "if(!a.hit&&Math.abs(d-a.radius)<=a.thickness/2+player.r){a.hit=damageLibi(1,a.name||'התקפה של אבא')}",
    "if(!a.hit&&Math.abs(d-a.radius)<=a.thickness/2+player.r&&(a.type!=='ring'||!playerSafeFromGroundRing())){a.hit=damageLibi(1,a.name||'התקפה של אבא')}",
    'ground ring dodge',
)
# A last-second roll breaks homing; after that the note continues on its old vector.
replace_once(
    "else if(a.type==='note'){if(a.homing){const ang=Math.atan2(player.y-a.y,player.x-a.x),sp=Math.hypot(a.vx,a.vy);a.vx=a.vx*.93+Math.cos(ang)*sp*.07;a.vy=a.vy*.93+Math.sin(ang)*sp*.07}",
    "else if(a.type==='note'){if(a.homing&&now<player.rollUntil&&Math.hypot(player.x-a.x,player.y-a.y)<105){a.homing=false;a.homingDodged=true}if(a.homing){const ang=Math.atan2(player.y-a.y,player.x-a.x),sp=Math.hypot(a.vx,a.vy);a.vx=a.vx*.93+Math.cos(ang)*sp*.07;a.vy=a.vy*.93+Math.sin(ang)*sp*.07}",
    'homing roll break',
)

# Make active note pose readable: lying rotates horizontally; floating keeps the high visual lane.
replace_once(
    "const mainGlyph=a.homing?'♫':a.bounce?'♬':DAD_MUSIC_GLYPHS[((a.sneezeTier||1)-1)%3];drawMusicGlyphV036(mainGlyph,x,y,(a.r||12)*1.75+(a.sneezeTier||0)*2,coreColor,.98,Math.sin(now/170+(a.born||0))*.11);",
    "const mainGlyph=a.homing?'♫':a.bounce?'♬':DAD_MUSIC_GLYPHS[((a.sneezeTier||1)-1)%3],poseRotation=a.notePose==='lying'?Math.PI/2:0;drawMusicGlyphV036(mainGlyph,x,y,(a.r||12)*1.75+(a.sneezeTier||0)*2,coreColor,.98,poseRotation+Math.sin(now/170+(a.born||0))*.11);",
    'note pose rendering',
)

# Enable abilities 11-12 in the active set.
replace_once(
    "configureDadAbilities(dadStage1AbilityIds);activeDadAbilities.add('chaseSong');activeDadAbilities.add('contact');",
    "configureDadAbilities([...dadStage1AbilityIds,...dadAmbientAbilityIds]);activeDadAbilities.add('chaseSong');activeDadAbilities.add('contact');",
    'active ability set',
)

# Talking launches ability 11. Pant/yawn launches ability 12. The helper itself blocks all ambient attacks during songs.
replace_once(
    "function playDadPre(index){if(index<0||index>=dadPreClips.length)return;stopDadPre();const a=dadPreClips[index];dadPreAudio=a;a.currentTime=0;a.playbackRate=1;a.preservesPitch=false;setBgDuck(true);nextFarChatterAt=performance.now()+1400+Math.random()*900;",
    "function playDadPre(index){if(index<0||index>=dadPreClips.length)return;stopDadPre();const a=dadPreClips[index];dadPreAudio=a;a.currentTime=0;a.playbackRate=1;a.preservesPitch=false;setBgDuck(true);triggerDadAmbientAttack('talk');nextFarChatterAt=performance.now()+1400+Math.random()*900;",
    'speech attack hook',
)
replace_once(
    "function setDadHouseState(state,ms,now=performance.now()){dadHouseState=state;dad.targetX=dad.x;dad.targetY=dad.y;if(state==='pant'){dadHouseUntil=now+(ms||1850);playDadHouseAudio(dadHouseAudio.pant,.92)}else if(state==='yawn'){dadHouseUntil=now+(ms||1700);playDadHouseAudio(dadHouseAudio.yawn,.92)}else if(state==='sneeze')",
    "function setDadHouseState(state,ms,now=performance.now()){dadHouseState=state;dad.targetX=dad.x;dad.targetY=dad.y;if(state==='pant'){dadHouseUntil=now+(ms||1850);playDadHouseAudio(dadHouseAudio.pant,.92);triggerDadAmbientAttack('breath')}else if(state==='yawn'){dadHouseUntil=now+(ms||1700);playDadHouseAudio(dadHouseAudio.yawn,.92);triggerDadAmbientAttack('breath')}else if(state==='sneeze')",
    'breath attack hook',
)

# Reset the three scheduled attacks at the exact start of every song.
replace_once(
    "function startDadSongClip(){setBgDuck(true);if(dadSongIndex<0)nextDadSong();dadClipIndex=dadSongIndex;dadSongFxClock=performance.now();if(dadSongTier?.id===4)triggerDadSongSuperEvent();playDadClip(dadClipIndex)}",
    "function startDadSongClip(){setBgDuck(true);if(dadSongIndex<0)nextDadSong();dadClipIndex=dadSongIndex;dadSongFxClock=performance.now();dadSongAttackStep=0;dadSongAttackStartedAt=dadSongFxClock;if(dadSongTier?.id===4)triggerDadSongSuperEvent();playDadClip(dadClipIndex)}",
    'song schedule reset',
)

# Higher song tiers keep their room/visual intensity but no longer inject unrelated damaging note attacks.
regex_once(
    r"function triggerDadSongSuperEvent\(\)\{.*?\}\nfunction updateDadSongTierEffects\(now,active\)\{.*?\}\nfunction drawDadSongTierFX",
    """function triggerDadSongSuperEvent(){const tier=dadSongTier;if(!tier||tier.id!==4)return;if(dad.scene==='ground'){houseFx.screenShake=Math.max(houseFx.screenShake,.8);houseFx.curtainBlast=Math.max(houseFx.curtainBlast,.82);houseFx.paperBurst=Math.max(houseFx.paperBurst,.88);houseFx.doorSlam=Math.max(houseFx.doorSlam,.72);houseFx.toyKick=Math.max(houseFx.toyKick,.75);houseFx.chairNudge=Math.max(houseFx.chairNudge,.7);houseFx.dustBurst=Math.max(houseFx.dustBurst,.55)}dadSongSuperWaveAt=0}
function updateDadSongTierEffects(now,active){if(!active||!dadSongTier){dadSongSuperWaveAt=0;return}const tier=dadSongTier;if(tier.id===3&&dad.scene==='ground'){houseFx.curtainBlast=Math.max(houseFx.curtainBlast,.18);houseFx.paperBurst=Math.max(houseFx.paperBurst,.12);houseFx.toyKick=Math.max(houseFx.toyKick,.12)}else if(tier.id===4&&dad.scene==='ground'){houseFx.screenShake=Math.max(houseFx.screenShake,.12);houseFx.curtainBlast=Math.max(houseFx.curtainBlast,.3);houseFx.paperBurst=Math.max(houseFx.paperBurst,.26)}}
function drawDadSongTierFX""",
    'song tier attack isolation',
)

# Update the visible help copy to match the approved system.
replace_once(
    '<strong>מערכת יכולות:</strong> כל 10 ההתקפות של אבא פעילות: גל נמוך, גל גבוה, גל אמצע, תו קופץ, תו רודף, גל רחב, קרן קול, טבעת קול, הד חוזר ובום של פזמון. כל פגיעה מורידה חיים.',
    '<strong>מערכת יכולות:</strong> שירים 1–10 מפעילים כל אחד יכולת חתימה קבועה בשלושה רגעים בשיר. בזמן שאבא לא שר, דיבור מפעיל מטר תווים בשלושה נתיבים ואנחה/פיהוק מפעילים מטח של 1–3 תווים בזווית אקראית. תו עומד דורש מעבר צד, תו שוכב מאפשר קפיצה או מעבר צד, ותו מרחף מאפשר התכופפות או מעבר צד. כל פגיעה מורידה חיים.',
    'help copy',
)

path.write_text(s, encoding='utf-8')
print('applied Crazy Family Dad abilities v0.39')
