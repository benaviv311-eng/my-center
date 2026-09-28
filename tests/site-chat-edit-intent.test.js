const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

async function helper(){
  return import('../supabase/functions/_shared/site-chat-edit-intent.mjs');
}

test('consult mode never opens a site edit directly',async()=>{
  const {shouldOpenSiteEdit}=await helper();
  assert.equal(shouldOpenSiteEdit({editorMode:'consult',question:'שנה את הכותרת',selectedElement:{tag:'h1'},parsedSiteEdit:{goal:'שנה'}}),false);
});

test('edit and work modes detect clear mutation intent',async()=>{
  const {shouldOpenSiteEdit}=await helper();
  for(const q of ['שנה את הכותרת','תוסיף כפתור חדש','הסר את הטקסט הזה','תעצב את הכרטיס מחדש','תקן את המרווח']){
    assert.equal(shouldOpenSiteEdit({editorMode:'edit',question:q,selectedElement:null,parsedSiteEdit:null}),true,q);
  }
  assert.equal(shouldOpenSiteEdit({editorMode:'work',question:'תגדיל את התמונה',selectedElement:null,parsedSiteEdit:null}),true);
});

test('a selected page element makes an edit-mode request actionable even without a mutation keyword',async()=>{
  const {shouldOpenSiteEdit}=await helper();
  assert.equal(shouldOpenSiteEdit({editorMode:'edit',question:'יותר גדול בבקשה',selectedElement:{tag:'div',text:'כרטיס'},parsedSiteEdit:null}),true);
});

test('ordinary questions do not accidentally create edit requests',async()=>{
  const {shouldOpenSiteEdit}=await helper();
  assert.equal(shouldOpenSiteEdit({editorMode:'edit',question:'מה דעתך על הכותרת?',selectedElement:null,parsedSiteEdit:null}),false);
  assert.equal(shouldOpenSiteEdit({editorMode:'work',question:'למה העמוד בנוי ככה?',selectedElement:null,parsedSiteEdit:null}),false);
});

test('explicit SITE_EDIT_JSON remains supported in edit/work mode',async()=>{
  const {shouldOpenSiteEdit}=await helper();
  assert.equal(shouldOpenSiteEdit({editorMode:'edit',question:'אפשר לטפל בזה?',selectedElement:null,parsedSiteEdit:{goal:'עדכן את הכותרת'}}),true);
});

test('site-chat server uses direct edit intent as a fallback when AI omits SITE_EDIT_JSON',()=>{
  const src=fs.readFileSync('supabase/functions/site-chat/index.ts','utf8');
  assert.match(src,/shouldOpenSiteEdit/);
  assert.match(src,/const shouldCreateSiteEdit=/);
  assert.match(src,/if\(!consultOnly&&shouldCreateSiteEdit\)/);
  assert.match(src,/text\(parsed\.siteEdit\?\.goal/);
  assert.match(src,/\|\|questionForModel/);
});
