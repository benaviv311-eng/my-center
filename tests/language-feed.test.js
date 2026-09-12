const assert = require('assert');
const fs = require('fs');
const path = require('path');
const feed = require('../language-four-feed-model.js');

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

// Dedicated “4 languages” feed mode: each post carries the same learning slot in all four languages.
assert.strictEqual(typeof feed.buildFourLanguageFeed, 'function', 'model should expose buildFourLanguageFeed');
const fourFeed = feed.buildFourLanguageFeed({seed:'four-feed', count:16});
assert.strictEqual(fourFeed.length,16);
const fourTypes = new Set(fourFeed.map(x=>x.type));
['word','sentence','joke','story','dialogue','challenge','culture'].forEach(t=>assert.ok(fourTypes.has(t), `four-language feed should include ${t}`));
fourFeed.forEach(card => {
  assert.strictEqual(card.lang, 'four');
  assert.deepStrictEqual(new Set(Object.keys(card.variants)), new Set(['ar','it','ru','es']));
});
const fourWord = fourFeed.find(x=>x.type==='word');
assert.ok(fourWord.hebrew, 'four-language word should expose a shared Hebrew meaning');
assert.strictEqual(new Set(Object.values(fourWord.variants).map(x=>x.item.he)).size, 1, 'word variants should share the same Hebrew meaning');

// Learning games: inline feed cards + a dedicated games page.
assert.ok(Array.isArray(feed.GAME_TYPES), 'model should expose GAME_TYPES');
['flashcards','memory','matching','sentence-builder','recall','speed','four-languages'].forEach(type => {
  assert.ok(feed.GAME_TYPES.includes(type), `GAME_TYPES should include ${type}`);
});
const arFlash = feed.buildMiniGame({type:'flashcards', filter:'ar', seed:'game-ar'});
assert.strictEqual(arFlash.type, 'flashcards');
assert.strictEqual(arFlash.lang, 'ar');
assert.ok(arFlash.items.length >= 4);
assert.ok(arFlash.items.every(item => item.lang === 'ar'));
const mixedGame = feed.buildMiniGame({type:'four-languages', filter:'all', seed:'game-mixed'});
assert.strictEqual(mixedGame.type, 'four-languages');
assert.deepStrictEqual(new Set(mixedGame.items.map(item => item.lang)), new Set(['ar','it','ru','es']));
const sentenceGame = feed.buildMiniGame({type:'sentence-builder', filter:'ru', seed:'game-sentence'});
assert.ok(sentenceGame.words.length >= 2);
assert.ok(sentenceGame.answer.length >= 2);

assert.strictEqual(typeof feed.buildFourLanguageMiniGame, 'function', 'model should expose buildFourLanguageMiniGame');
['flashcards','memory','matching','sentence-builder','recall','speed'].forEach(type => {
  const game = feed.buildFourLanguageMiniGame({type, seed:`four-game-${type}`});
  assert.strictEqual(game.lang, 'four');
  assert.strictEqual(game.type, type);
  assert.deepStrictEqual(new Set(Object.keys(game.variants)), new Set(['ar','it','ru','es']), `${type} should carry all four languages`);
});

const home = fs.readFileSync(path.join(__dirname,'..','languages.html'),'utf8');
['feed-filter-all','feed-filter-four','feed-filter-ar','feed-filter-it','feed-filter-ru','feed-filter-es','feed-refresh','language-feed','feed-load-more'].forEach(id => {
  assert.ok(home.includes(`id="${id}"`), `languages.html should contain ${id}`);
});
assert.ok(home.includes('language-feed-model.js'));
assert.ok(home.includes('language-four-feed-model.js'));
assert.ok(home.includes('languages-feed.js'));
assert.ok(home.includes('languages-feed.css'));
assert.ok(fs.existsSync(path.join(__dirname,'..','languages-feed.js')));
assert.ok(fs.existsSync(path.join(__dirname,'..','languages-feed.css')));

const feedJs = fs.readFileSync(path.join(__dirname,'..','languages-feed.js'),'utf8');
assert.ok(feedJs.includes("state.filter==='four'"), 'feed renderer should handle the dedicated four-language mode');
assert.ok(feedJs.includes('fourLanguageCardHtml'), 'feed renderer should render four-language cards');
assert.ok(feedJs.includes('fourLanguageMiniGameMoment'), 'feed renderer should render four-language mini games');

const gamesPage = path.join(__dirname,'..','language-games.html');
assert.ok(fs.existsSync(gamesPage), 'language-games.html should exist');
const gamesHtml = fs.readFileSync(gamesPage,'utf8');
['games-language-filter','games-grid','daily-mix-start'].forEach(id => {
  assert.ok(gamesHtml.includes(`id="${id}"`), `language-games.html should contain ${id}`);
});
assert.ok(gamesHtml.includes('language-games.js'));
assert.ok(gamesHtml.includes('language-games.css'));
assert.ok(fs.existsSync(path.join(__dirname,'..','language-games.js')));
assert.ok(fs.existsSync(path.join(__dirname,'..','language-games.css')));

console.log('language feed + games tests: OK');
