const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

test('live Writers Room chat can save an assistant answer as verse or inspiration',()=>{
  const src=fs.readFileSync('raika-writers-chat.js','utf8');
  assert.match(src,/data-rwc-save="verse"/);
  assert.match(src,/📖 שמור כפסוק\/השראה/);
  assert.match(src,/type:'philosophy'/);
  assert.match(src,/פסוק\/השראה/);
});

test('chat save infers mentioned canon characters from the assistant answer',()=>{
  const src=fs.readFileSync('raika-writers-chat.js','utf8');
  assert.match(src,/function inferCharacters/);
  assert.match(src,/RAIKA_DATA/);
  assert.match(src,/characters:inferredCharacters/);
});

test('Writers Room presents the live chat as the primary creative surface',()=>{
  const html=fs.readFileSync('raika-writers-room.html','utf8');
  const css=fs.readFileSync('raika-writers-chat.css','utf8');
  assert.ok(html.indexOf('id="raika-writers-chat"')<html.indexOf('id="raika-feed"'));
  assert.match(html,/צ׳אט חי — חדר הכותבים/);
  assert.match(css,/min-height:/);
  assert.match(css,/rwc-primary/);
});

test('Writers Room cache-busts the completed live chat assets',()=>{
  const html=fs.readFileSync('raika-writers-room.html','utf8');
  assert.match(html,/raika-writers-chat\.css\?v=2/);
  assert.match(html,/raika-writers-chat\.js\?v=2/);
});
