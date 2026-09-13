const test = require('node:test');
const assert = require('node:assert/strict');

async function core(){ return import('../supabase/functions/_shared/raika-feed-core.mjs'); }

test('request count is clamped and unknown actions are rejected', async () => {
  const c = await core();
  assert.equal(c.normalizeFeedRequest({action:'generate',count:99}).count, 12);
  assert.equal(c.normalizeFeedRequest({action:'generate',count:0}).count, 1);
  assert.throws(() => c.normalizeFeedRequest({action:'publish'}));
});

test('generated cards normalize to proposal-safe feed cards', async () => {
  const c = await core();
  const card = c.normalizeGeneratedCard({
    type:'scene', title:'  מבחן ', body:'רעיון', creativity_distance:'natural',
    characters:['raika'], tags:['משפחה']
  });
  assert.equal(card.title, 'מבחן');
  assert.equal(card.creativity_distance, 'natural');
  assert.deepEqual(card.characters, ['raika']);
  assert.equal(card.status, 'proposal');
});

test('dedupe rejects near-identical cards unless more-like-this is explicit', async () => {
  const c = await core();
  const old = {title:'ראיקה מבקשת עזרה מאוקנה',body:'ראיקה נאלצת לבקש עזרה מאוקנה',card_type:'relationship',characters:['raika','okane']};
  const newer = {title:'ראיקה מבקשת את עזרת אוקנה',body:'ראיקה נאלצת לבקש מאוקנה עזרה',card_type:'relationship',characters:['raika','okane']};
  assert.equal(c.dedupeCards([newer],[old],{allowSeedVariation:false}).length, 0);
  assert.equal(c.dedupeCards([newer],[old],{allowSeedVariation:true}).length, 1);
});

test('more-like permits seed similarity but still dedupes its own new batch', async () => {
  const c = await core();
  const seed = {title:'ראיקה מבקשת עזרה מאוקנה',body:'ראיקה נאלצת לבקש עזרה מאוקנה',card_type:'relationship',characters:['raika','okane']};
  const a = {title:'ראיקה מבקשת את עזרת אוקנה',body:'ראיקה נאלצת לבקש מאוקנה עזרה אחרי ויכוח',card_type:'relationship',characters:['raika','okane']};
  const b = {title:'ראיקה מבקשת עזרה מאוקנה אחרי ויכוח',body:'אחרי ויכוח ראיקה נאלצת לבקש מאוקנה עזרה',card_type:'relationship',characters:['raika','okane']};
  assert.equal(c.dedupeCards([a,b],[seed],{allowSeedVariation:true}).length, 1);
});

test('feedback weighting keeps exploration quota', async () => {
  const c = await core();
  const p = c.summarizeFeedback([
    {action:'more_like',metadata:{card_type:'family'}},
    {action:'developed',metadata:{card_type:'family'}},
    {action:'less_like',metadata:{card_type:'villain'}}
  ]);
  assert.ok(p.weights.family > 0);
  assert.ok(p.weights.villain < 0);
  assert.equal(p.exploration_ratio, 0.2);
});

test('feed schema requires an array of structured cards', async () => {
  const c = await core();
  const schema = c.buildFeedSchema(8);
  assert.equal(schema.type, 'object');
  assert.equal(schema.properties.cards.type, 'array');
  assert.equal(schema.properties.cards.maxItems, 8);
  assert.ok(schema.required.includes('cards'));
});
