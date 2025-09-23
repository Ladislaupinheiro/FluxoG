// service-worker.js

const CACHE_NAME = 'gestorbar-v5'; // Versão incrementada para forçar a atualização final
const URLS_TO_CACHE = [
    './',
    './index.html',
    './style.css', // CORREÇÃO: Ficheiro style.css re-adicionado à lista de cache.
    './manifest.json',
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
            .catch(error => {
                console.error('Falha ao adicionar ficheiros à cache. Verifique se todos os caminhos em URLS_TO_CACHE estão corretos.', error);
            })
    );
    self.skipWaiting();
});

// Evento 'activate': limpa caches antigas para garantir que usamos os ficheiros novos.
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('A limpar cache antiga:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Evento 'fetch': responde aos pedidos com os ficheiros em cache, se disponíveis.
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
