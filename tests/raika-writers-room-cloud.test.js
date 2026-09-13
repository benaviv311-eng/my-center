const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

test('writers room loads cloud actions and generator in dependency order',()=>{
  const html=fs.readFileSync('raika-writers-room.html','utf8');
  for(const file of ['raika-workspace-client.js','raika-workspace-actions.js','raika-workspace-remove.js','raika-card-actions.js','raika-autosave.js','raika-ai.js','raika-generator-core.js','raika-generator-emotion.js','raika-generator-proposal.js','raika-generator-ui.js','raika-generator-actions.js']) assert.match(html,new RegExp(file.replace('.','\\.')));
  assert.ok(html.indexOf('raika-ai.js')<html.indexOf('raika-generator-actions.js'));
});

test('generator styles are scoped to writers room page',()=>{
  const html=fs.readFileSync('raika-writers-room.html','utf8');
  assert.match(html,/raika-generator\.css/);
});
