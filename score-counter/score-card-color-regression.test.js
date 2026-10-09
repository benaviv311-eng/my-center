const fs=require('fs');
const path=require('path');
const assert=require('assert');

const root=__dirname;
const js=fs.readFileSync(path.join(root,'score-card-surface.js'),'utf8');
const css=fs.readFileSync(path.join(root,'score-card-surface.css'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');

assert(/CARD_MEGA_BOTTOM_GAP_PX\s*=\s*6/.test(js),'card must stay tight to Mega');
assert(/findTeamStripeColor/.test(js),'team color must fall back to the visible top stripe');
assert(/teamColorFromCard/.test(js),'team color must be resolved from the whole card, not only the plus button');
assert(/mixWithWhite/.test(js),'team tint must be lightened before rendering');
assert(/setProperty\(['"]background['"][\s\S]*['"]important['"]\)/.test(js),'team background must be written inline with important priority');
assert(/setProperty\(['"]border-color['"][\s\S]*['"]important['"]\)/.test(js),'team border tint must be written inline with important priority');
assert(/score-card-team-tint/.test(css),'surface stylesheet must retain team tint support');
assert(/score-card-surface\.css\?v=2&rev=3/.test(index),'index must cache-bust surface CSS rev 3');
assert(/score-card-surface\.js\?v=2&rev=3/.test(index),'index must cache-bust surface JS rev 3');
console.log('score card color regression checks passed');
