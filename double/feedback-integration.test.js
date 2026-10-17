const fs=require('fs');
const path=require('path');
const assert=require('assert');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

const encouragement=read('double/encouragement-bridge.js');
const reaction=read('double/reaction-time-bridge.js');
const launch=read('double/encouragement-launch-bridge.js');
const wrapper=read('double/success-ting.js');
const daily=read('double-daily.html');

assert.match(encouragement,/\.sym,\.symbol/,'adaptive feedback must work with normal and daily/classic symbols');
assert.match(encouragement,/DoubleAdaptiveEncouragement/,'one adaptive feedback owner must be exposed');
assert.match(encouragement,/DoubleSuccessTing/,'wrapper duplicate success ting must be suppressed');
assert.match(encouragement,/addEventListener\('keydown'/,'two-player keyboard success must feed the same system');
assert.match(encouragement,/voiceProfile/,'voice intensity must come from the shared model');
assert.match(encouragement,/PRIORITY_KINDS/,'level, boss and victory announcer moments must survive success filtering');
assert.match(encouragement,/announcerCallout\[data-kind="versusSuccess"\]/,'routine versus success callout must be replaced by adaptive feedback');
assert.match(reaction,/getElementById\('board'\).*getElementById\('cards'\)/s,'reaction timer must support both game boards');
assert.match(reaction,/\.sym,\.symbol/,'reaction timer must support both symbol classes');
assert.match(reaction,/stats\.parentElement\)stats\.parentElement\.appendChild\(badge\)/,'reaction badge must survive stats.innerHTML rerenders');
assert.match(launch,/const V='16'/,'landing feedback assets must use the current cache version');
assert.match(launch,/reaction-time-model\.js/);
assert.match(launch,/reaction-time-bridge\.js/);
assert.match(wrapper,/const V='16'/,'wrapper enhancement bootstrap must use the current cache version');
assert.match(daily,/encouragement-engine\.js\?v=16/,'daily challenge must load adaptive encouragement');
assert.match(daily,/reaction-time-bridge\.js\?v=16/,'daily challenge must show reaction time');

console.log('feedback integration tests OK');
