const test = require('node:test');
const assert = require('node:assert/strict');
const O = require('../book-original-content.js');

test('parses unnumbered study-summary headings without inventing section numbers', () => {
  const parsed = O.parseOriginalBookMarkdown('# Study Notes\n\n## Targeting\nMove toward a target.');
  assert.equal(parsed.phaseTitle, 'Study Notes');
  assert.equal(parsed.sections.length, 1);
  assert.equal(parsed.sections[0].number, null);
  assert.equal(parsed.sections[0].title, 'Targeting');
  assert.equal(parsed.sections[0].body, 'Move toward a target.');
});

test('continues to parse numbered source headings', () => {
  const parsed = O.parseOriginalBookMarkdown('# Source\n\n## 3. Timing\nTiming matters.');
  assert.equal(parsed.sections[0].number, 3);
  assert.equal(parsed.sections[0].title, 'Timing');
});
