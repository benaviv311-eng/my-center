const fs=require('fs');
const assert=require('assert');
const index=fs.readFileSync(__dirname+'/index.html','utf8');
['score-timer-v2-core.js?v=1','score-games-core.js?v=1','score-games-ui.js?v=1','score-games.css?v=1'].forEach(x=>assert(index.includes(x),`missing ${x}`));
assert(index.indexOf('score-live-patch.js?v=8') < index.indexOf('score-timer-v2-core.js?v=1'),'V2 timer core must load after existing patch');
assert(index.indexOf('score-timer-v2-core.js?v=1') < index.indexOf('score-games-core.js?v=1'),'timer core must load before game core');
assert(index.indexOf('score-games-core.js?v=1') < index.indexOf('score-games-ui.js?v=1'),'cores must load before V2 UI');
console.log('index v2 contract passed');
