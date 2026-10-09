const fs=require('fs');
const path=require('path');
const assert=require('assert');
const root=__dirname;
const lower=fs.readFileSync(path.join(root,'score-layout-lower.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');

assert(/FIRST_ROW_IMAGE_OFFSET_PX\s*=\s*135/.test(lower),'first score row must align around 135px from the visible image top, matching the gray control rectangle');
assert(!/findHeaderBottom/.test(lower),'layout must not depend on the TeamScore header bottom');
assert(!/measureCardGap/.test(lower),'layout must not reserve a full card-height spacer before the first row');
assert(/image\.top\s*\+\s*FIRST_ROW_IMAGE_OFFSET_PX/.test(lower),'layout top must derive directly from the visible image top plus the requested offset');
assert(/score-layout-lower\.js\?v=4/.test(index),'index must load the gray-rectangle-aligned layout positioning version');

console.log('score layout gray rectangle alignment checks passed');
