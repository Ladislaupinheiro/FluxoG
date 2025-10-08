// /modules/components/modals/FormAddPedidoModal.js
'use strict';

import store from '../../services/Store.js';
import * as Toast from '../Toast.js';
import { debounce } from '../../services/utils.js';

let produtoSelecionado = null;
let listeners = [];
let confirmationTimeout = null;

// Funções auxiliares para gerir os estados da UI dentro do modal
function showState(stateName) {
    const productStateDiv = document.getElementById('state-product-selection');
    const quantityStateDiv = document.getElementById('state-quantity-selection');
    const confirmationStateDiv = document.getElementById('state-confirmation');

    productStateDiv.classList.toggle('hidden', stateName !== 'product');
    quantityStateDiv.classList.toggle('hidden', stateName !== 'quantity');
    confirmationStateDiv.classList.toggle('hidden', stateName !== 'confirmation');
}

function renderizarResultadosBusca(termo) {
    const resultadosContainer = document.getElementById('autocomplete-results');
    const shortcutsContainer = document.getElementById('shortcuts-container');
    if (!resultadosContainer) return;

    if (!termo || termo.length < 2) {
        resultadosContainer.innerHTML = '';
        resultadosContainer.classList.add('hidden');
        if (shortcutsContainer) shortcutsContainer.classList.remove('hidden');
        return;
    }
    
    if (shortcutsContainer) shortcutsContainer.classList.add('hidden');
    const resultados = store.getState().inventario.filter(p => p.nome.toLowerCase().includes(termo.toLowerCase()) && p.stockLoja > 0);
    
    if (resultados.length > 0) {
        resultadosContainer.innerHTML = resultados.map(produto => `
            <div class="search-result-item" data-product-id="${produto.id}">
                <span class="font-bold">${produto.nome}</span>
                <span class="text-sm text-texto-secundario">Loja: <strong>${produto.stockLoja}</strong></span>
            </div>
        `).join('');
        resultadosContainer.classList.remove('hidden');
    } else {
        resultadosContainer.innerHTML = `<p class="p-2 text-center text-sm text-texto-secundario">Nenhum produto encontrado.</p>`;
        resultadosContainer.classList.remove('hidden');
    }
}

export const render = (conta) => {
    const state = store.getState();
    const shortcutIds = state.config.priorityProducts || [];
    const shortcutProducts = shortcutIds.map(id => state.inventario.find(p => p.id === id)).filter(Boolean);

    return `
    <div id="modal-add-pedido-overlay" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4">
        <form id="form-add-pedido" class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-sm">
            <header class="flex justify-between items-center p-4 border-b border-borda">
                <h3 id="modal-header-title" class="text-xl font-bold">Adicionar Pedido a ${conta.nome}</h3>
                <button type="button" class="btn-fechar-modal text-2xl">&times;</button>
            </header>
            
            <div class="p-4">
                <div id="state-product-selection">
                    <div id="shortcuts-container" class="space-y-2 mb-4">
                        ${shortcutProducts.map(p => `
                            <button type="button" class="shortcut-btn" data-product-id="${p.id}">
                                ${p.nome}
                            </button>
                        `).join('')}
                    </div>
                    <div class="relative">
                        <input type="search" id="input-busca-produto-pedido" class="w-full p-2 border border-borda rounded-md bg-fundo-input" placeholder="Ou procure por outro produto..." autocomplete="off">
                        <div id="autocomplete-results" class="absolute w-full bg-fundo-secundario border border-borda rounded-b-lg shadow-lg z-10 max-h-40 overflow-y-auto hidden"></div>
                    </div>
                </div>

                <div id="state-quantity-selection" class="hidden">
                    <div id="quantity-grid" class="grid grid-cols-4 gap-2">
                        ${[...Array(12).keys()].map(i => `<button type="button" class="quantity-btn" data-qtd="${i + 1}">${i + 1}</button>`).join('')}
                    </div>
                </div>

                <div id="state-confirmation" class="hidden text-center space-y-4 py-4">
                    <p id="confirmation-text" class="text-lg font-semibold"></p>
                    <button type="button" id="btn-add-more" class="w-full text-blue-600 dark:text-blue-400 font-semibold py-2 px-4 rounded-lg border-2 border-dashed border-blue-500 hover:bg-blue-500/10">
                        + Adicionar mais
                    </button>
                </div>
            </div>
            <style>
                .shortcut-btn { width: 100%; padding: 0.75rem; border-radius: 8px; background-color: var(--cor-fundo-principal); border: 1px solid var(--cor-borda); font-weight: 600; text-align: center; }
                .search-result-item { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; cursor: pointer; }
                .search-result-item:hover { background-color: rgba(0,0,0,0.1); }
                .quantity-btn { aspect-ratio: 1/1; border-radius: 8px; background-color: var(--cor-fundo-principal); border: 1px solid var(--cor-borda); font-weight: 600; }
                .quantity-btn:hover { background-color: var(--cor-primaria); color: white; }
            </style>
        </form>
    </div>`;
};

