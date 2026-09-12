const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const audioPath = path.join(root, 'language-audio.js');
assert.ok(fs.existsSync(audioPath), 'language-audio.js should exist');

const audio = fs.readFileSync(audioPath, 'utf8');
assert.ok(audio.includes('speechSynthesis'), 'audio helper should use browser speech synthesis for supported local voices');
assert.ok(audio.includes('SpeechSynthesisUtterance'), 'audio helper should create speech utterances');
['ar-SA','it-IT','ru-RU','es-ES'].forEach(locale => assert.ok(audio.includes(locale), `audio helper should include ${locale}`));
assert.ok(audio.includes('voiceschanged'), 'audio helper should wait for asynchronously loaded browser voices');
assert.ok(audio.includes('data-audio-text'), 'audio helper should listen for delegated audio buttons');
assert.ok(audio.includes('cancel()'), 'audio helper should stop previous playback before starting a new one');
assert.ok(audio.includes('LanguageCore'), 'audio helper should resolve original target text from lesson data when only transliteration is visible');
['.vocab-word-primary','.vocab-primary','.four-primary','.four-study-lang','.quiz-prompt','.feed-primary'].forEach(selector => {
  assert.ok(audio.includes(selector), `audio helper should decorate ${selector}`);
});
assert.ok(audio.includes('.target'), 'audio helper should speak original target-language text, not learner transliteration');
assert.ok(audio.includes("if((lang==='ar'||lang==='ru')&&!resolved)return''"), 'Arabic/Russian audio must never fall back to visible transliteration');

// Arabic must no longer hotlink undocumented Google Translate audio directly from the browser.
assert.ok(audio.includes('SUPABASE_TTS_ENDPOINT'), 'Arabic should use the site TTS edge endpoint');
assert.ok(audio.includes('SUPABASE_PUBLISHABLE_KEY'), 'Arabic TTS requests should authenticate with the public Supabase key');
assert.ok(audio.includes('fetch(SUPABASE_TTS_ENDPOINT'), 'Arabic should fetch audio through the edge function');
assert.ok(audio.includes('response.blob()'), 'Arabic edge response should be consumed as audio bytes');
assert.ok(audio.includes('URL.createObjectURL'), 'Arabic audio should play from a local blob URL');
assert.ok(!audio.includes('translate.googleapis.com/translate_tts'), 'browser code must not call Google Translate TTS directly');
assert.ok(!audio.includes('translate.google.com/translate_tts'), 'browser code must not hotlink a second Google Translate TTS endpoint');

const edgePath = path.join(root, 'supabase', 'functions', 'language-tts', 'index.ts');
assert.ok(fs.existsSync(edgePath), 'Arabic TTS edge function should be versioned in the repo');
const edge = fs.readFileSync(edgePath, 'utf8');
assert.ok(edge.includes('translate.googleapis.com/translate_tts'), 'edge function should fetch Arabic TTS server-side');
assert.ok(edge.includes("'User-Agent'"), 'edge function should send a browser-like User-Agent upstream');
assert.ok(edge.includes("'Content-Type': 'audio/mpeg'"), 'edge function should return MPEG audio');
assert.ok(edge.includes('Access-Control-Allow-Origin'), 'edge function should support browser CORS');
assert.ok(edge.includes("lang !== 'ar'"), 'edge function should currently restrict requests to Arabic');

const pages = ['languages.html','language-vocabulary.html','language-study.html','four-languages.html'];
pages.forEach(file => {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  assert.ok(/language-audio\.js\?v=\d+/.test(html), `${file} should load the shared audio helper`);
});

const four = fs.readFileSync(path.join(root, 'four-languages.js'), 'utf8');
assert.ok(four.includes('function audioButton(lang,item)'), 'four-language cards should create explicit audio buttons');
assert.ok(four.includes('item.target'), 'four-language audio buttons should bind directly to original target text');
assert.ok(four.includes('audioButton(lang,example)'), 'example sentences should bind audio to the sentence target, not the word target');
assert.ok(four.includes('audioButton(lang,sentence)'), 'sentence mode should bind audio directly to the sentence target');
assert.ok(four.includes('data-audio-decorated="1"'), 'explicit sentence audio should suppress guessed duplicate audio buttons');

const study = fs.readFileSync(path.join(root, 'language-study.js'), 'utf8');
assert.ok(study.includes('data-sentence='), 'single-language sentence exercises should expose sentence ids for original-target lookup');
assert.ok(study.includes('quiz-prompt'), 'single-language sentence prompts should remain available for shared audio decoration');

console.log('language audio tests: OK');
