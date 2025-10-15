// /modules/features/inventario/components/FormAddStockModal.js (CORRIGIDO)
'use strict';

import store from '../../../shared/services/Store.js';
import * as Toast from '../../../shared/components/Toast.js';

export const render = (produto) => `
<div id="modal-add-stock-overlay" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4">
    <form id="form-add-stock" class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-sm">
        <header class="flex justify-between items-center p-4 border-b border-borda">
            <h3 class="text-xl font-bold">Adicionar Stock (Armazém)</h3>
            <button type="button" class="btn-fechar-modal text-2xl">&times;</button>
        </header>
        <div class="p-4">
            <p class="mb-2">Adicionar ao produto: <strong>${produto.nome}</strong></p>
            <label for="input-add-stock-quantidade" class="block text-sm font-medium text-texto-secundario mb-1">Quantidade a Adicionar</label>
            <input type="number" id="input-add-stock-quantidade" required min="1" class="w-full p-2 border border-borda rounded-md bg-fundo-principal" placeholder="Ex: 12">
        </div>
        <footer class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Confirmar Entrada</button>
        </footer>
    </form>
</div>`;

export const mount = (closeModal, produto) => {
    const form = document.getElementById('form-add-stock');
    const inputQtd = form.querySelector('#input-add-stock-quantidade');
    inputQtd.focus();

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const quantidade = parseInt(inputQtd.value);
        if (isNaN(quantidade) || quantidade <= 0) {
            return Toast.mostrarNotificacao("Insira uma quantidade positiva.", "erro");
        }
        store.dispatch({ type: 'ADD_STOCK', payload: { produtoId: produto.id, quantidade } });
        Toast.mostrarNotificacao(`${quantidade} un. adicionadas ao stock do armazém.`);
        closeModal();
    });

    form.querySelector('.btn-fechar-modal').addEventListener('click', closeModal);
    
    document.getElementById('modal-add-stock-overlay').addEventListener('click', e => {
        if (e.target.id === 'modal-add-stock-overlay') {
            closeModal();
        }
    });
};

export const unmount = () => {};