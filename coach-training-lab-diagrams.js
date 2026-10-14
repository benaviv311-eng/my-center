(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.CoachTrainingLabDiagrams=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';

  const DIAGRAMS={
    'reception-read-server-01':{
      courtType:'full',net:true,
      players:[
        {id:'server',role:'server',label:'M',x:13,y:30},
        {id:'r1',role:'receiver',label:'K1',x:72,y:18},
        {id:'r2',role:'receiver',label:'K2',x:72,y:42},
        {id:'setter',role:'setter',label:'S',x:91,y:30}
      ],
      targetZones:[{id:'target',x:85,y:24,w:11,h:12,label:'מטרה'}],
      ballPaths:[{from:'server',to:'r1',step:1},{from:'r1',to:'target',step:3}],
      movementPaths:[{from:'r1',toX:66,toY:24,step:2}],
      notes:[{x:58,y:8,text:'קוראים את המגיש לפני התנועה'}]
    },
    'reception-two-target-02':{
      courtType:'full',net:true,
      players:[
        {id:'server',role:'server',label:'M',x:12,y:30},
        {id:'receiver',role:'receiver',label:'K',x:70,y:30},
        {id:'coach',role:'coach',label:'C',x:54,y:8}
      ],
      targetZones:[
        {id:'target1',x:86,y:12,w:10,h:12,label:'1'},
        {id:'target2',x:86,y:36,w:10,h:12,label:'2'}
      ],
      ballPaths:[{from:'server',to:'receiver',step:1},{from:'receiver',to:'target2',step:3}],
      movementPaths:[],
      notes:[{x:55,y:52,text:'המאמן מציג יעד ברגע האחרון'}]
    },
    'reception-sideout-03':{
      courtType:'mini',net:true,
      players:[
        {id:'server',role:'server',label:'M',x:12,y:30},
        {id:'a1',role:'receiver',label:'1',x:68,y:16},
        {id:'a2',role:'setter',label:'2',x:84,y:30},
        {id:'a3',role:'attacker',label:'3',x:68,y:44},
        {id:'b1',role:'defender',label:'D1',x:30,y:16},
        {id:'b2',role:'defender',label:'D2',x:30,y:44}
      ],
      targetZones:[{id:'attackzone',x:57,y:20,w:9,h:20,label:'התקפה'}],
      ballPaths:[{from:'server',to:'a1',step:1},{from:'a1',to:'a2',step:2},{from:'a2',to:'a3',step:3},{from:'a3',to:'attackzone',step:4}],
      movementPaths:[],
      notes:[{x:50,y:7,text:'3 על 3 — בונוס ל-side-out'}]
    },
    'defense-read-hitter-06':{
      courtType:'full',net:true,
      players:[
        {id:'setter',role:'setter',label:'S',x:34,y:30},
        {id:'hitter',role:'attacker',label:'T',x:43,y:14},
        {id:'defender',role:'defender',label:'D',x:74,y:37},
        {id:'target',role:'setter-target',label:'מטרה',x:91,y:30}
      ],
      targetZones:[{id:'digzone',x:84,y:23,w:13,h:14,label:'חפירה'}],
      ballPaths:[{from:'setter',to:'hitter',step:1},{from:'hitter',to:'defender',step:3},{from:'defender',to:'digzone',step:4}],
      movementPaths:[{from:'defender',toX:69,toY:32,step:2}],
      notes:[{x:61,y:8,text:'קוראים approach + כתף'}]
    },
    'defense-dig-set-cover-07':{
      courtType:'half',net:true,
      players:[
        {id:'feeder',role:'coach',label:'C',x:28,y:18},
        {id:'digger',role:'defender',label:'D',x:72,y:42},
        {id:'setter',role:'setter',label:'S',x:88,y:24},
        {id:'cover',role:'cover',label:'COV',x:68,y:17}
      ],
      targetZones:[{id:'return',x:53,y:20,w:10,h:20,label:'החזרה'}],
      ballPaths:[{from:'feeder',to:'digger',step:1},{from:'digger',to:'setter',step:2},{from:'setter',to:'return',step:3}],
      movementPaths:[{from:'digger',toX:76,toY:28,step:4}],
      notes:[{x:76,y:55,text:'Dig → Set → Cover'}]
    },
    'defense-range-08':{
      courtType:'half',net:true,
      players:[
        {id:'coach',role:'coach',label:'C',x:34,y:30},
        {id:'defender',role:'defender',label:'D',x:78,y:30},
        {id:'target',role:'setter-target',label:'S',x:93,y:30}
      ],
      targetZones:[
        {id:'near',x:67,y:15,w:8,h:10,label:'קרוב'},
        {id:'wide',x:67,y:40,w:8,h:10,label:'רחוק'}
      ],
      ballPaths:[{from:'coach',to:'near',step:1},{from:'coach',to:'wide',step:2}],
      movementPaths:[{from:'defender',toX:70,toY:20,step:1},{from:'defender',toX:70,toY:45,step:2}],
      notes:[{x:79,y:7,text:'חוזרים למרכז אחרי כל כדור'}]
    },
    'serve-risk-reward-11':{
      courtType:'full',net:true,
      players:[
        {id:'server',role:'server',label:'M',x:12,y:30},
        {id:'receiver',role:'receiver',label:'K',x:74,y:30}
      ],
      targetZones:[
        {id:'safe',x:67,y:18,w:12,h:12,label:'1 נק׳'},
        {id:'risk',x:84,y:38,w:11,h:10,label:'3 נק׳'}
      ],
      ballPaths:[{from:'server',to:'safe',step:1},{from:'server',to:'risk',step:1}],
      movementPaths:[],
      notes:[{x:50,y:7,text:'בוחרים יעד ורמת סיכון לפני ההגשה'}]
    },
    'serve-zone-choice-12':{
      courtType:'full',net:true,
      players:[
        {id:'server',role:'server',label:'M',x:12,y:30},
        {id:'receiver',role:'receiver',label:'K',x:76,y:20}
      ],
      targetZones:[
        {id:'zone1',x:65,y:38,w:11,h:12,label:'A'},
        {id:'zone2',x:84,y:38,w:11,h:12,label:'B'}
      ],
      ballPaths:[{from:'server',to:'zone2',step:2}],
      movementPaths:[{from:'receiver',toX:76,toY:14,step:1}],
      notes:[{x:50,y:7,text:'מיקום המקבל קובע את הבחירה'}]
    },
    'serve-volley2s-15':{
      courtType:'mini',net:true,
      players:[
        {id:'server',role:'server',label:'M',x:18,y:42},
        {id:'mate',role:'teammate',label:'2',x:32,y:18},
        {id:'opp1',role:'receiver',label:'1',x:70,y:18},
        {id:'opp2',role:'receiver',label:'2',x:82,y:42}
      ],
      targetZones:[{id:'play',x:60,y:10,w:34,h:40,label:'מגרש היריב'}],
      ballPaths:[{from:'server',to:'play',step:1}],
      movementPaths:[{from:'server',toX:31,toY:41,step:2}],
      notes:[{x:50,y:55,text:'מגישים — ומיד נכנסים לראלי'}]
    },
    'block-read-approach-16':{
      courtType:'half',net:true,
      players:[
        {id:'setter',role:'setter',label:'S',x:35,y:30},
        {id:'hitter',role:'attacker',label:'T',x:35,y:14},
        {id:'blocker',role:'blocker',label:'B',x:58,y:30}
      ],
      targetZones:[{id:'close',x:51,y:10,w:8,h:15,label:'סגירה'}],
      ballPaths:[{from:'setter',to:'hitter',step:1}],
      movementPaths:[{from:'hitter',toX:45,toY:19,step:2},{from:'blocker',toX:54,toY:18,step:3}],
      notes:[{x:69,y:52,text:'קוראים את מסלול ה-approach לפני הקפיצה'}]
    }
  };

  return {DIAGRAMS};
});
