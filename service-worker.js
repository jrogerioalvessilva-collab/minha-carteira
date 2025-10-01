const CACHE_NAME = 'carteira-investimentos-v1.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Instalação - fazer cache dos arquivos essenciais
self.addEventListener('install', event => {
  console.log('[Service Worker] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Cache criado');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('[Service Worker] Erro ao criar cache:', err);
      })
  );
  self.skipWaiting();
});

// Ativação - limpar caches antigos
self.addEventListener('activate', event => {
  console.log('[Service Worker] Ativando...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch - estratégia: Cache First, depois Network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se está no cache, retorna do cache
        if (response) {
          console.log('[Service Worker] Servindo do cache:', event.request.url);
          return response;
        }

        // Se não está no cache, busca da rede
        console.log('[Service Worker] Buscando da rede:', event.request.url);
        return fetch(event.request).then(response => {
          // Verifica se a resposta é válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clona a resposta
          const responseToCache = response.clone();

          // Adiciona ao cache para uso futuro
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(error => {
        console.error('[Service Worker] Erro no fetch:', error);
        // Em caso de erro, tenta retornar o index.html do cache
        return caches.match('/index.html');
      })
  );
});

// Escutar mensagens do cliente
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
