import { createClient } from 'npm:@supabase/supabase-js@2.116.0';

const url=Deno.env.get('SUPABASE_URL')||'';
const anon=Deno.env.get('SUPABASE_ANON_KEY')||Deno.env.get('SUPABASE_PUBLISHABLE_KEY')||'';
const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
const allowedOrigins=new Set(['https://benaviv311-eng.github.io','http://localhost:8000','http://127.0.0.1:8000']);

function cors(req:Request){
  const origin=req.headers.get('origin')||'';
  return {
    'Access-Control-Allow-Origin':allowedOrigins.has(origin)?origin:'https://benaviv311-eng.github.io',
    'Access-Control-Allow-Headers':'authorization, apikey, content-type',
    'Access-Control-Allow-Methods':'POST, OPTIONS',
    'Vary':'Origin',
  };
}
function json(req:Request,body:unknown,status=200){
  return new Response(JSON.stringify(body),{status,headers:{...cors(req),'Content-Type':'application/json; charset=utf-8'}});
}
function text(v:unknown,max=12000){return String(v??'').trim().slice(0,max);}
function compact(value:unknown,max=22000){
  try{return JSON.stringify(value??{}).slice(0,max);}catch{return '{}';}
}
async function authorizedUser(req:Request){
  const auth=req.headers.get('authorization')||'';
  const token=auth.replace(/^Bearer\s+/i,'');
  if(!token)return null;
  const client=createClient(url,anon,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false,autoRefreshToken:false}});
  const {data:userData,error:userError}=await client.auth.getUser(token);
  if(userError||!userData.user)return null;
  const {data:allow,error:allowError}=await client.from('raika_authorized_users').select('email_hash').limit(1);
  if(allowError||!allow?.length)return null;
  return userData.user;
}
function answerText(r:any){
  if(typeof r?.output_text==='string')return r.output_text.trim();
  const parts:string[]=[];
  for(const o of r?.output||[])for(const c of o?.content||[])if(c?.type==='output_text'&&c?.text)parts.push(c.text);
  return parts.join('\n').trim();
}
function schema(){
  return {
    type:'object',additionalProperties:false,required:['reply','items'],
    properties:{
      reply:{type:'string'},
      items:{
        type:'array',minItems:0,maxItems:6,
        items:{
          type:'object',additionalProperties:false,
          required:['kind','title','body','characters','tags'],
          properties:{
            kind:{type:'string',enum:['idea','scene','plotline','verse']},
            title:{type:'string'},
            body:{type:'string'},
            characters:{type:'array',items:{type:'string'}},
            tags:{type:'array',items:{type:'string'}}
          }
        }
      }
    }
  };
}
function historyText(history:any[]){
  return (Array.isArray(history)?history:[]).slice(-20).map((m:any)=>{
    const role=m?.role==='assistant'?'assistant':'user';
    return `${role}: ${text(m?.content,7000)}`;
  }).join('\n\n');
}

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors(req)});
  if(req.method!=='POST')return json(req,{error:'Method not allowed'},405);

  const user=await authorizedUser(req);
  if(!user)return json(req,{error:'Not authorized',code:'not_authorized'},403);

  let body:any={};
  try{body=await req.json();}catch{return json(req,{error:'Invalid JSON',code:'invalid_json'},400);}
  const message=text(body.message,10000);
  if(!message)return json(req,{error:'Message is required',code:'message_required'},400);

  const history=Array.isArray(body.history)?body.history.slice(-20):[];
  const baseContext=body.base_context&&typeof body.base_context==='object'?body.base_context:{};

  const [{data:workspace,error:workspaceError},{data:recentFeed,error:feedError}]=await Promise.all([
    admin.from('raika_item_edits').select('item_type,item_id,status,payload,updated_at').eq('user_id',user.id).order('updated_at',{ascending:false}).limit(120),
    admin.from('raika_feed_cards').select('card_type,title,body,structured_payload,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(40)
  ]);
  if(workspaceError||feedError)return json(req,{error:(workspaceError||feedError)?.message||'Context load failed',code:'context_load_failed'},500);

  const apiKey=Deno.env.get('OPENAI_API_KEY');
  if(!apiKey)return json(req,{error:'AI is not configured',code:'ai_not_configured'},503);

  const prompt=`אתה הצ'אט החי של חדר הכותבים בעולם ראיקה. אתה שותף כתיבה יצירתי, לא מאגר רעיונות.

המטרה:
- להגיב לבקשה הנוכחית וליצור תוכן חדש על המקום.
- לזכור את רצף השיחה המצורף. אם המשתמש אומר "עוד אחד", "יותר אפל", "עם ראי", "פתח את השלישי לסצנה" וכדומה — המשך ישירות מן ההקשר.
- להשתמש בקאנון ובחומר השמור כדי להימנע מסתירות, אבל לא להיות מוגבל לרעיונות קיימים במאגר.
- להציע רעיונות מקוריים, סצנות ממשיות עם פעולות ודיאלוג, קווי עלילה, דמויות, סודות, יחסים, עולם, קומדיה, עבר ועתיד לפי בקשת המשתמש.

כלל קאנון מחייב:
- עובדות שמופיעות בהקשר הקאנוני יכולות להיות מוצגות כקאנון.
- כל פרט חדש שאתה ממציא הוא הצעה בלבד / לא קאנון עד שהמשתמש מאשר במפורש.
- אל תכריז על המצאה חדשה כעובדה קאנונית.
- "plotline" שמוחזר כאן הוא תמיד קו עלילה לא קאנוני.
- "scene" שמוחזר כאן הוא תמיד סצנה בפיתוח.
- "verse" הוא פסוק/השראה לשמירה בחדר הכותבים; אם אתה מצטט מקור ממשי, ציין אותו במדויק ככל האפשר ואל תמציא מקור.

החזר JSON לפי הסכמה:
- reply: תשובה טבעית בעברית שמדברת עם המשתמש כמו שותף כתיבה.
- items: 0–6 פריטים שניתן לשמור. השתמש בהם רק כשיש בתשובה חומר מובנה שכדאי לשמור.
  kind=idea לרעיון; scene לסצנה; plotline לקו עלילה לא קאנוני; verse לפסוק/השראה.
- בסצנה, body צריך להכיל סצנה ממשית: מקום/זמן, פתיח, מהלך, דיאלוג, תפנית וסיום — לא רק תקציר.
- בקו עלילה, body צריך להכיל פתיחה, קונפליקט, הסלמה, תפנית, שיא אפשרי והשלכות.

הקשר קאנוני/עולם מהאתר:
${compact(baseContext,26000)}

חומר פרטי ששמור בחדר הכותבים:
${compact(workspace,26000)}

רעיונות פיד אחרונים — רק כדי לא לחזור עליהם, לא כמקור שחייבים לבחור ממנו:
${compact(recentFeed,12000)}

היסטוריית הצ'אט:
${historyText(history)}

בקשת המשתמש עכשיו:
${message}`;

  let response:Response;
  try{
    response=await fetch('https://api.openai.com/v1/responses',{
      method:'POST',
      headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},
      body:JSON.stringify({
        model:'gpt-5.6-sol',
        input:prompt,
        reasoning:{effort:'medium'},
        text:{format:{type:'json_schema',name:'raika_writers_chat',strict:true,schema:schema()}}
      })
    });
  }catch(e){
    return json(req,{error:'OpenAI network request failed',code:'openai_network',detail:e instanceof Error?e.message:'network error'},502);
  }
  const raw=await response.json().catch(()=>({}));
  if(!response.ok)return json(req,{error:'OpenAI request failed',code:`openai_${response.status}`,detail:raw?.error?.message||'unknown'},502);

  const output=answerText(raw);
  if(!output)return json(req,{error:'Empty AI response',code:'openai_empty'},502);
  let parsed:any;
  try{parsed=JSON.parse(output);}catch{return json(req,{error:'Invalid AI response',code:'openai_invalid_json'},502);}

  const items=(Array.isArray(parsed.items)?parsed.items:[]).slice(0,6).map((item:any)=>({
    kind:['idea','scene','plotline','verse'].includes(item?.kind)?item.kind:'idea',
    title:text(item?.title,240)||'הצעה חדשה',
    body:text(item?.body,12000),
    characters:Array.isArray(item?.characters)?item.characters.slice(0,20).map((x:any)=>text(x,120)).filter(Boolean):[],
    tags:Array.isArray(item?.tags)?item.tags.slice(0,30).map((x:any)=>text(x,100)).filter(Boolean):[]
  })).filter((item:any)=>item.body);

  return json(req,{ok:true,reply:text(parsed.reply,12000),items});
});