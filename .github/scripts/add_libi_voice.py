from pathlib import Path
from urllib.request import urlretrieve
import subprocess

html_path=Path('crazy-family.html')
h=html_path.read_text(encoding='utf-8')

assert 'עולם הבית · חקירה חופשית · v0.20' in h, 'expected v0.20 before Libi voice patch'
assert 'const libiVoiceClips=' not in h, 'Libi voice already present'

assets=Path('assets/crazy-family/audio')
assets.mkdir(parents=True,exist_ok=True)
urls=[
'https://dnznrvs05pmza.cloudfront.net/text_to_speech/b9b9f3d3-89b9-46f7-b5c4-ed6aae4a44dd/Libi___________.mp3?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiMmY1MGFkNGMyMWI0MDI4ZSIsImJ1Y2tldCI6InJ1bndheS10YXNrLWFydGlmYWN0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MTIxNzk5Nn0.gMH7nAOzGcHU1teiIul_TKzUs5ZeiqM7OvsbvN3MAtg',
'https://dnznrvs05pmza.cloudfront.net/text_to_speech/4151f627-2d34-4269-8cb1-47ff67b69161/Libi______________.mp3?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiMzA5Mzc3OGQzZWMzYTg1MyIsImJ1Y2tldCI6InJ1bndheS10YXNrLWFydGlmYWN0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MTIwNDM2NX0.bgocANf4GIsrr8J6MIEuJDC2KAk27LVQbGri8j_2f1c',
'https://dnznrvs05pmza.cloudfront.net/text_to_speech/ce0017ff-4776-462d-8cd9-9ee78421c70c/Libi_________.mp3?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiNTYwZmExZmI1YWU1OGU3ZiIsImJ1Y2tldCI6InJ1bndheS10YXNrLWFydGlmYWN0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MTE5MzA4M30.80FMUpgYTDmI-jFp-ycyqoZBDuFbNXo1I7N4s-XZYDk',
'https://dnznrvs05pmza.cloudfront.net/text_to_speech/93339a52-ee88-450f-a4e9-6e42d0062d65/Libi_________.mp3?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiNDI1MzgwM2FhZmJmMTI5NiIsImJ1Y2tldCI6InJ1bndheS10YXNrLWFydGlmYWN0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MTE4MTM3MH0.F9ViJUQTFM_377WZ9In_sGzPNF_WyOxy_s8wtSmmu64',
'https://dnznrvs05pmza.cloudfront.net/text_to_speech/165a752a-fa54-4837-9695-a548a47b297c/Libi________.mp3?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiNmIwYTAwODk3ZTk3MjJiZSIsImJ1Y2tldCI6InJ1bndheS10YXNrLWFydGlmYWN0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MTE1MjAwOX0.udyHpQDMG-kOo1Ey0thE8qJuygIQE9xxSCBKzi8ogUs',
'https://dnznrvs05pmza.cloudfront.net/text_to_speech/8175f600-f6ca-4aee-8a52-aed784a74eab/Libi_________.mp3?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiYTlhNjJlMmM1ZmJiYzg5NCIsImJ1Y2tldCI6InJ1bndheS10YXNrLWFydGlmYWN0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MTIwOTkwMH0.iV7ULp7a1ggeyjza-QtCHPhYQ0_J3XMt45c0JWGR6-c',
'https://dnznrvs05pmza.cloudfront.net/text_to_speech/3c779c39-cb8a-4dc4-a8c4-0c3e74325b3c/Libi__________.mp3?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiNmFlZTNhNjc4YjliN2U2YyIsImJ1Y2tldCI6InJ1bndheS10YXNrLWFydGlmYWN0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MTE0NjIxNX0.ooqDTSAwogFesKQZ3lQLc_S5oqy3ihW6KevfJF6le_g',
'https://dnznrvs05pmza.cloudfront.net/text_to_speech/72046d65-db83-464a-bff6-e9f61f1258bb/Libi_________________.mp3?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiMWFhZDg2MDU2MDhjYWQ2MCIsImJ1Y2tldCI6InJ1bndheS10YXNrLWFydGlmYWN0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MTE4NjA1M30.1SOv43UfsfLFJH6pWlFNdoQHd_qglARLEV7nKUF5lOs',
'https://dnznrvs05pmza.cloudfront.net/text_to_speech/3a298df9-01d5-48e9-9616-f6ea78a76833/Libi____________.mp3?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiYzMzMTczN2RiZDQxYzZmOCIsImJ1Y2tldCI6InJ1bndheS10YXNrLWFydGlmYWN0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MTIyMzU0OX0.s299RWiiFh5WYos3-Gxg-Cq8U9nxR3GNob5RVN7RtJI',
'https://dnznrvs05pmza.cloudfront.net/text_to_speech/989ac7b8-4ff4-45bd-8031-cd922a1691a0/Libi_______.mp3?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiMzkzYzk5NzA1NmJjMDkzZiIsImJ1Y2tldCI6InJ1bndheS10YXNrLWFydGlmYWN0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MTE4MTU1Mn0.qrTU9wCQilWep7hybLjIEGpgVRbSH5s_4lEGkn6aNBg',
'https://dnznrvs05pmza.cloudfront.net/text_to_speech/4120158f-441e-4069-894f-15c326e357f0/Libi________.mp3?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiYWVjZmVjZDdiNGY1MzdmMyIsImJ1Y2tldCI6InJ1bndheS10YXNrLWFydGlmYWN0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MTE3MjU2N30.PRogAuV-7a_ToN3tDEsYGEu0p-qPYLWtlE2JBP85xmo',
'https://dnznrvs05pmza.cloudfront.net/text_to_speech/f917518b-24a8-4a54-bda9-bfa0ea1bb103/Libi___________.mp3?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiZDA1OTM5MjhhOTE3ZjFlOCIsImJ1Y2tldCI6InJ1bndheS10YXNrLWFydGlmYWN0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MTE4MTg2NH0.qz5Wwyt50afZn_CfOSeprPPwDid0nl3MJ-cgxAU1HAg'
]

