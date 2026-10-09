const fs=require('fs'),path=require('path');const read=n=>fs.readFileSync(path.join(__dirname,n),'utf8');
const js=read('score-training-games.js'),css=read('score-training-games.css'),index=read('index.html');
for(const token of ['Target Chase','Streak Challenge','Comeback Challenge','Sideout Challenge','Serve Pressure','Training Mode','Race / Challenge','Countdown Target','Weighted Drill','Sideout successful','Serve error','Target reached','Streak broken','Perfect','Playable']) if(!js.includes(token)) throw new Error('missing '+token);
if(!/Date\.now\(\)/.test(js)) throw new Error('timed challenges must use wall clock');
if(!/score-training-games\.css\?v=1/.test(index)||!/score-training-games\.js\?v=1/.test(index)) throw new Error('assets not loaded');
console.log('score-training-games regression checks passed');