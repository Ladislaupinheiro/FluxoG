// /modules/features/inventario/components/FormEditProdutoModal.js (REATORADO)
'use strict';

import store from '../../../shared/services/Store.js';
import * as Toast from '../../../shared/components/Toast.js';

export const render = (produto) => {
    const state = store.getState();
    const fornecedoresOptions = state.fornecedores.map(f => 
        `<option value="${f.id}" ${f.id === produto.fornecedorId ? 'selected' : ''}>${f.nome}</option>`
    ).join('');

    const tagsComoString = produto.tags ? produto.tags.join(', ') : '';

    return `
<div id="modal-edit-produto-overlay" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4">
    <form id="form-edit-produto" class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-sm">
        <header class="flex justify-between items-center p-4 border-b border-borda">
            <h3 class="text-xl font-bold">Editar Produto</h3>
            <button type="button" class="btn-fechar-modal text-2xl">&times;</button>
        </header>
        <div class="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
                <label for="input-edit-produto-nome" class="block text-sm font-medium mb-1">Nome do Produto</label>
                <input type="text" id="input-edit-produto-nome" required class="w-full p-2 border border-borda rounded-md bg-fundo-input" value="${produto.nome}">
            </div>

            <div>
                <label for="select-edit-produto-fornecedor" class="block text-sm font-medium mb-1">Fornecedor (não editável)</label>
                <select id="select-edit-produto-fornecedor" disabled class="w-full p-2 border border-borda rounded-md bg-fundo-principal opacity-70">
                    ${fornecedoresOptions}
                </select>
            </div>

            <div>
                <label for="input-edit-produto-tags" class="block text-sm font-medium mb-1">Rótulos (separados por vírgula)</label>
                <input type="text" id="input-edit-produto-tags" class="w-full p-2 border border-borda rounded-md bg-fundo-input" placeholder="Ex: cerveja, álcool" value="${tagsComoString}">
            </div>

            <div>
                <label for="input-edit-produto-preco-venda" class="block text-sm font-medium mb-1">Preço de Venda (Kz)</label>
                <input type="number" id="input-edit-produto-preco-venda" required min="0" step="any" class="w-full p-2 border border-borda rounded-md bg-fundo-input" value="${produto.precoVenda}">
            </div>
            
            <div>
                <label for="input-edit-produto-stock-minimo" class="block text-sm font-medium mb-1">Stock Mínimo de Alerta</label>
                <input type="number" id="input-edit-produto-stock-minimo" required min="0" class="w-full p-2 border border-borda rounded-md bg-fundo-input" value="${produto.stockMinimo}">
            </div>
        </div>
        <footer class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Salvar Alterações</button>
        </footer>
    </form>
</div>`;
};

export const mount = (closeModal, produto) => {
    const form = document.getElementById('form-edit-produto');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const tags = form.querySelector('#input-edit-produto-tags').value.split(',')
            .map(tag => tag.trim()).filter(Boolean);

        const produtoAtualizado = {
            ...produto,
            nome: form.querySelector('#input-edit-produto-nome').value.trim(),
            precoVenda: parseFloat(form.querySelector('#input-edit-produto-preco-venda').value),
            stockMinimo: parseInt(form.querySelector('#input-edit-produto-stock-minimo').value),
            tags: tags
        };

        // Ação existente no reducer que simplesmente substitui o produto pelo ID
        store.dispatch({ type: 'UPDATE_PRODUCT', payload: produtoAtualizado });
        Toast.mostrarNotificacao(`Produto "${produtoAtualizado.nome}" atualizado!`);
        closeModal();
    });

    form.querySelector('.btn-fechar-modal').addEventListener('click', closeModal);
    
    document.getElementById('modal-edit-produto-overlay').addEventListener('click', e => {
        if (e.target.id === 'modal-edit-produto-overlay') {
            closeModal();
        }
    });
};

export const unmount = () => {};