const assert=require('assert');
const games=require('./score-custom-rules-v2.js');

(function customGameUsesSavedNameAndTarget(){
  let g=games.createGame('custom',{teams:['A','B'],name:'Pressure Serve 60',target:3,winBy2:false,rules:{point:1,bonus:2,penalty:-1},customWinCondition:'target'});
  assert.equal(g.definition.name,'Pressure Serve 60');
  assert.equal(g.settings.target,3);
  g=games.applyAction(g,0,'bonus');
  assert.equal(g.teams[0].score,2);
  g=games.applyAction(g,0,'point');
  assert.equal(g.finished,true);
  assert.equal(g.winnerId,g.teams[0].id);
})();

(function customWinByTwoExtendsPastTarget(){
  let g=games.createGame('custom',{teams:['A','B'],target:2,winBy2:true,rules:{point:1},customWinCondition:'target'});
  g=games.applyScore(g,0,1);g=games.applyScore(g,1,1);g=games.applyScore(g,0,1);
  assert.equal(g.teams[0].score,2);
  assert.equal(g.teams[1].score,1);
  assert.equal(g.finished,false);
  g=games.applyScore(g,0,1);
  assert.equal(g.finished,true);
  assert.equal(g.winnerId,g.teams[0].id);
})();

console.log('score-custom-rules-v2 tests passed');
