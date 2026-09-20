const VOLLEYBALL_DRILL_DETAIL_FIELDS=[
  ['players','מספר שחקנים'],
  ['equipment','ציוד'],
  ['setup','סידור'],
  ['execution','ביצוע'],
  ['coachingPoints','דגשים'],
  ['commonErrors','טעויות נפוצות'],
  ['progression','התקדמות']
];

function escapeDrillHtml(value){
  return String(value??'').replace(/[&<>"']/g,char=>({"&":'&amp;',"<":'&lt;',">":'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}
function escapeDrillAttr(value){return escapeDrillHtml(value);}
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

  const media=document.createElement('div');
  media.className='vb-drill-media';

  const tabs=document.createElement('div');
  tabs.className='vb-drill-media-tabs';
  const mediaTabs=[
    ['overview','סקירה'],
    ['diagram','תרשים'],
    ['video','וידאו'],
    ['images','תמונות'],
    ['coach','דגשי אימון']
  ];
  for(const [id,label] of mediaTabs){
    const button=document.createElement('button');
    button.type='button';
    button.dataset.drillMedia=id;
    button.textContent=label;
    if(id==='overview')button.classList.add('active');
    tabs.appendChild(button);
  }

  const panels=document.createElement('div');
  panels.className='vb-drill-media-panels';
  const makePanel=(id,html)=>{
    const panel=document.createElement('div');
    panel.className='vb-drill-media-panel'+(id==='overview'?' active':'');
    panel.dataset.drillPanel=id;
    panel.innerHTML=html;
    return panel;
  };

  const setup=escapeDrillHtml(drill.setup||'הסידור יופיע כאן.');
  const execution=escapeDrillHtml(drill.execution||'מהלך התרגיל יופיע כאן.');
  const coaching=escapeDrillHtml(drill.coachingPoints||'דגשי המאמן יופיעו כאן.');
  const errors=escapeDrillHtml(drill.commonErrors||'טעויות נפוצות יופיעו כאן.');

  panels.append(
    makePanel('overview',`<div class="vb-drill-media-summary"><b>סידור</b><p>${setup}</p><b>ביצוע</b><p>${execution}</p></div>`),
    makePanel('diagram',`<div class="vb-drill-diagram-card" aria-label="תרשים תרגיל סכמטי">
      <div class="vb-drill-court">
        <span class="vb-court-net"></span>
        <i class="p p1">1</i><i class="p p2">2</i><i class="p p3">3</i><i class="p p4">4</i>
        <span class="vb-drill-arrow a1">➜</span><span class="vb-drill-arrow a2">➜</span>
      </div>
      <div class="vb-drill-diagram-text"><b>סידור התרגיל</b><p>${setup}</p><b>רצף</b><p>${execution}</p><small>תרשים סכמטי: המספור עוזר לקרוא את סדר הפעולות. בתרגילים עם תרשים ייעודי הוא יוחלף בתרשים המדויק.</small></div>
    </div>`),
    makePanel('video',drill.videoUrl?`<div class="vb-drill-video-link"><a href="${escapeDrillAttr(drill.videoUrl)}" target="_blank" rel="noopener">▶ פתח סרטון הדגמה</a></div>`:`<div class="vb-drill-media-empty">🎥<b>סרטון הדגמה</b><p>כאן יוצג סרטון של התרגיל כשיצורף למאגר.</p></div>`),
    makePanel('images',Array.isArray(drill.images)&&drill.images.length?`<div class="vb-drill-image-grid">${drill.images.map(src=>`<img src="${escapeDrillAttr(src)}" alt="תמונת תרגיל" loading="lazy">`).join('')}</div>`:`<div class="vb-drill-media-empty">🖼️<b>גלריית תרגיל</b><p>כאן יוצגו תמונות ורצף תנועה של התרגיל.</p></div>`),
    makePanel('coach',`<div class="vb-drill-coach-panel"><b>דגשים</b><p>${coaching}</p><b>טעויות נפוצות</b><p>${errors}</p></div>`)
  );

  media.append(tabs,panels);
  media.addEventListener('click',event=>{
    const button=event.target.closest('[data-drill-media]');
    if(!button)return;
    const id=button.dataset.drillMedia;
    tabs.querySelectorAll('[data-drill-media]').forEach(btn=>btn.classList.toggle('active',btn===button));
    panels.querySelectorAll('[data-drill-panel]').forEach(panel=>panel.classList.toggle('active',panel.dataset.drillPanel===id));
  });
  section.appendChild(media);
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
