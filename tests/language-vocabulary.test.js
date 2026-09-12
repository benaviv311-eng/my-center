const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const pagePath = path.join(root, 'language-vocabulary.html');
const scriptPath = path.join(root, 'language-vocabulary.js');
const stylePath = path.join(root, 'language-vocabulary.css');

assert.ok(fs.existsSync(pagePath), 'language-vocabulary.html should exist');
assert.ok(fs.existsSync(scriptPath), 'language-vocabulary.js should exist');
assert.ok(fs.existsSync(stylePath), 'language-vocabulary.css should exist');

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

const feedJs = fs.readFileSync(path.join(root, 'languages-feed.js'), 'utf8');
assert.ok(feedJs.includes('language-vocabulary.html?lang='), 'single-language feed should link to vocabulary by topic');

console.log('language vocabulary tests: OK');
