# Raika Writers Room Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** להפוך את `raika.html` למרכז עבודה חי של עולם ראיקה, עם קאנון, סצנות, קווי עלילה, היסטוריה, עולם ואמונות, מערכות יחסים וחדר כותבים שמבדיל בבירור בין קאנון להצעות.

**Architecture:** האתר נשאר סטטי ב-GitHub Pages. נתוני ראיקה יופרדו ל-`raika-data.js`, לוגיקת הרינדור/חיפוש/סינון ל-`raika-app.js`, ו-`raika.html` יהפוך לשער עם אזורים ממוסגרים. כל רעיון יצירתי יקבל סטטוס מפורש ולא יהפוך לקאנון בלי אישור.

**Tech Stack:** HTML, CSS, Vanilla JavaScript, GitHub Pages, Node built-in test runner (`node --test`) לבדיקות לוגיקה ללא תלויות נוספות.

**Spec:** `docs/superpowers/specs/2026-09-12-raika-writers-room-design.md`

## Global Constraints

- קאנון והצעות חייבים להיות מופרדים חזותית ולוגית.
- סטטוסים נתמכים: `idea`, `developing`, `canon`, `parked`.
- שום רעיון יצירתי לא מסומן `canon` ללא אישור מפורש של המשתמש.
- שום תמונה אינה מוצגת כקאנונית ללא אישור מפורש.
- אין להוסיף ספריות או תלויות חיצוניות לגרסה הראשונה.
- העיצוב חייב להישאר תואם לסגנון הקיים של `my-center` ולפעול במובייל ובדסקטופ.
- יש לשמר את הניווט הקיים של האתר.

---

### Task 1: מודל נתונים לקאנון ולחדר הכותבים

**Files:**
- Create: `raika-data.js`
- Create: `tests/raika-data.test.js`

**Interfaces:**
- Produces: `window.RAIKA_DATA` בדפדפן ו-`module.exports = RAIKA_DATA` ב-Node.
- מבנה עליון: `{ characters, scenes, plotlines, history, world, relationships, ideas }`.

- [ ] **Step 1: כתוב בדיקה נכשלת למבנה הנתונים**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const data = require('../raika-data.js');

test('Raika data exposes all writers-room collections', () => {
  for (const key of ['characters','scenes','plotlines','history','world','relationships','ideas']) {
    assert.ok(Array.isArray(data[key]), `${key} must be an array`);
  }
});

test('every creative idea is non-canon by default', () => {
  assert.ok(data.ideas.length > 0);
  assert.ok(data.ideas.every(item => item.status !== 'canon'));
});

test('scene records carry stable ids and statuses', () => {
  assert.ok(data.scenes.length >= 20);
  assert.ok(data.scenes.every(scene => scene.id && scene.title && scene.status));
});
```

- [ ] **Step 2: הרץ את הבדיקה וודא שהיא נכשלת**

Run: `node --test tests/raika-data.test.js`
Expected: FAIL because `raika-data.js` does not exist yet.

- [ ] **Step 3: צור `raika-data.js` עם מודל מפורש**

```js
const RAIKA_DATA = {
  characters: [],
  scenes: [],
  plotlines: [],
  history: [],
  world: [],
  relationships: [],
  ideas: []
};

if (typeof window !== 'undefined') window.RAIKA_DATA = RAIKA_DATA;
if (typeof module !== 'undefined') module.exports = RAIKA_DATA;
```

הזן לתוך המודל את הקאנון הידוע: ראיקה, ראי, היקארי, טומו, נזו יוקאן, מדושי, דוקורן, סייראן, אוקנה, טאקאקי, איקטרו, גנזו, רייקו ורייגו; סצנות הקומיקס 1–28 מהדוגמה המאושרת; סצנות בית הספר הנעולות; דוג׳ו אינאזומה; כפר סאקורה; מורשת התליון והע.ב.ו; צירי העלילה של ההכשרה, בית הספר, גנזו, היקארי, מדושי/דוקורן וסייראן. רעיונות חדשים ייכנסו רק ל-`ideas` עם `status:'idea'`.

- [ ] **Step 4: הרץ שוב את הבדיקה**

Run: `node --test tests/raika-data.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add raika-data.js tests/raika-data.test.js
git commit -m "feat: add structured Raika canon and writers-room data"
```

---

### Task 2: פונקציות סינון וסטטוס טהורות

**Files:**
- Create: `raika-app.js`
- Create: `tests/raika-app.test.js`

**Interfaces:**
- Consumes: `window.RAIKA_DATA`.
- Produces: `statusMeta(status)`, `filterItems(items, query, status, type)` ו-`collectCharacterLinks(data, characterId)`.

- [ ] **Step 1: כתוב בדיקות נכשלות ללוגיקה**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { statusMeta, filterItems } = require('../raika-app.js');

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
```

