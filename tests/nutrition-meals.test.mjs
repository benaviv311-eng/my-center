import test from 'node:test';
import assert from 'node:assert/strict';
import Meals from '../nutrition-meals.js';

test('meal count defaults to 3 and is constrained to 1-6', () => {
  assert.equal(Meals.normalizeMealCount(undefined), 3);
  assert.equal(Meals.normalizeMealCount(0), 1);
  assert.equal(Meals.normalizeMealCount(7), 6);
  assert.equal(Meals.normalizeMealCount('5'), 5);
});

test('creates exactly the requested number of meal slots', () => {
  const meals = Meals.createMealShells(5);
  assert.equal(meals.length, 5);
  assert.deepEqual(meals.map(m => m.name), ['ארוחה 1','ארוחה 2','ארוחה 3','ארוחה 4','ארוחה 5']);
});

test('splits available food portions when needed so requested meals are not empty', () => {
  const items = [
    { f: { id: 'rice', k: 130 }, q: 300 },
    { f: { id: 'chicken', k: 165 }, q: 300 }
  ];
  const meals = Meals.distributeItems(items, 4);
  assert.equal(meals.length, 4);
  assert.ok(meals.every(m => m.items.length > 0));
  const total = meals.flatMap(m => m.items).reduce((sum, x) => sum + x.q, 0);
  assert.equal(Math.round(total), 600);
});
