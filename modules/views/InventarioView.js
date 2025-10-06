// /modules/views/InventarioView.js - (v12.0 - Refatorado para SPA com Destaque de Produto)
'use strict';

import store from '../services/Store.js';
import { 
    abrirModalAddProduto, 
    abrirModalEditProduto, 
    abrirModalAddStock, 
    abrirModalMoverStock, 
    abrirModalConfirmacao 
} from '../components/Modals.js';
import * as Toast from '../components/Toast.js';

let unsubscribe = null;
let viewNode = null;

/**
 * Renderiza a lista de produtos do inventário.
 */
function renderProducts() {
    if (!viewNode) return;

    const state = store.getState();
    const { inventario } = state;
    const listaInventarioEl = viewNode.querySelector('#lista-inventario');
    const inventarioHeaderEl = viewNode.querySelector('#inventario-header');
    const inventarioEmptyStateEl = viewNode.querySelector('#inventario-empty-state');
    const inputBuscaInventarioEl = viewNode.querySelector('#input-busca-inventario');

    // Mostra/esconde a barra de busca
    if (inventario.length > 5) {
        inventarioHeaderEl.classList.remove('hidden');
    } else {
        inventarioHeaderEl.classList.add('hidden');
    }

    // Mostra/esconde o estado vazio
    if (inventario.length === 0) {
        inventarioEmptyStateEl.classList.remove('hidden');
        listaInventarioEl.innerHTML = '';
        return;
    }
    inventarioEmptyStateEl.classList.add('hidden');
    
    const termoBusca = inputBuscaInventarioEl.value.toLowerCase().trim();
    const inventarioParaMostrar = inventario.filter(item => 
        item.nome.toLowerCase().includes(termoBusca)
    );
    
    listaInventarioEl.innerHTML = '';

    if (inventarioParaMostrar.length === 0) {
        listaInventarioEl.innerHTML = `<div class="text-center text-texto-secundario py-8">Nenhum produto encontrado.</div>`;
        return;
    }
    
    inventarioParaMostrar.forEach(item => {
        const isLowStock = item.stockLoja > 0 && item.stockLoja <= item.stockMinimo;
        const cardHTML = `
            <div id="produto-${item.id}" class="bg-fundo-secundario p-4 rounded-lg shadow-md transition-colors duration-300" data-product-id="${item.id}">
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="text-xl font-bold">${item.nome}</h3>
                        <p class="text-texto-secundario">${item.preco.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p>
                    </div>
                    <div class="flex gap-2 text-lg">
                        <button class="btn-icon btn-editar-produto text-texto-secundario hover:text-blue-500" title="Editar Produto"><i class="lni lni-pencil-alt"></i></button>
                        <button class="btn-icon btn-apagar-produto text-texto-secundario hover:text-red-500" title="Apagar Produto"><i class="lni lni-trash-can"></i></button>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4 mt-4 text-center">
                    <div>
                        <p class="text-sm text-texto-secundario">Armazém</p>
                        <p class="text-2xl font-bold">${item.stockArmazem}</p>
                        <button class="btn-add-stock-small btn-adicionar-stock" title="Adicionar Stock ao Armazém">
                            <i class="lni lni-plus"></i>
                        </button>
                    </div>
                    <div>
                        <p class="text-sm ${isLowStock ? 'text-red-500 animate-pulse' : 'text-texto-secundario'}">Loja</p>
                        <p class="text-2xl font-bold ${isLowStock ? 'text-red-500' : ''}">${item.stockLoja}</p>
                        <button class="btn-add-stock-small btn-mover-stock" title="Mover Stock para a Loja">
                            <i class="lni lni-chevron-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        listaInventarioEl.insertAdjacentHTML('beforeend', cardHTML);
    });
}

function handleViewClick(event) {
    const target = event.target.closest('button');
    if (!target) return;
    
    const card = target.closest('[data-product-id]');
    if (!card) return;

    const produtoId = card.dataset.productId;
    const state = store.getState();
    const produto = state.inventario.find(p => p.id === produtoId);
    if (!produto) return;

    if (target.classList.contains('btn-editar-produto')) {
        abrirModalEditProduto(produto);
    } else if (target.classList.contains('btn-adicionar-stock')) {
        abrirModalAddStock(produto);
    } else if (target.classList.contains('btn-mover-stock')) {
        abrirModalMoverStock(produto);
    } else if (target.classList.contains('btn-apagar-produto')) {
        abrirModalConfirmacao(
            `Apagar ${produto.nome}?`,
            "Esta ação não pode ser desfeita. O produto será removido permanentemente do inventário.",
            () => {
                store.dispatch({ type: 'DELETE_PRODUCT', payload: produtoId });
                Toast.mostrarNotificacao(`Produto "${produto.nome}" apagado com sucesso.`);
            }
        );
    }
}

/**
 * Retorna o HTML do ecrã de Inventário.
 */
function render() {
    return `
        <header id="inventario-header" class="p-4 hidden sticky top-0 bg-fundo-principal z-10">
            <input type="search" id="input-busca-inventario" class="w-full p-2 border border-borda rounded-md bg-fundo-secundario" placeholder="Buscar no inventário...">
        </header>

        <div id="inventario-empty-state" class="text-center p-8 hidden">
            <i class="lni lni-dropbox text-6xl text-gray-300 dark:text-gray-600"></i>
            <h3 class="mt-4 text-xl font-semibold">O seu inventário está vazio</h3>
            <p class="text-texto-secundario">Toque no botão '+' para adicionar o seu primeiro produto.</p>
        </div>

        <div id="lista-inventario" class="p-4 space-y-3"></div>

        <button id="btn-fab-add-produto" class="fab z-50">
            <i class="lni lni-plus"></i>
        </button>
    `;
}

/**
 * Adiciona os event listeners ao ecrã após ser renderizado.
 */
function mount(productId) { // Aceita o ID do produto como parâmetro
    viewNode = document.getElementById('app-root');
    
    unsubscribe = store.subscribe(renderProducts);
    renderProducts();

    viewNode.querySelector('#input-busca-inventario')?.addEventListener('input', renderProducts);
    viewNode.querySelector('#btn-fab-add-produto')?.addEventListener('click', abrirModalAddProduto);
    viewNode.querySelector('#lista-inventario')?.addEventListener('click', handleViewClick);
    
    // LÓGICA DE DESTAQUE E SCROLL
    if (productId) {
        setTimeout(() => {
            const targetCard = viewNode.querySelector(`#produto-${productId}`);
            if (targetCard) {
                targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                gsap.fromTo(targetCard, 
                    { backgroundColor: 'rgba(59, 130, 246, 0.3)' }, 
                    { backgroundColor: 'transparent', duration: 1.5, ease: 'power2.out' }
                );
            }
        }, 100); // Pequeno delay para garantir que o DOM está pronto
    }
}

function unmount() {
    if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
    }
    viewNode = null;
}

export default {
    render,
    mount,
    unmount
};