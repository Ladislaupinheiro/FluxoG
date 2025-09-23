// service-worker.js

// Versão incrementada para forçar a atualização da cache em todos os browsers
const CACHE_NAME = 'gestorbar-v11'; 
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
    './modules/security.js',
    // Ícones da aplicação
    './icons/logo-small-192.png',
    './icons/logo-big-512.png',
    './favicon.png' // CORRIGIDO: Nome do ícone atualizado na cache
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
    if (event.request.method !== 'GET') {
        return;
    }
    event.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.match(event.request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(event.request);
            });
        })
    );
});

