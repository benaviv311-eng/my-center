const assert=require('assert');
const R=require('./two-player-mode-rules.js');

assert.equal(R.defaultVariant(),'deck');
assert.deepEqual(R.orderVariants(['duel','deck','knockout']),['deck','duel','knockout']);
assert.equal(R.labelFor('deck'),'רגיל · חפיסה מלאה');
assert.equal(R.labelFor('duel'),'מרוץ ל־10');

const order=Array.from({length:57},(_,i)=>i);
const pairs=R.deckRoundPairs(order);
assert.equal(pairs.length,56,'full-deck mode must play 56 adjacent matchups');
assert.deepEqual(pairs[0],[0,1]);
assert.deepEqual(pairs[1],[1,2],'both visible cards should evolve instead of keeping one fixed anchor');
assert.deepEqual(pairs[55],[55,56]);
assert.equal(new Set(pairs.flat()).size,57,'all 57 cards must participate');

assert.deepEqual(R.knockoutLivesAfterRound([3,3],0),[3,2],'round loser loses one life');
assert.deepEqual(R.knockoutLivesAfterRound([1,3],1),[0,3],'player 1 can be knocked out');
assert.equal(R.knockoutWinner([0,2]),1);
assert.equal(R.knockoutWinner([2,0]),0);
assert.equal(R.knockoutWinner([2,1]),null);

assert.equal(R.suddenWinnerOnWrong(0),1,'player 1 mistake gives player 2 the match');
assert.equal(R.suddenWinnerOnWrong(1),0,'player 2 mistake gives player 1 the match');
assert.equal(R.suddenEndsOnCorrect(),false,'a correct answer should advance sudden-death play, not end the match');

console.log('two-player mode rules OK');
