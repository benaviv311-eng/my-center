async function rwaApprove(item){return RaikaWorkspaceClient.save({...item,status:'canon'},'approve');}
window.RaikaWorkspaceActions={approve:rwaApprove};
