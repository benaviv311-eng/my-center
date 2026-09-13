async function raiCall(body){
  const {data:{session}}=await RaikaPrivate.client.auth.getSession();
  if(!session)throw new Error('צריך להתחבר מחדש');
  const r=await fetch(`${BANK_URL}/functions/v1/raika-consult`,{
    method:'POST',
    headers:{apikey:BANK_PUBLISHABLE_KEY,Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json'},
    body:JSON.stringify(body)
  });
  const j=await r.json().catch(()=>({}));
  if(!r.ok){
    const detail=typeof j.detail==='string'?j.detail.trim():'';
    const e=new Error(detail?`${j.error||'הייעוץ נכשל'}: ${detail}`:(j.error||'הייעוץ נכשל'));
    e.code=j.code||'';
    e.detail=detail;
    e.status=r.status;
    throw e;
  }
  return j;
}
window.raiCall=raiCall;
