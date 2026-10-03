const assert = require('node:assert/strict');
const { patternFor } = require('../success-ting.js');

assert.deepEqual(patternFor('normal').map(n => n.frequency), [1760, 2349]);
assert.deepEqual(patternFor('combo').map(n => n.frequency), [1760, 2349, 3136]);
assert.deepEqual(patternFor('gold').map(n => n.frequency), [2093, 2637, 3136, 4186]);
assert.deepEqual(patternFor('win').map(n => n.frequency), [2093, 2637, 3136, 4186, 5274]);
console.log('success-ting tests passed');
