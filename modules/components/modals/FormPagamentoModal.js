// /modules/components/modals/FormPagamentoModal.js
'use strict';

import store from '../../services/Store.js';
import * as Toast from '../Toast.js';

export const render = (conta) => {
    const subtotal = conta.pedidos.reduce((total, p) => total + (p.preco * p.qtd), 0);
    return `
    <div id="modal-pagamento-overlay" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4">
        <div class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-sm">
            <header class="flex justify-between items-center p-4 border-b border-borda">
                <h3 class="text-xl font-bold">Finalizar Pagamento</h3>
                <button type="button" class="btn-fechar-modal text-2xl">&times;</button>
            </header>
            <div class="p-4 text-center">
                <p class="text-texto-secundario">Total a Pagar (${conta.nome})</p>
                <span class="text-5xl font-bold block my-4">${subtotal.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                <p class="font-semibold mb-3">Selecione o Método de Pagamento</p>
                <div id="pagamento-metodos-container" class="grid grid-cols-2 gap-4">
                    <button class="pagamento-metodo-btn flex flex-col items-center p-4 border-2 border-borda rounded-lg" data-metodo="Numerário">
                        <i class="lni lni-money-location text-4xl text-green-500"></i><span class="mt-2 font-semibold">Numerário</span>
                    </button>
                    <button class="pagamento-metodo-btn flex flex-col items-center p-4 border-2 border-borda rounded-lg" data-metodo="TPA">
                        <i class="lni lni-credit-cards text-4xl text-blue-500"></i><span class="mt-2 font-semibold">TPA</span>
                    </button>
                </div>
            </div>
            <footer class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
                <button id="btn-confirmar-pagamento" disabled class="w-full bg-gray-400 cursor-not-allowed text-white font-bold py-3 px-4 rounded">Confirmar Pagamento</button>
            </footer>
        </div>
    </div>`;
}

export const mount = (closeModal, conta) => {
    let metodoSelecionado = '';
    const metodosContainer = document.getElementById('pagamento-metodos-container');
    const btnConfirmar = document.getElementById('btn-confirmar-pagamento');

    metodosContainer.addEventListener('click', (e) => {
        const metodoBtn = e.target.closest('.pagamento-metodo-btn');
        if (!metodoBtn) return;

        metodosContainer.querySelectorAll('.pagamento-metodo-btn').forEach(btn => btn.classList.remove('border-blue-500', 'bg-blue-100', 'dark:bg-gray-700'));
        metodoBtn.classList.add('border-blue-500', 'bg-blue-100', 'dark:bg-gray-700');
        
        metodoSelecionado = metodoBtn.dataset.metodo;
        btnConfirmar.disabled = false;
        btnConfirmar.classList.replace('bg-gray-400', 'bg-blue-600');
        btnConfirmar.classList.replace('cursor-not-allowed', 'hover:bg-blue-700');
    });

    btnConfirmar.addEventListener('click', () => {
        if (metodoSelecionado) {
            store.dispatch({ type: 'FINALIZE_PAYMENT', payload: { contaId: conta.id, metodoPagamento: metodoSelecionado } });
            Toast.mostrarNotificacao("Pagamento finalizado com sucesso!");
            closeModal();
        }
    });

    document.querySelector('.btn-fechar-modal').addEventListener('click', closeModal);
    
    document.getElementById('modal-pagamento-overlay').addEventListener('click', e => {
        if (e.target.id === 'modal-pagamento-overlay') {
            closeModal();
        }
    });
};

export const unmount = () => {};