- [ ] **Step 2: הרץ וודא כשל צפוי**

Run: `node --test tests/raika-app.test.js`
Expected: FAIL because `raika-app.js` does not exist yet.

- [ ] **Step 3: ממש את הפונקציות הטהורות**

```js
function statusMeta(status){
  const map = {
    canon:{label:'✅ קאנון', className:'canon'},
    developing:{label:'📝 בפיתוח', className:'developing'},
    idea:{label:'💡 הצעה', className:'idea'},
    parked:{label:'🗄️ בצד', className:'parked'}
  };
  return map[status] || map.idea;
}

function filterItems(items, query='', status='all', type='all'){
  const q = String(query).trim().toLowerCase();
  return items.filter(item => {
    const haystack = [item.title, item.summary, ...(item.tags||[])].join(' ').toLowerCase();
    return (!q || haystack.includes(q)) &&
      (status === 'all' || item.status === status) &&
      (type === 'all' || item.type === type);
  });
}
```

שמור את אתחול ה-DOM מאחורי `if (typeof document !== 'undefined')` כדי שהבדיקות ב-Node יעבדו.

- [ ] **Step 4: הרץ את הבדיקות**

Run: `node --test tests/raika-app.test.js tests/raika-data.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add raika-app.js tests/raika-app.test.js
git commit -m "feat: add Raika writers-room filtering and status helpers"
```

---

### Task 3: הפוך את `raika.html` לשער של חדר הכותבים

**Files:**
- Modify: `raika.html`

**Interfaces:**
- Consumes: `raika-data.js`, `raika-app.js`.
- Produces: שבעה אזורים עם anchors: `characters`, `scenes`, `plotlines`, `history`, `world`, `relationships`, `writers-room`.

- [ ] **Step 1: הוסף בדיקת smoke פשוטה לקיום האזורים**

הוסף ל-`tests/raika-app.test.js`:

```js
const fs = require('node:fs');

test('raika page exposes all writers-room sections', () => {
  const html = fs.readFileSync('raika.html','utf8');
  for (const id of ['characters','scenes','plotlines','history','world','relationships','writers-room']) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  assert.match(html, /raika-data\.js/);
  assert.match(html, /raika-app\.js/);
});
```

- [ ] **Step 2: הרץ וודא שהבדיקה נכשלת**

Run: `node --test tests/raika-app.test.js`
Expected: FAIL because the new sections/scripts are missing.

- [ ] **Step 3: עדכן את `raika.html`**

העמוד יכלול בראשו שער עם כפתורי ניווט לשבעה האזורים, הודעת קאנון קבועה, שורת חיפוש וסינון סטטוס, וכל אזור יקבל container נפרד לרינדור JavaScript. שמור את ה-bottom nav הקיים ללא שינוי פונקציונלי.

- [ ] **Step 4: הרץ את הבדיקה**

Run: `node --test tests/raika-app.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add raika.html tests/raika-app.test.js
git commit -m "feat: turn Raika page into writers-room hub"
```

---

### Task 4: רינדור כרטיסי קאנון, סצנות ורעיונות

**Files:**
- Modify: `raika-app.js`

**Interfaces:**
- Produces DOM renderers: `renderCharacters`, `renderScenes`, `renderPlotlines`, `renderHistory`, `renderWorld`, `renderRelationships`, `renderIdeas`.

- [ ] **Step 1: כתוב בדיקה נכשלת ליצירת HTML של כרטיס**

הוסף ל-`tests/raika-app.test.js`:

