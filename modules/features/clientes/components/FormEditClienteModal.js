// /modules/features/clientes/components/FormEditClienteModal.js (NOVO FICHEIRO)
'use strict';

import store from '../../../shared/services/Store.js';
import * as Toast from '../../../shared/components/Toast.js';

export const render = (cliente) => `
<div id="modal-edit-cliente-overlay" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4">
    <form id="form-edit-cliente" class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-sm">
        <header class="flex justify-between items-center p-4 border-b border-borda">
            <h3 class="text-xl font-bold">Editar Cliente</h3>
            <button type="button" class="btn-fechar-modal text-2xl">&times;</button>
        </header>
        <div class="p-4 space-y-4">
            <div>
                <label for="input-edit-cliente-nome" class="block text-sm font-medium mb-1">Nome Completo</label>
                <input type="text" id="input-edit-cliente-nome" required class="w-full p-2 border border-borda rounded-md bg-fundo-principal" value="${cliente.nome}">
            </div>
            <div>
                <label for="input-edit-cliente-contacto" class="block text-sm font-medium mb-1">Contacto (Opcional)</label>
                <input type="tel" id="input-edit-cliente-contacto" class="w-full p-2 border border-borda rounded-md bg-fundo-principal" value="${cliente.contacto || ''}">
            </div>
        </div>
        <footer class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Salvar Alterações</button>
        </footer>
    </form>
</div>`;

export const mount = (closeModal, cliente) => {
    const form = document.getElementById('form-edit-cliente');
    const inputNome = form.querySelector('#input-edit-cliente-nome');
    inputNome.focus();
    inputNome.select();

    form.addEventListener('submit', e => {
        e.preventDefault();
        const nome = inputNome.value.trim();
        if (!nome) {
            return Toast.mostrarNotificacao("O nome do cliente é obrigatório.", "erro");
        }

        const clienteAtualizado = {
            ...cliente,
            nome: nome,
            contacto: form.querySelector('#input-edit-cliente-contacto').value.trim()
        };

        store.dispatch({ type: 'UPDATE_CLIENT', payload: clienteAtualizado });
        Toast.mostrarNotificacao(`Dados de "${nome}" atualizados.`);
        closeModal();
    });

    form.querySelector('.btn-fechar-modal').addEventListener('click', closeModal);
    
    document.getElementById('modal-edit-cliente-overlay').addEventListener('click', e => {
        if (e.target.id === 'modal-edit-cliente-overlay') {
            closeModal();
        }
    });
};

export const unmount = () => {};