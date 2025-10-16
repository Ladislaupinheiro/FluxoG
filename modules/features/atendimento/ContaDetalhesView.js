// /modules/features/atendimento/ContaDetalhesView.js (VERSÃO FINAL INTERATIVA)
'use strict';

import store from '../../shared/services/Store.js';
import Router from '../../app/Router.js';
import { abrirModalPagamento } from '../../shared/components/Modals.js';
import { getTopSellersByCategory } from '../inventario/services/ProductAnalyticsService.js';
import * as Toast from '../../shared/components/Toast.js';

let unsubscribe = null;
let viewNode = null;
let contaAtivaId = null;
let quickAccessSwiper = null;
let activeCategoryId = 'all'; // Estado para o filtro de categoria

function getCategoryMap(categorias = []) {
    return categorias.reduce((map, cat) => {
        map[cat.nome.toLowerCase()] = cat;
        return map;
    }, {});
}

function renderOrderList(conta, categorias = []) {
    if (!conta || conta.pedidos.length === 0) {
        return `<p class="text-center text-texto-secundario p-4">Nenhum pedido nesta conta.</p>`;
    }

    const categoryMap = getCategoryMap(categorias);

    return conta.pedidos.map(item => {
        const produto = store.getState().inventario.find(p => p.id === item.produtoId);
        const primeiraTag = produto && produto.tags && produto.tags[0] ? produto.tags[0].toLowerCase() : '';
        const cor = categoryMap[primeiraTag] ? categoryMap[primeiraTag].cor : '#6c757d';
        
        return `
        <div class="p-3 rounded-lg flex justify-between items-center" style="border-left: 4px solid ${cor}; background-color: var(--cor-fundo-principal);">
            <span>${item.qtd}x ${item.nome}</span>
            <span class="font-bold">${(item.preco * item.qtd).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
        </div>
    `}).join('');
}

function renderCategoryFilters(categorias = []) {
    const filtrosHTML = categorias.map(cat => `
        <button class="filter-btn px-4 py-2 text-sm font-semibold rounded-lg border-2 whitespace-nowrap ${activeCategoryId === cat.id ? 'text-white' : ''}" 
                style="${activeCategoryId === cat.id ? `background-color: ${cat.cor}; border-color: ${cat.cor};` : `border-color: ${cat.cor}; color: ${cat.cor};`}"
                data-category-id="${cat.id}">
            ${cat.nome}
        </button>
    `).join('');

    return `
        <button class="filter-btn px-4 py-2 text-sm font-semibold rounded-lg border-2 whitespace-nowrap ${activeCategoryId === 'all' ? 'bg-gray-700 dark:bg-gray-200 text-white dark:text-black border-gray-700 dark:border-gray-200' : 'border-gray-400 text-gray-400'}" data-category-id="all">
            Todos
        </button>
        ${filtrosHTML}
    `;
}

function renderQuickAccess() {
    const state = store.getState();
    const topSellers = getTopSellersByCategory(state, activeCategoryId, 10);
    const categoryMap = getCategoryMap(state.categoriasDeProduto);
    const quickAccessContainer = viewNode.querySelector('#quick-access-swiper-wrapper');

    if (!quickAccessContainer) return;

    if (topSellers.length === 0) {
        quickAccessContainer.innerHTML = `<div class="swiper-slide flex items-center justify-center text-texto-secundario">Nenhum produto popular nesta categoria.</div>`;
    } else {
        quickAccessContainer.innerHTML = topSellers.map(p => {
            const primeiraTag = p.tags && p.tags[0] ? p.tags[0].toLowerCase() : '';
            const cor = categoryMap[primeiraTag] ? categoryMap[primeiraTag].cor : '#6c757d';

            return `
            <div class="swiper-slide">
                <button class="quick-access-btn w-full h-full flex flex-col items-center justify-center rounded-lg p-2 text-center" style="background-color: ${cor};" data-product-id="${p.id}">
                    <span class="font-bold text-white text-sm leading-tight">${p.nome}</span>
                    <span class="text-xs text-white/80 mt-1">Stock: ${p.stockLoja}</span>
                </button>
            </div>
        `}).join('');
    }
    if (quickAccessSwiper) {
        quickAccessSwiper.update();
        quickAccessSwiper.slideTo(0);
    }
}

