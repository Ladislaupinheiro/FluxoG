// /modules/features/inventario/components/FormAddProdutoCatalogoModal.js (SIMPLIFICADO)
'use strict';

import store from '../../../shared/services/Store.js';
import * as Toast from '../../../shared/components/Toast.js';

export const render = (fornecedor) => `
<div id="modal-add-prod-catalogo-overlay" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4">
    <form id="form-add-prod-catalogo" class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-sm">
        <header class="flex justify-between items-center p-4 border-b border-borda">
            <div>
                <h3 class="text-xl font-bold">Adicionar ao Catálogo</h3>
                <p class="text-sm text-texto-secundario">Fornecedor: ${fornecedor.nome}</p>
            </div>
            <button type="button" class="btn-fechar-modal text-2xl self-start">&times;</button>
        </header>
        <div class="p-4 space-y-4">
            <div>
                <label for="input-catalogo-nome" class="block text-sm font-medium mb-1">Nome do Produto</label>
                <input type="text" id="input-catalogo-nome" required class="w-full p-2 border border-borda rounded-md bg-fundo-input" placeholder="Ex: Cerveja Tigra (Garrafa)">
            </div>
            <div>
                <label for="input-catalogo-tags" class="block text-sm font-medium mb-1">Rótulos (Tags)</label>
                <input id="input-catalogo-tags" class="w-full p-2 border border-borda rounded-md bg-fundo-input" placeholder="cerveja, álcool, ...">
            </div>
        </div>
        <footer class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Salvar no Catálogo</button>
        </footer>
    </form>
</div>`;

export const mount = (closeModal, fornecedor) => {
    const form = document.getElementById('form-add-prod-catalogo');
    const nomeInput = form.querySelector('#input-catalogo-nome');
    const tagsInput = form.querySelector('#input-catalogo-tags');
    
    nomeInput.focus();

    // Inicializa o Tagify no campo de rótulos
    const state = store.getState();
    const whitelist = state.categoriasDeProduto.map(cat => cat.nome);
    const tagify = new Tagify(tagsInput, {
        whitelist: whitelist,
        dropdown: {
            enabled: 0, 
            closeOnSelect: false
        }
    });

    form.addEventListener('submit', e => {
        e.preventDefault();
        
        const nome = nomeInput.value.trim();
        const tags = tagify.value.map(tag => tag.value.toLowerCase());

        if (!nome) {
            return Toast.mostrarNotificacao("O nome do produto é obrigatório.", "erro");
        }

        const produto = { 
            nome, 
            tags, 
            precoVenda: 0 // O preço de venda será definido no produto principal, não aqui.
        };
        
        store.dispatch({ 
            type: 'ADD_PRODUCT_TO_CATALOG', 
            payload: { fornecedorId: fornecedor.id, produto }
        });

        Toast.mostrarNotificacao(`"${nome}" adicionado ao catálogo de ${fornecedor.nome}.`);
        closeModal();
    });

    form.querySelector('.btn-fechar-modal').addEventListener('click', closeModal);
    
    document.getElementById('modal-add-prod-catalogo-overlay').addEventListener('click', e => {
        if (e.target.id === 'modal-add-prod-catalogo-overlay') {
            closeModal();
        }
    });
};

export const unmount = () => {};