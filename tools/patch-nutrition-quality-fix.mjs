import './patch-nutrition-quality.mjs';
import { readFileSync, writeFileSync } from 'node:fs';

const path='nutrition-planner.js';
let planner=readFileSync(path,'utf8');
const old=`const desired=Math.min(currentUnique.length,Math.max(4,Meals.normalizeMealCount(mealCount)+1));`;
const next=`const desired=Math.min(currentUnique.length,Math.max(5,Meals.normalizeMealCount(mealCount)+2));`;
if(planner.includes(old))planner=planner.replace(old,next);
else if(!planner.includes(next))throw new Error('diversity selection rule not found');
writeFileSync(path,planner);
