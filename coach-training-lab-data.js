(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.CoachTrainingLabData=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';

  const LAB_TOPICS=[
    {id:'reception',label:'קבלה'},
    {id:'defense',label:'הגנה'},
    {id:'serve',label:'הגשה'},
    {id:'attack',label:'התקפה'},
    {id:'block',label:'חסימה'},
    {id:'setting',label:'הרמה'},
    {id:'movement',label:'תנועה'},
    {id:'perception',label:'תפיסה וקבלת החלטות'},
    {id:'motor-learning',label:'למידה מוטורית'},
    {id:'power-jump',label:'כוח וקפיצה'},
    {id:'coaching-language',label:'שפת אימון'},
    {id:'psychology',label:'פסיכולוגיה'}
  ];
  const LAB_LEVELS=['beginner','developing','intermediate','advanced'];
  const LAB_TYPES=['drill','principle','science','teaching-method','scenario','comparison'];
  const LAB_SOURCE_KINDS=['research','official-body','coaching-organization','professional-practice','training-idea','our-interpretation'];
  const LAB_EVIDENCE_STRENGTHS=['strong','moderate','limited','practice-based','interpretation'];
  const LAB_ITEMS=[];

  return {LAB_TOPICS,LAB_LEVELS,LAB_TYPES,LAB_SOURCE_KINDS,LAB_EVIDENCE_STRENGTHS,LAB_ITEMS};
});
