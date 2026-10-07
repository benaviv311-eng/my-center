const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = __dirname;
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

const js = read('score-live-patch.js');
const css = read('score-live-patch.css');
const leader = read('score-leader-top.js');
const index = read('index.html');

assert(!/score-final-column/.test(js.replace(/remove\(['"]score-final-column['"]\)/g, '')), 'patch must not force the legacy one-column class');
assert(/classList\.remove\(['"]score-final-column['"]\)/.test(js), 'patch must remove the forced one-column class');
assert(/--score-width/.test(css) && /syncScoreBoxWidths/.test(js), 'score box width must respond to the rendered score digits');
assert(/bar\.addEventListener\(['"]pointerdown['"]/.test(js), 'timer shell must be draggable without a visible move icon');
assert(!/⠿/.test(js), 'timer must not render the move icon');
assert(!/↘/.test(js), 'timer must not render the resize icon');
assert(/score-timer-resize-zone/.test(js) && /resizePointer/.test(js) && /TIMER_MAX_SCALE/.test(js), 'timer must keep an invisible resize zone');
assert(/\.score-timer-resize-zone/.test(css) && /opacity\s*:\s*0/.test(css), 'resize zone must stay visually hidden');
assert(/smallestMatch/.test(js) && /TeamScore/.test(js) && /ספירת נקודות לקבוצות/.test(js), 'header offset must find nested title/subtitle text');
assert(/score-header-shift-left/.test(js) && /\.score-header-shift-left/.test(css) && /left:-24px/.test(css), 'mobile header text must visibly move 24px left');
assert(!/timerObserver/.test(js) && !/scoreObserver/.test(js), 'patch must not run whole-page observers after interactions');
assert(!/MutationObserver/.test(leader), 'leader banner must not use a whole-page mutation observer');
assert(/document\.addEventListener\(['"]click['"]/.test(leader), 'leader banner may refresh only after direct interactions');
assert(/position','fixed'/.test(leader) && /top','0px'/.test(leader), 'leader banner must stay pinned to the top');
assert(/score-live-patch\.css\?v=4/.test(index), 'index must load the current patch stylesheet');
assert(/score-live-patch\.js\?v=4/.test(index), 'index must load the current patch script');
assert(/score-leader-top\.js\?v=2/.test(index), 'index must load the lightweight leader script');
assert(index.indexOf('score-live.js?v=9') < index.indexOf('score-live-patch.js?v=4'), 'timer/layout patch must load after score-live.js');
console.log('score-live regression checks passed');
