const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = __dirname;
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const index = read('index.html');
const suite = read('score-game-suite.js');

assert(fs.existsSync(path.join(root, 'score-test-lab.js')), 'test lab script must exist');
assert(fs.existsSync(path.join(root, 'score-test-lab.css')), 'test lab stylesheet must exist');

const lab = read('score-test-lab.js');
const css = read('score-test-lab.css');
const modeIds = [...suite.matchAll(/\['([a-z0-9-]+)','[^']+'/g)].map(m => m[1]);
const missingFromLab = modeIds.filter(id => !lab.includes(`'${id}'`) && !lab.includes(`"${id}"`));
assert.deepStrictEqual(missingFromLab, [], 'every game mode must appear in the test lab status map');

assert(/score-test-lab\.css\?v=1/.test(index), 'index must load the test lab stylesheet');
assert(/score-test-lab\.js\?v=1/.test(index), 'index must load the test lab script');
assert(/🧪/.test(lab) && /בדיקות/.test(lab), 'test lab must have a clear Hebrew launcher');
assert(/data-lab-test/.test(lab), 'every lab item must expose a direct TEST action');
assert(/working/.test(lab) && /partial/.test(lab) && /missing/.test(lab), 'lab must expose working, partial, and missing statuses');
assert(/applyDemo/.test(lab), 'lab must be able to inject demo values for repeatable checks');
assert(/Timed Rounds/.test(lab) && /Pressure Game/.test(lab) && /שפיגל/.test(lab) && /4 Teams Rotation/.test(lab), 'priority game checks must be visible');
assert(/window\.TeamScoreTestLab/.test(lab), 'test lab must expose an inspection API');
assert(/score-test-lab-panel/.test(css), 'test lab must have an isolated panel style');

console.log('score test lab regression checks passed');
