// service-worker.js

const CACHE_NAME = 'gestorbar-v4'; // Versão incrementada para forçar a atualização final
const URLS_TO_CACHE = [
    './',
    './index.html',
    // REMOVIDO: A linha './style.css' foi removida pois o ficheiro não existe no repositório.
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

// Evento 'fetch': responde aos pedidos com os ficheiros em cache se disponíveis.
self.addEventListener('fetch', (event) => {
    // Apenas para pedidos de navegação (ex: abrir a página)
    if (event.request.mode === 'navigate') {
        event.respondWith(
            caches.match(event.request)
                .then((response) => {
                    return response || fetch(event.request);
                })
        );
    }
    // Para outros pedidos (scripts, ícones), a estratégia cache-first continua a ser boa.
    else {
        event.respondWith(
            caches.match(event.request)
                .then((response) => {
                    return response || fetch(event.request);
                })
        );
    }
});
