(function(){
'use strict';

const LIBRARY_API = 'https://iwemlxvjyhffumzcqrxf.supabase.co/functions/v1/library-feed?json=1';
const D = window.LibraryDiscovery;
const notesKey = 'my-center-library-notes';
const $ = id => document.getElementById(id);
const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const state = {
  today: '',
  book: null,
  history: [],
  seed: '',
  sectionRefresh: {},
  notes: JSON.parse(localStorage.getItem(notesKey) || '{}')
};

const content = book => book && book.content ? book.content : {};

function toast(message){
  const el = $('toast');
  if(!el) return;
  el.textContent = message;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 1500);
}

function sourceClass(label){
  return /ChatGPT|הרחבה|מושג מקצועי|יישום|דוגמה/.test(label) ? 'ai' : 'book';
}

function sectionCard(section){
  return `<article class="learning-card" data-book-section="${esc(section.kind)}">
    <div class="learning-card-head">
      <div><h3>${esc(section.title)}</h3></div>
      <button class="learning-refresh" data-refresh-section="${esc(section.kind)}">↻ רענן</button>
    </div>
    <p>${esc(section.text)}</p>
    <div class="source-row"><span class="source-badge ${sourceClass(section.sourceLabel)}">${esc(section.sourceLabel)}</span></div>
  </article>`;
}

function renderLearning(seed){
  const sections = D.buildBookSections(state.book, seed);
  $('book-learning-scroll').innerHTML = sections.length
    ? sections.map(sectionCard).join('')
    : '<div class="book-page-empty">אין עדיין חומר דינמי לספר הזה.</div>';
}

function renderStatic(){
  const book = state.book;
  const c = content(book);
  const ideas = Array.isArray(c.ideas) ? c.ideas : [];
  const topics = Array.isArray(c.topics) ? c.topics : [];

  $('book-category').textContent = c.category || 'ספר';
  $('book-title').textContent = book.title;
  document.title = `${book.title} | ספריית הלמידה שלי`;
  $('book-intro').textContent = c.summary || 'עמוד למידה מתחלף: תיאוריה, פסיכולוגיה, גישות, יישום ודוגמאות.';
  $('book-summary').textContent = c.summary || '';
  $('book-ideas').innerHTML = ideas.length
    ? ideas.map(x => `<li>${esc(x)}</li>`).join('')
    : '<li class="meta">נוסיף רעיונות בהמשך.</li>';
  $('book-topics').innerHTML = topics.length
    ? topics.map(x => `<li>${esc(x)}</li>`).join('')
    : '<li class="meta">נוסיף נושאים בהמשך.</li>';

  const dates = [...new Set(state.history.filter(r => r.item_id === book.id).map(r => r.feed_date))];
  $('book-history').innerHTML = dates.length
    ? dates.map(d => `<span class="pill">${esc(d)}</span>`).join(' ')
    : '<span class="meta">הספר עדיין לא הופיע בפיד היומי.</span>';

  $('book-note').value = state.notes[book.slug || book.id] || '';
}

function newSeed(mode){
  return `${state.today}|${state.book.slug || state.book.id}|${mode}|${Date.now()}|${Math.random()}`;
}

function refreshAll(mode){
  state.seed = newSeed(mode);
  state.sectionRefresh = {};
  renderLearning(state.seed);
  toast(mode === 'surprise'
    ? 'פתחתי זוויות חדשות'
    : mode === 'random'
      ? 'נוצר מסלול רנדומלי חדש'
      : 'כל חלקי הספר רועננו');
  if(mode === 'surprise'){
    $('book-learning-scroll').scrollIntoView({behavior:'smooth', block:'start'});
  }
}

function refreshSection(kind){
  state.sectionRefresh[kind] = (state.sectionRefresh[kind] || 0) + 1;
  const seed = `${state.seed}|${kind}|${state.sectionRefresh[kind]}|${Date.now()}`;
  const next = D.buildBookSections(state.book, seed).find(x => x.kind === kind);
  const current = document.querySelector(`[data-book-section="${CSS.escape(kind)}"]`);
  if(next && current) current.outerHTML = sectionCard(next);
}

function resolveBook(books){
  const params = new URLSearchParams(window.location.search);
  const key = params.get('book');
  if(!key) return null;
  return books.find(book => String(book.id) === key || String(book.slug || '') === key) || null;
}

async function loadBook(){
  try{
    if(!D || typeof D.buildBookSections !== 'function') throw new Error('LibraryDiscovery unavailable');

    const response = await fetch(LIBRARY_API, {cache:'no-store'});
    if(!response.ok) throw new Error('HTTP ' + response.status);
    const data = await response.json();

    const books = Array.isArray(data.books) ? data.books : [];
    state.today = data.today || '';
    state.history = Array.isArray(data.history) ? data.history : [];
    state.book = resolveBook(books);

    if(!state.book){
      $('book-status').textContent = 'הספר לא נמצא';
      $('book-title').textContent = 'הספר לא נמצא';
      $('book-learning-scroll').innerHTML = '<div class="book-page-empty book-page-error">חזור לספרייה ובחר ספר מחדש.</div>';
      return;
    }

    state.seed = `${state.today}|${state.book.slug || state.book.id}|daily`;
    renderStatic();
    renderLearning(state.seed);
    $('book-status').textContent = 'עמוד למידה דינמי';
  }catch(error){
    console.error(error);
    $('book-status').textContent = 'שגיאה בטעינת הספר';
    $('book-learning-scroll').innerHTML = '<div class="book-page-empty book-page-error">לא ניתן כרגע לטעון את הספר.</div>';
  }
}

document.addEventListener('click', event => {
  const refresh = event.target.closest('[data-refresh-section]');
  if(refresh) refreshSection(refresh.dataset.refreshSection);
});

$('book-refresh-all').addEventListener('click', () => refreshAll('refresh'));
$('book-random').addEventListener('click', () => refreshAll('random'));
$('book-surprise').addEventListener('click', () => refreshAll('surprise'));
$('book-save-note').addEventListener('click', () => {
  if(!state.book) return;
  state.notes[state.book.slug || state.book.id] = $('book-note').value;
  localStorage.setItem(notesKey, JSON.stringify(state.notes));
  toast('ההערה נשמרה');
});

loadBook();
})();
