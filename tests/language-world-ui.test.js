const assert=require('assert');
const fs=require('fs');
const path=require('path');
require('../language-world-model.js');
require('../language-mastery.js');
const handlers={};
const storage=new Map();
const elements={
  'language-world-root':{dataset:{},innerHTML:'',addEventListener(type,fn){handlers.world=fn;},setAttribute(name,value){this.dataset[name]=value;}},
  'language-coach-root':{dataset:{},innerHTML:'',addEventListener(type,fn){handlers.coach=fn;}},
  'world-active-mission':{scrollIntoView(){}},
};
global.document={readyState:'loading',getElementById(id){return elements[id]||null;},addEventListener(){}};
global.localStorage={getItem(key){return storage.get(key)||null;},setItem(key,value){storage.set(key,value);}};
const WorldUI=require('../language-world.js');
const html=fs.readFileSync(path.join(__dirname,'../languages.html'),'utf8');
const feed=fs.readFileSync(path.join(__dirname,'../languages-feed.js'),'utf8');

assert.ok(html.includes('id="language-world"'),'world needs a real section on the existing site');
assert.ok(html.includes('id="language-coach"'),'coach needs a real section on the existing site');
assert.ok(html.includes('language-world.css'),'page loads immersive visuals');
assert.ok(html.includes('language-world-model.js'),'page loads mission model');
assert.ok(html.includes('language-mastery.js'),'page loads adaptive memory');
assert.ok(html.includes('language-world.js'),'page loads the controller');
assert.ok(html.indexOf('language-world.js')<html.indexOf('languages-feed.js'),'world must initialize before the infinite feed inserts mission moments');
assert.ok(feed.includes('LanguageWorld.feedMoment'),'feed must mix missions with existing posts');
assert.ok(feed.includes('LanguageWorld.onLanguageChange'),'language switch must update world and coach');
assert.ok(feed.includes('data-open-world'),'feed teaser must open a playable mission');
['languages.html','language-study.html','language-games.html','language-vocabulary.html','language-archive.html','four-languages.html'].forEach(file=>assert.ok(fs.existsSync(path.join(__dirname,'..',file))));
assert.strictEqual(typeof WorldUI.open,'function');
assert.strictEqual(typeof WorldUI.feedMoment,'function');
assert.strictEqual(typeof WorldUI.onLanguageChange,'function');
assert.ok(WorldUI.feedMoment('ar','a').includes('data-world-lang="ar"'));
const four=WorldUI.feedMoment('four','b');
['ar','it','ru','es'].forEach(lang=>assert.ok(four.includes(`data-world-lang="${lang}"`)));
assert.ok(WorldUI.coachRecommendation({byLanguage:{}},'ru').placeId,'coach should recommend a mission for an empty history');

WorldUI.render('ar');
assert.ok(elements['language-world-root'].innerHTML.includes('בית הקפה'));
storage.set('my-center-languages-v1',JSON.stringify({customProgress:'preserve-me'}));
assert.ok(WorldUI.open('cafe','ar'));
assert.ok(elements['language-world-root'].innerHTML.includes('شو بتحب تشرب؟'),'mission opens with Arabic NPC dialogue');
const click=(dataset,attributes=[])=>handlers.world({target:{closest(){return {dataset,hasAttribute(attr){return attributes.includes(attr);}};}}});
click({worldChoice:'1'});
assert.ok(elements['language-world-root'].innerHTML.includes('השיחה הסתבכה'),'wrong choice has a consequence');
const mistakes=JSON.parse(storage.get('my-center-language-mastery-v1'));
assert.strictEqual(mistakes.byLanguage.ar['cafe:0'].attempts,1);
click({worldChoice:'1'});
assert.strictEqual(JSON.parse(storage.get('my-center-language-mastery-v1')).byLanguage.ar['cafe:0'].attempts,1,'double click must not count twice');
click({},['data-world-next']);
assert.ok(elements['language-world-root'].innerHTML.includes('بدك إشي ثاني؟'),'next step appears');
WorldUI.onLanguageChange('it');
assert.ok(!elements['language-world-root'].innerHTML.includes('بدك إشي ثاني؟'),'language switch resets a running scene');
assert.ok(WorldUI.open('cafe','it'));
assert.ok(elements['language-world-root'].innerHTML.includes('Che cosa desidera bere?'));
click({worldChoice:'0'});
click({},['data-world-next']);
click({worldChoice:'1'});
click({},['data-world-next']);
assert.strictEqual(JSON.parse(storage.get('my-center-language-world-v1')).done.it.cafe,true,'completed mission must be saved');
assert.ok(elements['language-world-root'].innerHTML.includes('השלמת את המשימה'),'completion should feel rewarding and visible');
assert.ok(elements['language-coach-root'].innerHTML.includes('משפטים תורגלו'),'coach reacts to completion');
assert.deepStrictEqual(JSON.parse(storage.get('my-center-languages-v1')),{customProgress:'preserve-me'},'existing course progress must remain untouched');

console.log('language world UI integration: OK');
