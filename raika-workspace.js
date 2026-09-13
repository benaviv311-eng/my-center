function normalizeWorkspaceItem(row={}){
  const payload=row && row.payload && typeof row.payload==='object' ? row.payload : {};
  return {id:row.item_id||row.id||'',type:row.item_type||row.type||'idea',status:row.status||'idea',...payload};
}
function mergeWorkspaceOverrides(baseItems=[],overrides=[]){
  const map=new Map(overrides.map(row=>[row.item_id,normalizeWorkspaceItem(row)]));
  const seen=new Set();
  const merged=baseItems.map(item=>{const over=map.get(item.id);if(!over)return {...item};seen.add(item.id);return {...item,...over,id:item.id};});
  for(const row of overrides){if(!seen.has(row.item_id))merged.push(normalizeWorkspaceItem(row));}
  return merged;
}
function nextDeleteAction(status){return status==='canon'||status==='archived'?'archive':'delete';}
function editablePayload(item={}){return {title:item.title||'',summary:item.summary||'',placement:item.placement||'',why:item.why||'',opens:item.opens||'',tags:Array.isArray(item.tags)?item.tags:[],characters:Array.isArray(item.characters)?item.characters:[],saved:Boolean(item.saved)};}
function buildAutosavePayload(item={}){return {action:'autosave',item_type:item.type||'idea',item_id:item.id||'',status:item.status||'idea',payload:editablePayload(item)};}
function buildRemovalPayload(item={}){return {action:nextDeleteAction(item.status),item_id:item.id||'',item_type:item.type||'idea'};}
function createAutosaveScheduler(send,delay=1000){const timers=new Map();return {schedule(id,item){clearTimeout(timers.get(id));timers.set(id,setTimeout(()=>{timers.delete(id);Promise.resolve(send(buildAutosavePayload(item))).catch(()=>{});},delay));},cancel(id){clearTimeout(timers.get(id));timers.delete(id);}};}
const api={normalizeWorkspaceItem,mergeWorkspaceOverrides,nextDeleteAction,editablePayload,buildAutosavePayload,buildRemovalPayload,createAutosaveScheduler};
if(typeof window!=='undefined')window.RaikaWorkspaceCore=api;
if(typeof module!=='undefined')module.exports=api;