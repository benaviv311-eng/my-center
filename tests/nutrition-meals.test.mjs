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

test('calculates calories from grams using values per 100g', () => {
  assert.equal(Meals.caloriesForQuantity({ k: 111 }, 700), 777);
  assert.equal(Meals.caloriesForQuantity({ k: 350 }, 700), 2450);
});

test('does not place more than a food per-meal maximum in one meal', () => {
  const rice = { id: 'brownrice-cooked', k: 111, perMealMax: 250 };
  const meals = Meals.distributeItems([{ f: rice, q: 700 }], 3);
  const portions = meals.flatMap(m => m.items);
  assert.equal(Math.round(portions.reduce((sum, x) => sum + x.q, 0)), 700);
  assert.ok(portions.every(x => x.q <= 250));
});

test('calculates calories for each meal and for the whole day', () => {
  const meals = [
    { name: 'ארוחה 1', items: [{ f: { k: 111 }, q: 200 }, { f: { k: 165 }, q: 100 }] },
    { name: 'ארוחה 2', items: [{ f: { k: 98 }, q: 200 }] }
  ];
  assert.equal(Meals.mealCalories(meals[0]), 387);
  assert.equal(Meals.dailyCalories(meals), 583);
});

test('honors an explicit reasonable daily maximum over a legacy max', () => {
  assert.equal(Meals.reasonableDailyMax({ max: 700, dailyMax: 450, cat: 'carb' }), 450);
  assert.equal(Meals.reasonableDailyMax({ max: 700, cat: 'carb' }), 700);
});

test('generic brown rice requires a cooked or dry preparation choice', () => {
  const options = Meals.preparationChoices('אורז מלא');
  assert.equal(options.length, 2);
  assert.deepEqual(options.map(x => x.label), ['מבושל', 'יבש / לפני בישול']);
  assert.equal(options[0].food.k, 111);
  assert.equal(options[1].food.k, 366);
});

test('explicit brown rice preparation resolves directly', () => {
  assert.equal(Meals.preparedFoodFor('אורז מלא מבושל').id, 'brownrice-cooked');
  assert.equal(Meals.preparedFoodFor('אורז מלא יבש').id, 'brownrice-dry');
  assert.equal(Meals.preparedFoodFor('אורז מלא'), null);
});
