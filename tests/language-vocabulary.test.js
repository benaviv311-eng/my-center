const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const pagePath = path.join(root, 'language-vocabulary.html');
const scriptPath = path.join(root, 'language-vocabulary.js');
const stylePath = path.join(root, 'language-vocabulary.css');
const feedLinkPath = path.join(root, 'language-vocabulary-link.js');

assert.ok(fs.existsSync(pagePath), 'language-vocabulary.html should exist');
assert.ok(fs.existsSync(scriptPath), 'language-vocabulary.js should exist');
assert.ok(fs.existsSync(stylePath), 'language-vocabulary.css should exist');
assert.ok(fs.existsSync(feedLinkPath), 'language-vocabulary-link.js should exist');

const html = fs.readFileSync(pagePath, 'utf8');
['vocab-language-switch','vocab-search','vocab-topic-nav','vocab-sections','vocab-summary'].forEach(id => {
  assert.ok(html.includes(`id="${id}"`), `language-vocabulary.html should contain ${id}`);
});
assert.ok(html.includes('language-core.js'), 'vocabulary page should load language-core.js');
assert.ok(html.includes('language-topic-expansion.js'), 'vocabulary page should load expanded topics');
assert.ok(html.includes('language-vocabulary.js'), 'vocabulary page should load vocabulary behavior');
assert.ok(html.includes('language-vocabulary.css'), 'vocabulary page should load vocabulary styles');

const js = fs.readFileSync(scriptPath, 'utf8');
assert.ok(js.includes('C.TOPIC_META'), 'vocabulary should render topics from the shared topic catalog');
assert.ok(js.includes('C.course'), 'vocabulary should render words from the shared language courses');
assert.ok(js.includes("'known'"), 'vocabulary should support known status');
assert.ok(js.includes("'practice'"), 'vocabulary should support practice status');
assert.ok(js.includes('language-games.html?lang='), 'vocabulary should link each language to games');

const home = fs.readFileSync(path.join(root, 'languages.html'), 'utf8');
assert.ok(home.includes('language-vocabulary-link.js'), 'languages feed should load vocabulary link integration');
const feedLink = fs.readFileSync(feedLinkPath, 'utf8');
assert.ok(feedLink.includes('language-vocabulary.html?lang='), 'single-language feed should link to vocabulary by topic');
assert.ok(feedLink.includes('feed-context-links'), 'vocabulary link should integrate with feed context links');

console.log('language vocabulary tests: OK');
