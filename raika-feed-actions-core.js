function rfaText(v,max=12000){return String(v??'').trim().slice(0,max);}
function rfaArray(v,max=30){return Array.isArray(v)?v.slice(0,max).map(x=>rfaText(x,120)).filter(Boolean):[];}
function rfaTags(...groups){return [...new Set(groups.flat().filter(Boolean).map(x=>rfaText(x,100)))].slice(0,40);}
function feedCardToWorkspaceItem(card={},status='idea'){
  const safeStatus=status==='developing'?'developing':'idea';
  return {
    id:`feed-${rfaText(card.id,120)}`,
    type:'idea',status:safeStatus,saved:true,
    title:rfaText(card.title,220)||'רעיון מהפיד היצירתי',
    summary:rfaText(card.body),
    placement:rfaText(card.suggested_placement,2000),
    why:rfaText(card.why_it_may_work,4000),
    opens:'',
    characters:rfaArray(card.characters,30),
    tags:rfaTags(['פיד יצירתי',card.card_type],card.tags||[]),
  };
}
function sceneProposalToWorkspaceItem(card={},proposal={},suffix=Date.now()){
  const beats=rfaArray(proposal.beats,20);
  const summary=[
    proposal.opening&&`פתיחה: ${rfaText(proposal.opening)}`,
    proposal.trigger&&`טריגר: ${rfaText(proposal.trigger)}`,
    beats.length&&`מהלך:\n${beats.map(x=>`• ${x}`).join('\n')}`,
    proposal.dialogue&&`דיאלוג:\n${rfaText(proposal.dialogue)}`,
    proposal.turning_point&&`נקודת מפנה: ${rfaText(proposal.turning_point)}`,
    proposal.ending&&`סיום: ${rfaText(proposal.ending)}`,
  ].filter(Boolean).join('\n\n');
  return {
    id:`feed-scene-${rfaText(card.id,100)}-${rfaText(suffix,60)}`,
    type:'idea',status:'idea',saved:true,
    title:rfaText(proposal.title,220)||`סצנה: ${rfaText(card.title,180)}`,
    summary:summary||rfaText(card.body),
    placement:rfaText(proposal.placement||card.suggested_placement,2000),
    why:rfaText(proposal.why||card.why_it_may_work,4000),
    opens:rfaText(proposal.opens,4000),
    characters:rfaArray(proposal.characters?.length?proposal.characters:card.characters,30),
    tags:rfaTags(['פיד יצירתי','הצעת סצנה',card.card_type],proposal.tags||[],card.tags||[]),
  };
}
const api={feedCardToWorkspaceItem,sceneProposalToWorkspaceItem};
if(typeof window!=='undefined')window.RaikaFeedActionsCore=api;
if(typeof module!=='undefined')module.exports=api;
