const assert = require('assert');
const path = require('path');
const data = require(path.join(__dirname, '..', 'book-fallacies-data.js'));
const dictionary = require(path.join(__dirname, '..', 'book-fallacies.js'));

assert.strictEqual(data.ENTRIES.length, 238, 'The public website index currently contains 238 entries');
assert.strictEqual(new Set(data.ENTRIES.map(item => item.englishTitle)).size, 238, 'English entries must be unique');
assert.strictEqual(new Set(data.ENTRIES.map(item => item.id)).size, 238, 'IDs must be unique');
assert.ok(data.ENTRIES.every(item => item.englishTitle && item.title && item.category && item.sourceUrl));
assert.ok(data.ENTRIES.every(item => item.definition.trim() && item.example.trim()),'Every entry must include a reviewed Hebrew explanation and example');

assert.ok(dictionary.isTargetBook({title:'Logically Fallacious'}));
assert.ok(dictionary.isTargetBook({title:'Logically Fallacious: The Ultimate Collection'}));
assert.ok(dictionary.isTargetBook({title:'ספר',slug:'logically-fallacious'}));
assert.ok(dictionary.isTargetBook({title:'כשלים לוגיים',content:{author:'Bo Bennett'}}));
assert.ok(!dictionary.isTargetBook({title:'Thinking, Fast and Slow'}));
assert.ok(!dictionary.isTargetBook({title:'Logic'}));

assert.strictEqual(dictionary.search(data.ENTRIES,'').length,238);
assert.ok(dictionary.search(data.ENTRIES,'Strawman').some(item=>item.englishTitle==='Strawman Fallacy'));
assert.ok(dictionary.search(data.ENTRIES,'איש קש').some(item=>item.englishTitle==='Strawman Fallacy'));
assert.ok(dictionary.search(data.ENTRIES,'post hoc').some(item=>item.englishTitle==='Post Hoc'));
assert.ok(dictionary.search(data.ENTRIES,'התנהגות עדר').some(item=>item.englishTitle==='Appeal to Popularity'));

const saved = new Set([data.ENTRIES[0].id,data.ENTRIES[1].id]);
assert.strictEqual(dictionary.search(data.ENTRIES,'','saved',saved).length,2);
const category=data.ENTRIES[0].category;
assert.ok(dictionary.search(data.ENTRIES,'',category).length>0);
assert.ok(dictionary.search(data.ENTRIES,'',category).every(item=>item.category===category));
assert.deepStrictEqual(dictionary.search(data.ENTRIES,'תוצאה לא קיימת כלל'),[]);
assert.strictEqual(data.categoryOf('Hasty Generalization'),'generalization');
assert.strictEqual(data.categoryOf('Wishful Thinking'),'belief');
assert.strictEqual(data.categoryOf('Circular Reasoning'),'reasoning');
assert.strictEqual(data.categoryOf('Moving the Goalposts'),'relevance');
assert.strictEqual(data.categoryOf('Ludic Fallacy'),'evidence');
assert.ok(data.ENTRIES.filter(x=>x.category==='other').length<60,'The catch-all category should not swallow most of the dictionary');

const feed=require('../book-infinite-feed.js');
const targetBook={id:'bennett',title:'Logically Fallacious',slug:'logically-fallacious',content:{topics:['חשיבה ביקורתית']}};
const listedFallacies=data.ENTRIES.filter(item=>item.kind==='fallacy');
const targetFeed=feed.buildBookFeedBatch(targetBook,{seed:'fallacies-index',offset:0,count:listedFallacies.length,filter:'fallacy'});
assert.strictEqual(targetFeed.length,listedFallacies.length);
assert.strictEqual(new Set(targetFeed.map(item=>item.englishTitle)).size,listedFallacies.length,'Target book should expose every actual fallacy in its feed');
assert.ok(!targetFeed.some(item=>item.englishTitle==='Methodology'),'Explanatory articles should not be mislabelled as fallacies');
assert.ok(targetFeed.some(item=>item.englishTitle==='Strawman Fallacy'));
const anotherBook={id:'not-bennett',title:'Atomic Habits',slug:'atomic-habits',content:{topics:['הרגלים']}};
const otherFeed=feed.buildBookFeedBatch(anotherBook,{seed:'fallacies-index',offset:0,count:35,filter:'fallacy'});
assert.ok(new Set(otherFeed.map(item=>item.englishTitle)).size<=14,'Other books must retain existing general fallacy pool');

console.log('book fallacies dictionary tests: OK');
