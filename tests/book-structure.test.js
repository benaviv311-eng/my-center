const assert = require('assert');
const S = require('../book-structure.js');

const richBook = {
  title: 'Example Book',
  content: {
    summary: 'Short summary.',
    key_points: Array.from({length: 14}, (_, i) => `Key ${i + 1}`),
    learning_points: Array.from({length: 36}, (_, i) => ({title: `Point ${i + 1}`, text: `Explanation ${i + 1}`})),
    ideas: ['Fallback idea'],
    feed_posts: ['Fallback post']
  }
};

const rich = S.buildBookStructure(richBook);
assert.equal(rich.summary, 'Short summary.');
assert.equal(rich.keyPoints.length, 12, 'curated key points should be capped at 12');
assert.equal(rich.learningPoints.length, 30, 'expanded learning points should be capped at 30');
assert.equal(rich.keyPoints[0].text, 'Key 1', 'curated key points should be preferred');
assert.equal(rich.learningPoints[0].title, 'Point 1', 'structured learning point titles should be preserved');
assert.equal(rich.hasExtendedLearning, true, 'rich books should expose the expanded learning section');

const fallbackBook = {
  title: 'Fallback Book',
  content: {
    summary: 'Fallback summary',
    ideas: ['Idea A', 'Idea B', 'Idea A'],
    feed_posts: ['Post A', 'Post B', 'Post C'],
    topics: ['Topic A']
  }
};
const fallback = S.buildBookStructure(fallbackBook);
assert.deepEqual(
  fallback.keyPoints.map(point => point.text),
  ['Idea A', 'Idea B', 'Post A', 'Post B', 'Post C'],
  'books without curated fields should still get key points from existing material'
);
assert.deepEqual(
  fallback.learningPoints.map(point => point.text),
  ['Idea A', 'Idea B', 'Post A', 'Post B', 'Post C'],
  'books without expanded fields should still get a stable learning-points collection'
);
assert.equal(fallback.hasExtendedLearning, false, 'do not show a redundant expanded list when it adds nothing');

const mixed = S.buildBookStructure({
  content: {
    key_points: ['Essential A', 'Essential B'],
    learning_points: ['Essential A', 'Deep C', 'Deep D']
  }
});
assert.deepEqual(mixed.keyPoints.map(point => point.text), ['Essential A', 'Essential B']);
assert.deepEqual(mixed.learningPoints.map(point => point.text), ['Essential A', 'Deep C', 'Deep D']);
assert.equal(mixed.hasExtendedLearning, true);

console.log('universal book structure tests: OK');
