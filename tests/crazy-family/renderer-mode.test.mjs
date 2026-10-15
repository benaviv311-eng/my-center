import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveRendererMode } from '../../crazy-family/renderer-mode.js';

test('renderer=3d opts into world3d',()=>assert.equal(resolveRendererMode('?renderer=3d'),'world3d'));
test('missing renderer stays cinematic',()=>assert.equal(resolveRendererMode(''),'cinematic'));
test('unknown renderer value stays cinematic',()=>assert.equal(resolveRendererMode('?renderer=banana'),'cinematic'));
