import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html=()=>readFileSync(new URL('../nutrition-builder.html',import.meta.url),'utf8');

test('builder loads professional planner and shared profile modules',()=>{
  const s=html();
  assert.match(s,/nutrition-meals\.js/);
  assert.match(s,/nutrition-planner\.js/);
  assert.match(s,/nutrition-profile\.js/);
  assert.ok(s.indexOf('nutrition-meals.js')<s.indexOf('nutrition-planner.js'));
  assert.ok(s.indexOf('nutrition-planner.js')<s.indexOf('nutrition-profile.js'));
});

test('build button uses the professional planner instead of legacy optimizer',()=>{
  const s=html();
  const build=s.slice(s.indexOf('function buildMenu(){'),s.indexOf('function renderMenu('));
  assert.match(build,/NutritionPlanner\.planDay/);
  assert.doesNotMatch(build,/optimize\(/);
});

test('menu exposes save-to-profile action and quality diagnostics',()=>{
  const s=html();
  assert.match(s,/שמור בפרופיל/);
  assert.match(s,/איכות וגיוון/);
  assert.match(s,/qualityDiagnostics/);
  assert.match(s,/toggleSavedFood/);
});

test('professional render path uses planner meal assignment and does not split duplicates',()=>{
  const s=html();
  const render=s.slice(s.indexOf('function renderMenu('),s.indexOf('function renderBalance(){'));
  assert.match(render,/res\.planner\.meals/);
  assert.doesNotMatch(render,/distributeItems\(/);
});

test('builder supports optional sport mode without workout-time invention',()=>{
  const s=html();
  assert.match(s,/id="sportMode"/);
  assert.match(s,/sportMode/);
  assert.doesNotMatch(s,/pre-workout|post-workout/);
});

test('government food normalization uses nullable nutrients instead of zero defaults',()=>{
  const s=html();
  const fn=s.slice(s.indexOf('function govFoodFromRow'),s.indexOf('function govName'));
  assert.match(fn,/nullableNumber/);
  assert.doesNotMatch(fn,/const p=num\(/);
});
