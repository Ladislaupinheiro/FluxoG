// /service-worker.js - (v7.0 - Arquitetura Final)
'use strict';

// A versão do cache é incrementada para garantir que o service worker seja atualizado.
const CACHE_NAME = 'gestorbar-v20';

// A lista de ficheiros foi completamente atualizada para a nova estrutura.
const URLS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './manifest.json',
    './favicon.png',
    
    // Ícones
    './icons/logo-small-192.png',
    './icons/logo-big-512.png',

    // Módulo Principal
    './modules/app.js',

    // Componentes
    './modules/components/Modals.js',
    './modules/components/Nav.js',
    './modules/components/Toast.js',

    // Serviços
    './modules/services/Store.js',
    './modules/services/Storage.js',

    // Views
    './modules/views/AtendimentoView.js',
    './modules/views/ClientesView.js',
    './modules/views/DashboardView.js',
    './modules/views/FluxoCaixaView.js',
    './modules/views/InventarioView.js'
];

self.addEventListener('install', (event) => {
    console.log(`[Service Worker] A instalar ${CACHE_NAME}...`);
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
    console.log(`[Service Worker] A ativar ${CACHE_NAME}...`);
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

// Estratégia: Network First (Tenta a rede primeiro, se falhar, usa a cache)
self.addEventListener('fetch', (event) => {
    // Ignora pedidos que não sejam GET (ex: POST, etc.)
    if (event.request.method !== 'GET') return;
    
    // Ignora pedidos a CDNs externas para scripts (ex: tailwind, jspdf)
    if (event.request.url.includes('cdn.')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(networkResponse => {
                // Se a resposta da rede for bem-sucedida, clona-a e guarda na cache
                return caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            })
            .catch(() => {
                // Se a rede falhar, tenta encontrar o recurso na cache
                return caches.match(event.request).then(cachedResponse => {
                    return cachedResponse || Response.error(); // Retorna a resposta da cache ou um erro
                });
            })
    );
});