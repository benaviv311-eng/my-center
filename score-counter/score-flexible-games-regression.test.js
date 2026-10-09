const fs=require('fs'),path=require('path');const read=n=>fs.readFileSync(path.join(__dirname,n),'utf8');
const js=read('score-flexible-games.js'),css=read('score-flexible-games.css'),index=read('index.html');
for(const token of ['Custom Game Builder','Save Game','Win by 2','Bonus','Penalty','Player Tracking','Serve','Reception','Attack','Block','Error','Player of the Game','Multi-Team','Individual Challenge','Personal record','Saved custom games']) if(!js.includes(token)) throw new Error('missing '+token);
if(!/score-flexible-games\.css\?v=1/.test(index)||!/score-flexible-games\.js\?v=1/.test(index)) throw new Error('assets not loaded');
console.log('score-flexible-games regression checks passed');