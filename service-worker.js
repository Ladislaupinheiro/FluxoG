// service-worker.js

// Versão incrementada para forçar a atualização da cache em todos os browsers
const CACHE_NAME = 'gestorbar-v8'; 
const URLS_TO_CACHE = [
    // URLs essenciais para o funcionamento offline
    './',
    './index.html',
    './style.css',
    './manifest.json',
    // Todos os módulos JavaScript
    './modules/main.js',
    './modules/state.js',
    './modules/ui.js',
    './modules/handlers.js',
    './modules/modals.js',
    './modules/selectors.js',
    './modules/security.js', // Módulo de segurança adicionado à cache
    // Ícones da aplicação
    './icons/logo-small-192.png',
    './icons/logo-big-512.png',
    './favicon.png' // Favicon adicionado à cache
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

// Evento 'activate': limpa caches antigas para evitar conflitos.
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('A limpar cache antiga:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Evento 'fetch': serve ficheiros da cache primeiro, com fallback para a rede (estratégia Cache-First).
self.addEventListener('fetch', (event) => {
    // Apenas aplica a estratégia de cache a pedidos GET
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.match(event.request).then((cachedResponse) => {
                // Se o recurso estiver na cache, retorna-o
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                // Se não estiver na cache, vai à rede
                return fetch(event.request).then((networkResponse) => {
                    // Opcional: pode-se adicionar o novo recurso à cache aqui se necessário
                    // cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                }).catch(() => {
                    // Se a rede falhar, pode-se retornar uma página de fallback offline
                    // if (event.request.mode === 'navigate') {
                    //     return caches.match('offline.html');
                    // }
                });
            });
        })
    );
});

