// /service-worker.js (ATUALIZADO)
'use strict';

const CACHE_NAME = 'gestorbar-v28'; // Versão incrementada para forçar a atualização da cache

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

    // Core da App
    './modules/app/app.js',
    './modules/app/Router.js',

    // Módulos Partilhados (Shared)
    './modules/shared/components/Nav.js',
    './modules/shared/components/Toast.js',
    './modules/shared/components/Modals.js',
    './modules/shared/ui/ConfirmacaoModal.js',
    './modules/shared/services/Store.js',
    './modules/shared/services/Storage.js',
    './modules/shared/services/ThemeService.js',
    './modules/shared/services/TipsService.js',
    './modules/shared/lib/utils.js',

    // Features -> Componentes de Modal (Antigos e Novos)
    './modules/features/settings/components/BackupRestoreModal.js',
    './modules/features/clientes/components/CustomerPerformanceModal.js',
    './modules/features/dashboard/components/DicaDoDiaModal.js',
    './modules/features/financas/components/FechoGlobalModal.js',
    './modules/features/clientes/components/FormAddClienteModal.js',
    './modules/features/clientes/components/FormAddDividaModal.js',
    './modules/features/atendimento/components/FormAddPedidoModal.js',
    './modules/features/inventario/components/FormAddFornecedorModal.js',      // <-- NOVO
    './modules/features/inventario/components/FormAddProdutoCatalogoModal.js', // <-- NOVO
    './modules/features/inventario/components/FormAddProdutoModal.js',
    './modules/features/inventario/components/FormAddStockModal.js',
    './modules/features/dashboard/components/FormEditBusinessNameModal.js',
    './modules/features/inventario/components/FormEditProdutoModal.js',
    './modules/features/inventario/components/FormGerirCategoriasModal.js',   // <-- NOVO
    './modules/features/clientes/components/FormLiquidarDividaModal.js',
    './modules/features/inventario/components/FormMoverStockModal.js',
    './modules/features/atendimento/components/FormNovaContaModal.js',
    './modules/features/financas/components/FormNovaDespesaModal.js',
    './modules/features/atendimento/components/FormPagamentoModal.js',
    './modules/features/inventario/components/ProductPerformanceModal.js',
    './modules/features/inventario/components/FormRegistarCompraModal.js',     // <-- NOVO
    './modules/features/inventario/components/ShortcutManagementModal.js',

    // Features -> Serviços de Análise
    './modules/features/clientes/services/ClientAnalyticsService.js',
    './modules/features/financas/services/FinancialAnalyticsService.js',
    './modules/features/inventario/services/ProductAnalyticsService.js',
    './modules/features/financas/services/ReportingService.js',

    // Features -> Vistas (Views)
    './modules/features/atendimento/AtendimentoView.js',
    './modules/features/clientes/ClientesView.js',
    './modules/features/clientes/ClienteDetalhesView.js',
    './modules/features/dashboard/DashboardView.js',
    './modules/features/financas/FluxoCaixaView.js',
    './modules/features/analises/AnálisesView.js',
    './modules/features/inventario/InventarioView.js',
    './modules/features/inventario/FornecedorDetalhesView.js', // <-- NOVO
    './modules/features/settings/SettingsView.js'
];

self.addEventListener('install', (event) => {
    console.log(`[Service Worker] A instalar ${CACHE_NAME}...`);
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            console.log('[Service Worker] Cache aberta. A guardar ficheiros essenciais...');
            const cachePromises = URLS_TO_CACHE.map(url => {
                const request = new Request(url, { cache: 'reload' });
                return fetch(request).then(response => {
                    if (response.ok) {
                        return cache.put(url, response);
                    }
                    return Promise.reject(`Falha ao carregar: ${url}`);
                }).catch(err => {
                    console.warn(`[Service Worker] Não foi possível guardar em cache o ficheiro: ${url}`, err);
                });
            });
            await Promise.all(cachePromises);
        }).then(() => {
            console.log('[Service Worker] Ficheiros essenciais guardados. A forçar ativação...');
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
    if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(event.request).then(networkResponse => {
                    return caches.open(CACHE_NAME).then(cache => {
                        if (networkResponse.ok) {
                            cache.put(event.request, networkResponse.clone());
                        }
                        return networkResponse;
                    });
                });
            }).catch(error => {
                console.error('[Service Worker] Erro no fetch:', error);
            })
    );
});