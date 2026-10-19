const CACHE = 'miniloja-v2';
const ARQUIVOS = ['./', './index.html', './style.css', './app.js', './manifest.json', './icon.svg', './icon-192.png', './icon-512.png', './imagens/produto.svg', './imagens/mochila.jpg', './imagens/camisa.jpg', './imagens/jaqueta.jpg', './vendor/bootstrap.min.css', './vendor/axios.min.js'];
self.addEventListener('install', evento => {
  evento.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', evento => {
  evento.waitUntil(caches.keys().then(chaves => Promise.all(
    chaves.filter(chave => chave.startsWith('miniloja-') && chave !== CACHE).map(chave => caches.delete(chave))
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', evento => {
  if (evento.request.method !== 'GET') return;
  const url = new URL(evento.request.url);
  // A API é consultada pelo aplicativo; seu último resultado fica no localStorage.
  if (url.origin !== self.location.origin) return;
  evento.respondWith(caches.match(evento.request).then(salvo => salvo || fetch(evento.request).catch(() => {
    if (evento.request.mode === 'navigate') return caches.match('./index.html');
    return Response.error();
  })));
});
