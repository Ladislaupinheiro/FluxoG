// service-worker.js

const CACHE_NAME = 'gestorbar-v2'; // Versão incrementada para forçar a atualização
// CAMINHOS CORRIGIDOS: Removidos os "/" no início para torná-los relativos.
const URLS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './modules/main.js',
    './modules/state.js',
    './modules/ui.js',
    './modules/handlers.js',
    './modules/modals.js',
    './modules/selectors.js',
    './icons/logo-small-192.png',
    './icons/logo-big-512.png'
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
});

// Evento 'activate': limpa caches antigas para garantir que usamos os ficheiros novos.
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Evento 'fetch': responde aos pedidos com os ficheiros em cache se disponíveis.
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Se encontrarmos o ficheiro em cache, retornamo-lo.
                // Se não, fazemos o pedido à rede.
                return response || fetch(event.request);
            })
    );
});
