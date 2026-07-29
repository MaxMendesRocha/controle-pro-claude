// public/sw.js
// Service worker minimo, so para satisfazer o criterio de instalabilidade do
// Chrome (precisa de um service worker ativo com um handler de fetch para
// oferecer o prompt de "Instalar app" em vez de um atalho generico).
// Nao faz cache de nada de proposito - o app depende de dados ao vivo do
// Firestore, entao cachear respostas aqui poderia mostrar dados desatualizados.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
