// /modules/features/inventario/components/FormAddFornecedorModal.js (NOVO FICHEIRO)
'use strict';

import store from '../../../shared/services/Store.js';
import * as Toast from '../../../shared/components/Toast.js';

export const render = () => `
<div id="modal-add-fornecedor-overlay" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4">
    <form id="form-add-fornecedor" class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-sm">
        <header class="flex justify-between items-center p-4 border-b border-borda">
            <h3 class="text-xl font-bold">Novo Fornecedor</h3>
            <button type="button" class="btn-fechar-modal text-2xl">&times;</button>
        </header>
        <div class="p-4 space-y-4">
            <div>
                <label for="input-fornecedor-nome" class="block text-sm font-medium mb-1">Nome da Empresa</label>
                <input type="text" id="input-fornecedor-nome" required class="w-full p-2 border border-borda rounded-md bg-fundo-input" placeholder="Nome do fornecedor">
            </div>
            <div>
                <label for="input-fornecedor-contacto" class="block text-sm font-medium mb-1">Contacto (Telefone/Email)</label>
                <input type="text" id="input-fornecedor-contacto" class="w-full p-2 border border-borda rounded-md bg-fundo-input">
            </div>
            <div>
                <label for="input-fornecedor-localizacao" class="block text-sm font-medium mb-1">Localização (Opcional)</label>
                <input type="text" id="input-fornecedor-localizacao" class="w-full p-2 border border-borda rounded-md bg-fundo-input">
            </div>
        </div>
        <footer class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Registar Fornecedor</button>
        </footer>
    </form>
</div>`;

export const mount = (closeModal) => {
    const form = document.getElementById('form-add-fornecedor');
    const inputNome = form.querySelector('#input-fornecedor-nome');
    inputNome.focus();
    
    form.addEventListener('submit', e => {
        e.preventDefault();
        const nome = inputNome.value.trim();
        const contacto = form.querySelector('#input-fornecedor-contacto').value.trim();
        const localizacao = form.querySelector('#input-fornecedor-localizacao').value.trim();

        if (!nome) {
            return Toast.mostrarNotificacao("O nome do fornecedor é obrigatório.", "erro");
        }

        const payload = { nome, contacto, localizacao };
        store.dispatch({ type: 'ADD_FORNECEDOR', payload });

        Toast.mostrarNotificacao(`Fornecedor "${nome}" adicionado com sucesso.`);
        closeModal();
    });

    form.querySelector('.btn-fechar-modal').addEventListener('click', closeModal);
    
    document.getElementById('modal-add-fornecedor-overlay').addEventListener('click', e => {
        if (e.target.id === 'modal-add-fornecedor-overlay') {
            closeModal();
        }
    });
};

export const unmount = () => {};