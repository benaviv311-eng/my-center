const CACHE_NAME="volleyball-app-v3";
const CORE=[
  "./","./index.html","./manifest.webmanifest","./app-icon.svg","./app-icon-192.png","./app-icon-512.png","./volleyball-app.css","./volleyball-app-shell.js",
  "../styles.css","../volleyball.css","../volleyball-rich-content.css",
  "../volleyball-data.js","../volleyball-rich-content.js","../volleyball-deep-content.js",
  "../volleyball-gallery-extension.js","../volleyball.js","../volleyball-feed-cycle.js",
  "../volleyball-drill-tab-priority.js","../volleyball-professional-feed.js",
  "../volleyball-drill-details.js","../volleyball-professional-visuals.js"
];
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith("volleyball-app-")&&k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET") return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin) return;
  if(event.request.mode==="navigate"){
    event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE_NAME).then(c=>c.put(event.request,copy));return response;}).catch(()=>caches.match("./index.html")));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{if(response&&response.status===200&&response.type==="basic"){const copy=response.clone();caches.open(CACHE_NAME).then(c=>c.put(event.request,copy));}return response;})));
});