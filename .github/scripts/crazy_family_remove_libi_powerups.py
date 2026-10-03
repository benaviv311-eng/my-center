from pathlib import Path
import re, subprocess
p=Path('crazy-family.html')
h=p.read_text(encoding='utf-8')

# RED: legacy Libi powerups still exist.
for marker in ["id:'speed'","id:'invisible'","player.ability==='speed'","player.invisible"]:
    if marker not in h:
        raise SystemExit('RED setup failed: '+marker)
print('RED confirmed: legacy speed/invisibility abilities still exist')

h=h.replace('עולם הבית · חקירה חופשית · v0.15','עולם הבית · חקירה חופשית · v0.16',1)
h=h.replace("ability:null,abilityUntil:0,invisible:false,",'',1)

h,n=re.subn(r"const abilities=\{.*?\n\};\n",'',h,count=1,flags=re.S)
if n!=1: raise SystemExit('abilities block replacement failed')

h=h.replace("worldOrder.forEach(s=>{items[s].forEach(i=>i.taken=false);abilities[s].forEach(i=>i.taken=false)});","worldOrder.forEach(s=>{items[s].forEach(i=>i.taken=false)});",1)
h=h.replace(" let m=1;if(player.ability==='speed'&&performance.now()<player.abilityUntil)m*=1.6;if(sprint&&player.stamina>0)"," let m=1;if(sprint&&player.stamina>0)",1)

# Remove ability pickup collection loop.
pattern=r"\n for\(const p of abilities\[player\.scene\]\)\{.*?\n \}\n"
h,n=re.subn(pattern,'\n',h,count=1,flags=re.S)
if n!=1: raise SystemExit('ability collect loop replacement failed')

h=h.replace(" if(player.ability&&performance.now()>=player.abilityUntil){if(player.ability==='invisible')player.invisible=false;player.ability=null}\n",'',1)

# Remove ability pickup drawing loop.
pattern=r"\n for\(const p of abilities\[player\.scene\]\)if\(!p\.taken\)\{.*?\}\n"
h,n=re.subn(pattern,'\n',h,count=1,flags=re.S)
if n!=1: raise SystemExit('ability pickup draw loop replacement failed')

# Invisibility no longer modifies Dad or Libi behavior.
repls={
 "activeDadAbilities.has('chaseSong')&&dadSongPlaying()&&!player.invisible":"activeDadAbilities.has('chaseSong')&&dadSongPlaying()",
 "if(a.homing&&!player.invisible)":"if(a.homing)",
 "if((player.invisible||distToPlayer>430)&&!songPlaying)":"if(distToPlayer>430&&!songPlaying)",
 "const readyToStart=!songPlaying&&!player.invisible&&distToPlayer<210":"const readyToStart=!songPlaying&&distToPlayer<210",
 "if(activeSong&&!player.invisible&&distToPlayer<155)":"if(activeSong&&distToPlayer<155)",
 "ctx.save();ctx.translate(player.x,player.y+bob-lift);ctx.globalAlpha=player.invisible?.35:1;":"ctx.save();ctx.translate(player.x,player.y+bob-lift);ctx.globalAlpha=1;"
}
for old,new in repls.items():
    if h.count(old)!=1: raise SystemExit('expected one occurrence: '+old)
    h=h.replace(old,new,1)

p.write_text(h,encoding='utf-8')
g=p.read_text(encoding='utf-8')

required=['עולם הבית · חקירה חופשית · v0.16','id="jump">קפיצה<br>Space',"if(e.key===' '&&!e.repeat)triggerJump();","const libiDefenseCatalog={jump:{id:'jump',name:'קפיצה'}};"]
for marker in required:
    if marker not in g: raise SystemExit('GREEN missing: '+marker)
for marker in ["id:'speed'","id:'invisible'","player.ability","player.invisible","const abilities=","abilities[player.scene]"]:
    if marker in g: raise SystemExit('GREEN forbidden marker remains: '+marker)

js=g.split('<script>',1)[1].split('</script>',1)[0]
Path('/tmp/crazy-family.js').write_text(js,encoding='utf-8')
subprocess.run(['node','--check','/tmp/crazy-family.js'],check=True)
print('GREEN passed: Libi has no speed/invisibility/powerup abilities; jump is the only explicit ability')
