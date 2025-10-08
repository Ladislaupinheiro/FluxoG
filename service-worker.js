// /service-worker.js
'use strict';

const CACHE_NAME = 'gestorbar-v26'; // Versão incrementada

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

    // Módulo Principal e Roteador
    './modules/app.js',
    './modules/Router.js',

    // Componentes Principais
    './modules/components/Nav.js',
    './modules/components/Toast.js',
    './modules/components/Modals.js',

    // --- Componentes de Modal ---
    './modules/components/modals/BackupRestoreModal.js',
    './modules/components/modals/ConfirmacaoModal.js',
    './modules/components/modals/CustomerPerformanceModal.js', // NOVO
    './modules/components/modals/DicaDoDiaModal.js',
    './modules/components/modals/FechoGlobalModal.js',
    './modules/components/modals/FormAddClienteModal.js',
    './modules/components/modals/FormAddDividaModal.js',
    './modules/components/modals/FormAddPedidoModal.js',
    './modules/components/modals/FormAddProdutoModal.js',
    './modules/components/modals/FormAddStockModal.js',
    './modules/components/modals/FormEditBusinessNameModal.js',
    './modules/components/modals/FormEditProdutoModal.js',
    './modules/components/modals/FormLiquidarDividaModal.js',
    './modules/components/modals/FormMoverStockModal.js',
    './modules/components/modals/FormNovaContaModal.js',
    './modules/components/modals/FormNovaDespesaModal.js',
    './modules/components/modals/FormPagamentoModal.js',
    './modules/components/modals/ProductPerformanceModal.js',

    // --- Serviços ---
    './modules/services/Store.js',
    './modules/services/Storage.js',
    './modules/services/ThemeService.js',
    './modules/services/TipsService.js',
    './modules/services/utils.js',
    './modules/services/AnalyticsService.js',
    './modules/services/ReportingService.js',

    // Views
    './modules/views/AtendimentoView.js',
    './modules/views/ClientesView.js',
    './modules/views/ClienteDetalhesView.js',
    './modules/views/DashboardView.js',
    './modules/views/FluxoCaixaView.js',
    './modules/views/AnálisesView.js',
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
    if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
        return;
    }

    // Estratégia: Network First
    event.respondWith(
        fetch(event.request)
            .then(networkResponse => {
                if (new URL(event.request.url).origin === location.origin) {
                    return caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                return caches.match(event.request);
            })
    );
});