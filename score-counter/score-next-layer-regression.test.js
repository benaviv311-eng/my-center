const fs=require('fs');
const path=__dirname;
const required=['score-remote-display.js','score-cloud-sync.js','score-data-hub.js','score-human-voice-pack.js'];
for(const f of required){
  if(!fs.existsSync(path+'/'+f)) throw new Error('missing '+f);
  const s=fs.readFileSync(path+'/'+f,'utf8');
  if(!s.includes('window.TeamScore')) throw new Error('missing public API '+f);
}
const remote=fs.readFileSync(path+'/score-remote-display.js','utf8');
for(const token of ['score-remote','displaySecret','controllerSecret','remote=','poll','Remote Display']) if(!remote.includes(token)) throw new Error('remote missing '+token);
const sync=fs.readFileSync(path+'/score-cloud-sync.js','utf8');
for(const token of ['score-sync','pairingCode','version_conflict','Presets','History','Preferences','Rosters','Players']) if(!sync.includes(token)) throw new Error('sync missing '+token);
const hub=fs.readFileSync(path+'/score-data-hub.js','utf8');
for(const token of ['Player Profiles','Rosters','History','goal','note','voiceAlias','present']) if(!hub.includes(token)) throw new Error('hub missing '+token);
const voice=fs.readFileSync(path+'/score-human-voice-pack.js','utf8');
for(const token of ['score-voice','countdown10','countdown3','end10','end3','continuousCountdown','arena','coach']) if(!voice.includes(token)) throw new Error('voice missing '+token);
console.log('next-layer regression ok');
