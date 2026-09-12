const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const expansionPath = path.join(root, 'language-topic-expansion.js');
const fourHtmlPath = path.join(root, 'four-languages.html');
const fourJsPath = path.join(root, 'four-languages.js');
const fourStudyJsPath = path.join(root, 'four-language-study.js');

assert.ok(fs.existsSync(expansionPath), 'language-topic-expansion.js should exist');
assert.ok(fs.existsSync(fourHtmlPath), 'four-languages.html should exist');
assert.ok(fs.existsSync(fourJsPath), 'four-languages.js should exist');
assert.ok(fs.existsSync(fourStudyJsPath), 'four-language-study.js should exist');

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
assert.ok(fourHtml.includes('four-language-study.js'), 'four-language page should load the full study behavior');

const studySectionIds = [
  'four-vocabulary-content','four-recognition-content','four-reverse-content','four-builder-content',
  'four-missing-content','four-truefalse-content','four-situation-content','four-translation-content',
  'four-dialogue-content','four-say-content','four-previous-content','four-mistakes-content','four-challenge-content'
];
studySectionIds.forEach(id => assert.ok(fourHtml.includes(`id="${id}"`), `four-language study should contain ${id}`));
assert.ok(fourHtml.includes('id="four-append-more"'), 'four-language study should support extra exercises');
assert.ok(fourHtml.includes('id="four-complete"'), 'four-language study should have its own completion action');

const fourStudyJs = fs.readFileSync(fourStudyJsPath, 'utf8');
['renderVocabulary','renderRecognition','renderReverse','renderBuilder','renderMissing','renderTrueFalse','renderSituation','renderTranslation','renderDialogue','renderSay','renderPrevious','renderMistakes','renderChallenge'].forEach(fn => {
  assert.ok(fourStudyJs.includes(`function ${fn}`), `four-language study should implement ${fn}`);
});
['ar','it','ru','es'].forEach(code => assert.ok(fourStudyJs.includes(`'${code}'`), `four-language study should include ${code}`));
assert.ok(fourStudyJs.includes('my-center-four-study-v1'), 'four-language study should keep its own mistakes/completion state');
assert.ok(fourStudyJs.includes('data-four-refresh'), 'four-language study should allow per-section refresh');

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
const feedJs = fs.readFileSync(path.join(root, 'languages-feed.js'), 'utf8');
assert.ok(feedJs.includes('href="four-languages.html"'), 'four-language feed cards should open the full four-language page');

console.log('expanded topics and full four-language study tests: OK');
