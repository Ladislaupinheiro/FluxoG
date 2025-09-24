// /modules/service-worker.js (v16) - Implementa um recarregamento forçado na ativação para garantir consistência.
'use strict';

const CACHE_NAME = 'gestorbar-v16';
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
    './modules/security.js',
    './icons/logo-small-192.png',
    './icons/logo-big-512.png'
];

self.addEventListener('install', (event) => {
    console.log('[Service Worker] A instalar v16...');
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            console.log('[Service Worker] Cache aberta. A guardar ficheiros essenciais...');
            const promises = URLS_TO_CACHE.map(async (url) => {
                try {
                    const response = await fetch(url, { cache: 'reload' });
                    if (!response.ok) throw new Error(`Status ${response.status}`);
                    await cache.put(url, response);
                } catch (error) {
                    console.error(`[Service Worker] Falha ao guardar em cache '${url}':`, error.message);
                }
            });
            await Promise.all(promises);
        }).then(() => {
            console.log('[Service Worker] Instalação concluída. A forçar ativação...');
            return self.skipWaiting();
        })
    );
});

self.addEventListener('activate', (event) => {
    console.log('[Service Worker] A ativar v16...');
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
            console.log('[Service Worker] Caches limpas. A assumir o controlo e a forçar o recarregamento dos clientes...');
            // Força todas as abas abertas a recarregarem para usar a nova versão da aplicação.
            return self.clients.claim().then(() => {
                return self.clients.matchAll({ type: 'window' }).then(clients => {
                    clients.forEach(client => {
                        client.navigate(client.url);
                    });
                });
            });
        })
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
        return;
    }
    event.respondWith(
        fetch(event.request)
            .then(networkResponse => {
                return caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            })
            .catch(() => {
                return caches.match(event.request);
            })
    );
});

