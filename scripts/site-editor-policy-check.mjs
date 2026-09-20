import {execFileSync} from 'node:child_process';
import {basename} from 'node:path';

function git(args){
  return execFileSync('git',args,{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
}

function changedPaths(){
  const out=git(['diff','--name-only','--diff-filter=ACMR','origin/main...HEAD']);
  return out?out.split(/\r?\n/).filter(Boolean):[];
}

function blockedPath(path){
  const name=basename(path).toLowerCase();
  if(name==='.env'||name.startsWith('.env.'))return true;
  if(name.endsWith('.pem')||name.endsWith('.key'))return true;
  if(/^id_(rsa|dsa|ecdsa|ed25519)(\.|$)/.test(name))return true;
  if(/(^|[._-])(credentials?|secrets?)([._-]|$)/.test(name))return true;
  return false;
}

function addedText(path){
  try{
    const diff=git(['diff','--unified=0','origin/main...HEAD','--',path]);
    return diff.split(/\r?\n/)
      .filter(line=>line.startsWith('+')&&!line.startsWith('+++'))
      .map(line=>line.slice(1))
      .join('\n');
  }catch{
    return '';
  }
}

const paths=changedPaths();
const violations=[];

for(const path of paths){
  if(blockedPath(path))violations.push(`blocked secret-like path: ${path}`);
  const added=addedText(path);
  if(/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(added)){
    violations.push(`PRIVATE KEY material added in: ${path}`);
  }
  if(/(?:GITHUB_APP_PRIVATE_KEY|SUPABASE_SERVICE_ROLE_KEY)\s*[:=]\s*[^$\s{]/.test(added)){
    violations.push(`hard-coded secret assignment added in: ${path}`);
  }
}

if(violations.length){
  console.error('Site Editor policy check failed:');
  for(const item of violations)console.error('- '+item);
  process.exit(1);
}

console.log(`Site Editor policy check passed for ${paths.length} changed path(s) against origin/main.`);
