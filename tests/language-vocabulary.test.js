const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const pagePath = path.join(root, 'language-vocabulary.html');
const scriptPath = path.join(root, 'language-vocabulary.js');
const stylePath = path.join(root, 'language-vocabulary.css');
const bankPath = path.join(root, 'language-vocabulary-bank.js');
const viewModelPath = path.join(root, 'language-vocabulary-view-model.js');

assert.ok(fs.existsSync(pagePath), 'language-vocabulary.html should exist');
assert.ok(fs.existsSync(scriptPath), 'language-vocabulary.js should exist');
assert.ok(fs.existsSync(stylePath), 'language-vocabulary.css should exist');
assert.ok(fs.existsSync(bankPath), 'language-vocabulary-bank.js should exist');
assert.ok(fs.existsSync(viewModelPath), 'language-vocabulary-view-model.js should exist');

const html = fs.readFileSync(pagePath, 'utf8');
['vocab-language-switch','vocab-search','vocab-topic-nav','vocab-sections','vocab-summary'].forEach(id => {
  assert.ok(html.includes(`id="${id}"`), `language-vocabulary.html should contain ${id}`);
});
assert.ok(html.includes('language-vocabulary-bank.js'), 'vocabulary page should load the standalone vocabulary bank');
assert.ok(html.includes('language-vocabulary-view-model.js'), 'vocabulary page should load the lazy view model');
assert.ok(!html.includes('id="vocab-status"'), 'vocabulary bank should not show progress/status filtering');

const js = fs.readFileSync(scriptPath, 'utf8');
assert.ok(js.includes('LanguageVocabularyBank'), 'vocabulary page should render from the standalone bank');
assert.ok(js.includes('LanguageVocabularyViewModel'), 'vocabulary page should use the lazy view model');
assert.ok(!js.includes('wordStatus'), 'vocabulary bank should not depend on learning progress');
assert.ok(!js.includes('data-set-status'), 'vocabulary bank should not render progress buttons');
assert.ok(!js.includes('function renderSections()'), 'vocabulary page should not eagerly render every topic');

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

const createViewModel = require(viewModelPath);
const view = createViewModel(bank);
assert.strictEqual(view.topicEntries('verbs').length, 100, 'opening a topic should expose only its 100 entries');
assert.strictEqual(view.initialEntries().length, 100, 'initial vocabulary render should be limited to one topic');
assert.ok(view.search('בית').length > 0, 'search should still search the whole bank');

const home = fs.readFileSync(path.join(root, 'languages.html'), 'utf8');
const esIndex = home.indexOf('id="feed-filter-es"');
const vocabIndex = home.indexOf('id="feed-vocabulary-tab"');
assert.ok(esIndex >= 0 && vocabIndex > esIndex, 'frozen vocabulary tab should sit directly to the left of Spanish in the RTL filter row');
assert.ok(home.includes('id="feed-vocabulary-tab" class="feed-filter"'), 'vocabulary tab should use the exact same visual style as language filters');
assert.ok(home.includes('href="language-vocabulary.html"'), 'frozen vocabulary tab should point to the shared vocabulary bank');
assert.ok(!home.includes('language-vocabulary-link.js'), 'home should not inject a second language-specific vocabulary link');

console.log('language vocabulary tests: OK');
