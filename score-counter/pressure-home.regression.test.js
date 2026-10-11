const assert=require('assert');
const home=require('./score-pressure-home.js');

assert.equal(home.deriveStatus([22,22],{target:25,winBy2:true,context:'set'},['Brenner','Rehovot']),'TIED · 3 POINTS TO TARGET');
assert.equal(home.deriveStatus([23,22],{target:25,winBy2:true,context:'set'},['Brenner','Rehovot']),'BRENNER LEADS · 2 POINTS TO TARGET');
assert.equal(home.deriveStatus([24,23],{target:25,winBy2:true,context:'set'},['Brenner','Rehovot']),'SET POINT · BRENNER');
assert.equal(home.deriveStatus([24,24],{target:25,winBy2:true,context:'set'},['Brenner','Rehovot']),'DEUCE · WIN BY 2');
assert.equal(home.deriveStatus([26,24],{target:25,winBy2:true,context:'set'},['Brenner','Rehovot']),'BRENNER WINS · 26–24');
assert.equal(home.rulesLine({startA:22,startB:22,target:25,winBy2:true}),'Start 22–22 · First to 25 · Win by 2');

const fs=require('fs');
const source=fs.readFileSync(__dirname+'/score-pressure-home.js','utf8');
for(const marker of ['data-pressure-home',"getElementById('teams')",'score-suite-active-game',"startMode?.('pressure-game')"]){
  assert(source.includes(marker),'missing integration marker '+marker);
}
console.log('pressure-home regression passed');
