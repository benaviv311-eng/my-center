const fs=require('fs');
const path=require('path');
const assert=require('assert');

const root=__dirname;
const orderPath=path.join(root,'score-leader-order.js');
assert(fs.existsSync(orderPath),'leader ordering script must exist');
const order=require(orderPath);

const sorted=order.sortScoreEntries([
  {id:'a',score:4},
  {id:'b',score:9},
  {id:'c',score:9},
  {id:'d',score:1}
]);
assert.deepStrictEqual(sorted.map(x=>x.id),['b','c','a','d'],'higher scores must move first while equal scores keep their previous order');

const tiedAgain=order.sortScoreEntries([
  {id:'c',score:9},
  {id:'b',score:9},
  {id:'a',score:4}
]);
assert.deepStrictEqual(tiedAgain.map(x=>x.id),['c','b','a'],'ties must preserve the current order rather than restoring an older order');

const source=fs.readFileSync(orderPath,'utf8');
assert(/score-board-source/.test(source) && /score-board-value/.test(source),'ordering must read the live score source with display fallback');
assert(/score-layout-free/.test(source),'free layout must be left untouched');
assert(/appendChild\(entry\.card\)/.test(source),'managed layouts must reorder whole cards in the DOM');
assert(/requestAnimationFrame/.test(source),'reordering must wait until score updates have rendered');

const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert(/score-leader-order\.js\?v=1/.test(index),'index must load the leader-order behavior');
console.log('score leader ordering checks passed');
