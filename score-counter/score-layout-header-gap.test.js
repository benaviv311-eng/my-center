const fs=require('fs');
const path=require('path');
const assert=require('assert');
const root=__dirname;
const lower=fs.readFileSync(path.join(root,'score-layout-lower.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');

assert(!/LAYOUT_START_RATIO\s*=\s*0\.75/.test(lower),'layout must no longer start from a fixed 75% image ratio');
assert(/findHeaderBottom/.test(lower),'layout must measure the visible TeamScore header bottom');
assert(/measureCardGap/.test(lower),'layout must measure an actual score-card height for the spacer');
assert(/HEADER_GAP_PX\s*=\s*8/.test(lower),'layout must keep a small extra gap after the one-card spacer');
assert(/headerBottom\s*\+\s*cardGap\s*\+\s*HEADER_GAP_PX/.test(lower),'layout top must derive from header bottom plus at least one card height');
assert(/score-layout-lower\.js\?v=2/.test(index),'index must load the header-relative layout positioning version');

console.log('score layout header gap checks passed');
