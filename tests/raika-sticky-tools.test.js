const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { currentRaikaSectionId } = require('../raika-app.js');

// Sticky topics + search behavior specification.
test('Raika navigation and search live inside one sticky tools bar', () => {
  const html = fs.readFileSync('raika.html','utf8');
  assert.match(html, /class=["'][^"']*raika-sticky-tools[^"']*["']/);
  const stickyStart = html.indexOf('raika-sticky-tools');
  const stickyEnd = html.indexOf('</section>', stickyStart);
  const stickyMarkup = html.slice(stickyStart, stickyEnd);
  assert.match(stickyMarkup, /class=["'][^"']*raika-section-nav[^"']*["']/);
  assert.match(stickyMarkup, /id=["']raika-search["']/);
});

test('sticky Raika tools stay fixed during page scrolling and allow horizontal topic scrolling on mobile', () => {
  const css = fs.readFileSync('styles.css','utf8');
  assert.match(css, /\.raika-sticky-tools\s*\{[^}]*position\s*:\s*sticky/s);
  assert.match(css, /\.raika-section-nav\s*\{[^}]*overflow-x\s*:\s*auto/s);
});

test('currentRaikaSectionId returns the last section reached before the sticky offset', () => {
  const sections = [
    {id:'characters', top:400},
    {id:'scenes', top:900},
    {id:'plotlines', top:1500}
  ];
  assert.equal(currentRaikaSectionId(sections, 760, 180), 'scenes');
  assert.equal(currentRaikaSectionId(sections, 200, 180), 'characters');
});
