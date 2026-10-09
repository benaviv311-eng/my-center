const fs=require('fs');
const path=require('path');
const assert=require('assert');

const root=__dirname;
const menuJs=fs.readFileSync(path.join(root,'score-layout-menu.js'),'utf8');
const stabilityJs=fs.readFileSync(path.join(root,'score-layout-stability.js'),'utf8');
const lowerJs=fs.readFileSync(path.join(root,'score-layout-lower.js'),'utf8');
const css=fs.readFileSync(path.join(root,'score-layout-menu.css'),'utf8');
const js=menuJs+'\n'+stabilityJs;

assert(!/\.score-layout-three \.score-board-row/.test(css),'layout chooser must not rewrite the score row inside a card');
assert(!/\.score-layout-row \.score-board-row/.test(css),'row layout must not rewrite the score row inside a card');
assert(!/\.score-layout-three \.score-board-value/.test(css),'layout chooser must not resize the score value inside a card');
assert(!/\.score-layout-row \.score-board-value/.test(css),'row layout must not resize the score value inside a card');
assert(/grid-template-columns:repeat\(var\(--score-layout-columns\),minmax\(0,240px\)\)/.test(css),'managed layouts must keep stable 240px card tracks');
assert(/width:min\(240px,100%\)!important/.test(css),'managed cards must preserve their normal width instead of stretching');
assert(/CARD_WIDTH=240/.test(stabilityJs),'column calculation must use the real card width');
assert(/LAYOUT_GLYPHS/.test(js),'layout controller must define a glyph for each layout mode');
assert(/updateTriggerIcon/.test(js),'layout controller must update the trigger icon when the mode changes');
assert(/trigger\.dataset\.scoreLayoutMode/.test(js),'trigger must expose the selected layout mode');
assert(/icon\.textContent=glyph/.test(js),'visible trigger icon must reflect the selected mode');
assert(!/score-layout-managed'\)\s*\|\|\s*teams\.classList\.contains\('score-layout-free/.test(lowerJs),'free drag mode must not be compressed into the lower managed-layout strip');
console.log('score layout menu regression checks passed');
