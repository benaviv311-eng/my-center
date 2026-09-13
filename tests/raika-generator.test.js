const test=require('node:test');
const assert=require('node:assert/strict');
const {buildInteractionPrompt}=require('../raika-generator-core.js');
const {buildEmotionPrompt}=require('../raika-generator-emotion.js');
const {generatedProposal}=require('../raika-generator-proposal.js');

test('two characters builds interaction request',()=>{const p=buildInteractionPrompt('ראיקה','אוקנה','מתח');assert.match(p,/ראיקה/);assert.match(p,/אוקנה/);});
test('character emotion builds scene request',()=>{const p=buildEmotionPrompt('ראיקה','קנאה');assert.match(p,/ראיקה/);assert.match(p,/קנאה/);});
test('generated proposal always starts as idea',()=>{const x=generatedProposal({mode:'emotion',title:'בדיקה',text:'תוכן',characters:['raika']});assert.equal(x.status,'idea');assert.equal(x.type,'idea');});
