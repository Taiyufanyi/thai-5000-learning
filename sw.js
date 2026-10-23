const AUDIO_CACHE = 'thai5000-pronunciation-v1';
const PAGE_CACHE = 'thai5000-pages-v1';
self.addEventListener('install', e => { e.waitUntil(self.skipWaiting()); });
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', e => {
  if(e.request.method!=='GET') return;
  const url = new URL(e.request.url);
  if(url.origin!==self.location.origin) return;
  if(url.pathname.endsWith('/__thai_audio_cache__/')) {
    e.respondWith((async()=>{
      const q=url.searchParams.get('q');
      if(!q) return new Response('Missing q',{status:400});
      const remote='https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=th&q='+encodeURIComponent(q.trim());
      const c=await caches.open(AUDIO_CACHE);
      return (await c.match(remote)) || new Response('Not cached',{status:404});
    })());
    return;
  }
  e.respondWith((async()=>{
    const c=await caches.open(PAGE_CACHE);
    try{
      const response=await fetch(e.request);
      if(response.ok) await c.put(e.request,response.clone());
      return response;
    } catch(e){ return (await c.match(e.request)) || Response.error(); }
  })());
});
