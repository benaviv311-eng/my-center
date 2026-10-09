from pathlib import Path

path = Path('crazy-family.html')
html = path.read_text(encoding='utf-8')

if 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js' not in html:
    head_add = '''\n<style>\n.movie-set-root{position:absolute;inset:0;z-index:3;background:#201b1d;overflow:hidden}.movie-set-root[hidden]{display:none!important}.movie-set-canvas{width:100%;height:100%;display:block;aspect-ratio:auto}.movie-set-unsupported{position:absolute;inset:0;display:grid;place-content:center;text-align:center;padding:28px;background:linear-gradient(145deg,#3b3035,#1f1a1d);color:#fff;font-weight:800;line-height:1.6}.legacy-mode .movie-set-root{display:none!important}\n</style>\n<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js"}}</script>\n'''
    html = html.replace('</head>', head_add + '</head>', 1)

stage_anchor = '<section class="stage">\n        <canvas id="game" width="960" height="600"></canvas>'
if 'id="movieSetRoot"' not in html:
    html = html.replace(stage_anchor, '<section class="stage">\n        <div id="movieSetRoot" class="movie-set-root" aria-live="polite"></div>\n        <canvas id="game" width="960" height="600"></canvas>', 1)

if 'const __crazyFamilyLegacyMode=' not in html:
    html = html.replace('(()=>{\nconst c=', "(()=>{\nconst __crazyFamilyLegacyMode=new URLSearchParams(location.search).get('legacy')==='1';\nconst c=", 1)

if 'window.__crazyFamilyRetainedApi={' not in html:
    start = html.index("addEventListener('keydown'")
    end_marker = 'renderInv();renderFloors();requestAnimationFrame(loop);'
    end = html.index(end_marker, start) + len(end_marker)
    controls = html[start:end]
    api = '''window.__crazyFamilyRetainedApi={\n getSnapshot(){return {player:{lives:player.lives,stamina:player.stamina,shield:player.shield,inventory:player.inventory.map(i=>({...i}))},dad:{singing:dad.singing,state:dadHouseState},dizziness:dizzyCharge,scene:player.scene};},\n setWorldPose(pose){window.__crazyFamilyWorldPose=pose;return true;},\n collectItem(id){const p=(items.ground||[]).find(i=>i.id===id);if(!p||p.taken||player.inventory.length>=player.capacity)return false;p.taken=true;player.inventory.push({id:p.id,name:p.name,icon:p.icon});player.selected=player.inventory.length-1;renderInv();return true;},\n useItem(id){const idx=player.inventory.findIndex(i=>i.id===id);if(idx<0)return false;player.selected=idx;useSelectedItem();return true;},\n damagePlayer(amount=1,source='movie-set'){player.lives=Math.max(0,player.lives-Math.max(1,Math.round(amount)));player.invulnerableUntil=performance.now()+650;renderLives();return {lives:player.lives,source};},\n setDadWorldDistance(distance){window.__crazyFamilyDadWorldDistance=distance;return distance;},\n tickRetainedSystems(dt){if(Number.isFinite(dt)&&dt>0)updateHouseObjects(Math.min(.05,dt));renderLives();staminaEl.style.width=player.stamina+'%';shieldEl.style.width=player.shield+'%';dizzyMeterEl.style.width=Math.min(100,dizzyCharge)+'%';}\n};\nif(__crazyFamilyLegacyMode){\n'''
    html = html[:start] + api + controls + '\n}else{renderInv();renderFloors();}\n' + html[end:]

if 'setDadSpatial(state)' not in html and 'setDadWorldDistance(distance)' in html:
    needle = " setDadWorldDistance(distance){window.__crazyFamilyDadWorldDistance=distance;return distance;},\n"
    bridge = """ setDadSpatial(state){const g=Math.max(0,Math.min(1,Number(state?.gain)??1));dadVoiceClips.forEach(a=>a.volume=Math.min(1,.96*g));dadPreClips.forEach(a=>a.volume=Math.min(1,.92*g));dadHouseAudioClips.forEach(a=>a.volume=Math.min(1,.92*g));return g;},\n startDadSong(){if(dadSongPlaying())return true;startDadSongClip();return true;},\n dadSongIsPlaying(){return dadSongPlaying();},\n playDadPreForMovieSet(index){playDadPre(Math.max(0,Math.min(dadPreClips.length-1,index|0)));return true;},\n triggerDadHouseState(state){if(!['pant','yawn','sneeze'].includes(state))return false;setDadHouseState(state,0,performance.now());return true;},\n"""
    html = html.replace(needle, needle + bridge, 1)

if 'crazy-family/bootstrap.js' not in html:
    module = '''\n<!-- Movie-set runtime is default. Explicit rollback only: ?legacy=1 -->\n<script type="module">\nimport { shouldUseLegacy, bootCrazyFamily, renderUnsupported } from './crazy-family/bootstrap.js';\nimport { createLegacyAdapter } from './crazy-family/legacy-adapter.js';\nconst movieSetRoot=document.getElementById('movieSetRoot');\nif(shouldUseLegacy(location.search)){document.body.classList.add('legacy-mode');movieSetRoot.hidden=true;}else{\n document.body.classList.add('movie-set-mode');\n const legacyCanvas=document.getElementById('game');if(legacyCanvas)legacyCanvas.hidden=true;\n const legacyAdapter=createLegacyAdapter(window);\n bootCrazyFamily({root:movieSetRoot,legacyAdapter}).catch(error=>renderUnsupported(movieSetRoot,error));\n}\n</script>\n'''
    html = html.replace('</body>', module + '</body>', 1)

path.write_text(html, encoding='utf-8')
