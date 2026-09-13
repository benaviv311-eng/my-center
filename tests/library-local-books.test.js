const test = require('node:test');
const assert = require('node:assert/strict');
const local = require('../library-local-books.js');

test('adds Don’t Shoot the Dog to a remote library payload', () => {
  const payload = local.mergePayload({books:[{id:'remote-1',slug:'other',title:'Other',content:{}}]});
  const book = payload.books.find(b => b.slug === 'dont-shoot-the-dog');
  assert.ok(book);
  assert.equal(book.title, "Don't Shoot the Dog! — Karen Pryor");
  assert.ok(book.content.feed_posts.length >= 10);
  assert.equal(book.content.original_text_asset, 'content/dont-shoot-the-dog/summaries.json');
});

test('merges with an existing server copy instead of duplicating it', () => {
  const payload = local.mergePayload({books:[{id:'server-id',slug:'dont-shoot-the-dog',title:'Server title',content:{serverOnly:true}}]});
  const matches = payload.books.filter(b => b.slug === 'dont-shoot-the-dog');
  assert.equal(matches.length, 1);
  assert.equal(matches[0].id, 'server-id');
  assert.equal(matches[0].content.serverOnly, true);
  assert.ok(matches[0].content.ideas.length >= 10);
});

test('only intercepts the library json endpoint', () => {
  assert.equal(local.isLibraryJsonUrl('https://example.com/functions/v1/library-feed?json=1'), true);
  assert.equal(local.isLibraryJsonUrl('https://example.com/functions/v1/library-feed'), false);
  assert.equal(local.isLibraryJsonUrl('https://example.com/anything-else?json=1'), false);
});
