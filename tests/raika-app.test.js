const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { statusMeta, filterItems, itemCardHtml } = require('../raika-app.js');

test('canon has a distinct visible label', () => {
  assert.equal(statusMeta('canon').label, '✅ קאנון');
});

test('ideas stay visually distinct from canon', () => {
  assert.equal(statusMeta('idea').label, '💡 הצעה');
});

test('filterItems matches Hebrew text and status', () => {
  const items = [
    {title:'המארב המשפחתי', status:'canon', tags:['משפחה']},
    {title:'שיחה לילית', status:'idea', tags:['עבר']}
  ];
  assert.deepEqual(filterItems(items, 'משפחה', 'canon'), [items[0]]);
});

test('Raika topic pages expose all writers-room collections', () => {
  const pages={
    characters:'raika-characters.html',
    scenes:'raika-scenes.html',
    plotlines:'raika-plotlines.html',
    history:'raika-history.html',
    world:'raika-world.html',
    relationships:'raika-relationships.html',
    'writers-room':'raika-writers-room.html'
  };
  for (const [id,file] of Object.entries(pages)) {
    assert.equal(fs.existsSync(file),true,`${file} must exist`);
    if(!fs.existsSync(file)) continue;
    const html=fs.readFileSync(file,'utf8');
    assert.match(html,new RegExp(`id=["']${id}["']`));
    assert.match(html,/raika-data\.js/);
    assert.match(html,/raika-app\.js/);
  }
});

test('itemCardHtml prints title and status without promoting ideas to canon', () => {
  const html = itemCardHtml({title:'שיחה לילית', status:'idea', summary:'הצעה בלבד'});
  assert.match(html, /שיחה לילית/);
  assert.match(html, /💡 הצעה/);
  assert.doesNotMatch(html, /✅ קאנון/);
});

test('styles distinguish canon and idea cards', () => {
  const css = fs.readFileSync('styles.css','utf8');
  assert.match(css, /\.status-canon/);
  assert.match(css, /\.status-idea/);
  assert.match(css, /\.scene-timeline/);
});
