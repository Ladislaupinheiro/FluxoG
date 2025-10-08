// /modules/components/modals/CustomerPerformanceModal.js
'use strict';

const formatCurrency = (value) => (value || 0).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });

export const render = (customerInsights, periodo) => {
    const topSpendersHTML = customerInsights.topSpenders && customerInsights.topSpenders.length > 0
        ? customerInsights.topSpenders.map((cliente, index) => `
            <div class="flex justify-between items-center py-2 border-b border-borda last:border-b-0">
                <div class="flex items-center gap-3">
                    <span class="font-bold w-6 text-center">${index + 1}.</span>
                    <div>
                        <p class="font-semibold">${cliente.nome}</p>
                        <p class="text-xs text-texto-secundario">${cliente.visitas} visita(s) no período</p>
                    </div>
                </div>
                <span class="font-bold text-green-500">${formatCurrency(cliente.gastoTotal)}</span>
            </div>
        `).join('')
        : '<p class="text-center text-texto-secundario p-4">Nenhum gasto de cliente registado neste período.</p>';

    return `
    <div id="modal-customer-performance-overlay" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4">
        <div class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <header class="flex justify-between items-center p-4 border-b border-borda">
                <div>
                    <h3 class="text-xl font-bold">Ranking de Clientes</h3>
                    <p class="text-sm text-texto-secundario">${periodo}</p>
                </div>
                <button type="button" class="btn-fechar-modal text-2xl self-start">&times;</button>
            </header>
            
            <div class="p-4 overflow-y-auto">
                ${topSpendersHTML}
            </div>

            <footer class="p-2 text-center border-t border-borda">
                <button class="btn-fechar-modal-footer text-sm text-blue-600 dark:text-blue-400 font-semibold hover:underline">Fechar</button>
            </footer>
        </div>
    </div>`;
};

export const mount = (closeModal) => {
    // Listeners para fechar o modal
    document.querySelector('.btn-fechar-modal')?.addEventListener('click', closeModal);
    document.querySelector('.btn-fechar-modal-footer')?.addEventListener('click', closeModal);
    document.getElementById('modal-customer-performance-overlay')?.addEventListener('click', e => {
        if (e.target.id === 'modal-customer-performance-overlay') {
            closeModal();
        }
    });
};

export const unmount = () => {};