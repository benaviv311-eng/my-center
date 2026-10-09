const fs=require('fs');
const path=require('path');
const assert=require('assert');

const root=__dirname;
const js=fs.readFileSync(path.join(root,'score-layout-menu.js'),'utf8');
const css=fs.readFileSync(path.join(root,'score-layout-menu.css'),'utf8');

assert(!/\.score-layout-three \.score-board-row/.test(css),'layout chooser must not rewrite the score row inside a card');
assert(!/\.score-layout-row \.score-board-row/.test(css),'row layout must not rewrite the score row inside a card');
assert(!/\.score-layout-three \.score-board-value/.test(css),'layout chooser must not resize the score value inside a card');
assert(!/\.score-layout-row \.score-board-value/.test(css),'row layout must not resize the score value inside a card');
assert(/LAYOUT_GLYPHS/.test(js),'layout controller must define a glyph for each layout mode');
assert(/updateTriggerIcon/.test(js),'layout controller must update the trigger icon when the mode changes');
assert(/trigger\.dataset\.scoreLayoutMode/.test(js),'trigger must expose the selected layout mode');
assert(/updateTriggerIcon\(\)/.test(js),'layout mode changes must actively refresh the icon');
console.log('score layout menu regression checks passed');
