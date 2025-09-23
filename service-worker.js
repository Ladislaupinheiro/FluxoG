// service-worker.js

const CACHE_NAME = 'gestorbar-v7'; // Versão incrementada para forçar a atualização
const URLS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './manifest.json',
    './modules/main.js',
    './modules/state.js',
    './modules/ui.js',
    './modules/handlers.js',
    './modules/modals.js',
    './modules/selectors.js',
    './icons/logo-small-192.png',
    './icons/logo-big-512.png'
];

// Evento 'install': guarda os ficheiros essenciais em cache.
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Cache aberta. A guardar ficheiros essenciais...');
                return cache.addAll(URLS_TO_CACHE);
            })
    );
    self.skipWaiting();
});

// Evento 'activate': limpa caches antigas.
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// ==== INÍCIO DA ALTERAÇÃO: ESTRATÉGIA STALE-WHILE-REVALIDATE ====
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.match(event.request).then((cachedResponse) => {
                // Faz o pedido à rede em paralelo
                const fetchPromise = fetch(event.request).then((networkResponse) => {
                    // Se o pedido à rede for bem sucedido, atualiza a cache
                    if (networkResponse && networkResponse.status === 200) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                }).catch(error => {
                    // O fetch falhou, o que é normal em modo offline.
                    console.log('Fetch falhou; provavelmente offline.', error);
                });

                // Responde imediatamente com a versão em cache (se existir), 
                // ou espera pela rede se não houver nada em cache.
                return cachedResponse || fetchPromise;
            });
        })
    );
});
// ==== FIM DA ALTERAÇÃO ====
