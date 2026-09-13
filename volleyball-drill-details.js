const VOLLEYBALL_DRILL_DETAIL_FIELDS=[
  ['players','מספר שחקנים'],
  ['equipment','ציוד'],
  ['setup','סידור'],
  ['execution','ביצוע'],
  ['coachingPoints','דגשים'],
  ['commonErrors','טעויות נפוצות'],
  ['progression','התקדמות']
];

function findVolleyballCardForElement(element){
  if(typeof window==='undefined'||!element)return null;
  const title=element.querySelector('.vb-card-title-button')?.textContent?.trim()||element.querySelector('h3')?.textContent?.trim()||'';
  return (window.VOLLEYBALL_FEED_CARDS||[]).find(card=>card.title===title)||null;
}

function buildDrillDetailsSection(drill){
  if(typeof document==='undefined'||!drill)return null;
  const section=document.createElement('section');
  section.className='vb-drill-details';
  section.setAttribute('aria-label','פרטי התרגיל');

  const head=document.createElement('div');
  head.className='vb-drill-details-head';
  const eyebrow=document.createElement('span');
  eyebrow.textContent='כרטיס תרגיל';
  const heading=document.createElement('b');
  heading.textContent='איך מבצעים';
  head.append(eyebrow,heading);
  section.appendChild(head);

  const grid=document.createElement('div');
  grid.className='vb-drill-detail-grid';
  for(const [key,label] of VOLLEYBALL_DRILL_DETAIL_FIELDS){
    const value=drill[key];
    if(!value)continue;
    const item=document.createElement('div');
    item.className=`vb-drill-detail vb-drill-detail-${key}`;
    const itemLabel=document.createElement('strong');
    itemLabel.textContent=label;
    const text=document.createElement('p');
    text.textContent=value;
    item.append(itemLabel,text);
    grid.appendChild(item);
  }
  section.appendChild(grid);
  return section;
}

function addVolleyballDrillDetails(root=document){
  if(typeof document==='undefined'||!root?.querySelectorAll)return;
  root.querySelectorAll('.vb-feed-card').forEach(element=>{
    if(element.querySelector('.vb-drill-details'))return;
    const card=findVolleyballCardForElement(element);
    if(!card?.drill)return;
    const section=buildDrillDetailsSection(card.drill);
    if(!section)return;
    const source=element.querySelector('.vb-drill-source');
    const tags=element.querySelector('.vb-tags');
    const anchor=source||tags;
    if(anchor)anchor.insertAdjacentElement('beforebegin',section);
    else element.appendChild(section);
  });
}

function installVolleyballDrillDetails(){
  if(typeof document==='undefined')return;
  addVolleyballDrillDetails(document);
  const targets=[document.getElementById('volleyball-feed'),document.getElementById('volleyball-discovery-result')].filter(Boolean);
  targets.forEach(target=>{
    let queued=false;
    const observer=new MutationObserver(()=>{
      if(queued)return;
      queued=true;
      requestAnimationFrame(()=>{
        queued=false;
        addVolleyballDrillDetails(target);
      });
    });
    observer.observe(target,{childList:true,subtree:true});
  });
}

if(typeof window!=='undefined')Object.assign(window,{VOLLEYBALL_DRILL_DETAIL_FIELDS,addVolleyballDrillDetails,installVolleyballDrillDetails});
if(typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installVolleyballDrillDetails);
  else installVolleyballDrillDetails();
}
if(typeof module!=='undefined'&&module.exports)module.exports={VOLLEYBALL_DRILL_DETAIL_FIELDS,buildDrillDetailsSection};
