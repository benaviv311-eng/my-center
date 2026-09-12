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
assert.ok(audio.includes('LanguageCore'), 'audio helper should resolve original target text from lesson data when only transliteration is visible');
['.vocab-word-primary','.vocab-primary','.four-primary','.four-study-lang','.quiz-prompt','.feed-primary'].forEach(selector => {
  assert.ok(audio.includes(selector), `audio helper should decorate ${selector}`);
});
assert.ok(audio.includes('.target'), 'audio helper should speak original target-language text, not learner transliteration');

const pages = ['languages.html','language-vocabulary.html','language-study.html','four-languages.html'];
pages.forEach(file => {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  assert.ok(html.includes('language-audio.js'), `${file} should load the shared audio helper`);
});

console.log('language audio tests: OK');
