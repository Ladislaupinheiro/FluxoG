// /modules/service-worker.js (v14) - Remove dependências de ficheiros inexistentes e implementa a instalação resiliente.
'use strict';

const CACHE_NAME = 'gestorbar-v14';
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
    // O ficheiro config.js foi removido pois não existe no projeto, causando o erro 404.
    // As suas constantes foram movidas de volta para os módulos que as usam.
    './icons/logo-small-192.png',
    './icons/logo-big-512.png'
];

/**
 * Evento 'install': guarda os ficheiros essenciais em cache de forma resiliente,
 * um a um, para evitar que uma falha única quebre toda a instalação.
 */
self.addEventListener('install', (event) => {
    console.log('[Service Worker] A instalar v14...');
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            console.log('[Service Worker] Cache aberta. A guardar ficheiros essenciais...');
            for (const url of URLS_TO_CACHE) {
                try {
                    const response = await fetch(url);
                    if (!response.ok) {
                        throw new Error(`Status ${response.status}`);
                    }
                    await cache.put(url, response);
                } catch (error) {
                    console.error(`[Service Worker] Falha ao guardar em cache '${url}':`, error.message);
                }
            }
        }).then(() => {
            console.log('[Service Worker] Instalação concluída. A forçar ativação...');
            return self.skipWaiting();
        })
    );
});


// Evento 'activate': limpa caches antigas para garantir que usamos a nova.
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] A ativar v14...');
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
        }).then(() => self.clients.claim())
    );
});

// Evento 'fetch': implementa a estratégia "Network-First, falling back to Cache".
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

