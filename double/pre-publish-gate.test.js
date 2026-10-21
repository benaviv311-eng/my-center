const fs=require('fs');
const path=require('path');
const repoRoot=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(repoRoot,p),'utf8');
const RELEASE='34';

const root=read('../double.html');
const wrapper=read('../double-game.html');
const core=read('../double-game-core.html');
const classic=read('../double-classic-core.html');
const daily=read('../double-daily.html');
const landing=read('landing-selection.js');
const success=read('success-ting.js');
const toy=read('toy-theme-bridge.js');
const iconBridge=read('icon-pack-game-bridge.js');
const dailyUi=read('daily-challenge-ui.js');
const launch=read('encouragement-launch-bridge.js');

function must(src,needle,label){if(!src.includes(needle))throw new Error(label+' missing '+needle)}
function mustNot(src,needle,label){if(src.includes(needle))throw new Error(label+' still contains '+needle)}

must(root,'double/landing-selection.js?v='+RELEASE,'root');
must(root,'double-game.html?v='+RELEASE+'&','root');
must(landing,"const V='"+RELEASE+"'","landing");
must(wrapper,'double/premium-theme.css?v='+RELEASE,'wrapper');
must(wrapper,'double/success-ting.js?v='+RELEASE,'wrapper');
must(wrapper,'double-classic-core.html?v='+RELEASE,'wrapper');
must(wrapper,'double-game-core.html?v='+RELEASE,'wrapper');
must(success,"const V='"+RELEASE+"'","success bootstrap");
must(toy,"const V='"+RELEASE+"'","theme bridge");
must(core,'double/two-player-mode-rules.js?v='+RELEASE,'core');
must(core,'double/game.js?v='+RELEASE,'core');
must(classic,'double/classic-mode-rules.js?v='+RELEASE,'classic');
must(classic,'double/classic-speed-game.js?v='+RELEASE,'classic');
for(const asset of ['daily-challenge-core.js','stats-store.js','daily-challenge-game.js','encouragement-engine.js','reaction-time-model.js','encouragement-bridge.js','reaction-time-bridge.js']){
  must(daily,asset+'?v='+RELEASE,'daily');
}
must(dailyUi,'double-daily.html?v='+RELEASE,'daily launcher');
must(launch,"const V='"+RELEASE+"'","feedback launcher");

mustNot(iconBridge,'premium-theme.css','icon bridge must not own theme loading');
for(const stale of ['?v=1','?v=10','?v=12','?v=14','?v=15','?v=16','?v=17','?v=18','?v=29','?v=30']){
  mustNot(root,stale,'root');
  mustNot(wrapper,stale,'wrapper');
}
mustNot(core,'site-chat','DOUBLE core');
mustNot(core,'site-editor','DOUBLE core');

console.log('DOUBLE pre-publish static gate OK · release '+RELEASE);
