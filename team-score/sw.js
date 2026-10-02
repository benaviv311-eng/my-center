const CACHE='teamscore-pilot-v35';
const ASSETS=[
  './','./index.html','./manifest.webmanifest','./icon.svg',
  './t1.txt','./t2.txt','./t3.txt','./t4.txt',
  './b1.txt','./b2.txt','./b3.txt','./b4.txt',
  './backgrounds.css','./backgrounds.js',
  './assets/hd-sprites/maya.webp','./assets/hd-sprites/sofia.webp',
  './assets/hd-sprites/nia.webp','./assets/hd-sprites/lena.webp'
];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  if(e.request.mode==='navigate'){
    e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{const y=r.clone();caches.open(CACHE).then(c=>c.put('./index.html',y));return r;}).catch(()=>caches.match('./index.html').then(x=>x||caches.match('./'))));
    return;
  }
  e.respondWith(caches.match(e.request).then(cached=>{
    const fresh=fetch(e.request).then(r=>{if(r&&r.ok){const y=r.clone();caches.open(CACHE).then(c=>c.put(e.request,y));}return r;});
    return cached||fresh;
  }));
});