```js
const { itemCardHtml } = require('../raika-app.js');

test('itemCardHtml prints title and status without promoting ideas to canon', () => {
  const html = itemCardHtml({title:'שיחה לילית', status:'idea', summary:'הצעה בלבד'});
  assert.match(html, /שיחה לילית/);
  assert.match(html, /💡 הצעה/);
  assert.doesNotMatch(html, /✅ קאנון/);
});
```

- [ ] **Step 2: הרץ וודא כשל**

Run: `node --test tests/raika-app.test.js`
Expected: FAIL because `itemCardHtml` is not implemented/exported.

- [ ] **Step 3: ממש רינדור אחיד**

כרטיסים יציגו: סטטוס, כותרת, תקציר, תגיות, קישורי דמויות/סצנות רלוונטיים ו-`details` למידע עמוק. כרטיסי רעיון יציגו בנוסף: למה זה מתאים לקו הקיים ומה הוא עשוי לפתוח בהמשך.

- [ ] **Step 4: חבר חיפוש וסינון לכל האזורים**

אירוע `input` בחיפוש ו-`change` בסינון ירנדרו מחדש את כל האזורים דרך `filterItems` בלי לשנות את הנתונים.

- [ ] **Step 5: הרץ את כל בדיקות Node**

Run: `node --test tests/raika-data.test.js tests/raika-app.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add raika-app.js tests/raika-app.test.js
git commit -m "feat: render Raika canon scenes and writers-room ideas"
```

---

### Task 5: עיצוב והבחנה חזותית בין קאנון להצעה

**Files:**
- Modify: `styles.css`

**Interfaces:**
- Consumes classes: `.raika-hub`, `.raika-section-nav`, `.status-canon`, `.status-idea`, `.status-developing`, `.status-parked`, `.scene-timeline`, `.writer-card`.

- [ ] **Step 1: הוסף בדיקת smoke ל-CSS**

הוסף ל-`tests/raika-app.test.js`:

```js
test('styles distinguish canon and idea cards', () => {
  const css = fs.readFileSync('styles.css','utf8');
  assert.match(css, /\.status-canon/);
  assert.match(css, /\.status-idea/);
  assert.match(css, /\.scene-timeline/);
});
```

- [ ] **Step 2: הרץ וודא כשל**

Run: `node --test tests/raika-app.test.js`
Expected: FAIL until the styles are added.

- [ ] **Step 3: הוסף סגנונות**

השתמש במשתני הצבע/כרטיסים הקיימים באתר ככל האפשר; אל תחליף את theme הכללי. במובייל ה-grid יעבור לעמודה אחת. סטטוס יהיה badge ברור בראש כל כרטיס.

- [ ] **Step 4: הרץ את כל הבדיקות**

Run: `node --test tests/raika-data.test.js tests/raika-app.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add styles.css tests/raika-app.test.js
git commit -m "style: add Raika writers-room visual hierarchy"
```

---

### Task 6: אימות תוכן וקישורים לפני פרסום

**Files:**
- Verify: `raika.html`, `raika-data.js`, `raika-app.js`, `styles.css`

**Interfaces:**
- No new interfaces.

- [ ] **Step 1: הרץ את כל הבדיקות**

Run: `node --test tests/raika-data.test.js tests/raika-app.test.js`
Expected: 0 failures.

- [ ] **Step 2: בדוק שכל הרעיונות אינם קאנון**

Run:
```bash
node -e "const d=require('./raika-data'); if(d.ideas.some(x=>x.status==='canon')) process.exit(1); console.log('ideas-safe')"
```
Expected: `ideas-safe`.

- [ ] **Step 3: בדוק טעינת scripts**

Run:
```bash
grep -n "raika-data.js\|raika-app.js" raika.html
```
Expected: both script files appear after the shared `app.js` or immediately before `</body>`.

- [ ] **Step 4: בדוק ידנית בדפדפן**

פתח `raika.html` ובדוק: ניווט בין שבעת האזורים, חיפוש בעברית, סינון לפי סטטוס, תצוגת סצנות, ותוויות קאנון/הצעה. ודא שה-bottom nav נשאר פעיל ושאין שגיאות console.

- [ ] **Step 5: פרסם ל-`main` לאחר האישור שכבר ניתן לעדכון האתר החי**

וודא שכל הקבצים על `main` וש-GitHub Pages מציג את הגרסה החדשה.
