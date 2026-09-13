const VOLLEYBALL_POPULATION_LABELS=new Set(['יסודי','נוער בנים','נוער בנות','נשים','גברים','כל האוכלוסיות']);

function isPopulationLabel(value){
  return VOLLEYBALL_POPULATION_LABELS.has(String(value||'').trim());
}

function stripPopulationSections(entry){
  if(!entry)return entry;
  return {
    ...entry,
    sections:(entry.sections||[]).filter(section=>!/^התאמה ל/.test(String(section.title||'').trim())),
    related:(entry.related||[]).filter(term=>!isPopulationLabel(term))
  };
}

function getBaseTermBuilder(){
  if(typeof window!=='undefined'&&typeof window.buildTermExpansion==='function')return window.buildTermExpansion;
  if(typeof require==='function')return require('./volleyball.js').buildTermExpansion;
  return null;
}

function buildProfessionalTermExpansion(term,cards=[],options={}){
  const builder=getBaseTermBuilder();
  if(!builder)return null;
  return stripPopulationSections(builder(term,cards,options));
}

function buildCardExpansion(card,cards=[]){
  if(!card)return null;
  const entry=buildProfessionalTermExpansion(card.title,cards,{population:'all'});
  return entry?{...entry,term:card.title,type:'concept'}:null;
}

function classifyCardTags(tags=[]){
  return tags.reduce((groups,tag)=>{
    (isPopulationLabel(tag)?groups.context:groups.professional).push(tag);
    return groups;
  },{context:[],professional:[]});
}

function findCardForElement(cardElement){
  if(typeof window==='undefined'||!cardElement)return null;
  const title=cardElement.querySelector('h3')?.textContent?.trim()||'';
  return (window.VOLLEYBALL_FEED_CARDS||[]).find(card=>card.title===title)||null;
}

function replacePopulationTermButton(button){
  if(!button||!isPopulationLabel(button.dataset.term))return;
  const context=document.createElement('span');
  context.className='vb-context-chip';
  context.textContent=button.textContent;
  context.title='אוכלוסיית יעד';
  button.replaceWith(context);
}

function cleanExpansion(cardElement){
  if(!cardElement)return;
  cardElement.querySelectorAll('.vb-term-section').forEach(section=>{
    const heading=section.querySelector('h5')?.textContent?.trim()||'';
    if(/^התאמה ל/.test(heading))section.remove();
  });
  cardElement.querySelectorAll('.vb-term-related [data-term]').forEach(button=>{
    if(isPopulationLabel(button.dataset.term))button.remove();
  });
}

function decorateCard(cardElement){
  if(!cardElement)return;
  const card=findCardForElement(cardElement);
  const heading=cardElement.querySelector('h3');
  if(card&&heading&&!heading.querySelector('.vb-card-title-button')){
    const button=document.createElement('button');
    button.type='button';
    button.className='vb-card-title-button';
    button.dataset.cardConcept=card.id;
    button.setAttribute('aria-expanded','false');
    button.title=`פתח הסבר מקצועי מלא על ${card.title}`;
    button.textContent=card.title;
    heading.textContent='';
    heading.appendChild(button);
  }
  cardElement.querySelectorAll('.vb-tags [data-term]').forEach(replacePopulationTermButton);
  cleanExpansion(cardElement);
  cardElement.dataset.professionalFeedReady='true';
}

function enhanceVolleyballFeed(root=document){
  root.querySelectorAll?.('.vb-feed-card').forEach(decorateCard);
}

function installProfessionalFeedInteractions(){
  if(typeof document==='undefined'||document.documentElement.dataset.volleyballProfessionalFeed==='true')return;
  document.documentElement.dataset.volleyballProfessionalFeed='true';

  enhanceVolleyballFeed(document);

  const observer=new MutationObserver(mutations=>{
    for(const mutation of mutations){
      mutation.addedNodes.forEach(node=>{
        if(node.nodeType!==1)return;
        if(node.matches?.('.vb-feed-card'))decorateCard(node);
        enhanceVolleyballFeed(node);
        const parentCard=node.closest?.('.vb-feed-card');
        if(parentCard)cleanExpansion(parentCard);
      });
    }
  });
  observer.observe(document.body,{childList:true,subtree:true});

  document.addEventListener('click',event=>{
    const populationTerm=event.target.closest?.('[data-term]');
    if(populationTerm&&isPopulationLabel(populationTerm.dataset.term)){
      event.preventDefault();
      event.stopImmediatePropagation();
      replacePopulationTermButton(populationTerm);
      return;
    }

    const close=event.target.closest?.('.vb-term-close');
    if(close){
      const cardElement=close.closest('.vb-feed-card');
      cardElement?.querySelector('.vb-card-title-button')?.setAttribute('aria-expanded','false');
      const slot=cardElement?.querySelector('.vb-term-expansion-slot');
      if(slot)delete slot.dataset.openConcept;
      return;
    }

    const professionalTerm=event.target.closest?.('[data-term]');
    if(professionalTerm){
      const cardElement=professionalTerm.closest('.vb-feed-card');
      cardElement?.querySelector('.vb-card-title-button')?.setAttribute('aria-expanded','false');
      const slot=cardElement?.querySelector('.vb-term-expansion-slot');
      if(slot)delete slot.dataset.openConcept;
      return;
    }

    const titleButton=event.target.closest?.('.vb-card-title-button');
    if(!titleButton)return;
    event.preventDefault();
    event.stopPropagation();

    const cardElement=titleButton.closest('.vb-feed-card');
    const slot=cardElement?.querySelector('.vb-term-expansion-slot');
    const card=(window.VOLLEYBALL_FEED_CARDS||[]).find(item=>item.id===titleButton.dataset.cardConcept);
    if(!cardElement||!slot||!card)return;

    if(slot.dataset.openConcept===card.id){
      slot.innerHTML='';
      delete slot.dataset.openConcept;
      titleButton.setAttribute('aria-expanded','false');
      return;
    }

    cardElement.querySelectorAll('[data-term]').forEach(button=>button.setAttribute('aria-expanded','false'));
    const entry=buildCardExpansion(card,window.VOLLEYBALL_FEED_CARDS||[]);
    if(!entry)return;
    slot.innerHTML=window.renderTermExpansion(entry);
    slot.dataset.openConcept=card.id;
    delete slot.dataset.openTerm;
    titleButton.setAttribute('aria-expanded','true');
    cleanExpansion(cardElement);
    const eyebrow=slot.querySelector('.vb-term-expansion>header small');
    if(eyebrow)eyebrow.textContent='רעיון מקצועי · הסבר מורחב';
    requestAnimationFrame(()=>slot.scrollIntoView({behavior:'smooth',block:'nearest'}));
  },true);
}

if(typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installProfessionalFeedInteractions);
  else installProfessionalFeedInteractions();
}

if(typeof window!=='undefined')Object.assign(window,{buildCardExpansion,buildProfessionalTermExpansion,isPopulationLabel,classifyCardTags});
if(typeof module!=='undefined'&&module.exports){
  module.exports={VOLLEYBALL_POPULATION_LABELS,isPopulationLabel,stripPopulationSections,buildProfessionalTermExpansion,buildCardExpansion,classifyCardTags};
}
