import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';

function git(args){
  return execFileSync('git',args,{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
}

function changedMigrationFiles(){
  const out=git(['diff','--name-only','--diff-filter=ACMR','origin/main...HEAD','--','supabase/migrations/*.sql']);
  return out?out.split(/\r?\n/).filter(Boolean):[];
}

function stripComments(sql){
  return sql
    .replace(/\/\*[\s\S]*?\*\//g,' ')
    .replace(/--[^\r\n]*/g,' ');
}

function normalize(sql){
  return stripComments(sql).replace(/\s+/g,' ').trim().toUpperCase();
}

function statements(sql){
  return stripComments(sql).split(';').map(s=>s.replace(/\s+/g,' ').trim()).filter(Boolean);
}

function violationFor(sql){
  const upper=normalize(sql);
  const failures=[];

  const blocked=[
    ['DROP TABLE',/\bDROP\s+TABLE\b/],
    ['DROP COLUMN',/\bDROP\s+COLUMN\b/],
    ['TRUNCATE',/\bTRUNCATE(?:\s+TABLE)?\b/],
    ['ALTER COLUMN TYPE',/\bALTER\s+TABLE\b[\s\S]*?\bALTER\s+COLUMN\b[\s\S]*?\bTYPE\b/],
    ['SET NOT NULL',/\bALTER\s+TABLE\b[\s\S]*?\bALTER\s+COLUMN\b[\s\S]*?\bSET\s+NOT\s+NULL\b/],
    ['DROP CONSTRAINT',/\bDROP\s+CONSTRAINT\b/],
    ['RENAME',/\bALTER\s+(?:TABLE|INDEX|VIEW)\b[\s\S]*?\bRENAME\b/]
  ];
  for(const [label,re] of blocked)if(re.test(upper))failures.push(label);

  for(const stmt of statements(sql)){
    const s=stmt.toUpperCase();
    if(/^DELETE\s+FROM\b/.test(s)&&!/[\s(]WHERE\b/.test(s))failures.push('DELETE FROM without WHERE');
    if(/^UPDATE\b/.test(s)&&/\bSET\b/.test(s)&&!/[\s(]WHERE\b/.test(s))failures.push('UPDATE without WHERE');
  }

  if(/\bDROP\s+POLICY\b/.test(upper)&&!/\bCREATE\s+POLICY\b/.test(upper)){
    failures.push('DROP POLICY without replacement');
  }

  return [...new Set(failures)];
}

const files=changedMigrationFiles();
const violations=[];
for(const file of files){
  const sql=readFileSync(file,'utf8');
  for(const reason of violationFor(sql))violations.push(`${file}: ${reason}`);
}

if(violations.length){
  console.error('unsafe_migration');
  for(const item of violations)console.error('- '+item);
  process.exit(1);
}

console.log(`Migration policy passed for ${files.length} changed migration file(s).`);
