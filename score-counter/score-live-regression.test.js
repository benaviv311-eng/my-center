const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = __dirname;
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

const js = read('score-live-patch.js');
const css = read('score-live-patch.css');
const index = read('index.html');

assert(!/score-final-column/.test(js.replace(/remove\(['"]score-final-column['"]\)/g, '')), 'patch must not force the legacy one-column class');
assert(/classList\.remove\(['"]score-final-column['"]\)/.test(js), 'patch must remove the forced one-column class');
assert(/MutationObserver/.test(js), 'patch must keep the layout class from being re-forced after DOM changes');
assert(/--score-width/.test(css) && /syncScoreBoxWidths/.test(js), 'score box width must respond to the rendered score digits');
assert(/bar\.addEventListener\(['"]pointerdown['"]/.test(js), 'timer shell must be draggable without a visible move icon');
assert(!/⠿/.test(js), 'timer must not render the move icon');
assert(!/↘/.test(js), 'timer must not render the resize icon');
assert(/score-timer-resize-zone/.test(js) && /resizePointer/.test(js) && /TIMER_MAX_SCALE/.test(js), 'timer must keep an invisible resize zone');
assert(/\.score-timer-resize-zone/.test(css) && /opacity\s*:\s*0/.test(css), 'resize zone must stay visually hidden');
assert(/score-live-patch\.css\?v=2/.test(index), 'index must load the current patch stylesheet');
assert(/score-live-patch\.js\?v=2/.test(index), 'index must load the current patch script');
assert(index.indexOf('score-live.js?v=9') < index.indexOf('score-live-patch.js?v=2'), 'timer/layout patch must load after score-live.js');
console.log('score-live regression checks passed');
