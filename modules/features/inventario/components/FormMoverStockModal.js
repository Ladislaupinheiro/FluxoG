// /modules/features/inventario/components/FormMoverStockModal.js (CORRIGIDO)
'use strict';

import store from '../../../shared/services/Store.js';
import * as Toast from '../../../shared/components/Toast.js';

export const render = (produto) => `
<div id="modal-mover-stock-overlay" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4">
    <form id="form-mover-stock" class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-sm">
        <header class="flex justify-between items-center p-4 border-b border-borda">
            <h3 class="text-xl font-bold">Mover Stock para Loja</h3>
            <button type="button" class="btn-fechar-modal text-2xl">&times;</button>
        </header>
        <div class="p-4">
            <p class="mb-2">Mover do produto: <strong>${produto.nome}</strong></p>
            <p class="text-sm text-texto-secundario mb-2">Disponível no Armazém: <span>${produto.stockArmazem}</span> un.</p>
            <label for="input-mover-stock-quantidade" class="block text-sm font-medium text-texto-secundario mb-1">Quantidade a Mover</label>
            <input type="number" id="input-mover-stock-quantidade" required min="1" max="${produto.stockArmazem}" class="w-full p-2 border border-borda rounded-md bg-fundo-principal" placeholder="Ex: 6">
        </div>
        <footer class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Mover para Loja</button>
        </footer>
    </form>
</div>`;

export const mount = (closeModal, produto) => {
    const form = document.getElementById('form-mover-stock');
    const inputQtd = form.querySelector('#input-mover-stock-quantidade');
    inputQtd.focus();

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const quantidade = parseInt(inputQtd.value);

        if (!produto || isNaN(quantidade) || quantidade <= 0) {
            return Toast.mostrarNotificacao("A quantidade deve ser um número positivo.", "erro");
        }
        if (quantidade > produto.stockArmazem) {
            return Toast.mostrarNotificacao(`Apenas ${produto.stockArmazem} un. disponíveis no armazém.`, "erro");
        }

        store.dispatch({ type: 'MOVE_STOCK', payload: { produtoId: produto.id, quantidade } });
        Toast.mostrarNotificacao(`${quantidade} un. movidas para o stock da loja.`);
        closeModal();
    });

    form.querySelector('.btn-fechar-modal').addEventListener('click', closeModal);
    
    document.getElementById('modal-mover-stock-overlay').addEventListener('click', e => {
        if (e.target.id === 'modal-mover-stock-overlay') {
            closeModal();
        }
    });
};

export const unmount = () => {};