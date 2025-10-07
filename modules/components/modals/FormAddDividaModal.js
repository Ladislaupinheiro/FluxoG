// /modules/components/modals/FormAddDividaModal.js
'use strict';

import store from '../../services/Store.js';
import * as Toast from '../Toast.js';

export const render = (cliente) => `
<div id="modal-add-divida-overlay" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4">
    <form id="form-add-divida" class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-sm">
        <header class="flex justify-between items-center p-4 border-b border-borda">
            <h3 class="text-xl font-bold">Adicionar Dívida</h3>
            <button type="button" class="btn-fechar-modal text-2xl">&times;</button>
        </header>
        <div class="p-4 space-y-4">
            <p>Cliente: <strong>${cliente.nome}</strong></p>
            <div>
                <label for="input-divida-valor" class="block text-sm font-medium mb-1">Valor da Dívida (Kz)</label>
                <input type="number" id="input-divida-valor" required min="1" class="w-full p-2 border border-borda rounded-md bg-fundo-principal">
            </div>
            <div>
                <label for="input-divida-descricao" class="block text-sm font-medium mb-1">Descrição</label>
                <input type="text" id="input-divida-descricao" required class="w-full p-2 border border-borda rounded-md bg-fundo-principal" placeholder="Ex: 2 Cervejas">
            </div>
        </div>
        <footer class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
            <button type="submit" class="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">Adicionar Dívida</button>
        </footer>
    </form>
</div>`;

export const mount = (closeModal, cliente) => {
    const form = document.getElementById('form-add-divida');
    const inputValor = form.querySelector('#input-divida-valor');
    inputValor.focus();

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const valor = parseFloat(inputValor.value);
        const descricao = form.querySelector('#input-divida-descricao').value.trim();

        if (!valor || valor <= 0 || !descricao) {
            return Toast.mostrarNotificacao("Preencha todos os campos com valores válidos.", "erro");
        }

        store.dispatch({ type: 'ADD_DEBT', payload: { clienteId: cliente.id, valor, descricao } });
        Toast.mostrarNotificacao("Dívida adicionada com sucesso.");
        closeModal();
    });

    form.querySelector('.btn-fechar-modal').addEventListener('click', closeModal);

    document.getElementById('modal-add-divida-overlay').addEventListener('click', e => {
        if (e.target.id === 'modal-add-divida-overlay') {
            closeModal();
        }
    });
};

export const unmount = () => {};