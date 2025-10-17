// /modules/features/inventario/components/FormAddProdutoCatalogoModal.js (CORRIGIDO E COMPLETO)
'use strict';

import store from '../../../shared/services/Store.js';
import * as Toast from '../../../shared/components/Toast.js';

export const render = (fornecedor) => {
    const state = store.getState();
    const categoriasPrimariasOptions = state.categoriasDeProduto
        .filter(cat => cat.isSystemDefault)
        .map(cat => `<option value="${cat.id}">${cat.nome}</option>`)
        .join('');

    return `
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
            
            <div class="grid grid-cols-2 gap-4">
                 <div>
                    <label for="select-catalogo-categoria-pai" class="block text-sm font-medium mb-1">Categoria Principal</label>
                    <select id="select-catalogo-categoria-pai" required class="w-full p-2 border border-borda rounded-md bg-fundo-input">
                        <option value="" disabled selected>Selecione...</option>
                        ${categoriasPrimariasOptions}
                    </select>
                </div>
                <div>
                    <label for="select-catalogo-subcategoria" class="block text-sm font-medium mb-1">Subcategoria</label>
                    <select id="select-catalogo-subcategoria" required disabled class="w-full p-2 border border-borda rounded-md bg-fundo-input opacity-50">
                        <option value="" disabled selected>Primeiro selecione a Categoria</option>
                    </select>
                </div>
            </div>
            
            {/* CAMPO DE PREÇO ADICIONADO */}
            <div>
                <label for="input-catalogo-preco" class="block text-sm font-medium mb-1">Preço de Venda (Kz)</label>
                <input type="number" id="input-catalogo-preco" required min="0" step="any" class="w-full p-2 border border-borda rounded-md bg-fundo-input" placeholder="Ex: 1500">
            </div>
        </div>
        <footer class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Salvar no Catálogo</button>
        </footer>
    </form>
</div>`;
};

export const mount = (closeModal, fornecedor) => {
    const form = document.getElementById('form-add-prod-catalogo');
    const nomeInput = form.querySelector('#input-catalogo-nome');
    const precoInput = form.querySelector('#input-catalogo-preco'); // NOVO
    const selectCategoriaPai = form.querySelector('#select-catalogo-categoria-pai');
    const selectSubcategoria = form.querySelector('#select-catalogo-subcategoria');
    
    nomeInput.focus();

    function popularSubcategorias(categoriaPaiId) {
        if (!selectSubcategoria) return;
        const state = store.getState();
        const subcategoriasFiltradas = state.categoriasDeProduto.filter(cat => cat.parentId === categoriaPaiId);
        selectSubcategoria.innerHTML = '<option value="" disabled selected>Selecione...</option>';
        selectSubcategoria.innerHTML += subcategoriasFiltradas.map(cat => `<option value="${cat.nome}">${cat.nome}</option>`).join('');
        selectSubcategoria.disabled = false;
        selectSubcategoria.classList.remove('opacity-50');
    }

    selectCategoriaPai.addEventListener('change', (event) => {
        const selectedParentId = event.target.value;
        if (selectedParentId) {
            popularSubcategorias(selectedParentId);
        }
    });

    form.addEventListener('submit', e => {
        e.preventDefault();
        
        const nome = nomeInput.value.trim();
        const subcategoriaNome = selectSubcategoria.value;
        const precoVenda = parseFloat(precoInput.value); // NOVO

        if (!nome) { return Toast.mostrarNotificacao("O nome do produto é obrigatório.", "erro"); }
        if (!subcategoriaNome) { return Toast.mostrarNotificacao("A seleção da subcategoria é obrigatória.", "erro"); }
        if (isNaN(precoVenda) || precoVenda < 0) { return Toast.mostrarNotificacao("O preço de venda é obrigatório e deve ser um valor positivo.", "erro"); }

        const produto = { 
            nome, 
            tags: [subcategoriaNome.toLowerCase()],
            precoVenda: precoVenda // NOVO
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