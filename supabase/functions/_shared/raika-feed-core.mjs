const ACTIONS = new Set(['generate','feedback','more_like','expand_scene']);
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

export function normalizeFeedRequest(input={}) {
  const action = text(input.action || 'generate',40);
  if (!ACTIONS.has(action)) throw new Error('Unsupported feed action');
  const requested=Number(input.count);
  const count=Number.isFinite(requested)?requested:8;
  return {
    action,
    count: Math.max(1,Math.min(12,count || 1)),
    seed_card_id: text(input.seed_card_id,80),
    recent_signatures: arr(input.recent_signatures,80),
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
  };
}

export function cardSignature(card={}) {
  return [card.card_type,...(card.characters||[]),...(card.entities||[]),card.title,card.body]
    .join('|').toLowerCase().replace(/[^\p{L}\p{N}|]+/gu,' ').replace(/\s+/g,' ').trim().slice(0,1400);
}

export function similarity(a,b) {
  const A=tokens(`${a?.title||''} ${a?.body||''}`), B=tokens(`${b?.title||''} ${b?.body||''}`);
  if (!A.size || !B.size) return 0;
  let common=0; for (const t of A) if (B.has(t)) common++;
  return common / Math.max(1,Math.min(A.size,B.size));
}

export function dedupeCards(cards=[], recentCards=[], {allowSeedVariation=false}={}) {
  const accepted=[];
  for (const raw of cards) {
    const card=normalizeGeneratedCard(raw); if(!card) continue;
    card.signature=cardSignature(card);
    const pool=[...recentCards,...accepted];
    const threshold=allowSeedVariation?0.9:0.72;
    const duplicate=pool.some(old => old?.signature===card.signature || similarity(old,card) >= threshold);
    if (!duplicate) accepted.push(card);
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

export function buildFeedSchema(count=8){
  return {
    type:'object', additionalProperties:false, required:['cards'],
    properties:{
      cards:{
        type:'array', minItems:1, maxItems:Math.max(1,Math.min(12,Number(count)||8)),
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

export function buildFeedPrompt({count=8,baseContext={},workspace=[],recentCards=[],preferences={},seedCard=null}={}){
  const n=Math.max(1,Math.min(12,Number(count)||8));
  const recent=(recentCards||[]).slice(0,50).map(c=>({
    type:c.card_type,title:c.title,body:c.body,signature:c.signature,creativity_distance:c.creativity_distance
  }));
  const seed=seedCard?compact(seedCard,5000):'אין';
  return `אתה שותף יצירתי בחדר הכותבים של עולם ראיקה. החזר בדיוק ${n} רעיונות מובנים לפי סכמת ה-JSON שסופקה.\n\nכללים מחייבים:\n- כל רעיון הוא הצעה בלבד ואינו קאנון. אסור להציג המצאה חדשה כאילו היא עובדה קאנונית קיימת.\n- מותר ואף רצוי להמציא חומר חדש: דמויות, עבר, סודות, קשרים, קונפליקטים, מקומות, תרבויות, יריבים וקווי עלילה חדשים, כל עוד הם מתאימים לרוח העולם.\n- ערבב שלוש רמות יצירתיות: close (קרוב לחומר הקיים), natural (פיתוח טבעי), wild (רעיון נועז). אל תייצר אצווה מסוג אחד בלבד.\n- אל תחזור על סצנה קיימת או סצנה בפיתוח, ואל תחזור על רעיון/חתימה שהופיעו לאחרונה.\n- העדפות המשתמש משפיעות על התמהיל אך אינן חוסמות גילוי: לפחות 20% מהאצווה צריכים להיות חקירה מחוץ לקטגוריות המועדפות כרגע.\n- גוון את סוגי הכרטיסים: סצנות, דיאלוגים, יחסים, קונפליקטים, קומדיה, עבר, עולם, מורשת, דמות חדשה, סוד, מה-אם, חור עלילתי, השלכה, נקודת מבט אחרת ועוד.\n- כרטיס wild יכול לשנות כיוון או להציע פרשנות חדשה, אך חייב להיות מסומן wild ולא לדרוס קאנון.\n${seedCard?'- הבקשה היא עוד כזה: צור וריאציות קשורות לכרטיס הזרע, אך אל תשכפל אותו מילולית או רעיונית.':''}\n\nהקשר ראיקה מהאתר:\n${compact(baseContext)}\n\nחומר פרטי מה-workspace (טיוטות/בפיתוח/שמורים):\n${compact(workspace,18000)}\n\nהעדפות שנלמדו מהפעולות האחרונות:\n${compact(preferences,6000)}\n\nכרטיסי פיד אחרונים שיש להימנע מלחזור עליהם:\n${compact(recent,12000)}\n\nכרטיס זרע ל'עוד כזה':\n${seed}\n\nכתוב בעברית טבעית. שמור את גוף הרעיון תמציתי אך מספיק עשיר כדי לפתוח שיחה או סצנה.`;
}
