const fs=require('fs');
const path=require('path');
const assert=require('assert');

const root=__dirname;
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const jsPath=path.join(root,'score-audio.js');
const cssPath=path.join(root,'score-audio.css');
const habaitaPath=path.join(root,'score-habaita-refrain.js');

assert(fs.existsSync(jsPath),'arena audio behavior must exist');
assert(fs.existsSync(cssPath),'arena audio controls stylesheet must exist');

const js=fs.readFileSync(jsPath,'utf8');
const css=fs.readFileSync(cssPath,'utf8');

assert(/PRESSURE_DURATION_MS\s*=\s*15000/.test(js),'pressure mode must run for 15 seconds');
assert(/רשת!/.test(js),'chants must include רשת');
assert(/הוא לא יודע!/.test(js),'chants must include הוא לא יודע');
assert(/בוזזזז/.test(js),'chants must include a long boo chant');
assert(/תחזרו הביתה!/.test(js),'chants must include תחזרו הביתה');
assert(!/speechSynthesis/.test(js),'live arena mode must not use browser robot speech');
assert(/ARENA_ASSETS/.test(js),'arena audio must use recorded/generated audio assets');
assert(/chants/.test(js) && /anthems/.test(js) && /noise/.test(js),'audio engine must expose chants, anthems and noise layers');
assert(/layerMarkup\(['"]chants['"]/.test(js),'panel must expose a chants layer');
assert(/layerMarkup\(['"]anthems['"]/.test(js),'panel must expose an anthems layer');
assert(/layerMarkup\(['"]noise['"]/.test(js),'panel must expose a noise layer');
assert(/setLayerVolume/.test(js),'each sound layer must have its own volume control');
assert(/toggleLayer/.test(js),'each sound layer must have its own on/off control');
assert(/playChant/.test(js),'chant buttons must trigger recorded crowd calls');
assert(/startPressure/.test(js),'audio layer must preserve 15-second pressure mode');
assert(/pressureMix/.test(js),'pressure mode must intensify the three layers together');
assert(/audio\/chants\//.test(js),'chant layer must point at permanent local audio files');
assert(/audio\/anthems\//.test(js),'anthem layer must point at permanent local audio files');
assert(/audio\/noise\//.test(js),'noise layer must point at permanent local audio files');

assert(/LIVE_CHANT_MIN_MS\s*=\s*8000/.test(js),'live arena chants must use an 8 second minimum random gap');
assert(/LIVE_CHANT_MAX_MS\s*=\s*25000/.test(js),'live arena chants must use a 25 second maximum random gap');
assert(/LIVE_NOISE_MIN_MS\s*=\s*40000/.test(js),'live arena noise must stay natural for at least 40 seconds');
assert(/LIVE_NOISE_MAX_MS\s*=\s*90000/.test(js),'live arena noise must shift by 90 seconds at the latest');
assert(/startLiveMode/.test(js) && /stopLiveMode/.test(js),'panel must support an endless live arena mode');
assert(/scheduleLiveChant/.test(js),'live arena must schedule chants repeatedly');
assert(/scheduleLiveNoiseShift/.test(js),'live arena must schedule crowd-bed changes repeatedly');
assert(/randomDelay/.test(js),'live arena timing must be randomized rather than fixed');
assert(/lastLiveChant/.test(js),'live arena must avoid repeating the same chant immediately');
assert(/crossfadeNoise/.test(js),'crowd-bed changes must crossfade instead of hard cutting');
assert(/liveIntensity/.test(js),'live arena must expose a global atmosphere intensity');
assert(/data-live-intensity/.test(js),'panel must render the atmosphere intensity slider');
assert(/score-audio-live/.test(css),'endless live mode must have a dedicated visual control');
assert(/score-audio-eq/.test(css),'audio console must show a live equalizer');
assert(/score-audio-now-playing/.test(css),'audio console must show now-playing information');
assert(/data-now-playing/.test(js),'audio console must render now-playing information');

assert(/RHYTHMIC_CHANT_MIN_REPEATS\s*=\s*2/.test(js),'live chants must repeat at least twice for a rhythmic terrace feel');
assert(/RHYTHMIC_CHANT_MAX_REPEATS\s*=\s*4/.test(js),'live chants must support up to four rhythmic hits');
assert(/playRhythmicChant/.test(js),'live mode must turn recorded calls into rhythmic chant patterns');
assert(/CHANT_LIVE_BOOST\s*=\s*1\.28/.test(js),'live chants must receive a strong dedicated gain boost');
assert(/CHANT_ANTHEM_DUCK\s*=\s*0\.22/.test(js),'anthem must duck hard while a chant cuts through');
assert(/CHANT_NOISE_DUCK\s*=\s*0\.56/.test(js),'crowd bed must duck while a chant cuts through');
assert(/LIVE_REFRAIN_MIN_MS\s*=\s*12000/.test(js),'live arena must bring refrains back regularly');
assert(/LIVE_REFRAIN_MAX_MS\s*=\s*28000/.test(js),'live arena refrains must not disappear for too long');
assert(/liveRefrainTimer/.test(js),'live arena must track its refrain schedule');
assert(/scheduleLiveRefrain/.test(js),'live arena must schedule terrace refrains between calls');

assert(fs.existsSync(habaitaPath),'approved habaita refrain module must exist');
const habaita=fs.readFileSync(habaitaPath,'utf8');
assert(/HABAITA_LABEL\s*=\s*['"]הביתה! הביתה! הביתה!['"]/.test(habaita),'habaita refrain must use the approved words');
assert(/playHabaitaRefrain/.test(habaita),'habaita refrain must have a dedicated playback routine');
assert(/scheduleHabaitaRefrain/.test(habaita),'habaita refrain must enter live arena automatically');
assert(/tachzeru-deep\.mp3/.test(habaita) && /tachzeru-young\.mp3/.test(habaita) && /tachzeru-sharp\.mp3/.test(habaita),'habaita refrain must build a crowd from multiple permanent local voices');
assert(/source\.start\([^;]*offset[^;]*duration/.test(habaita),'habaita refrain must isolate the final word from the local recordings');
assert(/playKick/.test(habaita) && /playClap/.test(habaita),'habaita refrain must include terrace drum and clap rhythm');
assert(/MutationObserver/.test(habaita),'habaita refrain must follow live-mode and pressure state changes');
assert(!/_jwt=/.test(habaita),'habaita refrain must not depend on expiring signed audio URLs');
assert(/score-habaita-refrain\.js\?v=1/.test(index),'index must load the durable habaita refrain module');
assert(/score-audio\.css\?v=4/.test(index),'index must keep loading the live-arena audio styles');
assert(/score-audio\.js\?v=5/.test(index),'index must keep loading the rhythmic live-arena engine');

console.log('score arena rhythmic chants and habaita refrain checks passed');
