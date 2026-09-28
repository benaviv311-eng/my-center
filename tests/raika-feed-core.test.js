const test = require('node:test');
const assert = require('node:assert/strict');

async function core(){ return import('../supabase/functions/_shared/raika-feed-core.mjs'); }

test('request count is clamped and unknown actions are rejected', async () => {
  const c = await core();
  assert.equal(c.normalizeFeedRequest({action:'generate',count:99}).count, 12);
  assert.equal(c.normalizeFeedRequest({action:'generate',count:0}).count, 1);
  assert.throws(() => c.normalizeFeedRequest({action:'publish'}));
});

test('recent signatures keep enough content for exact deduplication', async () => {
  const c = await core();
  const signature='x'.repeat(700);
  const out=c.normalizeFeedRequest({action:'generate',recent_signatures:[signature]});
  assert.equal(out.recent_signatures[0].length,700);
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

test('OpenAI errors preserve HTTP status in a stable code', async () => {
  const c = await core();
  assert.equal(c.mapOpenAIError(401),'openai_401');
  assert.equal(c.mapOpenAIError(429),'openai_429');
  assert.equal(c.mapOpenAIError(500),'openai_500');
});

test('refresh_all supports 24 cards while normal generation remains capped at 12', async () => {
  const c=await core();
  assert.equal(c.normalizeFeedRequest({action:'refresh_all',count:24}).count,24);
  assert.equal(c.normalizeFeedRequest({action:'generate',count:24}).count,12);
});

test('block_forever requires a seed card id', async () => {
  const c=await core();
  assert.throws(()=>c.normalizeFeedRequest({action:'block_forever'}),/seed/i);
  assert.equal(c.normalizeFeedRequest({action:'block_forever',seed_card_id:'abc'}).seed_card_id,'abc');
});

test('request bounds blocked context and carries novelty filters', async () => {
  const c=await core();
  const many=Array.from({length:200},(_,i)=>`x-${i}`);
  const out=c.normalizeFeedRequest({
    action:'refresh_all',count:24,blocked_signatures:many,blocked_fingerprints:many,
    filter_type:'new',novelty_target:0.9
  });
  assert.ok(out.blocked_signatures.length<=120);
  assert.ok(out.blocked_fingerprints.length<=120);
  assert.equal(out.filter_type,'new');
  assert.equal(out.novelty_target,0.9);
});

test('semantic fingerprint and block matching reject normalized near equivalents', async () => {
  const c=await core();
  const a={card_type:'relationship',characters:['raika','okane'],plot_family:'trust',title:'ראיקה מבקשת עזרה מאוקנה',body:'ראיקה נאלצת לבקש עזרה'};
  const b={card_type:'relationship',characters:['okane','raika'],plot_family:'trust',title:'ראיקה מבקשת את עזרת אוקנה',body:'ראיקה חייבת לבקש עזרה'};
  const fp=c.semanticFingerprint(a);
  assert.equal(typeof fp,'string');
  assert.ok(fp.length>0);
  assert.equal(c.isBlockedCard(b,[{semantic_fingerprint:fp,plot_family:'trust',scope:'family'}]),true);
});

test('feed prompt includes blocked context and novelty target', async () => {
  const c=await core();
  const prompt=c.buildFeedPrompt({
    count:8,baseContext:{},workspace:[],recentCards:[],preferences:{},
    blockedRows:[{semantic_fingerprint:'abc',plot_family:'family-secret'}],
    noveltyTarget:0.8,filterType:'new'
  });
  assert.match(prompt,/0\.8/);
  assert.match(prompt,/family-secret/);
  assert.match(prompt,/חדש|novel/i);
});


test('permanent blocks reject a semantically close rewording using stored blocked text', async () => {
  const coreModule=await core();
  const blocked={title:'ראיקה מגלה יומן ישן של קאמינארי',body:'ראיקה מוצאת יומן עתיק של קאמינארי ובו סוד משפחתי.',semantic_fingerprint:'old-fp',plot_family:'journal-discovery',scope:'fingerprint'};
  const candidate={card_type:'secret',characters:['raika','kaminari'],title:'ראיקה מוצאת מחברת עתיקה של קאמינארי',body:'ראיקה מגלה מחברת ישנה של קאמינארי שחושפת סוד משפחתי.',plot_family:'journal-discovery'};
  assert.equal(coreModule.isBlockedCard(candidate,[blocked]),true);
});


test('semantic fresh filter rejects reworded recent premises and duplicates within a new batch', async () => {
  const coreModule=await core();
  const recent=[{title:'ראיקה מגלה סוד משפחתי ביומן ישן',body:'ראיקה מוצאת יומן עתיק שחושף סוד משפחתי של קאמינארי.'}];
  const cards=[
    {title:'יומן ישן חושף לראיקה סוד משפחתי',body:'ראיקה מגלה מחברת עתיקה ובה סוד משפחתי הקשור לקאמינארי.'},
    {title:'אימון על גשר צר',body:'ראיקה צריכה להשלים אימון שיווי משקל על גשר בזמן שרוח חזקה משנה את חוקי התרגיל.'},
    {title:'רוח חזקה באימון הגשר',body:'בתרגיל על גשר צר ראיקה נאבקת בשיווי משקל מול רוח שמשנה את המשימה.'}
  ];
  const out=coreModule.filterSemanticallyFresh(cards,recent,0.5);
  assert.equal(out.length,1);
  assert.match(out[0].title,/גשר/);
});

test('feed request keeps a larger cross-interface signature history', async () => {
  const coreModule=await core();
  const many=Array.from({length:240},(_,i)=>'sig-'+i);
  const out=coreModule.normalizeFeedRequest({action:'refresh_all',recent_signatures:many});
  assert.equal(out.recent_signatures.length,240);
});
