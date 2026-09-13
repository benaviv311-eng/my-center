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
