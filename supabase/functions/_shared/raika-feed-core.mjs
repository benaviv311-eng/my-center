const ACTIONS = new Set(['generate','feedback','more_like','expand_scene','refresh_all','block_forever']);
const DISTANCES = new Set(['close','natural','wild']);
const FEEDBACK_WEIGHT = {
  more_like: 4,
  developed: 4,
  converted_scene: 4,
  saved: 2,
  liked: 2,
  discussed: 2,
  less_like: -4,
  hidden: -3,
  shown: 0,
};

const text = (v,max=6000) => String(v ?? '').trim().slice(0,max);
const arr = (v,max=24) => Array.isArray(v) ? v.slice(0,max).map(x => text(x,120)).filter(Boolean) : [];
const tokens = v => new Set(text(v,12000).toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu,' ').split(/\s+/).filter(Boolean));
function hash(value=''){
  let h=2166136261;
  for(const ch of String(value)){h^=ch.codePointAt(0)||0;h=Math.imul(h,16777619);}
  return (h>>>0).toString(36);
}

export function normalizeFeedRequest(input={}) {
  const action = text(input.action || 'generate',40);
  if (!ACTIONS.has(action)) throw new Error('Unsupported feed action');
  const seed_card_id=text(input.seed_card_id,80);
  if(action==='block_forever'&&!seed_card_id)throw new Error('seed card id required');
  const requested=Number(input.count);
  const count=Number.isFinite(requested)?requested:8;
  const maxCount=action==='refresh_all'?24:12;
  const novelty=Number(input.novelty_target);
  return {
    action,
    count: Math.max(1,Math.min(maxCount,count || 1)),
    seed_card_id,
    recent_signatures: Array.isArray(input.recent_signatures)?input.recent_signatures.slice(0,80).map(x=>text(x,1400)).filter(Boolean):[],
    blocked_signatures:Array.isArray(input.blocked_signatures)?input.blocked_signatures.slice(0,120).map(x=>text(x,1400)).filter(Boolean):[],
    blocked_fingerprints:Array.isArray(input.blocked_fingerprints)?input.blocked_fingerprints.slice(0,120).map(x=>text(x,300)).filter(Boolean):[],
    filter_type:text(input.filter_type||'all',80)||'all',
    novelty_target:Number.isFinite(novelty)?Math.max(0,Math.min(1,novelty)):0.4,
    base_context: input.base_context && typeof input.base_context === 'object' && !Array.isArray(input.base_context) ? input.base_context : {},
  };
}

export function normalizeGeneratedCard(raw={}) {
  const title = text(raw.title,220), body = text(raw.body,5000);
  if (!title || !body) return null;
  const creativity_distance = DISTANCES.has(raw.creativity_distance) ? raw.creativity_distance : 'natural';
  return {
    status:'proposal',
    card_type:text(raw.type || raw.card_type || 'idea',80) || 'idea',
    title,
    body,
    creativity_distance,
    characters:arr(raw.characters,16),
    entities:arr(raw.entities,16),
    suggested_placement:text(raw.suggested_placement,1200),
    why_it_may_work:text(raw.why_it_may_work,1600),
    context_refs:arr(raw.context_refs,30),
    tags:arr(raw.tags,20),
    plot_family:text(raw.plot_family,180),
  };
}

export function cardSignature(card={}) {
  return [card.card_type,...(card.characters||[]),...(card.entities||[]),card.title,card.body]
    .join('|').toLowerCase().replace(/[^\p{L}\p{N}|]+/gu,' ').replace(/\s+/g,' ').trim().slice(0,1400);
}

export function semanticFingerprint(card={}) {
  const chars=arr(card.characters,16).sort();
  const family=text(card.plot_family,180).toLowerCase();
  const coreTokens=[...tokens(`${card?.title||''} ${card?.body||''}`)].filter(t=>t.length>2).sort().slice(0,20);
  return hash([text(card.card_type,80).toLowerCase(),...chars,family,...coreTokens].join('|'));
}

export function isBlockedCard(card={},blockedRows=[]) {
  const fp=semanticFingerprint(card);
  const family=text(card.plot_family,180);
  const sig=text(card.signature||cardSignature(card),1400);
  return (blockedRows||[]).some(row=>{
    if(row?.scope==='family'&&family&&text(row.plot_family,180)===family)return true;
    if(text(row?.semantic_fingerprint,300)&&text(row.semantic_fingerprint,300)===fp)return true;
    if(text(row?.signature,1400)&&text(row.signature,1400)===sig)return true;
    if((text(row?.title,220)||text(row?.body,5000))&&similarity(row,card)>=0.5)return true;
    return false;
  });
}

export function similarity(a,b) {
  const A=tokens(`${a?.title||''} ${a?.body||''}`), B=tokens(`${b?.title||''} ${b?.body||''}`);
  if (!A.size || !B.size) return 0;
  let common=0; for (const t of A) if (B.has(t)) common++;
  return common / Math.max(1,Math.min(A.size,B.size));
}

