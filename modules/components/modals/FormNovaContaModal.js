// /modules/components/modals/FormNovaContaModal.js
'use strict';

import store from '../../services/Store.js';
import * as Toast from '../Toast.js';

export const render = () => `
<div id="modal-nova-conta-overlay" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4">
    <form id="form-nova-conta" class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-sm">
        <header class="flex justify-between items-center p-4 border-b border-borda">
            <h3 class="text-xl font-bold">Nova Conta</h3>
            <button type="button" class="btn-fechar-modal text-2xl">&times;</button>
        </header>
        <div class="p-4">
            <label for="input-nome-conta" class="block text-sm font-medium text-texto-secundario mb-1">Nome da Conta / Mesa</label>
            <input type="text" id="input-nome-conta" required class="w-full p-2 border border-borda rounded-md bg-fundo-principal" placeholder="Ex: Mesa 5">
        </div>
        <footer class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Criar Conta</button>
        </footer>
    </form>
</div>`;

export const mount = (closeModal) => {
    const form = document.getElementById('form-nova-conta');
    const inputNome = form.querySelector('#input-nome-conta');
    inputNome.focus();

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const nomeConta = inputNome.value.trim();

        if (!nomeConta) {
            return Toast.mostrarNotificacao("O nome da conta não pode estar vazio.", "erro");
        }
        if (store.getState().contasAtivas.some(c => c.status === 'ativa' && c.nome.toLowerCase() === nomeConta.toLowerCase())) {
            return Toast.mostrarNotificacao(`Já existe uma conta ativa com o nome "${nomeConta}".`, "erro");
        }

        const novaContaObj = { 
            id: crypto.randomUUID(), 
            nome: nomeConta, 
            pedidos: [], 
            dataAbertura: new Date().toISOString(), 
            status: 'ativa' 
        };
        
        store.dispatch({ type: 'ADD_ACCOUNT', payload: novaContaObj });
        Toast.mostrarNotificacao(`Conta "${nomeConta}" criada com sucesso!`);
        closeModal();
    });

    form.querySelector('.btn-fechar-modal').addEventListener('click', closeModal);

    document.getElementById('modal-nova-conta-overlay').addEventListener('click', e => {
        if (e.target.id === 'modal-nova-conta-overlay') {
            closeModal();
        }
    });
};

export const unmount = () => {};