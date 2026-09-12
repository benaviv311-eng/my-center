const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const expansionPath = path.join(root, 'language-topic-expansion.js');
const fourHtmlPath = path.join(root, 'four-languages.html');
const fourJsPath = path.join(root, 'four-languages.js');

assert.ok(fs.existsSync(expansionPath), 'language-topic-expansion.js should exist');
assert.ok(fs.existsSync(fourHtmlPath), 'four-languages.html should exist');
assert.ok(fs.existsSync(fourJsPath), 'four-languages.js should exist');

const expansion = require(expansionPath);
const requiredTopics = ['verbs','adjectives','cinema','music','school','work','shopping','travel','home','health','emotions','weather','technology','colors','numbers'];
requiredTopics.forEach(id => assert.ok(expansion.TOPIC_META[id], `missing topic ${id}`));
assert.ok(Object.keys(expansion.TOPIC_META).length >= 15, 'should expose at least 15 expanded topics');

['ar','it','ru','es'].forEach(lang => {
  requiredTopics.forEach(topic => {
    const course = expansion.COURSES[lang] && expansion.COURSES[lang][topic];
    assert.ok(course, `${lang}/${topic} should have a course`);
    assert.ok(course.words.length >= 8, `${lang}/${topic} should have at least 8 vocabulary words`);
    assert.ok(course.sentences.length >= 4, `${lang}/${topic} should have at least 4 sentences`);
  });
});

requiredTopics.forEach(topic => {
  const ids = expansion.COURSES.ar[topic].words.map(w => w[0]);
  ['it','ru','es'].forEach(lang => assert.deepStrictEqual(expansion.COURSES[lang][topic].words.map(w => w[0]), ids, `${topic} should align concept ids across languages`));
});

const fourHtml = fs.readFileSync(fourHtmlPath, 'utf8');
['four-mode-word','four-mode-sentence','four-topic','four-refresh','four-grid'].forEach(id => {
  assert.ok(fourHtml.includes(`id="${id}"`), `four-languages.html should contain ${id}`);
});
assert.ok(fourHtml.includes('language-topic-expansion.js'), 'four-language page should load expanded topics');

const topicsHtml = fs.readFileSync(path.join(root, 'language-topics.html'), 'utf8');
const topicsJs = fs.readFileSync(path.join(root, 'language-topics.js'), 'utf8');
const studyHtml = fs.readFileSync(path.join(root, 'language-study.html'), 'utf8');
const archiveHtml = fs.readFileSync(path.join(root, 'language-archive.html'), 'utf8');
assert.ok(topicsHtml.includes('language-topic-expansion.js'), 'topics page should load expanded topics');
assert.ok(topicsJs.includes('topic-vocab'), 'topics page should render vocabulary inside each topic');
assert.ok(studyHtml.includes('language-topic-expansion.js'), 'study page should load expanded topics');
assert.ok(archiveHtml.includes('language-topic-expansion.js'), 'archive page should load expanded topics');

const home = fs.readFileSync(path.join(root, 'languages.html'), 'utf8');
assert.ok(home.includes('four-languages.html'), 'languages home should link to four-language view');

console.log('expanded topics and four-language tests: OK');
