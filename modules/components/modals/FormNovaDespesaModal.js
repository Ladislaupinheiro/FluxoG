// /modules/components/modals/FormNovaDespesaModal.js
'use strict';

import store from '../../services/Store.js';
import * as Toast from '../Toast.js';

export const render = () => `
<div id="modal-nova-despesa-overlay" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4">
    <form id="form-nova-despesa" class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-sm">
        <header class="flex justify-between items-center p-4 border-b border-borda">
            <h3 class="text-xl font-bold">Registar Nova Despesa</h3>
            <button type="button" class="btn-fechar-modal text-2xl">&times;</button>
        </header>
        <div class="p-4 space-y-4">
            <div>
                <label for="input-despesa-descricao" class="block text-sm font-medium mb-1">Descrição</label>
                <input type="text" id="input-despesa-descricao" required class="w-full p-2 border border-borda rounded-md bg-fundo-principal" placeholder="Ex: Compra de gelo">
            </div>
            <div>
                <label for="input-despesa-valor" class="block text-sm font-medium mb-1">Valor (Kz)</label>
                <input type="number" id="input-despesa-valor" required min="1" class="w-full p-2 border border-borda rounded-md bg-fundo-principal">
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">Método de Pagamento</label>
                <select id="select-despesa-metodo" class="w-full p-2 border border-borda rounded-md bg-fundo-principal">
                    <option value="Numerário">Numerário</option>
                    <option value="TPA">TPA</option>
                </select>
            </div>
        </div>
        <footer class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
            <button type="submit" class="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">Registar Despesa</button>
        </footer>
    </form>
</div>`;

export const mount = (closeModal) => {
    const form = document.getElementById('form-nova-despesa');
    form.querySelector('#input-despesa-descricao').focus();

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const descricao = form.querySelector('#input-despesa-descricao').value.trim();
        const valor = parseFloat(form.querySelector('#input-despesa-valor').value);
        const metodoPagamento = form.querySelector('#select-despesa-metodo').value;

        if (!descricao || !valor || valor <= 0) {
            return Toast.mostrarNotificacao("Preencha a descrição e um valor válido.", "erro");
        }

        const novaDespesa = {
            id: crypto.randomUUID(),
            data: new Date().toISOString(),
            descricao,
            valor,
            metodoPagamento
        };
        
        store.dispatch({ type: 'ADD_EXPENSE', payload: novaDespesa });
        Toast.mostrarNotificacao("Despesa registada com sucesso.");
        closeModal();
    });

    form.querySelector('.btn-fechar-modal').addEventListener('click', closeModal);
    
    document.getElementById('modal-nova-despesa-overlay').addEventListener('click', e => {
        if (e.target.id === 'modal-nova-despesa-overlay') {
            closeModal();
        }
    });
};

export const unmount = () => {};