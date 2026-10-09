const fs=require('fs'),path=require('path');const read=n=>fs.readFileSync(path.join(__dirname,n),'utf8');
const js=read('score-competition-games.js'),css=read('score-competition-games.css'),index=read('index.html');
for(const token of ['Surprise Me','Easy','Extreme','Team Battle','King Rotation','winner stays','Elimination','Redemption','Tournament','Round Robin','Next Match','standings','Forced rotation']) if(!js.includes(token)) throw new Error('missing '+token);
if(!/score-competition-games\.css\?v=1/.test(index)||!/score-competition-games\.js\?v=1/.test(index)) throw new Error('assets not loaded');
console.log('score-competition-games regression checks passed');