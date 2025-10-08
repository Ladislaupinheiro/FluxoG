// /modules/components/modals/ShortcutManagementModal.js
'use strict';

import store from '../../services/Store.js';
import * as Toast from '../Toast.js';

export const render = (produto) => {
    const state = store.getState();
    const { priorityProducts } = state.config;
    const { inventario } = state;

    let slotsHTML = '';
    for (let i = 0; i < 3; i++) {
        const produtoId = priorityProducts[i];
        const produtoNoSlot = produtoId ? inventario.find(p => p.id === produtoId) : null;
        const nomeProduto = produtoNoSlot ? produtoNoSlot.nome : 'Vazio';

        slotsHTML += `
            <div class="flex justify-between items-center bg-fundo-principal p-3 rounded-lg">
                <span class="font-semibold">Atalho ${i + 1}: <em class="text-texto-secundario">${nomeProduto}</em></span>
                <button data-slot-index="${i}" class="btn-atribuir-atalho bg-blue-500 text-white text-xs font-bold py-1 px-3 rounded-md hover:bg-blue-600">Atribuir</button>
            </div>
        `;
    }

    return `
    <div id="modal-shortcut-management-overlay" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4">
        <div class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-sm">
            <header class="flex justify-between items-center p-4 border-b border-borda">
                <div>
                    <h3 class="text-xl font-bold">Gerir Atalhos</h3>
                    <p class="text-sm text-texto-secundario">Atribuir: ${produto.nome}</p>
                </div>
                <button type="button" class="btn-fechar-modal text-2xl self-start">&times;</button>
            </header>
            
            <div class="p-4 space-y-3">
                ${slotsHTML}
            </div>

            <footer class="p-2 text-center border-t border-borda">
                <button class="btn-fechar-modal-footer text-sm text-blue-600 dark:text-blue-400 font-semibold hover:underline">Fechar</button>
            </footer>
        </div>
    </div>`;
};

export const mount = (closeModal, produto) => {
    const container = document.getElementById('modal-shortcut-management-overlay');

    container.addEventListener('click', e => {
        const target = e.target.closest('.btn-atribuir-atalho');
        if (target) {
            const slotIndex = parseInt(target.dataset.slotIndex, 10);
            
            const currentShortcuts = [...store.getState().config.priorityProducts];
            
            // Garante que o array tenha sempre 3 posições
            while (currentShortcuts.length < 3) {
                currentShortcuts.push(null);
            }
            
            // Remove o ID do produto de qualquer outro slot em que ele possa estar
            const filteredShortcuts = currentShortcuts.map(id => (id === produto.id ? null : id));
            
            // Atribui o ID do produto ao slot selecionado
            filteredShortcuts[slotIndex] = produto.id;

            store.dispatch({ type: 'UPDATE_SHORTCUTS', payload: filteredShortcuts });
            Toast.mostrarNotificacao(`"${produto.nome}" definido como Atalho ${slotIndex + 1}.`);
            closeModal();
        }
    });
    
    // Listeners para fechar o modal
    container.querySelector('.btn-fechar-modal')?.addEventListener('click', closeModal);
    container.querySelector('.btn-fechar-modal-footer')?.addEventListener('click', closeModal);
    container.addEventListener('click', e => {
        if (e.target.id === 'modal-shortcut-management-overlay') {
            closeModal();
        }
    });
};

export const unmount = () => {};