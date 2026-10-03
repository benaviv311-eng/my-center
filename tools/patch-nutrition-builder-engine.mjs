import { readFileSync, writeFileSync } from 'node:fs';

const path='nutrition-builder.html';
let html=readFileSync(path,'utf8');

const legacyWrite=`\n  localStorage.setItem('nutritionProfile',JSON.stringify({\n    age,w,h,sex,activity:state.activity,goal:state.goal,targets:state.targets\n  }));`;
if(!html.includes(legacyWrite))throw new Error('legacy nutritionProfile write block not found');
html=html.replace(legacyWrite,'');

const legacyLoader=/\n\(function loadProfile\(\)\{[\s\S]*?\n\}\)\(\);\n(?=<\/script>)/;
if(!legacyLoader.test(html))throw new Error('legacy nutritionProfile loader block not found');
html=html.replace(legacyLoader,'\n');

writeFileSync(path,html);
