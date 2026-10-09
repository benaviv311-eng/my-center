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
assert(/רשת!/.test(js),'pressure chants must include רשת');
assert(/הוא לא יודע!/.test(js),'pressure chants must include הוא לא יודע');
assert(/בוזזזז/.test(js),'pressure chants must include a long boo chant');
assert(/תחזרו הביתה!/.test(js),'pressure chants must include תחזרו הביתה');
assert(/speechSynthesis/.test(js),'manual and automatic chants must use browser speech synthesis');
assert(/createMusic/.test(js),'audio layer must provide sports background music');
assert(/createCrowd/.test(js),'audio layer must provide continuous crowd ambience');
assert(/startPressure/.test(js),'audio layer must provide pressure mode');
assert(/score-audio-pressure/.test(css),'pressure button must have a dedicated visual style');
assert(/score-audio\.css\?v=1/.test(index),'index must load arena audio styles');
assert(/score-audio\.js\?v=1/.test(index),'index must load arena audio behavior');

console.log('score arena audio checks passed');
