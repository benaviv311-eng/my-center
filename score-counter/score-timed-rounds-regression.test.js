const fs=require('fs');const path=require('path');const read=n=>fs.readFileSync(path.join(__dirname,n),'utf8');
const js=read('score-timed-rounds.js');const css=read('score-timed-rounds.css');const index=read('index.html');
for(const token of ['Timed Rounds','Next:','Round Results','Start now','Add break','Golden Point','tiebreak','winnerBy','reverse','get ready','Time!']) if(!js.includes(token)) throw new Error('missing '+token);
if(!/Date\.now\(\)/.test(js)) throw new Error('wall clock timer missing');
if(!/activeTeam/.test(js)) throw new Error('active team lock missing');
if(!/score-timed-rounds\.css\?v=1/.test(index)||!/score-timed-rounds\.js\?v=1/.test(index)) throw new Error('assets not loaded');
if(!/score-timed-rounds-hud/.test(css)) throw new Error('HUD style missing');
console.log('score-timed-rounds regression checks passed');