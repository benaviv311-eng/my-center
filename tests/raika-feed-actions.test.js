const test=require('node:test');
const assert=require('node:assert/strict');
const a=require('../raika-feed-actions-core.js');

const card={id:'card-1',card_type:'relationship',title:'בקשת עזרה',body:'ראיקה מבקשת מאוקנה עזרה.',characters:['raika','okane'],tags:['יחסים'],suggested_placement:'אחרי בית הספר',why_it_may_work:'שובר את הדינמיקה הרגילה.'};

test('saving a feed card creates a saved proposal, never canon',()=>{
  const item=a.feedCardToWorkspaceItem(card,'canon');
  assert.equal(item.status,'idea');
  assert.equal(item.saved,true);
  assert.equal(item.type,'idea');
  assert.match(item.id,/^feed-/);
});

test('develop action creates a developing saved item',()=>{
  const item=a.feedCardToWorkspaceItem(card,'developing');
  assert.equal(item.status,'developing');
  assert.equal(item.saved,true);
});

test('scene expansion becomes a saved proposal item',()=>{
  const proposal={title:'סצנת בקשת העזרה',opening:'ראיקה מחכה במסדרון.',trigger:'אוקנה מגיעה.',beats:['שתיקה','בקשה'],dialogue:'ראיקה: אני צריכה עזרה.',turning_point:'אוקנה מסכימה.',ending:'שתיהן יוצאות.',placement:'אחרי הלימודים',why:'מעמיק קשר',opens:'אמון חדש',characters:['raika','okane'],tags:['בית ספר']};
  const item=a.sceneProposalToWorkspaceItem(card,proposal,'x1');
  assert.equal(item.status,'idea');
  assert.equal(item.saved,true);
  assert.ok(item.tags.includes('הצעת סצנה'));
  assert.match(item.summary,/ראיקה מחכה במסדרון/);
  assert.match(item.summary,/אני צריכה עזרה/);
});
