const fs=require('fs');
const css=fs.readFileSync(require('path').join(__dirname,'premium-theme.css'),'utf8');
for(const token of ['--toy-violet','--toy-pink','--toy-cyan','--toy-green','.landing.toy-arcade','.double-toy-game','.toy-cloud']){
  if(!css.includes(token)) throw new Error('missing '+token);
}
console.log('toy theme contract OK');
