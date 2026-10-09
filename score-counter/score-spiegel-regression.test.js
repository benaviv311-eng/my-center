const fs=require('fs'),path=require('path');const read=n=>fs.readFileSync(path.join(__dirname,n),'utf8');
const js=read('score-spiegel.js'),css=read('score-spiegel.css'),index=read('index.html');
for(const token of ['Now Playing','Next','Final Duel','Reception error','Ball dropped','Double contact','Net error','Serve error','Restore','Most Improved','long press','bad point','Final life']) if(!js.includes(token)) throw new Error('missing '+token);
if(!/draggable/.test(js)) throw new Error('drag reorder missing');
if(!/bestCleanStreak/.test(js)||!/riskCount/.test(js)) throw new Error('player stats missing');
if(!/score-spiegel\.css\?v=1/.test(index)||!/score-spiegel\.js\?v=1/.test(index)) throw new Error('assets not loaded');
console.log('score-spiegel regression checks passed');