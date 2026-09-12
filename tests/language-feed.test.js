const assert = require('assert');
const fs = require('fs');
const path = require('path');
const feed = require('../language-feed-model.js');

assert.deepStrictEqual(feed.LANGUAGE_CODES, ['ar','it','ru','es']);
const mixed = feed.buildFeed({filter:'all', seed:'feed-a', count:16});
assert.strictEqual(mixed.length,16);
assert.deepStrictEqual(new Set(mixed.map(x=>x.lang)), new Set(['ar','it','ru','es']));
const onlyRu = feed.buildFeed({filter:'ru', seed:'feed-b', count:8});
assert.ok(onlyRu.every(x=>x.lang==='ru'));
const ar = feed.getDisplay({lang:'ar',target:'مرحبا',pron:'מַרְחַבַּא',he:'שלום'});
assert.strictEqual(ar.primary,'מַרְחַבַּא');
assert.strictEqual(ar.secondary,'مرحبا');
const ru = feed.getDisplay({lang:'ru',target:'привет',pron:'privet',he:'שלום'});
assert.strictEqual(ru.primary,'privet');
assert.strictEqual(ru.secondary,'привет');
const types = new Set(mixed.map(x=>x.type));
['word','sentence','joke','story','dialogue','challenge','culture'].forEach(t=>assert.ok(types.has(t)));
const changed = feed.buildFeed({filter:'all', seed:'feed-c', count:16});
assert.notDeepStrictEqual(changed.map(x=>x.id), mixed.map(x=>x.id));

const home = fs.readFileSync(path.join(__dirname,'..','languages.html'),'utf8');
['feed-filter-all','feed-filter-ar','feed-filter-it','feed-filter-ru','feed-filter-es','feed-refresh','language-feed','feed-load-more'].forEach(id => {
  assert.ok(home.includes(`id="${id}"`), `languages.html should contain ${id}`);
});
assert.ok(home.includes('language-feed-model.js'));
assert.ok(home.includes('languages-feed.js'));
assert.ok(home.includes('languages-feed.css'));
assert.ok(fs.existsSync(path.join(__dirname,'..','languages-feed.js')));
assert.ok(fs.existsSync(path.join(__dirname,'..','languages-feed.css')));

console.log('language feed tests: OK');
