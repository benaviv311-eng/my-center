from pathlib import Path
import subprocess

p=Path('crazy-family.html')
h=p.read_text(encoding='utf-8')

old_space="if(e.key===' '&&!e.repeat)triggerDash();"
old_j="if(e.key.toLowerCase()==='j'&&!e.repeat)triggerJump();"
old_dash='דאש<br>Space'
old_jump='קפיצה<br>J'

# RED: prove the requested mapping is not present yet.
assert old_space in h, 'RED setup failed: Space is no longer mapped to dash'
assert old_j in h, 'RED setup failed: J jump mapping missing'
assert "if(e.key===' '&&!e.repeat)triggerJump();" not in h, 'RED failed: Space already jumps'
print('RED confirmed: Space still triggers dash, not jump')

repls=[
 ('עולם הבית · חקירה חופשית · v0.13','עולם הבית · חקירה חופשית · v0.14'),
 (old_dash,'דאש<br>כפתור'),
 (old_jump,'קפיצה<br>Space'),
 (old_space,"if(e.key===' '&&!e.repeat)triggerJump();"),
 (old_j,'')
]
for old,new in repls:
    count=h.count(old)
    if count!=1:
        raise SystemExit(f'expected one occurrence of {old!r}, got {count}')
    h=h.replace(old,new)

p.write_text(h,encoding='utf-8')

# GREEN: verify the final control contract.
g=p.read_text(encoding='utf-8')
checks=[
 'עולם הבית · חקירה חופשית · v0.14',
 'קפיצה<br>Space',
 'דאש<br>כפתור',
 "if(e.key===' '&&!e.repeat)triggerJump();",
 "if(e.key.toLowerCase()==='c'||e.key==='Control')player.crouching=false",
 "document.getElementById('dash').onclick=triggerDash",
 "document.getElementById('jump').onclick=triggerJump"
]
missing=[x for x in checks if x not in g]
if missing:
    raise SystemExit('GREEN failed, missing: '+repr(missing))
if old_space in g or old_j in g:
    raise SystemExit('GREEN failed: old keyboard mappings remain')

# JavaScript syntax check.
js=g.split('<script>',1)[1].split('</script>',1)[0]
Path('/tmp/crazy-family.js').write_text(js,encoding='utf-8')
subprocess.run(['node','--check','/tmp/crazy-family.js'],check=True)
print('GREEN passed: Space jumps, C crouches, dash remains on its button')
