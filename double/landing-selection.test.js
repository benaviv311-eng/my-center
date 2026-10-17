const assert=require('assert');
const S=require('./landing-selection.js');
assert.equal(S.previewKey({mode:'classic'}),'classic');
assert.deepEqual(S.classicPreview(),{
  title:'קלאסי מהיר',
  sub:'20 התאמות · הזמן המהיר ביותר',
  targetLabel:'יעד',
  targetValue:'20',
  timeLabel:'ללא הגבלה',
  timeValue:'∞',
  extra:'20 התאמות · הכי מהר שאפשר'
});
console.log('landing selection classic preview OK');
