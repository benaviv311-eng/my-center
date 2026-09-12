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
assert.ok(audio.includes("if((lang==='ar'||lang==='ru')&&!resolved)return''"), 'Arabic/Russian audio must never fall back to visible transliteration');

const pages = ['languages.html','language-vocabulary.html','language-study.html','four-languages.html'];
pages.forEach(file => {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  assert.ok(html.includes('language-audio.js'), `${file} should load the shared audio helper`);
});

const four = fs.readFileSync(path.join(root, 'four-languages.js'), 'utf8');
assert.ok(four.includes('function audioButton(lang,item)'), 'four-language cards should create explicit audio buttons');
assert.ok(four.includes('item.target'), 'four-language audio buttons should bind directly to original target text');
assert.ok(four.includes('audioButton(lang,example)'), 'example sentences should bind audio to the sentence target, not the word target');
assert.ok(four.includes('audioButton(lang,sentence)'), 'sentence mode should bind audio directly to the sentence target');

const study = fs.readFileSync(path.join(root, 'language-study.js'), 'utf8');
assert.ok(study.includes('function audioButton(item)'), 'single-language study should create explicit audio buttons for target items');
assert.ok(study.includes('item.target'), 'single-language study audio should use original target text');
assert.ok(study.includes('audioButton(s)'), 'single-language sentence views should bind audio directly to sentence target text');

console.log('language audio tests: OK');
