const fs=require('fs');
const path=require('path');
const assert=require('assert');
const root=__dirname;
const lower=fs.readFileSync(path.join(root,'score-layout-lower.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');

assert(/FIRST_ROW_VIEWPORT_OFFSET_PX\s*=\s*135/.test(lower),'first score row must align around 135px from the viewport top, matching the gray control rectangle');
assert(!/FIRST_ROW_IMAGE_OFFSET_PX/.test(lower),'layout must not use the scaled image top as its vertical reference');
assert(!/image\.top\s*\+\s*FIRST_ROW/.test(lower),'layout top must not add the offset to the scaled image top');
assert(/const target=FIRST_ROW_VIEWPORT_OFFSET_PX/.test(lower),'layout top must derive directly from the viewport offset');
assert(/score-layout-lower\.js\?v=5/.test(index),'index must load the viewport-anchored layout positioning version');

console.log('score layout viewport alignment checks passed');