export const mount = (closeModal, contaId) => {
    const conta = store.getState().contasAtivas.find(c => c.id === contaId);
    if (!conta) return closeModal();

    const form = document.getElementById('form-add-pedido');
    const headerTitle = document.getElementById('modal-header-title');
    const productSelectionDiv = document.getElementById('state-product-selection');
    const quantitySelectionDiv = document.getElementById('state-quantity-selection');
    const confirmationDiv = document.getElementById('state-confirmation');
    
    // Função para tratar a seleção de um produto
    const handleProductSelection = (produtoId) => {
        produtoSelecionado = store.getState().inventario.find(p => p.id === produtoId);
        if (produtoSelecionado) {
            headerTitle.textContent = `Qtd. para ${produtoSelecionado.nome}`;
            showState('quantity');
        }
    };
    
    // Função para tratar a seleção de quantidade
    const handleQuantitySelection = (qtd) => {
        store.dispatch({ type: 'ADD_ORDER_ITEM', payload: { contaId, produto: produtoSelecionado, quantidade: qtd } });
        
        document.getElementById('confirmation-text').textContent = `✓ ${qtd}x ${produtoSelecionado.nome} adicionado(s)`;
        showState('confirmation');

        clearTimeout(confirmationTimeout);
        confirmationTimeout = setTimeout(() => {
            headerTitle.textContent = `Adicionar Pedido a ${conta.nome}`;
            showState('product');
        }, 4000);
    };

    // Listeners para seleção de produto (atalhos e busca)
    productSelectionDiv.addEventListener('click', e => {
        const shortcutBtn = e.target.closest('.shortcut-btn');
        const searchResult = e.target.closest('.search-result-item');
        if (shortcutBtn) handleProductSelection(shortcutBtn.dataset.productId);
        if (searchResult) handleProductSelection(searchResult.dataset.productId);
    });
    
    document.getElementById('input-busca-produto-pedido').addEventListener('input', debounce(e => renderizarResultadosBusca(e.target.value), 300));
    
    // Listener para seleção de quantidade
    quantitySelectionDiv.addEventListener('click', e => {
        const quantityBtn = e.target.closest('.quantity-btn');
        if (quantityBtn) handleQuantitySelection(parseInt(quantityBtn.dataset.qtd, 10));
    });

    // Listener para o botão "+ Adicionar mais"
    document.getElementById('btn-add-more').addEventListener('click', () => {
        clearTimeout(confirmationTimeout);
        showState('quantity');
    });

    // Listener para fechar o modal
    form.querySelector('.btn-fechar-modal').addEventListener('click', closeModal);
    document.getElementById('modal-add-pedido-overlay').addEventListener('click', e => {
        if (e.target.id === 'modal-add-pedido-overlay') closeModal();
    });
    
    // Estado inicial
    showState('product');
};

export const unmount = () => {
    produtoSelecionado = null;
    listeners = [];
    clearTimeout(confirmationTimeout);
};