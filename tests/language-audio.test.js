const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const audioPath = path.join(root, 'language-audio.js');
assert.ok(fs.existsSync(audioPath), 'language-audio.js should exist');

const audio = fs.readFileSync(audioPath, 'utf8');
assert.ok(audio.includes('speechSynthesis'), 'audio helper should use browser speech synthesis');
assert.ok(audio.includes('SpeechSynthesisUtterance'), 'audio helper should create speech utterances');
['ar','it-IT','ru-RU','es-ES'].forEach(locale => assert.ok(audio.includes(locale), `audio helper should include ${locale}`));
assert.ok(audio.includes('data-audio-text'), 'audio helper should listen for delegated audio buttons');
assert.ok(audio.includes('cancel()'), 'audio helper should stop previous playback before starting a new one');

const pages = ['languages.html','language-vocabulary.html','language-study.html','four-languages.html'];
pages.forEach(file => {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  assert.ok(html.includes('language-audio.js'), `${file} should load the shared audio helper`);
});

const vocabulary = fs.readFileSync(path.join(root, 'language-vocabulary.js'), 'utf8');
assert.ok(vocabulary.includes('data-audio-text'), 'vocabulary cards should expose audio buttons');
assert.ok(vocabulary.includes('entry.word[lang].target'), 'vocabulary audio should speak the original target script');

const study = fs.readFileSync(path.join(root, 'language-study.js'), 'utf8');
assert.ok(study.includes('data-audio-text'), 'single-language study should expose audio buttons');
assert.ok(study.includes('.target'), 'single-language study audio should use target-language source text');

const four = fs.readFileSync(path.join(root, 'four-languages.js'), 'utf8');
assert.ok(four.includes('data-audio-text'), 'four-language comparison cards should expose audio buttons');

const fourStudy = fs.readFileSync(path.join(root, 'four-language-study.js'), 'utf8');
assert.ok(fourStudy.includes('data-audio-text'), 'four-language full study should expose audio buttons');

const feed = fs.readFileSync(path.join(root, 'languages-feed.js'), 'utf8');
assert.ok(feed.includes('data-audio-text'), 'feed language items should expose audio buttons');

console.log('language audio tests: OK');
