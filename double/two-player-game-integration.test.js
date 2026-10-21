const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const core=fs.readFileSync(path.join(root,'../double-game-core.html'),'utf8');
const game=fs.readFileSync(path.join(root,'game.js'),'utf8');

const rulesIndex=core.indexOf('double/two-player-mode-rules.js');
const gameIndex=core.indexOf('double/game.js');
if(rulesIndex<0)throw new Error('two-player rules must load in the core game');
if(gameIndex<0)throw new Error('game.js missing from core');
if(rulesIndex>gameIndex)throw new Error('two-player rules must load before game.js');

for(const token of ['deckRoundPairs','knockoutLivesAfterRound','knockoutWinner','suddenWinnerOnWrong','suddenEndsOnCorrect']){
  if(!game.includes(token))throw new Error('game integration missing '+token);
}
if(game.includes("a=versusDeckOrder[0];"))throw new Error('full-deck mode must not keep one anchor card fixed');
if(game.includes("if(versusVariant==='sudden'){endVersusMatch(claim);return true}"))throw new Error('correct sudden-death matches must not end the game');

console.log('two-player game integration OK');
