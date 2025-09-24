// /modules/service-worker.js (v13) - Implementa uma instalação de cache resiliente e a estratégia Network-First.
'use strict';

const CACHE_NAME = 'gestorbar-v13';
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
    './modules/config.js',
    './icons/logo-small-192.png',
    './icons/logo-big-512.png'
];

/**
 * Evento 'install': guarda os ficheiros essenciais em cache de forma resiliente,
 * um a um, para evitar que uma falha única quebre toda a instalação.
 */
self.addEventListener('install', (event) => {
    console.log('[Service Worker] A instalar v13...');
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            console.log('[Service Worker] Cache aberta. A guardar ficheiros essenciais...');
            for (const url of URLS_TO_CACHE) {
                try {
                    // Faz o pedido para cada URL individualmente.
                    const response = await fetch(url);
                    if (!response.ok) {
                        // Se a resposta não for bem-sucedida (ex: 404), lança um erro para este item.
                        throw new Error(`Status ${response.status}`);
                    }
                    // Guarda a resposta bem-sucedida na cache.
                    await cache.put(url, response);
                } catch (error) {
                    // Regista o erro para o URL específico, mas continua o loop para os outros ficheiros.
                    console.error(`[Service Worker] Falha ao guardar em cache '${url}':`, error.message);
                }
            }
        }).then(() => {
            console.log('[Service Worker] Instalação concluída. A forçar ativação...');
            return self.skipWaiting(); // Força a ativação do novo SW
        })
    );
});


// Evento 'activate': limpa caches antigas para garantir que usamos a nova.
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] A ativar v13...');
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
        }).then(() => self.clients.claim()) // Torna-se o SW ativo para todas as abas
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
                    // Retorna a resposta da cache ou uma resposta de fallback se não estiver em cache
                    return cachedResponse || Response.error();
                });
            })
    );
});

