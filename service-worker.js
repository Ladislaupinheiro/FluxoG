// /modules/service-worker.js (v15) - Implementa um ciclo de vida agressivo para atualizações rápidas.
'use strict';

const CACHE_NAME = 'gestorbar-v15';
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

/**
 * Evento 'install': Guarda os ficheiros essenciais e força a ativação do novo Service Worker.
 */
self.addEventListener('install', (event) => {
    console.log('[Service Worker] A instalar v15...');
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            console.log('[Service Worker] Cache aberta. A guardar ficheiros essenciais...');
            const promises = URLS_TO_CACHE.map(async (url) => {
                try {
                    const response = await fetch(url, { cache: 'reload' }); // Busca uma versão fresca da rede
                    if (!response.ok) throw new Error(`Status ${response.status}`);
                    await cache.put(url, response);
                } catch (error) {
                    console.error(`[Service Worker] Falha ao guardar em cache '${url}':`, error.message);
                }
            });
            await Promise.all(promises);
        }).then(() => {
            console.log('[Service Worker] Todos os ficheiros guardados. A forçar ativação...');
            // self.skipWaiting() força a passagem do estado 'waiting' para 'activating'.
            return self.skipWaiting();
        })
    );
});

/**
 * Evento 'activate': Limpa caches antigas e assume o controlo da página imediatamente.
 */
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] A ativar v15...');
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
            // self.clients.claim() permite que o SW ativado controle os clientes imediatamente.
            return self.clients.claim();
        })
    );
});

/**
 * Evento 'fetch': Implementa a estratégia "Network-First, falling back to Cache".
 */
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(networkResponse => {
                // Se a resposta da rede for bem-sucedida, atualiza a cache e retorna a resposta.
                return caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            })
            .catch(() => {
                // Se a rede falhar, tenta obter a resposta da cache.
                return caches.match(event.request).then(cachedResponse => {
                    return cachedResponse;
                });
            })
    );
});

