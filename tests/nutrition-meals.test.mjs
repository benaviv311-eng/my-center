import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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

test('scales all numeric nutrient values to the actual gram amount', () => {
  const scaled = Meals.nutrientsForQuantity({
    food_energy: 200,
    protein: 10,
    iron: '2.5',
    label: 'example'
  }, 150);
  assert.equal(scaled.food_energy, 300);
  assert.equal(scaled.protein, 15);
  assert.equal(scaled.iron, 3.75);
  assert.equal(scaled.label, 'example');
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

test('builder opens nutrition values for the exact menu quantity', () => {
  const html = readFileSync(new URL('../nutrition-builder.html', import.meta.url), 'utf8');
  assert.match(html, /showFoodValues\(f,q\)/);
  assert.match(html, /ערכים ל־\$\{Math\.round\(amount\)\} גרם/);
});

test('builder inline javascript is syntactically valid and build button is wired', () => {
  const html = readFileSync(new URL('../nutrition-builder.html', import.meta.url), 'utf8');
  const inlineScripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  assert.ok(inlineScripts.length > 0);
  for (const source of inlineScripts) assert.doesNotThrow(() => new Function(source));
  assert.match(html, /id="buildBtn">בנה לי תפריט<\/button>/);
  assert.match(html, /qs\('buildBtn'\)\.addEventListener\('click',buildMenu\)/);
});

test('profile meal helper does not install a self-triggering MutationObserver loop', () => {
  const source = readFileSync(new URL('../nutrition-profile-meals.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /new MutationObserver/);
});

test('stable food identity merges duplicate rows but keeps preparations distinct', () => {
  assert.equal(Meals.foodIdentity({ id: 'chicken' }), 'chicken');
  assert.equal(Meals.foodIdentity({ id: 'rice', preparation: 'cooked' }), 'rice::cooked');
  const merged = Meals.mergeDuplicateFoods([
    { f: { id: 'chicken', name: 'חזה עוף' }, q: 120 },
    { f: { id: 'chicken', name: 'חזה עוף' }, q: 80 },
    { f: { id: 'brownrice-cooked', name: 'אורז מלא מבושל' }, q: 150 },
    { f: { id: 'brownrice-dry', name: 'אורז מלא יבש' }, q: 70 }
  ]);
  assert.equal(merged.length, 3);
  assert.equal(merged.find(x => x.f.id === 'chicken').q, 200);
  assert.ok(merged.some(x => x.f.id === 'brownrice-cooked'));
  assert.ok(merged.some(x => x.f.id === 'brownrice-dry'));
});

test('unique assignment never clones a food just to fill requested meals', () => {
  const items = [
    { f: { id: 'rice', k: 130 }, q: 300 },
    { f: { id: 'chicken', k: 165 }, q: 300 }
  ];
  const meals = Meals.assignUniqueFoodsToMeals(items, 4);
  assert.equal(meals.length, 4);
  const assigned = meals.flatMap(m => m.items);
  assert.equal(assigned.length, 2);
  assert.equal(new Set(assigned.map(x => Meals.foodIdentity(x.f))).size, 2);
  assert.equal(assigned.reduce((sum, x) => sum + x.q, 0), 600);
  assert.equal(meals.filter(m => m.items.length === 0).length, 2);
});

test('nullableNumber keeps zero but returns null for missing or invalid values', () => {
  assert.equal(Meals.nullableNumber(0), 0);
  assert.equal(Meals.nullableNumber('2.5'), 2.5);
  assert.equal(Meals.nullableNumber(''), null);
  assert.equal(Meals.nullableNumber(null), null);
  assert.equal(Meals.nullableNumber('abc'), null);
});
