const fs=require('fs'),path=require('path');const read=n=>fs.readFileSync(path.join(__dirname,n),'utf8');
const js=read('score-core-games.js'),css=read('score-core-games.css'),index=read('index.html');
for(const token of ['First to X','Win by 2','Best of Sets','Timed Game','Timed + Overtime','Set Point','Match Point','Final set','Overtime','setsWon','winner']) if(!js.includes(token)) throw new Error('missing '+token);
if(!/Date\.now\(\)/.test(js)) throw new Error('timed mode must use wall clock');
if(!/score-core-games\.css\?v=1/.test(index)||!/score-core-games\.js\?v=1/.test(index)) throw new Error('assets not loaded');
console.log('score-core-games regression checks passed');