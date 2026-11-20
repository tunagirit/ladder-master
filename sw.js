// Ladder Master service worker — çevrimdışı oynama için uygulama dosyalarını önbelleğe alır
const CACHE='ladder-master-v1.1.5';
const FONT_CACHE='ladder-master-fonts-1';
const SHELL=['./','./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/maskable-512.png','./icons/apple-touch-icon.png','./icons/favicon-32.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE&&k!==FONT_CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  // Google Fonts (Roboto Flex + Material Symbols): önbellekten, internetsizken de ikonlar görünsün
  if(e.request.method==='GET'&&(u.host==='fonts.googleapis.com'||u.host==='fonts.gstatic.com')){
    e.respondWith(caches.open(FONT_CACHE).then(c=>c.match(e.request).then(m=>m||fetch(e.request).then(r=>{ if(r.ok||r.type==='opaque') c.put(e.request,r.clone()); return r; }))));
    return;
  }
  if(e.request.method!=='GET'||u.origin!==location.origin) return;           // Supabase vb. dış istekler önbelleğe alınmaz
  if(e.request.mode==='navigate'||u.pathname.endsWith('/index.html')){      // sayfa: önce ağ (güncel sürüm), yoksa önbellek
    e.respondWith(fetch(e.request).then(r=>{ const c=r.clone(); caches.open(CACHE).then(x=>x.put('./index.html',c)); return r; }).catch(()=>caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(e.request).then(m=>m||fetch(e.request).then(r=>{ const c=r.clone(); caches.open(CACHE).then(x=>x.put(e.request,c)); return r; })));
});
