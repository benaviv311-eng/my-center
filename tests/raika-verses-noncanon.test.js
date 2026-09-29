const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

test('Raika navigation exposes verses and noncanon plotlines',()=>{
  const pages=['raika-writers-room.html','raika-characters.html','raika-scenes.html','raika-plotlines.html','raika-history.html','raika-world.html','raika-relationships.html'];
  for(const page of pages){
    const html=fs.readFileSync(page,'utf8');
    assert.match(html,/raika-verses\.html/);
    assert.match(html,/📖 פסוקים/);
    assert.match(html,/raika-noncanon-plotlines\.html/);
    assert.match(html,/קווי עלילה לא־קאנוניים/);
  }
});

test('verses page filters saved verse/philosophy material',()=>{
  const html=fs.readFileSync('raika-verses.html','utf8');
  const js=fs.readFileSync('raika-verses.js','utf8');
  assert.match(html,/📖 פסוקים/);
  assert.match(html,/id="raika-verses-grid"/);
  assert.match(js,/writers-verse/);
  assert.match(js,/פסוק/);
  assert.match(js,/RaikaPrivate/);
});

test('noncanon plotlines page keeps proposals separate from canon plotlines',()=>{
  const html=fs.readFileSync('raika-noncanon-plotlines.html','utf8');
  const js=fs.readFileSync('raika-noncanon-plotlines.js','utf8');
  assert.match(html,/קווי עלילה לא־קאנוניים/);
  assert.match(html,/id="raika-noncanon-grid"/);
  assert.match(js,/noncanon-plotline/);
  assert.match(js,/status.*canon/);
  assert.match(js,/לא קאנון/);
});
