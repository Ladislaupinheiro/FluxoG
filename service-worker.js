// /modules/service-worker.js (v17) - Garante uma instalação limpa e a estratégia Network-First.
'use strict';

const CACHE_NAME = 'gestorbar-v18';
// CORREÇÃO: Removido o 'config.js' que não existe.
const URLS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './manifest.json',
    './favicon.png',
    './modules/main.js',
    './modules/state.js',
    './modules/ui.js',
    './modules/handlers.js',
    './modules/modals.js',
    './modules/selectors.js',
    './modules/database.js',
    './icons/logo-small-192.png',
    './icons/logo-big-512.png'
];

self.addEventListener('install', (event) => {
    console.log('[Service Worker] A instalar v18...');
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            console.log('[Service Worker] Cache aberta. A guardar ficheiros essenciais...');
            await cache.addAll(URLS_TO_CACHE);
        }).then(() => {
            console.log('[Service Worker] Todos os ficheiros guardados. A forçar ativação...');
            return self.skipWaiting();
        })
    );
});

self.addEventListener('activate', (event) => {
    console.log('[Service Worker] A ativar v18...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log(`[Service Worker] A limpar cache antiga: ${cacheName}`);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[Service Worker] Caches limpas. A assumir o controlo...');
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .then(networkResponse => {
                return caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            })
            .catch(() => {
                return caches.match(event.request).then(cachedResponse => {
                    return cachedResponse || Response.error();
                });
            })
    );
});