for i,url in enumerate(urls,1):
    dst=assets/f'libi-{i:02d}.mp3'
    if not dst.exists() or dst.stat().st_size<1000:
        urlretrieve(url,dst)
    assert dst.stat().st_size>1000, f'audio download failed: {dst}'

h=h.replace('עולם הבית · חקירה חופשית · v0.20','עולם הבית · חקירה חופשית · v0.21',1)

old="let dadWasSinging=false,dadClipIndex=-1,dadEncounterStage=0,dadSongStartAt=0,lastPreAt=0,dadPreAudio=null,nextFarChatterAt=0,dadSongAudio=null,farChatterBag=[],lastFarChatter=-1;"
new=old+"\nlet libiVoiceAudio=null,libiVoiceTier='',libiVoiceNextAt=0,libiVoiceLast={normal:-1,annoyed:-1,panic:-1};\nconst libiVoiceClips={\n normal:[1,2,3,4].map(i=>new Audio(`assets/crazy-family/audio/libi-${String(i).padStart(2,'0')}.mp3`)),\n annoyed:[5,6,7,8].map(i=>new Audio(`assets/crazy-family/audio/libi-${String(i).padStart(2,'0')}.mp3`)),\n panic:[9,10,11,12].map(i=>new Audio(`assets/crazy-family/audio/libi-${String(i).padStart(2,'0')}.mp3`))\n};\nObject.values(libiVoiceClips).flat().forEach(a=>{a.preload='auto';a.volume=.94});\nfunction libiVoicePlaying(){return !!(libiVoiceAudio&&!libiVoiceAudio.paused&&!libiVoiceAudio.ended)}\nfunction stopLibiVoice(){if(!libiVoiceAudio)return;try{libiVoiceAudio.pause();libiVoiceAudio.currentTime=0}catch(e){}libiVoiceAudio=null;if(!dadPrePlaying()&&!dadSongPlaying())setBgDuck(false)}\nfunction playLibiVoice(tier){\n const arr=libiVoiceClips[tier];if(!arr||!arr.length||libiVoicePlaying()||dadPrePlaying()||dadSongPlaying())return false;\n let choices=arr.map((_,i)=>i).filter(i=>i!==libiVoiceLast[tier]);if(!choices.length)choices=arr.map((_,i)=>i);\n const idx=choices[Math.floor(Math.random()*choices.length)],a=arr[idx];libiVoiceLast[tier]=idx;libiVoiceAudio=a;a.currentTime=0;setBgDuck(true);\n a.onended=()=>{if(libiVoiceAudio===a)libiVoiceAudio=null;if(!dadPrePlaying()&&!dadSongPlaying())setBgDuck(false)};\n a.play().catch(()=>{if(libiVoiceAudio===a)libiVoiceAudio=null});return true\n}\nfunction updateLibiDadVoice(dist,now){\n const tier=dist<180?'panic':dist<300?'annoyed':dist<430?'normal':'';\n if(!tier){libiVoiceTier='';libiVoiceNextAt=0;return}\n if(tier!==libiVoiceTier){libiVoiceTier=tier;libiVoiceNextAt=now+(tier==='panic'?550:950)+Math.random()*650}\n if(now<libiVoiceNextAt||libiVoicePlaying()||dadPrePlaying()||dadSongPlaying())return;\n if(playLibiVoice(tier)){const base=tier==='panic'?5200:tier==='annoyed'?7200:9000;libiVoiceNextAt=now+base+Math.random()*2600}\n}"
assert h.count(old)==1
h=h.replace(old,new,1)

