// /service-worker.js - (v10.0 - Arquitetura SPA)
'use strict';

// A versão do cache é incrementada para forçar a atualização de todos os ficheiros.
const CACHE_NAME = 'gestorbar-v21';

// A lista de ficheiros foi atualizada para incluir os novos módulos da arquitetura SPA.
const URLS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './manifest.json',
    './tips.json',
    './favicon.png',
    
    // Ícones
    './icons/logo-small-192.png',
    './icons/logo-big-512.png',

    // Módulo Principal e Roteador (NOVOS E CRÍTICOS)
    './modules/app.js',
    './modules/Router.js',

    // Componentes
    './modules/components/Modals.js',
    './modules/components/Nav.js',
    './modules/components/Toast.js',

    // Serviços (NOVOS E ATUALIZADOS)
    './modules/services/Store.js',
    './modules/services/Storage.js',
    './modules/services/ThemeService.js',
    './modules/services/TipsService.js',
    './modules/services/utils.js',

    // Views
    './modules/views/AtendimentoView.js',
    './modules/views/ClientesView.js',
    './modules/views/ClienteDetalhesView.js',
    './modules/views/DashboardView.js',
    './modules/views/FluxoCaixaView.js',
    './modules/views/InventarioView.js',
    './modules/views/SettingsView.js'
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

self.addEventListener('fetch', (event) => {
    // CORRIGIDO: Ignora pedidos que não sejam GET, pedidos a CDNs e pedidos que não sejam http (ex: chrome-extension://)
    if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
        return;
    }

    // Estratégia: Network First, com otimização para não colocar CDNs na cache desnecessariamente
    event.respondWith(
        fetch(event.request)
            .then(networkResponse => {
                // Apenas coloca na cache os recursos da nossa própria origem
                if (new URL(event.request.url).origin === location.origin) {
                    return caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                // Se a rede falhar, tenta encontrar o recurso na cache
                return caches.match(event.request).then(cachedResponse => {
                    return cachedResponse || Response.error();
                });
            })
    );
});