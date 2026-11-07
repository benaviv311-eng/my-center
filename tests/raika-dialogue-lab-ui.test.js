const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('Writers Room loads the new dialogue tools after canon data and existing generators', () => {
  const html = fs.readFileSync('raika-writers-room.html', 'utf8');
  const dataIndex = html.indexOf('raika-data.js');
  const oldGeneratorIndex = html.indexOf('raika-generator-ui.js');
  const oldHotfixIndex = html.indexOf('raika-generator-hotfix.js');
  const coreIndex = html.indexOf('raika-dialogue-lab-core.js');
  const uiIndex = html.indexOf('raika-dialogue-lab-ui.js');

  assert.ok(dataIndex >= 0);
  assert.ok(oldGeneratorIndex > dataIndex);
  assert.ok(oldHotfixIndex > oldGeneratorIndex);
  assert.ok(coreIndex > oldHotfixIndex);
  assert.ok(uiIndex > coreIndex);
  assert.match(html, /raika-dialogue-lab\.css/);
});

test('dialogue lab browser module parses without executing or calling a paid API', () => {
  const ui = fs.readFileSync('raika-dialogue-lab-ui.js', 'utf8');
  assert.doesNotThrow(() => new Function(ui));
  assert.doesNotMatch(ui, /\bfetch\s*\(/);
  assert.doesNotMatch(ui, /raiCall|RaikaFeedClient\.expandScene/);
});