export function dedupeCards(cards=[], recentCards=[], {allowSeedVariation=false,blockedRows=[]}={}) {
  const accepted=[];
  for (const raw of cards) {
    const card=normalizeGeneratedCard(raw); if(!card) continue;
    card.signature=cardSignature(card);
    card.semantic_fingerprint=semanticFingerprint(card);
    if(isBlockedCard(card,blockedRows))continue;
    const pool=[...recentCards,...accepted];
    if (pool.some(old => old?.signature===card.signature)) continue;
    const tooCloseToRecent=!allowSeedVariation && recentCards.some(old => similarity(old,card)>=0.72);
    const tooCloseInBatch=accepted.some(old => similarity(old,card)>=0.72);
    if (tooCloseToRecent || tooCloseInBatch) continue;
    accepted.push(card);
  }
  return accepted;
}

export function summarizeFeedback(rows=[]) {
  const weights={};
  for (const row of rows) {
    const type=text(row?.metadata?.card_type || 'general',80) || 'general';
    weights[type]=(weights[type]||0)+(FEEDBACK_WEIGHT[row?.action]||0);
  }
  return {weights,exploration_ratio:0.2};
}

export const mapOpenAIError = status => `openai_${Number(status)||500}`;

export function buildFeedSchema(count=8){
  return {
    type:'object', additionalProperties:false, required:['cards'],
    properties:{
      cards:{
        type:'array', minItems:1, maxItems:Math.max(1,Math.min(24,Number(count)||8)),
        items:{
          type:'object', additionalProperties:false,
          required:['type','title','body','creativity_distance','characters','entities','suggested_placement','why_it_may_work','context_refs','tags'],
          properties:{
            type:{type:'string'}, title:{type:'string'}, body:{type:'string'},
            creativity_distance:{type:'string',enum:['close','natural','wild']},
            characters:{type:'array',items:{type:'string'}},
            entities:{type:'array',items:{type:'string'}},
            suggested_placement:{type:'string'}, why_it_may_work:{type:'string'},
            context_refs:{type:'array',items:{type:'string'}},
            tags:{type:'array',items:{type:'string'}},
          }
        }
      }
    }
  };
}

function compact(value,max=24000){
  let out='';
  try{out=JSON.stringify(value??{});}catch{out='{}';}
  return out.slice(0,max);
}

export function buildFeedPrompt({
  count=8,baseContext={},workspace=[],recentCards=[],preferences={},seedCard=null,
  blockedRows=[],noveltyTarget=0.4,filterType='all'
}={}){
  const n=Math.max(1,Math.min(24,Number(count)||8));
  const recent=(recentCards||[]).slice(0,50).map(c=>({
    type:c.card_type,title:c.title,body:c.body,signature:c.signature,creativity_distance:c.creativity_distance
  }));
  const blocked=(blockedRows||[]).slice(0,120).map(row=>({
    signature:row.signature||'',semantic_fingerprint:row.semantic_fingerprint||'',plot_family:row.plot_family||'',title:row.title||'',body:row.body||''
  }));
  const seed=seedCard?compact(seedCard,5000):'אין';
  return `אתה שותף יצירתי בחדר הכותבים של עולם ראיקה. החזר בדיוק ${n} רעיונות מובנים לפי סכמת ה-JSON שסופקה.

כללים מחייבים:
- כל רעיון הוא הצעה בלבד ואינו קאנון. אסור להציג המצאה חדשה כאילו היא עובדה קאנונית קיימת.
- מותר ואף רצוי להמציא חומר חדש: דמויות, עבר, סודות, קשרים, קונפליקטים, מקומות, תרבויות, יריבים וקווי עלילה חדשים, כל עוד הם מתאימים לרוח העולם.
- יעד החדשנות הוא ${Number(noveltyTarget).toFixed(2)}. רעיונות חדשים צריכים להיות genuinely novel ולא רק החלפת שם, מקום או ניסוח.
- פילטר מבוקש: ${filterType}. כאשר הפילטר הוא new, תן עדיפות חזקה לרעיונות בעלי premise חדש.
- ערבב שלוש רמות יצירתיות: close, natural, wild. אל תייצר אצווה מסוג אחד בלבד.
- אל תחזור על סצנה קיימת, סצנה בפיתוח, רעיון שנראה לאחרונה או משפחת רעיון שנחסמה.
- העדפות המשתמש משפיעות על התמהיל אך אינן חוסמות גילוי: לפחות 20% מהאצווה צריכים להיות חקירה מחוץ לקטגוריות המועדפות כרגע.
- גוון את סוגי הכרטיסים: סצנות, דיאלוגים, יחסים, קונפליקטים, קומדיה, עבר, עולם, מורשת, דמות חדשה, סוד, מה-אם, חור עלילתי, השלכה, נקודת מבט אחרת ועוד.
- כרטיס wild יכול לשנות כיוון או להציע פרשנות חדשה, אך חייב להיות מסומן wild ולא לדרוס קאנון.
${seedCard?'- הבקשה היא עוד כזה: צור וריאציות קשורות לכרטיס הזרע, אך אל תשכפל אותו מילולית או רעיונית.':''}

הקשר ראיקה מהאתר:
${compact(baseContext)}

חומר פרטי מה-workspace:
${compact(workspace,18000)}

העדפות שנלמדו מהפעולות האחרונות:
${compact(preferences,6000)}

כרטיסי פיד אחרונים שיש להימנע מלחזור עליהם:
${compact(recent,12000)}

רעיונות/משפחות שנחסמו לצמיתות:
${compact(blocked,12000)}

כרטיס זרע ל'עוד כזה':
${seed}

כתוב בעברית טבעית. שמור את גוף הרעיון תמציתי אך מספיק עשיר כדי לפתוח שיחה או סצנה.`;
}
