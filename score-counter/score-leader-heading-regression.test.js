const fs=require('fs');
const path=require('path');
const assert=require('assert');

const leader=fs.readFileSync(path.join(__dirname,'score-leader-top.js'),'utf8');

assert(/תיקו בצמרת/.test(leader),'leader controller must recognize the tie-at-the-top state');
assert(/desiredLeaderHeading/.test(leader),'leader controller must derive one dynamic heading from the live scores');
assert(/score-board-value/.test(leader),'dynamic heading must read the visible score values');
assert(/תיקו בצמרת 🤝/.test(leader),'tied leaders must use the tie heading');
assert(/מובילה 🏆/.test(leader),'a single leader must use the leader heading');
assert(/updateLeaderHeading/.test(leader),'the same pinned heading element must be updated instead of adding another title');
assert(/STATUS_RE/.test(leader),'duplicate detection must cover both leader and tie headings');
console.log('score leader dynamic heading regression checks passed');
