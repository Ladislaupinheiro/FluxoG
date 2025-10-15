// /modules/features/inventario/InventarioView.js
'use strict';

import store from '../../shared/services/Store.js';
import { 
    abrirModalAddProduto, 
    abrirModalEditProduto, 
    abrirModalAddStock, 
    abrirModalMoverStock, 
    abrirModalConfirmacao,
    abrirModalShortcutManagement
} from '../../shared/components/Modals.js';
import * as Toast from '../../shared/components/Toast.js';

let unsubscribe = null;
let viewNode = null;
let swiper = null;

function renderProductCards() {
    if (!viewNode) return;

    const state = store.getState();
    const { inventario } = state;
    const swiperWrapper = viewNode.querySelector('#inventario-swiper .swiper-wrapper');
    const emptyStateEl = viewNode.querySelector('#inventario-empty-state');
    
    if (!swiperWrapper || !emptyStateEl) return;

    if (inventario.length === 0) {
        emptyStateEl.classList.remove('hidden');
        if (swiper) swiper.disable();
        swiperWrapper.innerHTML = '';
        return;
    }
    
    emptyStateEl.classList.add('hidden');
    if (swiper) swiper.enable();

    swiperWrapper.innerHTML = inventario.map(item => {
        const isShortcut = state.config.priorityProducts.includes(item.id);
        const shortcutIconClass = isShortcut ? 'lni-star-fill text-yellow-500' : 'lni-star';

        return `
            <div class="swiper-slide">
                <div class="product-card" data-product-id="${item.id}">
                    <div class="card-header">
                        <div>
                            <h3 class="card-title">${item.nome}</h3>
                            <p class="card-price">${(item.precoVenda || 0).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p>
                        </div>
                        <div class="card-menu-container">
                             <button class="btn-icon btn-menu"><i class="lni lni-more-alt"></i></button>
                             <div class="card-menu-dropdown">
                                <button class="btn-edit-product">Editar</button>
                                <button class="btn-delete-product">Apagar</button>
                             </div>
                        </div>
                    </div>
                    
                    <button class="btn-shortcut"><i class="lni ${shortcutIconClass}"></i></button>

                    <div class="card-stock-info">
                        <div class="stock-column">
                            <span class="stock-label">armazém</span>
                            <span class="stock-value">${item.stockArmazem}</span>
                            <button class="btn-add btn-add-armazem"><i class="lni lni-plus"></i></button>
                        </div>
                        <div class="stock-column">
                            <span class="stock-label">loja</span>
                            <span class="stock-value">${item.stockLoja}</span>
                            <button class="btn-add btn-move-loja"><i class="lni lni-plus"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    if (swiper) {
        swiper.update();
        swiper.pagination.render();
        swiper.pagination.update();
    }
}

function handleViewClick(event) {
    const target = event.target;
    const productCard = target.closest('.product-card');

    if (target.closest('#btn-fab-add-produto')) {
        abrirModalAddProduto();
        return;
    }

    // Fecha menus de contexto se clicar fora
    if (!productCard) {
        document.querySelectorAll('.card-menu-dropdown.visible').forEach(menu => {
            menu.classList.remove('visible');
        });
        return;
    }

    const produtoId = productCard.dataset.productId;
    const produto = store.getState().inventario.find(p => p.id === produtoId);
    if (!produto) return;

    if (target.closest('.btn-menu')) {
        const dropdown = productCard.querySelector('.card-menu-dropdown');
        // Fecha outros menus abertos antes de abrir o novo
        document.querySelectorAll('.card-menu-dropdown.visible').forEach(menu => {
            if (menu !== dropdown) menu.classList.remove('visible');
        });
        dropdown.classList.toggle('visible');
        return; 
    }

    if (target.closest('.btn-add-armazem')) abrirModalAddStock(produto);
    else if (target.closest('.btn-move-loja')) abrirModalMoverStock(produto);
    else if (target.closest('.btn-shortcut')) abrirModalShortcutManagement(produto);
    else if (target.closest('.btn-edit-product')) abrirModalEditProduto(produto);
    else if (target.closest('.btn-delete-product')) {
        abrirModalConfirmacao(`Apagar ${produto.nome}?`, "Esta ação não pode ser desfeita.", () => {
            store.dispatch({ type: 'DELETE_PRODUCT', payload: produtoId });
            Toast.mostrarNotificacao(`Produto "${produto.nome}" apagado.`);
        });
    }
}

function render() {
    return `
        <style>
            .product-card { background-color: var(--cor-fundo-secundario); border-radius: 12px; box-shadow: var(--sombra-padrao); padding: 1rem; display: flex; flex-direction: column; height: 100%; position: relative; }
            .card-header { display: flex; justify-content: space-between; align-items: flex-start; }
            .card-title { font-size: 1.5rem; font-weight: bold; line-height: 1.2; }
            .card-price { color: var(--cor-texto-secundario); font-weight: 500;}
            .btn-shortcut { background: none; border: none; font-size: 1.75rem; cursor: pointer; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: var(--cor-texto-secundario); padding: 1rem; }
            .card-stock-info { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; text-align: center; margin-top: auto; padding-top: 1rem; }
            .stock-column { display: flex; flex-direction: column; align-items: center; }
            .stock-label { font-size: 0.75rem; text-transform: uppercase; color: var(--cor-texto-secundario); }
            .stock-value { font-size: 2rem; font-weight: bold; }
            .btn-add { background-color: #28a745; color: white; border: none; border-radius: 50%; width: 28px; height: 28px; font-size: 1rem; cursor: pointer; display:flex; justify-content:center; align-items:center; }
            .card-menu-container { position: relative; }
            .card-menu-dropdown { display: none; position: absolute; right: 0; top: 100%; background-color: var(--cor-fundo-principal); border-radius: 8px; box-shadow: var(--sombra-padrao); z-index: 10; overflow: hidden; min-width: 100px; }
            .card-menu-dropdown.visible { display: block; }
            .card-menu-dropdown button { display: block; width: 100%; padding: 0.5rem 1rem; background: none; border: none; text-align: left; cursor: pointer; font-size: 0.875rem; }
            .card-menu-dropdown button:hover { background-color: rgba(0,0,0,0.1); }
            .swiper-pagination-bullet-active { background-color: var(--cor-primaria); }
        </style>
        <header class="flex justify-between items-center p-4">
            <h2 class="text-2xl font-bold">Inventário</h2>
        </header>

        <div id="inventario-empty-state" class="text-center p-8 hidden">
            <i class="lni lni-dropbox text-6xl text-gray-300 dark:text-gray-600"></i>
            <h3 class="mt-4 text-xl font-semibold">O seu inventário está vazio</h3>
            <p class="text-texto-secundario">Toque no botão '+' para começar.</p>
        </div>

        <div id="inventario-swiper" class="swiper p-4">
            <div class="swiper-wrapper pb-8">
                </div>
            <div class="swiper-pagination"></div>
        </div>
        
        <button id="btn-fab-add-produto" class="fab">
             <i class="lni lni-plus"></i>
        </button>
    `;
}

function mount() {
    viewNode = document.getElementById('app-root');
    
    swiper = new Swiper('#inventario-swiper', {
        slidesPerView: 'auto',
        centeredSlides: true,
        spaceBetween: 16,
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
    });

    unsubscribe = store.subscribe(renderProductCards);
    
    renderProductCards();

    viewNode.addEventListener('click', handleViewClick);
}

function unmount() {
    if (unsubscribe) unsubscribe();
    if (swiper) swiper.destroy(true, true);
    
    if (viewNode) viewNode.removeEventListener('click', handleViewClick);

    unsubscribe = null;
    viewNode = null;
    swiper = null;
}

export default { render, mount, unmount };