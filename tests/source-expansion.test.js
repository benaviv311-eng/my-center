const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const scriptPath = path.join(root, 'source-expander.js');
const cssPath = path.join(root, 'source-expander.css');

assert.ok(fs.existsSync(scriptPath), 'source-expander.js should exist');
assert.ok(fs.existsSync(cssPath), 'source-expander.css should exist');

const expander = require(scriptPath);
assert.equal(typeof expander.buildExpansion, 'function', 'source expander should expose buildExpansion');
assert.equal(typeof expander.sourceKind, 'function', 'source expander should expose sourceKind');

const book = expander.buildExpansion({
  label: 'מתוך חומר הספר',
  title: 'רעיון מתוך הספר',
  text: 'הרגלים משתנים כאשר משנים את התנאים סביבם.'
});
assert.equal(book.kind, 'book');
assert.ok(book.heading.includes('הרחבה'));
assert.ok(book.body.length > 80, 'book expansion should add meaningful detail');

const professional = expander.buildExpansion({
  label: 'מושג מקצועי קשור',
  title: 'מסוגלות עצמית',
  text: 'אמונה של אדם ביכולתו לבצע משימה.'
});
assert.equal(professional.kind, 'professional');
assert.ok(professional.body.includes('הקשר'));

const chatgpt = expander.buildExpansion({
  label: 'הצעה של ChatGPT',
  title: 'חיבור חדש',
  text: 'אפשר לחבר את הרעיון לעולם האימון.'
});
assert.equal(chatgpt.kind, 'suggestion');
assert.ok(chatgpt.body.includes('כיוון'));

const generic = expander.buildExpansion({
  label: 'הרחבה מקצועית',
  title: 'הטיית אישור',
  text: 'אנחנו נוטים לחפש מידע שתומך במה שכבר חשבנו.'
});
assert.ok(generic.body.length > 80, 'every source label should receive an expansion');

const html = fs.readFileSync(path.join(root, 'book.html'), 'utf8');
assert.ok(html.includes('source-expander.css'), 'book pages should load source expansion styles');
assert.ok(html.includes('source-expander.js'), 'book pages should load source expansion behavior');

const js = fs.readFileSync(scriptPath, 'utf8');
assert.ok(js.includes('.source-badge'), 'all source badges should be enhanced');
assert.ok(js.includes('MutationObserver'), 'dynamically loaded infinite-feed badges should also be enhanced');
assert.ok(js.includes('aria-expanded'), 'source badges should expose expansion state');
assert.ok(js.includes('source-expansion-panel'), 'expansion should open inline in the card');

console.log('source expansion tests: OK');
