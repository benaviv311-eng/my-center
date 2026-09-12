const test = require('node:test');
const assert = require('node:assert/strict');
const { sceneDetailHtml, sceneCardHtml } = require('../raika-app.js');

test('scene detail shows the full scene text and image when available', () => {
  const html = sceneDetailHtml({
    id:'scene-1', order:7, title:'אומץ למרות הפחד', status:'canon',
    summary:'תקציר קצר', fullText:'זהו הטקסט המלא של הסצנה.\nשורה שנייה.',
    image:'images/scene-7.jpg', characters:[], tags:[]
  });
  assert.match(html, /זהו הטקסט המלא של הסצנה/);
  assert.doesNotMatch(html, /תקציר קצר/);
  assert.match(html, /images\/scene-7\.jpg/);
});

test('scene detail says נעלה בהמשך when there is no image', () => {
  const html = sceneDetailHtml({
    id:'scene-2', order:8, title:'הדרך הארוכה', status:'canon',
    summary:'הטקסט הקיים של הסצנה', characters:[], tags:[]
  });
  assert.match(html, /הטקסט הקיים של הסצנה/);
  assert.match(html, /נעלה בהמשך/);
});

test('scene cards are clickable scene controls', () => {
  const html = sceneCardHtml({id:'scene-3', order:9, title:'התליון', status:'canon', summary:'...', characters:[], tags:[]});
  assert.match(html, /data-scene-id="scene-3"/);
  assert.match(html, /פתיחת סצנה מלאה/);
});
