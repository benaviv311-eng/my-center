async function rwRemove(item){const action=item.status==='canon'?'archive':'delete';const out=await RaikaWorkspaceClient.call({action,item_type:item.type||'idea',item_id:item.id});await RaikaPrivateAPI.reload();return out;}
window.RaikaWorkspaceRemove=rwRemove;
