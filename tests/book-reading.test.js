const assert = require('assert');
const reading = require('../book-reading.js');

const sample = {
  id: 'sample',
  slug: 'sample',
  title: 'Sample Book',
  content: {
    summary: 'ספר על למידה, הרגלים, החלטות ושיפור מתמשך.',
    ideas: ['שיפור קטן מצטבר', 'משוב משנה התנהגות', 'סביבה מעצבת הרגלים'],
    topics: ['הרגלים', 'למידה', 'משוב', 'קבלת החלטות'],
    feed_posts: ['יישום מעשי מתחיל משינוי קטן שניתן למדוד.']
  }
};

const chapters = reading.buildReadingChapters(sample, {seed: 'test'});
assert.ok(chapters.length >= 5, 'should create at least five reading chapters');

chapters.forEach(chapter => {
  assert.ok(chapter.id && chapter.title, 'chapter should have identity');
  assert.ok(chapter.bodyParagraphs.length >= 3, 'core chapter should be substantial and open');
  assert.ok(Array.isArray(chapter.supportBlocks), 'chapter should expose supporting learning blocks');
  assert.ok(chapter.deep && chapter.deep.sections.length >= 4, 'deep expansion should be structured');
  assert.ok(chapter.deep.takeaway, 'deep expansion should end with a takeaway');
});

const takeaways = reading.buildTakeaways(sample, chapters);
assert.ok(takeaways.length >= 4, 'book should end with several takeaways');

console.log('book reading model tests: OK');


const richSample = {
  id:'rich-refresh',
  slug:'rich-refresh',
  title:'Rich Refresh Book',
  content:{
    summary:'ספר עשיר עם הרבה נושאים ורעיונות שונים.',
    ideas:['רעיון א','רעיון ב','רעיון ג','רעיון ד','רעיון ה','רעיון ו'],
    topics:['נושא א','נושא ב','נושא ג','נושא ד','נושא ה','נושא ו'],
    feed_posts:['פוסט א','פוסט ב','פוסט ג','פוסט ד','פוסט ה','פוסט ו','פוסט ז','פוסט ח']
  }
};
const firstSet = reading.buildReadingChapters(richSample,{seed:'first'});
const excludedTitles = firstSet.map(ch=>ch.title);
const refreshedSet = reading.buildReadingChapters(richSample,{seed:'second',fullRefresh:true,excludeTitles:excludedTitles});
assert.ok(refreshedSet.length >= 5, 'full refresh should still return a substantial chapter set');
assert.ok(refreshedSet.every(ch=>!excludedTitles.includes(ch.title)), 'full refresh should avoid all currently visible chapter titles when enough material exists');
assert.ok(refreshedSet.some(ch=>!['מפת הספר','מהרעיון לפעולה'].includes(ch.title)), 'full refresh should build chapters directly from alternate book material');


const keySentenceBook = {
  id:'key-sentences',
  slug:'key-sentences',
  title:'Key Sentences',
  content:{
    summary:'משוב מדויק מאפשר ללומד להבין איזו פעולה הצליחה. תזמון קובע אם המשוב מתחבר להתנהגות הנכונה.',
    ideas:[
      'חיזוק מוגדר לפי ההשפעה שלו על ההתנהגות העתידית.',
      'תזמון הוא מידע: משוב מאוחר עלול לחזק את הדבר הלא נכון.',
      'לומד צריך לדעת איזו פעולה בדיוק הובילה לתוצאה.'
    ],
    topics:['משוב','תזמון','למידה'],
    feed_posts:[
      'משוב שמגיע סמוך לפעולה עוזר לקשר בין ההתנהגות לבין התוצאה.',
      'אות מותנה עובד רק אם הוא ממשיך לנבא חיזוק אמיתי.',
      'כאשר מתקנים כמה דברים יחד, המסר ללומד נהיה פחות ברור.'
    ]
  }
};
const keyChapters = reading.buildReadingChapters(keySentenceBook,{seed:'keys'});
keyChapters.forEach(chapter=>{
  assert.ok(Array.isArray(chapter.keySentences), 'each chapter should expose key sentences for the left rail');
  assert.ok(chapter.keySentences.length >= 3, 'chapter should surface several key sentences when the book bank has enough material');
  assert.ok(chapter.keySentences.every(sentence=>!/^הפרק הזה|^דרך מועילה|^כדי להעמיק|^בסופו של דבר/.test(sentence)), 'key sentences should not be explanatory meta-text about the chapter');
});
