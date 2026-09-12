(function(root){
  'use strict';

  const LOCALES={ar:'ar-SA',it:'it-IT',ru:'ru-RU',es:'es-ES'};
  const CODE_TO_LANG={AR:'ar',IT:'it',RU:'ru',ES:'es'};
  const SELECTORS=['.vocab-word-primary','.vocab-primary','.four-primary','.four-example strong','.four-study-lang span','.quiz-prompt','.feed-primary','.dialogue-bubble.user'];
  const SUPABASE_TTS_ENDPOINT='https://iwemlxvjyhffumzcqrxf.supabase.co/functions/v1/language-tts';
  const SUPABASE_PUBLISHABLE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3ZW1seHZqeWhmZnVtemNxcnhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNDE0MTEsImV4cCI6MjEwMzgxNzQxMX0.pHtStP5oPWwJaupLuJxt8n-czurrGyMyzAkojrKF1MA';
  let activeButton=null;
  let remoteAudio=null;
  let remoteObjectUrl='';
  let remoteRequestId=0;
  let observer=null;
  let decorateQueued=false;

  function escapeAttr(value){return String(value??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  function button(lang,text,label='השמע'){return `<button class="language-audio-btn" type="button" data-audio-lang="${escapeAttr(lang)}" data-audio-text="${escapeAttr(text)}" aria-label="${escapeAttr(label)}" title="${escapeAttr(label)}">🔊</button>`;}
  function normalise(value){return String(value||'').toLowerCase().replace(/[.,!?¿؟،؛:׳״'"־-]/g,'').replace(/\s+/g,' ').trim();}
  function cleanText(el){
    if(!el)return'';
    if(el.classList&&el.classList.contains('dialogue-bubble')){
      const clone=el.cloneNode(true);
      clone.querySelectorAll('strong,small,.language-audio-btn').forEach(node=>node.remove());
      return clone.textContent.replace(/\s+/g,' ').trim();
    }
    return el.textContent.replace(/\s+/g,' ').trim();
  }
  function langFromLabel(text){const code=String(text||'').trim().split(/\s|·/)[0].toUpperCase();return CODE_TO_LANG[code]||'';}
  function validLang(value){return Object.prototype.hasOwnProperty.call(LOCALES,value)?value:'';}
  function pageLang(){
    try{return validLang(new URLSearchParams(root.location.search).get('lang'));}catch(e){return'';}
  }
  function findLang(el){
    const dataHost=el.closest('[data-lang]');
    if(dataHost){const found=validLang(dataHost.dataset.lang);if(found)return found;}
    const feedCard=el.closest('[data-card-lang]');
    if(feedCard){const found=validLang(feedCard.dataset.cardLang);if(found)return found;}
    const fourCard=el.closest('.four-card');
    if(fourCard){const found=langFromLabel(fourCard.querySelector('.four-code')?.textContent);if(found)return found;}
    const fourStudy=el.closest('.four-study-lang');
    if(fourStudy){const found=langFromLabel(fourStudy.querySelector('strong')?.textContent);if(found)return found;}
    const feedCell=el.closest('.feed-moment-item');
    if(feedCell){const found=langFromLabel(feedCell.querySelector('strong')?.textContent);if(found)return found;}
    const dialogue=el.closest('.dialogue-bubble');
    if(dialogue){const found=langFromLabel(dialogue.querySelector('strong')?.textContent);if(found)return found;}
    return pageLang();
  }

  function currentTopic(){
    const select=document.getElementById('four-topic');
    if(select&&select.value)return select.value;
    try{return new URLSearchParams(root.location.search).get('topic')||'basics';}catch(e){return'basics';}
  }
  function itemFromDataHost(el,lang){
    const C=root.LanguageCore;
    if(!C||!C.course)return null;
    const host=el.closest('[data-id],[data-item],[data-sentence]');
    if(!host)return null;
    const id=host.dataset.id||host.dataset.item||host.dataset.sentence;
    if(!id)return null;
    try{
      const course=C.course(lang,currentTopic());
      return [...(course.words||[]),...(course.sentences||[])].find(item=>item.id===id)||null;
    }catch(e){return null;}
  }
  function resolveFromCourse(lang,visible){
    const C=root.LanguageCore;
    if(!C||!C.course||!visible)return'';
    try{
      const course=C.course(lang,currentTopic());
      const all=[...(course.words||[]),...(course.sentences||[])];
      const wanted=normalise(visible);
      const item=all.find(candidate=>normalise(C.primary(lang,candidate))===wanted||normalise(candidate.target)===wanted);
      return item?.target||'';
    }catch(e){return'';}
  }
  function nearbySecondary(el,lang){
    if(lang!=='ar'&&lang!=='ru')return'';
    const hosts=['.vocab-word','.vocab-card','.four-card','.four-study-lang','.quiz-card','.translation-row','.feed-line','.feed-card','.dialogue-bubble'];
    const host=hosts.map(selector=>el.closest(selector)).find(Boolean);
    if(!host)return'';
    if(host.classList.contains('four-study-lang'))return cleanText(host.querySelector('small'));
    if(host.classList.contains('dialogue-bubble'))return cleanText(host.querySelector('small'));
    const candidates=[...host.querySelectorAll('.vocab-word-secondary,.vocab-secondary,.four-secondary,.feed-secondary')].filter(node=>node!==el);
    if(candidates.length===1)return cleanText(candidates[0]);
    return'';
  }
  function originalText(el,lang){
    const direct=itemFromDataHost(el,lang);
    if(direct?.target)return direct.target;
    const secondary=nearbySecondary(el,lang);
    if(secondary)return secondary;
    const visible=cleanText(el);
    if(!visible||visible.includes('_____'))return'';
    const resolved=resolveFromCourse(lang,visible);
    if((lang==='ar'||lang==='ru')&&!resolved)return'';
    return resolved||visible;
  }

  function resetActive(){if(activeButton){activeButton.classList.remove('is-speaking');activeButton.textContent='🔊';activeButton=null;}}
  function revokeRemoteUrl(){if(remoteObjectUrl&&root.URL?.revokeObjectURL){root.URL.revokeObjectURL(remoteObjectUrl);remoteObjectUrl='';}}
  function stopRemote(){
    remoteRequestId+=1;
    if(remoteAudio){
      remoteAudio.pause();
      remoteAudio.removeAttribute('src');
      remoteAudio.load();
      remoteAudio=null;
    }
    revokeRemoteUrl();
  }
  function pickVoice(locale){
    if(!root.speechSynthesis?.getVoices)return null;
    const voices=root.speechSynthesis.getVoices();
    const exact=voices.find(v=>String(v.lang).toLowerCase()===locale.toLowerCase());
    if(exact)return exact;
    const base=locale.split('-')[0].toLowerCase();
    return voices.find(v=>String(v.lang).toLowerCase().startsWith(base))||null;
  }
  function waitForVoices(done){
    const synth=root.speechSynthesis;
    if(!synth?.getVoices){done();return;}
    if(synth.getVoices().length){done();return;}
    let finished=false;
    const finish=()=>{
      if(finished)return;
      finished=true;
      if(synth.removeEventListener)synth.removeEventListener('voiceschanged',finish);
      done();
    };
    if(synth.addEventListener)synth.addEventListener('voiceschanged',finish,{once:true});
    else synth.onvoiceschanged=finish;
    setTimeout(finish,500);
  }
  function markSpeaking(buttonEl){
    if(!buttonEl)return;
    activeButton=buttonEl;
    buttonEl.classList.add('is-speaking');
    buttonEl.textContent='■';
  }
  function speakNow(text,lang,buttonEl){
    const locale=LOCALES[lang];
    const utterance=new SpeechSynthesisUtterance(text);
    const voice=pickVoice(locale);
    utterance.lang=voice?.lang||locale;
    if(voice)utterance.voice=voice;
    utterance.rate=.9;
    markSpeaking(buttonEl);
    utterance.onend=resetActive;
    utterance.onerror=resetActive;
    root.speechSynthesis.speak(utterance);
  }
  async function playArabicRemote(text,buttonEl){
    stopRemote();
    const requestId=remoteRequestId;
    markSpeaking(buttonEl);
    try{
      const response=await fetch(SUPABASE_TTS_ENDPOINT,{
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'apikey':SUPABASE_PUBLISHABLE_KEY,
          'Authorization':`Bearer ${SUPABASE_PUBLISHABLE_KEY}`
        },
        body:JSON.stringify({text,lang:'ar'})
      });
      if(!response.ok)throw new Error(`Arabic TTS failed: ${response.status}`);
      const blob=await response.blob();
      if(!blob.size)throw new Error('Arabic TTS returned empty audio');
      if(requestId!==remoteRequestId)return false;
      const objectUrl=root.URL.createObjectURL(blob);
      remoteObjectUrl=objectUrl;
      const audio=new Audio(objectUrl);
      remoteAudio=audio;
      audio.preload='auto';
      audio.onended=()=>{
        if(remoteAudio===audio)remoteAudio=null;
        revokeRemoteUrl();
        resetActive();
      };
      audio.onerror=()=>{
        if(remoteAudio===audio)remoteAudio=null;
        revokeRemoteUrl();
        resetActive();
        if(root.speechSynthesis&&typeof root.SpeechSynthesisUtterance==='function')waitForVoices(()=>speakNow(text,'ar',buttonEl));
      };
      await audio.play();
      return true;
    }catch(error){
      if(requestId!==remoteRequestId)return false;
      stopRemote();
      resetActive();
      if(root.speechSynthesis&&typeof root.SpeechSynthesisUtterance==='function')waitForVoices(()=>speakNow(text,'ar',buttonEl));
      return false;
    }
  }
  function speak(text,lang,buttonEl){
    const locale=LOCALES[lang];
    if(!locale||!text)return false;
    if(activeButton===buttonEl){
      stopRemote();
      if(root.speechSynthesis)root.speechSynthesis.cancel();
      resetActive();
      return true;
    }
    stopRemote();
    if(root.speechSynthesis)root.speechSynthesis.cancel();
    resetActive();
    if(lang==='ar')return playArabicRemote(text,buttonEl);
    if(!root.speechSynthesis||typeof root.SpeechSynthesisUtterance!=='function')return false;
    waitForVoices(()=>speakNow(text,lang,buttonEl));
    return true;
  }

  function placeButton(el,btn){
    if(el.classList.contains('dialogue-bubble')){el.appendChild(btn);return;}
    const wrapper=document.createElement(/^(SPAN|STRONG)$/i.test(el.tagName)?'span':'div');
    wrapper.className='language-audio-inline';
    el.parentNode.insertBefore(wrapper,el);
    wrapper.appendChild(el);
    wrapper.appendChild(btn);
  }
  function decorateElement(el){
    if(!el||el.dataset.audioDecorated==='1'||el.closest('.language-audio-btn'))return;
    const lang=findLang(el);if(!lang)return;
    const text=originalText(el,lang);if(!text)return;
    const btn=document.createElement('button');
    btn.type='button';btn.className='language-audio-btn';btn.textContent='🔊';
    btn.dataset.audioLang=lang;btn.dataset.audioText=text;
    btn.setAttribute('aria-label','השמע הגייה');btn.title='השמע הגייה';
    el.dataset.audioDecorated='1';
    placeButton(el,btn);
  }
  function decorate(scope=document){
    SELECTORS.forEach(selector=>{
      if(scope.matches&&scope.matches(selector))decorateElement(scope);
      if(scope.querySelectorAll)scope.querySelectorAll(selector).forEach(decorateElement);
    });
  }
  function scheduleDecorate(){
    if(decorateQueued)return;decorateQueued=true;
    const run=()=>{decorateQueued=false;decorate(document);};
    if(root.requestAnimationFrame)root.requestAnimationFrame(run);else setTimeout(run,0);
  }
  function installStyle(){
    if(document.getElementById('language-audio-style'))return;
    const style=document.createElement('style');style.id='language-audio-style';
    style.textContent='.language-audio-inline{display:inline-flex;align-items:center;gap:7px;max-width:100%;flex-wrap:wrap}.language-audio-btn{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border:1px solid var(--line,#d8d2c7);border-radius:999px;background:#fff;cursor:pointer;font-size:16px;line-height:1;vertical-align:middle;flex:0 0 auto}.language-audio-btn:hover{background:#f5f1e8}.language-audio-btn.is-speaking{background:#22313e;color:#fff;border-color:#22313e}.dialogue-bubble .language-audio-btn{margin-inline-start:7px;width:30px;height:30px;font-size:14px}@media(max-width:520px){.language-audio-btn{width:32px;height:32px;font-size:15px}}';
    document.head.appendChild(style);
  }
  function init(){
    installStyle();decorate(document);
    document.addEventListener('click',event=>{
      const btn=event.target.closest('[data-audio-text]');if(!btn)return;
      event.preventDefault();event.stopPropagation();
      speak(btn.dataset.audioText,btn.dataset.audioLang,btn);
    });
    if(root.MutationObserver){observer=new MutationObserver(scheduleDecorate);observer.observe(document.body,{childList:true,subtree:true});}
  }

  root.LanguageAudio={LOCALES,button,speak,decorate};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window);
