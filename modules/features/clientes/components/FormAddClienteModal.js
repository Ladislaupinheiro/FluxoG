// /modules/features/clientes/components/FormAddClienteModal.js (CORRIGIDO)
'use strict';

import store from '../../../shared/services/Store.js';
import * as Toast from '../../../shared/components/Toast.js';
import Router from '../../../app/Router.js';

export const render = () => `
<div id="modal-add-cliente-overlay" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4">
    <form id="form-add-cliente" class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-sm">
        <header class="flex justify-between items-center p-4 border-b border-borda">
            <h3 class="text-xl font-bold">Novo Cliente</h3>
            <button type="button" class="btn-fechar-modal text-2xl">&times;</button>
        </header>
        <div class="p-4 space-y-4">
            <div>
                <label for="input-cliente-nome" class="block text-sm font-medium mb-1">Nome Completo</label>
                <input type="text" id="input-cliente-nome" required class="w-full p-2 border border-borda rounded-md bg-fundo-principal" placeholder="Nome do cliente">
            </div>
            <div>
                <label for="input-cliente-contacto" class="block text-sm font-medium mb-1">Contacto (Opcional)</label>
                <input type="tel" id="input-cliente-contacto" class="w-full p-2 border border-borda rounded-md bg-fundo-principal" placeholder="9xx xxx xxx">
            </div>
        </div>
        <footer class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Registar Cliente</button>
        </footer>
    </form>
</div>`;

export const mount = (closeModal) => {
    const form = document.getElementById('form-add-cliente');
    const inputNome = form.querySelector('#input-cliente-nome');
    inputNome.focus();
    
    form.addEventListener('submit', e => {
        e.preventDefault();
        const nome = inputNome.value.trim();
        if (!nome) {
            return Toast.mostrarNotificacao("O nome do cliente é obrigatório.", "erro");
        }

        const novoCliente = {
            id: crypto.randomUUID(),
            nome,
            contacto: form.querySelector('#input-cliente-contacto').value.trim(),
            dataRegisto: new Date().toISOString(),
            dividas: [],
        };

        store.dispatch({ type: 'ADD_CLIENT', payload: novoCliente });
        Toast.mostrarNotificacao(`Cliente "${nome}" adicionado.`);
        closeModal();
        
        // Navega para a página de detalhes do novo cliente
        Router.navigateTo(`#cliente-detalhes/${novoCliente.id}`);
    });

    form.querySelector('.btn-fechar-modal').addEventListener('click', closeModal);
    
    document.getElementById('modal-add-cliente-overlay').addEventListener('click', e => {
        if (e.target.id === 'modal-add-cliente-overlay') {
            closeModal();
        }
    });
};

export const unmount = () => {};