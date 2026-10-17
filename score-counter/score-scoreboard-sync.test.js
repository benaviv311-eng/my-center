const fs=require('fs');
const path=require('path');
const root=__dirname;
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const bridge=read('score-scoreboard-sync.js');
const index=read('index.html');

function has(source,needle,message){
  if(!source.includes(needle)) throw new Error(message);
}

has(bridge,"const EVENT='scoreboard:scorechange'",'bridge must publish one shared score-change event');
has(bridge,"Object.defineProperty(display,'textContent'",'legacy game readers must see the visible input value through textContent');
has(bridge,'syncDisplayFromSource','game/button changes must flow back into the visible scoreboard');
has(bridge,'syncSourceFromDisplay','manual scoreboard edits must flow back into the legacy score source');
has(bridge,".score-board-plus,.score-board-minus,.score-card-mega",'bridge must observe all scoring controls');
has(bridge,'.score-suite-live-team','shared score changes must update the active game view too');
has(index,'score-scoreboard-sync.js?v=1','loader must include the scoreboard/game bridge');

console.log('scoreboard/game sync regression checks passed');
