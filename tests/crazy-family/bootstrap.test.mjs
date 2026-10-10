import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldUseLegacy, renderUnsupported, bootCrazyFamily } from '../../crazy-family/bootstrap.js';

test('legacy mode is explicit opt in only', () => {
  assert.equal(shouldUseLegacy(''), false);
  assert.equal(shouldUseLegacy('?foo=1'), false);
  assert.equal(shouldUseLegacy('?legacy=0'), false);
  assert.equal(shouldUseLegacy('?legacy=1'), true);
  assert.equal(shouldUseLegacy('?legacy=true'), false);
});

test('unsupported WebGL renders a visible message without invoking legacy', () => {
  const root = { innerHTML: '' };
  renderUnsupported(root, new Error('WebGL unavailable'));
  assert.match(root.innerHTML, /WebGL/i);
  assert.doesNotMatch(root.innerHTML, /legacy/i);
});

test('bootstrap rejects missing root before creating a runtime', async () => {
  await assert.rejects(() => bootCrazyFamily({ root: null, legacyAdapter: {} }), /root/i);
});
