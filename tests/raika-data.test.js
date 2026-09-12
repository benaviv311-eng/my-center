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
  assert.ok(data.scenes.length >= 28);
  assert.ok(data.scenes.every(scene => scene.id && scene.title && scene.status));
});
