function createFeedState(){return{cards:[],locked:new Set(),hidden:new Set(),loading:false,error:'',exhausted:false};}
function rfStateIds(cards=[]){return new Set(cards.map(c=>String(c?.id||'')).filter(Boolean));}
function rfUnique(cards=[],existing=new Set()){const out=[];const seen=new Set(existing);for(const card of cards||[]){const id=String(card?.id||'');if(!id||seen.has(id))continue;seen.add(id);out.push(card);}return out;}
function appendCards(state,cards){const next=rfUnique(cards,rfStateIds(state.cards));return{...state,cards:[...state.cards,...next]};}
function setLoading(state,loading){return{...state,loading:Boolean(loading)};}
function setError(state,error=''){return{...state,error:String(error||'')};}
function setExhausted(state,exhausted){return{...state,exhausted:Boolean(exhausted)};}
function canLoadMore(state){return!state.loading&&!state.exhausted;}
function lockCard(state,id){const locked=new Set(state.locked);locked.add(String(id));return{...state,locked};}
function hideCard(state,id){const hidden=new Set(state.hidden);hidden.add(String(id));return{...state,hidden};}
function insertCardsAfter(state,seedId,cards){const seed=String(seedId);const next=rfUnique(cards,rfStateIds(state.cards));const i=state.cards.findIndex(c=>String(c.id)===seed);if(i<0)return appendCards(state,next);return{...state,cards:[...state.cards.slice(0,i+1),...next,...state.cards.slice(i+1)]};}
function replaceUnlockedCards(state,cards){const keep=state.cards.filter(c=>state.locked.has(String(c.id)));const next=rfUnique(cards,rfStateIds(keep));return{...state,cards:[...keep,...next],hidden:new Set([...state.hidden].filter(id=>keep.some(c=>String(c.id)===id))),exhausted:false};}
const api={createFeedState,appendCards,setLoading,setError,setExhausted,canLoadMore,lockCard,hideCard,insertCardsAfter,replaceUnlockedCards};
if(typeof window!=='undefined')window.RaikaCreativeFeedState=api;
if(typeof module!=='undefined')module.exports=api;