function render(contaId) {
    const state = store.getState();
    const conta = state.contasAtivas.find(c => c.id === contaId);
    const cliente = conta ? state.clientes.find(c => c.id === conta.clienteId) : null;
    if (!conta || !cliente) return `<p class="p-4 text-center">Conta ou cliente não encontrado.</p>`;

    const totalAPagar = conta.pedidos.reduce((total, p) => total + (p.preco * p.qtd), 0);

    return `
        <style>
            .category-filters::-webkit-scrollbar { display: none; }
            .quick-access-btn { min-width: 100px; }
        </style>
        <header class="p-4 sticky top-0 bg-fundo-principal z-10 shadow-sm">
            <button id="btn-voltar-atendimento" class="absolute top-4 left-4 p-2 -ml-2 text-2xl text-texto-secundario"><i class="lni lni-arrow-left"></i></button>
            <div id="category-filters-container" class="category-filters flex gap-2 overflow-x-auto ml-12">
                ${renderCategoryFilters(state.categoriasDeProduto)}
            </div>
        </header>

        <main class="p-4 space-y-4">
            <div class="bg-fundo-secundario p-4 rounded-lg shadow-md">
                <div class="flex justify-between items-center text-lg">
                    <span class="font-bold">${cliente.nome}</span>
                    <span class="font-extrabold text-green-500">${totalAPagar.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                </div>
                <div id="order-list-container" class="mt-4 space-y-2 max-h-[calc(100vh-420px)] overflow-y-auto">
                    ${renderOrderList(conta, state.categoriasDeProduto)}
                </div>
            </div>
        </main>

        <footer class="fixed bottom-0 left-0 w-full bg-fundo-secundario shadow-lg p-4 space-y-2">
            <div id="quick-access-swiper" class="swiper h-20">
                <div id="quick-access-swiper-wrapper" class="swiper-wrapper"></div>
            </div>
            <button id="btn-pagar" class="w-full bg-blue-600 text-white font-bold py-3 rounded-lg shadow-lg">Pagar</button>
        </footer>
    `;
}

function mount(contaId) {
    viewNode = document.getElementById('app-root');
    contaAtivaId = contaId;
    activeCategoryId = 'all';

    const updateView = () => {
        const state = store.getState();
        const conta = state.contasAtivas.find(c => c.id === contaAtivaId);
        if(!conta) { Router.navigateTo('#atendimento'); return; }
        
        viewNode.querySelector('#order-list-container').innerHTML = renderOrderList(conta, state.categoriasDeProduto);
        const totalAPagarEl = viewNode.querySelector('.font-extrabold.text-green-500');
        if(totalAPagarEl) totalAPagarEl.textContent = conta.pedidos.reduce((total, p) => total + (p.preco * p.qtd), 0).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
        renderQuickAccess();
    };
    
    const handleViewClick = (e) => {
        const filterBtn = e.target.closest('.filter-btn');
        const quickAccessBtn = e.target.closest('.quick-access-btn');

        if (e.target.closest('#btn-voltar-atendimento')) { Router.navigateTo('#atendimento'); return; }
        
        if (e.target.closest('#btn-pagar')) {
            const conta = store.getState().contasAtivas.find(c => c.id === contaAtivaId);
            if(conta && conta.pedidos.length > 0) abrirModalPagamento(conta);
            else Toast.mostrarNotificacao("Adicione pedidos à conta antes de pagar.", "erro");
            return;
        }

        if (filterBtn) {
            activeCategoryId = filterBtn.dataset.categoryId;
            viewNode.querySelector('#category-filters-container').innerHTML = renderCategoryFilters(store.getState().categoriasDeProduto);
            renderQuickAccess();
            return;
        }

        if (quickAccessBtn) {
            const produtoId = quickAccessBtn.dataset.productId;
            const produto = store.getState().inventario.find(p => p.id === produtoId);
            if(produto && produto.stockLoja > 0) {
                store.dispatch({ type: 'ADD_ORDER_ITEM', payload: { contaId: contaAtivaId, produto, quantidade: 1 } });
                Toast.mostrarNotificacao(`1x ${produto.nome} adicionado.`);
            } else {
                Toast.mostrarNotificacao(`"${produto.nome}" sem stock na loja.`, "erro");
            }
        }
    };
    
    viewNode.addEventListener('click', handleViewClick);
    
    renderQuickAccess();
    unsubscribe = store.subscribe(updateView);

    quickAccessSwiper = new Swiper('#quick-access-swiper', {
        slidesPerView: 'auto',
        spaceBetween: 8,
    });
    
    const originalUnmount = unmount;
    unmount = () => {
        if(viewNode) viewNode.removeEventListener('click', handleViewClick);
        originalUnmount();
    };
}

function unmount() {
    if (unsubscribe) unsubscribe();
    if (quickAccessSwiper) quickAccessSwiper.destroy(true, true);
    unsubscribe = null;
    viewNode = null;
    contaAtivaId = null;
    quickAccessSwiper = null;
}

export default {
    render,
    mount,
    unmount
};