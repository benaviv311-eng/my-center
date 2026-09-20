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
function renderDrillDiagram(diagram){
  const fallback={title:'תרשים התרגיל',players:[['1',25,145,'a'],['2',50,125,'a'],['3',75,145,'a'],['4',50,35,'b']],arrows:[[25,145,50,125],[50,125,75,145],[75,145,50,70]]};
  const d=diagram||fallback;
  const esc=escapeDrillHtml;
  const players=(d.players||fallback.players).map(([label,x,y,team])=>`
    <g class="vb-svg-player vb-svg-${esc(team||'a')}">
      <circle cx="${Number(x)}" cy="${Number(y)}" r="7"></circle>
      <text x="${Number(x)}" y="${Number(y)+2.4}" text-anchor="middle">${esc(label)}</text>
    </g>`).join('');
  const arrows=(d.arrows||[]).map(([x1,y1,x2,y2])=>`<line x1="${Number(x1)}" y1="${Number(y1)}" x2="${Number(x2)}" y2="${Number(y2)}" marker-end="url(#vbArrow)"></line>`).join('');
  const targets=(d.targets||[]).map(([x,y])=>`<rect class="vb-svg-target" x="${Number(x)-7}" y="${Number(y)-5}" width="14" height="10" rx="2"></rect>`).join('');
  return `<div class="vb-drill-svg-wrap">
    <div class="vb-drill-diagram-title">${esc(d.title||'תרשים התרגיל')}</div>
    <svg class="vb-drill-svg" viewBox="0 0 100 180" role="img" aria-label="${esc(d.title||'תרשים התרגיל')}">
      <defs><marker id="vbArrow" markerWidth="7" markerHeight="7" refX="5.6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 z"></path></marker></defs>
      <rect class="vb-svg-court" x="5" y="5" width="90" height="170" rx="4"></rect>
      <line class="vb-svg-net" x1="5" y1="90" x2="95" y2="90"></line>
      <line class="vb-svg-attack" x1="5" y1="65" x2="95" y2="65"></line>
      <line class="vb-svg-attack" x1="5" y1="115" x2="95" y2="115"></line>
      <g class="vb-svg-arrows">${arrows}</g>
      <g>${targets}</g>
      <g>${players}</g>
    </svg>
    <div class="vb-drill-legend"><span><i class="team-a"></i>קבוצה/מבצע</span><span><i class="team-b"></i>יריב/מקבל</span><span><i class="team-coach"></i>מאמן</span><span>➜ מסלול הכדור/תנועה</span></div>
  </div>`;
}

function renderDrillImages(images=[]){
  if(!Array.isArray(images)||!images.length)return '<div class="vb-drill-media-empty">🖼️<b>גלריית תרגיל</b><p>כאן יוצגו תמונות ורצף תנועה של התרגיל.</p></div>';
  return `<div class="vb-drill-image-grid">${images.map(item=>{
    const data=typeof item==='string'?{src:item,alt:'תמונת תרגיל',credit:''}:item;
    return `<figure><img src="${escapeDrillAttr(data.src)}" alt="${escapeDrillAttr(data.alt||'תמונת תרגיל')}" loading="lazy"><figcaption>${escapeDrillHtml(data.credit||'')}</figcaption></figure>`;
  }).join('')}</div>`;
}

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
    makePanel('diagram',`<div class="vb-drill-diagram-card" aria-label="תרשים תרגיל">
      ${renderDrillDiagram(drill.diagram)}
      <div class="vb-drill-diagram-text"><b>סידור התרגיל</b><p>${setup}</p><b>רצף</b><p>${execution}</p><small>המספרים והאותיות מסמנים תפקידים, והחצים מסמנים מסלול כדור או מעבר בין פעולות.</small></div>
    </div>`),
    makePanel('video',drill.videoUrl?`<div class="vb-drill-video-link"><a href="${escapeDrillAttr(drill.videoUrl)}" target="_blank" rel="noopener">▶ פתח סרטון הדגמה</a></div>`:`<div class="vb-drill-media-empty">🎥<b>סרטון הדגמה</b><p>כאן יוצג סרטון של התרגיל כשיצורף למאגר.</p></div>`),
    makePanel('images',renderDrillImages(drill.images)),
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
