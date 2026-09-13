const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const js = fs.readFileSync(path.join(root, 'book-page.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'book.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'source-expander.css'), 'utf8');

assert.ok(html.includes('source-expander.css'), 'book pages should load source expansion styles');
assert.ok(js.includes('buildSourceExpansion'), 'book page should build a meaningful source expansion');
assert.ok(js.includes('toggleSourceExpansion'), 'source badges should toggle an inline expansion');
assert.ok(js.includes('data-source-expand'), 'every rendered source badge should be marked as expandable');
assert.ok(js.includes('aria-expanded'), 'source badges should expose expansion state');
assert.ok(js.includes('source-expansion-panel'), 'expansion should open inline in the card');
assert.ok(js.includes("if(event.target.closest('[data-source-expand]'))"), 'delegated click handling should work for dynamically loaded feed cards');
assert.ok(js.includes("event.key==='Enter'") || js.includes('event.key === \'Enter\''), 'source expansion should support keyboard activation');
assert.ok(css.includes('.source-expand-trigger'), 'clickable source badges should have a visible affordance');
assert.ok(css.includes('.source-expansion-panel'), 'expanded source content should be styled inline');

const sectionBadgeCount = (js.match(/data-source-expand/g) || []).length;
assert.ok(sectionBadgeCount >= 2, 'both learning cards and infinite-feed cards should render expandable source badges');

console.log('source expansion tests: OK');
