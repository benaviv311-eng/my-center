const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const pagePath = path.join(root, 'language-vocabulary.html');
const scriptPath = path.join(root, 'language-vocabulary.js');
const stylePath = path.join(root, 'language-vocabulary.css');
const bankPath = path.join(root, 'language-vocabulary-bank.js');
const feedLinkPath = path.join(root, 'language-vocabulary-link.js');

assert.ok(fs.existsSync(pagePath), 'language-vocabulary.html should exist');
assert.ok(fs.existsSync(scriptPath), 'language-vocabulary.js should exist');
assert.ok(fs.existsSync(stylePath), 'language-vocabulary.css should exist');
assert.ok(fs.existsSync(bankPath), 'language-vocabulary-bank.js should exist');
assert.ok(fs.existsSync(feedLinkPath), 'language-vocabulary-link.js should exist');

const html = fs.readFileSync(pagePath, 'utf8');
['vocab-language-switch','vocab-search','vocab-topic-nav','vocab-sections','vocab-summary'].forEach(id => {
  assert.ok(html.includes(`id="${id}"`), `language-vocabulary.html should contain ${id}`);
});
assert.ok(html.includes('language-vocabulary-bank.js'), 'vocabulary page should load the standalone vocabulary bank');
assert.ok(!html.includes('id="vocab-status"'), 'vocabulary bank should not show progress/status filtering');

const js = fs.readFileSync(scriptPath, 'utf8');
assert.ok(js.includes('LanguageVocabularyBank'), 'vocabulary page should render from the standalone bank');
assert.ok(!js.includes('wordStatus'), 'vocabulary bank should not depend on learning progress');
assert.ok(!js.includes('data-set-status'), 'vocabulary bank should not render progress buttons');

const bank = require(bankPath);
assert.ok(bank && bank.TOPICS && bank.LANGUAGES, 'vocabulary bank should export topics and languages');
['ar','it','ru','es'].forEach(code => assert.ok(bank.LANGUAGES[code], `bank should support ${code}`));
['verbs','adjectives','nouns','places'].forEach(topic => assert.ok(bank.TOPICS[topic], `bank should include ${topic}`));
assert.ok(Object.keys(bank.TOPICS).length >= 12, 'vocabulary bank should include many broad topics');
Object.entries(bank.TOPICS).forEach(([topic,data]) => {
  assert.strictEqual(data.words.length, 100, `${topic} should contain exactly 100 vocabulary entries`);
  data.words.forEach((word,index) => {
    assert.ok(word.he, `${topic} word ${index+1} should have Hebrew meaning`);
    ['ar','it','ru','es'].forEach(code => {
      assert.ok(word[code] && word[code].target, `${topic} word ${index+1} should have ${code} translation`);
    });
  });
});

const home = fs.readFileSync(path.join(root, 'languages.html'), 'utf8');
assert.ok(home.includes('language-vocabulary-link.js'), 'languages feed should keep the vocabulary tab integration');
const feedLink = fs.readFileSync(feedLinkPath, 'utf8');
assert.ok(feedLink.includes('language-vocabulary.html'), 'frozen vocabulary tab should point to the shared vocabulary bank');
assert.ok(!feedLink.includes('currentLanguage()'), 'vocabulary tab should not depend on the selected feed language');
assert.ok(feedLink.includes('feed-context-links'), 'vocabulary link should stay in the existing frozen toolbar');

console.log('language vocabulary tests: OK');
