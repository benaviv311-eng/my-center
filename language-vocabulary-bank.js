(function(root,factory){if(typeof module==='object'&&module.exports){module.exports=factory({verbs:require('./language-vocabulary-data-verbs.js'),adjectives:require('./language-vocabulary-data-adjectives.js'),nouns:require('./language-vocabulary-data-nouns.js'),placesHome:require('./language-vocabulary-data-places-home.js')});}else{root.LanguageVocabularyBank=factory(root.LanguageVocabularyParts||{});}})(typeof globalThis!=='undefined'?globalThis:this,function(parts){
const LANGUAGES={ar:{name:'ערבית',code:'AR'},it:{name:'איטלקית',code:'IT'},ru:{name:'רוסית',code:'RU'},es:{name:'ספרדית',code:'ES'}};
function make(row,id){return{id,he:row[0],ar:{target:row[1]},it:{target:row[2]},ru:{target:row[3]},es:{target:row[4]}};}
function makeList(rows,prefix){return rows.map((row,i)=>make(row,prefix+'-'+(i+1)));}
function range(list,start,count){return Array.from({length:count},(_,i)=>list[(start+i)%list.length]);}
function mix(prefix,groups){return makeList(groups.flat().slice(0,100),prefix);}
const verbs=(parts.verbs||[]).slice();const adjectives=(parts.adjectives||[]).slice();const nouns=(parts.nouns||[]).slice();const placesHome=(parts.placesHome||[]).slice();
function placesWords(){const a=[adjectives[0],adjectives[1],adjectives[14],adjectives[15],adjectives[18],adjectives[20],adjectives[24],adjectives[28],adjectives[59],adjectives[60]];const rows=[];placesHome.forEach(p=>a.forEach(x=>rows.push([p[0]+' — '+x[0],p[1]+' '+x[1],p[2]+' '+x[2],x[3]+' '+p[3],p[4]+' '+x[4]])));return makeList(rows,'places');}
const TOPICS={
verbs:{name:'פעלים',icon:'⚡',description:'100 פעלים שימושיים לשיחה וליום־יום',words:makeList(verbs,'verbs')},
adjectives:{name:'שמות תואר',icon:'✨',description:'100 תארים שימושיים',words:makeList(adjectives,'adjectives')},
nouns:{name:'שמות עצם',icon:'🧩',description:'100 שמות עצם שימושיים',words:makeList(nouns,'nouns')},
places:{name:'מקומות',icon:'📍',description:'100 צירופי מקום שימושיים',words:placesWords()},
daily:{name:'יום־יום',icon:'☀️',description:'מילים שימושיות להתנהלות יומיומית',words:mix('daily',[range(verbs,0,34),range(adjectives,0,33),range(nouns,0,33)])},
conversation:{name:'שיחה ותקשורת',icon:'💬',description:'דיבור, שאלות, תשובות ומחשבות',words:mix('conversation',[range(verbs,0,34),range(adjectives,20,33),range(nouns,40,33)])},
home:{name:'בית וחפצים',icon:'🏠',description:'פעולות, תיאורים וחפצים בבית',words:mix('home',[range(verbs,17,33),range(adjectives,45,33),range(nouns,0,34)])},
travel:{name:'עיר, דרך ונסיעות',icon:'🧭',description:'תנועה, נסיעות, כיוונים ומרחב',words:mix('travel',[range(verbs,36,33),range(adjectives,0,33),range(nouns,55,34)])},
workstudy:{name:'עבודה ולימודים',icon:'🎓',description:'למידה, משימות, עבודה ותקשורת',words:mix('workstudy',[range(verbs,8,33),range(adjectives,20,33),range(nouns,30,34)])},
emotions:{name:'רגשות ואנשים',icon:'❤️',description:'רגשות, אופי, קשרים ומפגשים',words:mix('emotions',[range(verbs,67,33),range(adjectives,33,33),range(nouns,67,34)])},
leisure:{name:'קולנוע, מוזיקה ופנאי',icon:'🎬',description:'צפייה, משחק, מוזיקה, מדיה ובילוי',words:mix('leisure',[range(verbs,53,33),range(adjectives,28,33),range(nouns,33,34)])},
sporthealth:{name:'ספורט, גוף ובריאות',icon:'🏐',description:'תנועה, אימון, גוף, תחושות ובריאות',words:mix('sporthealth',[range(verbs,36,33),range(adjectives,40,33),range(nouns,67,34)])}
};
return{LANGUAGES,TOPICS};
});