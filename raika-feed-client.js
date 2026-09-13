async function rfcCall(body){
  const {data:{session}}=await RaikaPrivate.client.auth.getSession();
  if(!session){const e=new Error('צריך להתחבר מחדש');e.code='login_required';throw e;}
  const r=await fetch(`${BANK_URL}/functions/v1/raika-feed`,{
    method:'POST',headers:{apikey:BANK_PUBLISHABLE_KEY,Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json'},body:JSON.stringify(body)
  });
  const j=await r.json().catch(()=>({}));
  if(!r.ok){const e=new Error(j.detail||j.error||'בקשת הפיד נכשלה');e.code=j.code||`http_${r.status}`;e.status=r.status;e.detail=j.detail||'';throw e;}
  return j;
}
function rfcContext(){return window.RaikaFeedContext?.buildFeedBaseContext(window.RAIKA_DATA||{})||{};}
async function generate({count=10,recentSignatures=[]}={}){return rfcCall({action:'generate',count,recent_signatures:recentSignatures,base_context:rfcContext()});}
async function moreLike(seedCardId,{count=3,recentSignatures=[]}={}){return rfcCall({action:'more_like',seed_card_id:seedCardId,count,recent_signatures:recentSignatures,base_context:rfcContext()});}
async function feedback(cardId,feedbackAction,metadata={},promotedItemId=''){return rfcCall({action:'feedback',card_id:cardId,feedback_action:feedbackAction,metadata,promoted_item_id:promotedItemId});}
async function expandScene(seedCardId){return rfcCall({action:'expand_scene',seed_card_id:seedCardId,base_context:rfcContext()});}
window.RaikaFeedClient={call:rfcCall,generate,moreLike,feedback,expandScene,context:rfcContext};
