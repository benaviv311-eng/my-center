(function(root){
  'use strict';
  if(!root) return;
  const KEY='my-center-favorites';
  function read(){
    try{return new Set(JSON.parse(root.localStorage.getItem(KEY)||'[]'))}catch(_){return new Set()}
  }
  function write(set){root.localStorage.setItem(KEY,JSON.stringify([...set]));}
  function has(id){return read().has(String(id));}
  function all(){return [...read()];}
  function set(id,shouldSave){
    const key=String(id),items=read();
    if(shouldSave) items.add(key); else items.delete(key);
    write(items);
    const saved=items.has(key);
    if(root.document&&typeof root.CustomEvent==='function'){
      root.document.dispatchEvent(new root.CustomEvent('mycenter:favorites-changed',{detail:{id:key,saved}}));
    }
    return saved;
  }
  function toggle(id){const key=String(id);return set(key,!has(key));}
  root.MyCenterFavorites={KEY,has,all,set,toggle};
})(typeof window!=='undefined'?window:globalThis);
