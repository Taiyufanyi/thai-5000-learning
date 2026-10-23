const CACHE_NAME='thai5000-pronunciation-v1';
const SHELL='thai5000-shell-v20261023-3';
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k.startsWith('thai5000-shell-') && k!==SHELL).map(k=>caches.delete(k)));
  await self.clients.claim();
})()));
self.addEventListener('fetch',e=>{
  const req=e.request;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin || req.method!=='GET') return;
  if(url.pathname.endsWith('/__thai_audio_cache__/')){
    e.respondWith((async()=>{
      const thai=(url.searchParams.get('q')||'').trim();
      if(!thai)return new Response('Missing word',{status:400});
      const remote='https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=th&q='+encodeURIComponent(thai);
      const cache=await caches.open(CACHE_NAME);
      return (await cache.match(remote))||new Response('Not cached',{status:404});
    })());return;
  }
  // Network first for pages, so GitHub updates are not hidden by old cache.
  if(req.mode==='navigate' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/')){
    e.respondWith((async()=>{
      const cache=await caches.open(SHELL);
      try{
        const fresh=await fetch(req,{cache:'no-store'});
        if(fresh.ok) await cache.put(req,fresh.clone());
        return fresh;
      }catch(_){return (await cache.match(req))||Response.error()}
    })());return;
  }
  e.respondWith((async()=>{
    const cache=await caches.open(SHELL);
    try{
      const fresh=await fetch(req);
      if(fresh.ok) await cache.put(req,fresh.clone());
      return fresh;
    }catch(_){return (await cache.match(req))||Response.error()}
  })());
});
