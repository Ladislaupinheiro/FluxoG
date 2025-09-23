// service-worker.js

const CACHE_NAME = 'gestorbar-v1';
// Lista de todos os ficheiros essenciais para a aplicação funcionar offline.
const URLS_TO_CACHE = [
    '/',
    'index.html',
    'style.css',
    '/modules/main.js',
    '/modules/state.js',
    '/modules/ui.js',
    '/modules/handlers.js',
    '/modules/modals.js',
    '/modules/selectors.js',
    'icons/logo-small-192.png',
    'icons/logo-big-512.png'
];

// Evento 'install': é disparado quando o service worker é instalado.
// Aqui, guardamos todos os nossos ficheiros em cache.
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Cache aberta. A guardar ficheiros essenciais...');
                return cache.addAll(URLS_TO_CACHE);
            })
    );
});

// Evento 'fetch': é disparado sempre que a aplicação faz um pedido de rede (ex: pedir um ficheiro).
// Aqui, intercetamos o pedido e respondemos com o ficheiro em cache, se existir.
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Se encontrarmos o ficheiro em cache, retornamo-lo.
                if (response) {
                    return response;
                }
                // Se não, fazemos o pedido à rede.
                return fetch(event.request);
            })
    );
});