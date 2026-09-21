const CACHE='teamscore-pilot-v24';
const ASSETS=[
  './','./index.html','./manifest.webmanifest','./icon.svg',
  './t1.txt','./t2.txt','./t3.txt','./t4.txt',
  './backgrounds.css','./backgrounds.js'
];
self.addEventListener('install',e=>e.waitUntil(
  caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())
));
self.addEventListener('activate',e=>e.waitUntil(
  caches.keys()
    .then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim())
));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(
    caches.match(e.request).then(x=>x||fetch(e.request).then(r=>{
      const y=r.clone();
      caches.open(CACHE).then(c=>c.put(e.request,y));
      return r;
    }))
  );
});
