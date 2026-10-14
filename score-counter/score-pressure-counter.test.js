const assert=require('assert');
const mod=require('./score-pressure-counter.js');

const markup=mod.buildCounterMarkup([
  {name:'Brenner',score:22},
  {name:'Rehovot',score:23}
]);
assert(markup.includes('Brenner'));
assert(markup.includes('Rehovot'));
assert(markup.includes('data-pressure-delta="1"'));
assert(markup.includes('data-pressure-delta="-1"'));
assert(markup.includes('score-pressure-counter-a'));
assert(markup.includes('score-pressure-counter-b'));

const p=mod.computePlacement(
  {left:250,right:750,top:0,bottom:900},
  {left:300,right:700,top:360,bottom:600,width:400,height:240}
);
assert.deepStrictEqual(p,{left:300,width:400,top:360,height:240});

console.log('pressure counter tests passed');