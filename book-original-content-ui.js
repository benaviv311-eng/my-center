(function(){
'use strict';

const LIBRARY_API='https://iwemlxvjyhffumzcqrxf.supabase.co/functions/v1/library-feed?json=1';
const O=window.BookOriginalContent;
const $=id=>document.getElementById(id);
const esc=value=>String(value==null?'':value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

function resolveBook(books){
  const key=new URLSearchParams(window.location.search).get('book');
  return books.find(book=>String(book.id)===key||String(book.slug||'')===key)||null;
}

function sectionHtml(section){
  return `<article class="book-original-card" data-original-section="${section.number}"><h4 dir="ltr">${esc(section.number+'. '+section.title)}</h4><pre class="book-original-body" dir="ltr">${esc(section.body)}</pre></article>`;
}

function phaseHtml(part){
  return `<section class="book-original-phase"><h3 dir="ltr">${esc(part.phaseTitle)}</h3>${part.sections.map(sectionHtml).join('')}</section>`;
}

async function loadOriginalText(){
  const wrap=$('book-original-section');
  const target=$('book-original-content');
  if(!wrap||!target||!O)return;
  try{
    const response=await fetch(LIBRARY_API,{cache:'no-store'});
    if(!response.ok)throw new Error('HTTP '+response.status);
    const data=await response.json();
    const book=resolveBook(Array.isArray(data.books)?data.books:[]);
    const asset=O.getOriginalTextAsset(book);
    const sources=O.getOriginalTextSources(book);
    if(!asset&&!sources.length)return;
    const c=book&&book.content?book.content:{};
    const heading=$('book-original-heading');
    const subtitle=$('book-original-subtitle');
    if(heading)heading.textContent=c.original_text_label||'📚 הטקסט המלא';
    if(subtitle)subtitle.textContent=c.original_text_subtitle||'טקסט מקור קבוע · ללא שינוי ניסוח או פיסוק';
    wrap.classList.remove('hidden');
    target.innerHTML='<div class="book-page-empty">טוען את חומר הקריאה…</div>';
    let texts=[];
    if(asset){
      const r=await fetch(asset,{cache:'no-store'});
      if(!r.ok)throw new Error(`HTTP ${r.status} ${asset}`);
      const blocks=await r.json();
      if(!Array.isArray(blocks))throw new Error('Original text asset must contain an array');
      texts=blocks.map(block=>String(block));
    }else{
      texts=await Promise.all(sources.map(async source=>{
        const r=await fetch(source,{cache:'no-store'});
        if(!r.ok)throw new Error(`HTTP ${r.status} ${source}`);
        return r.text();
      }));
    }
    const parts=O.mergeOriginalParts(texts.map(O.parseOriginalBookMarkdown));
    const sections=parts.flatMap(part=>part.sections);
    if(!sections.length)throw new Error('No original sections found');
    target.innerHTML=parts.map(phaseHtml).join('');
  }catch(error){
    console.error(error);
    wrap.classList.remove('hidden');
    target.innerHTML='<div class="book-page-empty book-page-error">לא ניתן כרגע לטעון את חומר הקריאה.</div>';
  }
}

loadOriginalText();
})();
