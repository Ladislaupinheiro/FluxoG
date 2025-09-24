// /modules/service-worker.js (v12) - Implementa a estratégia Network-First para máxima fiabilidade.
'use strict';

const CACHE_NAME = 'gestorbar-v12';
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
    // Adicionar aqui os ícones principais para uma melhor experiência offline
    './icons/logo-small-192.png',
    './icons/logo-big-512.png'
];

// Evento 'install': guarda os ficheiros essenciais em cache.
self.addEventListener('install', (event) => {
    console.log('[Service Worker] A instalar...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Cache aberta. A guardar ficheiros essenciais...');
                return cache.addAll(URLS_TO_CACHE);
            })
            .then(() => self.skipWaiting()) // Força a ativação do novo SW
    );
});

// Evento 'activate': limpa caches antigas para garantir que usamos a nova.
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] A ativar...');
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
    // Ignora pedidos que não sejam GET (ex: POST, PUT)
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        // 1. Tenta ir à rede primeiro.
        fetch(event.request)
            .then(networkResponse => {
                // 2. Se a rede responder com sucesso...
                console.log(`[Service Worker] A servir da rede: ${event.request.url}`);
                // ...abre a cache para guardar a nova versão.
                return caches.open(CACHE_NAME).then(cache => {
                    // Guarda uma cópia da resposta da rede na cache.
                    cache.put(event.request, networkResponse.clone());
                    // Retorna a resposta da rede para a aplicação.
                    return networkResponse;
                });
            })
            .catch(() => {
                // 3. Se a rede falhar...
                console.log(`[Service Worker] Rede falhou. A servir da cache: ${event.request.url}`);
                // ...tenta encontrar o recurso na cache.
                return caches.match(event.request);
            })
    );
});
