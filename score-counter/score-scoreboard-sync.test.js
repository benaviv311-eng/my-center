const fs=require('fs');
const path=require('path');
const root=__dirname;
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const live=read('score-live.js');
const suite=read('score-game-suite.js');
const index=read('index.html');

function has(source,needle,message){
  if(!source.includes(needle)) throw new Error(message);
}

has(live,"scoreboard:scorechange",'scoreboard layer must publish a shared score-change event');
has(live,"scoreDisplay.value=scoreSourceValue()",'visible scoreboard value must resync from the legacy score source');
has(suite,"function scoreNodeValue(node)",'game suite must read scores through an input-aware helper');
has(suite,"node.value",'game suite score reader must support input.value');
has(suite,"scoreboard:scorechange",'game suite must listen to shared scoreboard score changes');
has(index,'score-live.js?v=10','loader must bust the score-live cache after sync fix');
has(index,'score-game-suite.js?v=2','loader must bust the game-suite cache after sync fix');

console.log('scoreboard/game sync regression checks passed');
