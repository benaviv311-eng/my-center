const assert=require('assert');
const R=require('./two-player-mode-rules.js');
assert.equal(R.defaultVariant(),'deck');
assert.deepEqual(R.orderVariants(['duel','deck','knockout']),['deck','duel','knockout']);
assert.equal(R.labelFor('deck'),'רגיל · חפיסה מלאה');
assert.equal(R.labelFor('duel'),'מרוץ ל־10');
console.log('two-player mode rules OK');
