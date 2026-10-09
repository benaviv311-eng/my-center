const fs=require('fs'),path=require('path');const read=n=>fs.readFileSync(path.join(__dirname,n),'utf8');
const js=read('score-four-team-rotation.js'),css=read('score-four-team-rotation.css'),index=read('index.html');
for(const token of ['HALFTIME','FIRST + FOURTH','SECOND + THIRD','rankAt10','finalRank','Side A','Side B','20']) if(!js.includes(token)) throw new Error('missing '+token);
if(!/firstToTen/.test(js)) throw new Error('midpoint trigger missing');
if(!/style\.order/.test(js)) throw new Error('visual reorder missing');
if(!/score-four-team-rotation\.css\?v=1/.test(index)||!/score-four-team-rotation\.js\?v=1/.test(index)) throw new Error('assets not loaded');
console.log('score-four-team-rotation regression checks passed');