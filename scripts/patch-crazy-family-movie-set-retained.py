from pathlib import Path

path = Path('crazy-family.html')
html = path.read_text(encoding='utf-8')

html = html.replace(
    "dad:{singing:dad.singing,state:dadHouseState}",
    "dad:{singing:dad.singing||dadSongPlaying(),state:dadHouseState}"
)
html = html.replace(
    "inventory:player.inventory.map(i=>({...i}))},dad:",
    "inventory:player.inventory.map(i=>({...i})),selected:player.selected},dad:"
)

old_damage = "damagePlayer(amount=1,source='movie-set'){player.lives=Math.max(0,player.lives-Math.max(1,Math.round(amount)));player.invulnerableUntil=performance.now()+650;renderLives();return {lives:player.lives,source};}"
new_damage = "damagePlayer(amount=1,source='movie-set'){const now=performance.now();if(now<player.invulnerableUntil)return {lives:player.lives,source,blocked:true};player.lives=Math.max(0,player.lives-Math.max(1,Math.round(amount)));player.invulnerableUntil=now+650;renderLives();return {lives:player.lives,source,blocked:false};}"
html = html.replace(old_damage, new_damage)

buggy_spatial = "setDadSpatial(state){const g=Math.max(0,Math.min(1,Number(state?.gain)??1));"
fixed_spatial = "setDadSpatial(state){const raw=Number(state?.gain),g=Number.isFinite(raw)?Math.max(0,Math.min(1,raw)):1;"
html = html.replace(buggy_spatial, fixed_spatial)

if 'controlsReversed:performance.now()<dizzyUntil' not in html:
    html = html.replace('dizziness:dizzyCharge,scene:player.scene', 'dizziness:dizzyCharge,controlsReversed:performance.now()<dizzyUntil,scene:player.scene')

if 'updateStamina(sprinting,dt)' not in html:
    damage_markers = [
        " damagePlayer(amount=1,source='movie-set'){const now=performance.now();if(now<player.invulnerableUntil)return {lives:player.lives,source,blocked:true};player.lives=Math.max(0,player.lives-Math.max(1,Math.round(amount)));player.invulnerableUntil=now+650;renderLives();return {lives:player.lives,source,blocked:false};},\n",
        " damagePlayer(amount=1,source='movie-set'){player.lives=Math.max(0,player.lives-Math.max(1,Math.round(amount)));player.invulnerableUntil=performance.now()+650;renderLives();return {lives:player.lives,source};},\n",
    ]
    stamina = " updateStamina(sprinting,dt){const step=Math.max(0,Number(dt)||0);if(sprinting&&player.stamina>0)player.stamina=Math.max(0,player.stamina-34*step);else player.stamina=Math.min(100,player.stamina+20*step);return player.stamina;},\n"
    for marker in damage_markers:
        if marker in html:
            html = html.replace(marker, marker + stamina, 1)
            break

old_tick = "tickRetainedSystems(dt){if(Number.isFinite(dt)&&dt>0)updateHouseObjects(Math.min(.05,dt));renderLives();staminaEl.style.width=player.stamina+'%';shieldEl.style.width=player.shield+'%';dizzyMeterEl.style.width=Math.min(100,dizzyCharge)+'%';}"
new_tick = "tickRetainedSystems(dt){const now=performance.now();if(dadHouseState!=='idle'&&now>=dadHouseUntil){dadHouseState='idle';dadSneezeSecondWaveAt=0;}if(Number.isFinite(dt)&&dt>0)updateHouseObjects(Math.min(.05,dt));renderLives();staminaEl.style.width=player.stamina+'%';shieldEl.style.width=player.shield+'%';dizzyMeterEl.style.width=Math.min(100,dizzyCharge)+'%';}"
html = html.replace(old_tick, new_tick)

path.write_text(html, encoding='utf-8')
