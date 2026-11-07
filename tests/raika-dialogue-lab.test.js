const test = require('node:test');
const assert = require('node:assert/strict');
const { buildDialogue, buildToneRemix } = require('../raika-dialogue-lab-core.js');

const raika = {
  id: 'raika',
  title: 'ראיקה',
  traits: ['אמיצה', 'תחרותית', 'רגישה'],
  summary: 'לוחמת ומתאמנת מגיל צעיר.'
};
const okane = {
  id: 'okane',
  title: 'אוקנה',
  summary: 'מנהיגה חברתית בבית הספר ובתו של ראש הכפר.',
  tags: ['בית ספר', 'חברה', 'מנהיגות']
};

test('dialogue builder uses the selected characters, canon location, activity, dynamic and mixed tone', () => {
  const result = buildDialogue({
    characters: [raika, okane],
    location: 'דוג׳ו אינאזומה',
    activity: 'אימון דיוק',
    dynamic: 'rivalry',
    primaryTone: 'comedic',
    secondaryTone: 'sarcastic',
    note: 'בלי השפלה אישית',
    variant: 0
  });

  assert.equal(result.status, 'idea');
  assert.equal(result.isCanon, false);
  assert.match(result.text, /ראיקה/);
  assert.match(result.text, /אוקנה/);
  assert.match(result.text, /דוג׳ו אינאזומה/);
  assert.match(result.text, /אימון דיוק/);
  assert.match(result.text, /מתח בין יריבות/);
  assert.match(result.text, /קומי/);
  assert.match(result.text, /עוקצני/);
  assert.ok(result.dialogue.length >= 6);
  assert.deepEqual(result.unverifiedCharacters, ['אוקנה']);
});

test('dialogue builder rejects fewer than two participants and missing required context', () => {
  assert.throws(() => buildDialogue({
    characters: [raika],
    location: 'דוג׳ו אינאזומה',
    activity: 'אימון',
    dynamic: 'rivalry',
    primaryTone: 'tense'
  }), /לפחות שתי דמויות/);

  assert.throws(() => buildDialogue({
    characters: [raika, okane],
    location: '',
    activity: 'אימון',
    dynamic: 'rivalry',
    primaryTone: 'tense'
  }), /מיקום/);
});

test('tone remix keeps the original premise and source untouched while creating a separate tone version', () => {
  const source = {
    title: 'קומוגי והכיכר',
    body: 'ראיקה מגיעה למאפייה כדי לעזור לקומוגי, אבל משהו קטן משתבש.',
    characters: ['raika', 'komugi']
  };
  const before = JSON.stringify(source);
  const result = buildToneRemix(source, 'comedic', 'sarcastic', 1);

  assert.equal(JSON.stringify(source), before);
  assert.equal(result.status, 'idea');
  assert.equal(result.isCanon, false);
  assert.match(result.title, /קומי/);
  assert.match(result.text, /ראיקה מגיעה למאפייה כדי לעזור לקומוגי/);
  assert.match(result.text, /אותה סיטואציה/);
  assert.match(result.text, /דיאלוג מוצע/);
  assert.match(result.text, /קומוגי/);
  assert.match(result.text, /הצעה בלבד/);
  const withNote = buildToneRemix({ title: 'בדיקה', body: 'רגע קצר', characterNames: ['ראיקה', 'אוקנה'], note: 'בלי השפלה אישית' }, 'comedic');
  assert.match(withNote.text, /בלי השפלה אישית/);
});

test('tone remix requires an existing scene or idea to preserve', () => {
  assert.throws(() => buildToneRemix({ title: '', body: '' }, 'comedic'), /סצנה או רעיון/);
});

test('dialogue builder labels a manually entered participant and custom location as unverified', () => {
  const result = buildDialogue({
    characters: [raika, { title: 'קומוגי', missingProfile: true }],
    location: 'המאפייה של קומוגי',
    locationVerified: false,
    activity: 'עזרה במאפייה',
    dynamic: 'teasing',
    primaryTone: 'comedic',
    customCharacter: true
  });
  assert.ok(result.warnings.some((warning) => warning.includes('המיקום הוזן ידנית')));
  assert.ok(result.warnings.some((warning) => warning.includes('דמות נוספת הוזנה ידנית')));
  assert.deepEqual(result.unverifiedCharacters, ['קומוגי']);
});
