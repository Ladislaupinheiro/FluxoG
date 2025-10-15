// /modules/components/modals/ProductPerformanceModal.js
'use strict';

const formatCurrency = (value) => (value || 0).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });

/**
 * Renderiza o conteúdo da lista para uma aba específica.
 * @param {Array} data - O array de dados a ser renderizado.
 * @param {string} type - O tipo de aba ('sellers', 'profit', 'zombies').
 * @returns {string} O HTML da lista.
 */
function renderListContent(data, type) {
    if (!data || data.length === 0) {
        return '<p class="text-center text-texto-secundario p-4">Nenhum dado disponível para este período.</p>';
    }

    return data.map((item, index) => {
        let valueHTML = '';
        switch (type) {
            case 'sellers':
                valueHTML = `<strong>${item.qtd}</strong> un.`;
                break;
            case 'profit':
                valueHTML = `<strong class="text-green-500">${formatCurrency(item.lucro)}</strong>`;
                break;
            case 'zombies':
                const dateStr = item.ultimaVenda 
                    ? `Últ. venda: ${new Date(item.ultimaVenda).toLocaleDateString('pt-PT')}`
                    : 'Nunca vendido';
                valueHTML = `<span class="text-sm text-gray-400">${dateStr}</span>`;
                break;
        }

        return `
            <div class="flex justify-between items-center py-2 border-b border-borda last:border-b-0">
                <span class="font-semibold">${index + 1}. ${item.nome}</span>
                <span>${valueHTML}</span>
            </div>
        `;
    }).join('');
}

export const render = (performanceData, periodo) => {
    const initialListHTML = renderListContent(performanceData.topSellers, 'sellers');

    return `
    <div id="modal-product-performance-overlay" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4">
        <div class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <header class="flex justify-between items-center p-4 border-b border-borda">
                <div>
                    <h3 class="text-xl font-bold">Relatório de Produtos</h3>
                    <p class="text-sm text-texto-secundario">${periodo}</p>
                </div>
                <button type="button" class="btn-fechar-modal text-2xl self-start">&times;</button>
            </header>
            
            <nav id="modal-tabs-nav" class="flex justify-around p-2 bg-fundo-principal border-b border-borda">
                <button class="modal-tab-btn active" data-tab="sellers">Top Vendas</button>
                <button class="modal-tab-btn" data-tab="profit">Mais Rentáveis</button>
                <button class="modal-tab-btn" data-tab="zombies">Estagnados</button>
            </nav>

            <div id="modal-list-container" class="p-4 overflow-y-auto">
                ${initialListHTML}
            </div>

            <footer class="p-2 text-center border-t border-borda">
                <button class="btn-fechar-modal-footer text-sm text-blue-600 dark:text-blue-400 font-semibold hover:underline">Fechar</button>
            </footer>
        </div>
        <style>
            .modal-tab-btn {
                padding: 8px 16px;
                border-radius: 6px;
                font-weight: 600;
                color: var(--cor-texto-secundario);
                transition: background-color 0.2s, color 0.2s;
            }
            .modal-tab-btn.active {
                background-color: var(--cor-primaria);
                color: white;
            }
        </style>
    </div>`;
};

export const mount = (closeModal, performanceData, periodo) => {
    const listContainer = document.getElementById('modal-list-container');
    const tabsContainer = document.getElementById('modal-tabs-nav');

    tabsContainer.addEventListener('click', (e) => {
        const target = e.target.closest('.modal-tab-btn');
        if (!target) return;

        // Atualiza o estado visual das abas
        tabsContainer.querySelectorAll('.modal-tab-btn').forEach(btn => btn.classList.remove('active'));
        target.classList.add('active');

        const tabType = target.dataset.tab;
        let dataToShow;

        switch (tabType) {
            case 'sellers':
                dataToShow = performanceData.topSellers;
                break;
            case 'profit':
                dataToShow = performanceData.topProfit;
                break;
            case 'zombies':
                dataToShow = performanceData.zombieProducts;
                break;
        }

        listContainer.innerHTML = renderListContent(dataToShow, tabType);
    });
    
    // Listeners para fechar o modal
    document.querySelector('.btn-fechar-modal')?.addEventListener('click', closeModal);
    document.querySelector('.btn-fechar-modal-footer')?.addEventListener('click', closeModal);
    document.getElementById('modal-product-performance-overlay')?.addEventListener('click', e => {
        if (e.target.id === 'modal-product-performance-overlay') {
            closeModal();
        }
    });
};

export const unmount = () => {};