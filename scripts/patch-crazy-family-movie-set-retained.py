from pathlib import Path

path = Path('crazy-family.html')
html = path.read_text(encoding='utf-8')

html = html.replace(
    "dad:{singing:dad.singing,state:dadHouseState}",
    "dad:{singing:dad.singing||dadSongPlaying(),state:dadHouseState}"
)

old_damage = "damagePlayer(amount=1,source='movie-set'){player.lives=Math.max(0,player.lives-Math.max(1,Math.round(amount)));player.invulnerableUntil=performance.now()+650;renderLives();return {lives:player.lives,source};}"
new_damage = "damagePlayer(amount=1,source='movie-set'){const now=performance.now();if(now<player.invulnerableUntil)return {lives:player.lives,source,blocked:true};player.lives=Math.max(0,player.lives-Math.max(1,Math.round(amount)));player.invulnerableUntil=now+650;renderLives();return {lives:player.lives,source,blocked:false};}"
html = html.replace(old_damage, new_damage)

buggy_spatial = "setDadSpatial(state){const g=Math.max(0,Math.min(1,Number(state?.gain)??1));"
fixed_spatial = "setDadSpatial(state){const raw=Number(state?.gain),g=Number.isFinite(raw)?Math.max(0,Math.min(1,raw)):1;"
html = html.replace(buggy_spatial, fixed_spatial)

if 'controlsReversed:performance.now()<dizzyUntil' not in html:
    html = html.replace('dizziness:dizzyCharge,scene:player.scene', 'dizziness:dizzyCharge,controlsReversed:performance.now()<dizzyUntil,scene:player.scene')

path.write_text(html, encoding='utf-8')
