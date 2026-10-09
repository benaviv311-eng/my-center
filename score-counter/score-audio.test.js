const fs=require('fs');
const path=require('path');
const assert=require('assert');

const root=__dirname;
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const jsPath=path.join(root,'score-audio.js');
const cssPath=path.join(root,'score-audio.css');

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
assert(/score-audio-layer/.test(css),'three layer controls must have dedicated styling');
assert(/score-audio\.css\?v=3/.test(index),'index must load the three-layer arena audio styles');
assert(/score-audio\.js\?v=3/.test(index),'index must load the three-layer arena audio behavior');

console.log('score arena three-layer audio checks passed');