old_prime="const clips=[...dadVoiceClips,...dadPreClips];"
new_prime="const clips=[...dadVoiceClips,...dadPreClips,...Object.values(libiVoiceClips).flat()];"
assert h.count(old_prime)==1
h=h.replace(old_prime,new_prime,1)

old_leave="dadEncounterStage=0;dadSongStartAt=0;nextFarChatterAt=0;stopDadPre();"
new_leave="dadEncounterStage=0;dadSongStartAt=0;nextFarChatterAt=0;libiVoiceTier='';libiVoiceNextAt=0;stopDadPre();stopLibiVoice();"
assert h.count(old_leave)==1
h=h.replace(old_leave,new_leave,1)

old_dist="const distToPlayer=Math.hypot(player.x-dad.x,player.y-dad.y);"
new_dist=old_dist+"\n updateLibiDadVoice(distToPlayer,now);"
assert h.count(old_dist)==1
h=h.replace(old_dist,new_dist,1)

old_sidebar='<strong>מוזיקת רקע:</strong> מוזיקת המשחק נחלשת אוטומטית כשהאבא מתחיל לשיר.'
new_sidebar='<strong>קול ליבי:</strong> לליבי יש עכשיו תגובות קוליות קצרות רק מול אבא. כשהוא רחוק יחסית היא מגיבה ברוגע, כשהוא מתקרב היא נעשית חסרת סבלנות, וכשהוא ממש קרוב היא נכנסת ללחץ. המשפטים נבחרים באקראי בלי חזרה מיידית ולא עולים על הדיבור או השיר של אבא.<br><strong>מוזיקת רקע:</strong> מוזיקת המשחק נחלשת אוטומטית כשאבא או ליבי מדברים.'
assert h.count(old_sidebar)==1
h=h.replace(old_sidebar,new_sidebar,1)

html_path.write_text(h,encoding='utf-8')

g=html_path.read_text(encoding='utf-8')
required=[
'עולם הבית · חקירה חופשית · v0.21',
'const libiVoiceClips=',
"normal:[1,2,3,4]",
"annoyed:[5,6,7,8]",
"panic:[9,10,11,12]",
'function updateLibiDadVoice(dist,now)',
'updateLibiDadVoice(distToPlayer,now);',
'...Object.values(libiVoiceClips).flat()',
'<strong>קול ליבי:</strong>'
]
missing=[x for x in required if x not in g]
assert not missing, missing
for i in range(1,13):
    assert (assets/f'libi-{i:02d}.mp3').stat().st_size>1000

js=g.split('<script>',1)[1].split('</script>',1)[0]
Path('/tmp/crazy-family.js').write_text(js,encoding='utf-8')
subprocess.run(['node','--check','/tmp/crazy-family.js'],check=True)
print('GREEN passed: Libi voice clips downloaded, integrated by Dad distance tiers, and JS syntax is valid')
