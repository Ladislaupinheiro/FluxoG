// /modules/components/modals/FormEditBusinessNameModal.js
'use strict';

import store from '../../services/Store.js';
import * as Toast from '../Toast.js';

export const render = (nomeAtual) => `
<div id="modal-edit-business-name-overlay" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4">
    <form id="form-edit-business-name" class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-sm">
        <header class="flex justify-between items-center p-4 border-b border-borda">
            <h3 class="text-xl font-bold">Nome do Estabelecimento</h3>
            <button type="button" class="btn-fechar-modal text-2xl">&times;</button>
        </header>
        <div class="p-4">
            <label for="input-edit-business-name" class="block text-sm font-medium text-texto-secundario mb-1">Novo Nome</label>
            <input type="text" id="input-edit-business-name" required class="w-full p-2 border border-borda rounded-md bg-fundo-principal" value="${nomeAtual}">
        </div>
        <footer class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Salvar Nome</button>
        </footer>
    </form>
</div>`;

export const mount = (closeModal, nomeAtual) => {
    const form = document.getElementById('form-edit-business-name');
    const inputNome = form.querySelector('#input-edit-business-name');
    inputNome.focus();
    inputNome.select();

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const novoNome = inputNome.value.trim();
        if (novoNome && novoNome !== nomeAtual) {
            store.dispatch({ type: 'UPDATE_CONFIG', payload: { businessName: novoNome } });
            Toast.mostrarNotificacao("Nome do estabelecimento atualizado.");
        }
        closeModal();
    });

    form.querySelector('.btn-fechar-modal').addEventListener('click', closeModal);
    
    document.getElementById('modal-edit-business-name-overlay').addEventListener('click', e => {
        if (e.target.id === 'modal-edit-business-name-overlay') {
            closeModal();
        }
    });
};

export const unmount = () => {};