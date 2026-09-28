const EDIT_MODES=new Set(['edit','work']);

function hasSelectedElement(value){
  return Boolean(value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length);
}

const HEBREW_MUTATION=/(?:^|[\s"'׳״.,!?():;—-])(?:שנה|שני|תשנה|עדכן|תעדכן|הוסף|תוסיף|הסר|תסיר|מחק|תמחק|עצב|תעצב|תקן|תתקן|הגדל|תגדיל|הקטן|תקטין|הזז|תזיז|החלף|תחליף|צור|תיצור|בנה|תבנה|יישר|תיישר|סדר|תסדר|פתח|תפתח|סגור|תסגור)(?=$|[\s"'׳״.,!?():;—-])/u;
const ENGLISH_MUTATION=/\b(?:change|update|add|remove|delete|edit|redesign|fix|resize|move|replace|create|build|align|reorder|open|close)\b/i;

export function hasDirectEditIntent(question=''){
  const q=String(question||'').trim();
  if(!q)return false;
  return HEBREW_MUTATION.test(q)||ENGLISH_MUTATION.test(q);
}

export function shouldOpenSiteEdit({
  editorMode='edit',
  question='',
  selectedElement=null,
  parsedSiteEdit=null,
  parsedAction=null
}={}){
  if(!EDIT_MODES.has(String(editorMode)))return false;
  if(parsedSiteEdit)return true;
  if(parsedAction)return false;
  if(hasSelectedElement(selectedElement))return Boolean(String(question||'').trim());
  return hasDirectEditIntent(question);
}
