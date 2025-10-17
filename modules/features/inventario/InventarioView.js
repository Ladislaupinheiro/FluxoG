// /modules/features/inventario/InventarioView.js (MODIFICADO E COMPLETO)
'use strict';

import store from '../../shared/services/Store.js';
import Router from '../../app/Router.js';
import {
    abrirModalAddFornecedor,
    abrirModalGerirCategorias,
    abrirModalMoverStock,
    abrirModalEditProduto,
    abrirModalRegistarCompra 
} from '../../shared/components/Modals.js';

let unsubscribe = null;
let viewNode = null;
let activeTab = 'fornecedores'; 
let activeCategoryFilter = 'all';

function getCategoryMap(categorias = []) {
    return categorias.reduce((map, cat) => {
        map[cat.nome.toLowerCase()] = cat;
        return map;
    }, {});
}

function renderFiltrosDeCategoria(categorias = []) {
    const filtrosHTML = categorias.map(cat => `<button class="px-3 py-1 text-sm font-semibold rounded-full border-2 whitespace-nowrap ${activeCategoryFilter === cat.id ? 'text-white' : ''}" style="${activeCategoryFilter === cat.id ? `background-color: ${cat.cor}; border-color: ${cat.cor};` : `border-color: ${cat.cor}; color: ${cat.cor};`}" data-category-id="${cat.id}">${cat.nome}</button>`).join('');
    return `<div id="category-filters-container" class="filter-bar py-2 flex gap-2 overflow-x-auto"><button class="px-3 py-1 text-sm font-semibold rounded-full border-2 whitespace-nowrap ${activeCategoryFilter === 'all' ? 'bg-gray-700 dark:bg-gray-200 text-white dark:text-black border-gray-700 dark:border-gray-200' : 'border-gray-400 text-gray-400'}" data-category-id="all">Todas</button>${filtrosHTML}</div>`;
}

function renderListaProdutosFinal(inventario = [], categorias = [], fornecedores = []) {
    const categoryMap = getCategoryMap(categorias);
    const produtosFiltrados = activeCategoryFilter === 'all' 
        ? inventario 
        : inventario.filter(p => {
            const categoriaDoFiltro = categorias.find(c => c.id === activeCategoryFilter);
            return p.tags && categoriaDoFiltro && p.tags.includes(categoriaDoFiltro.nome.toLowerCase());
        });

    if (produtosFiltrados.length === 0) {
        return `<p class="text-center text-texto-secundario p-8">Nenhum produto no seu stock. Registe uma compra para começar.</p>`;
    }

    return `<div class="space-y-4">${produtosFiltrados.map(p => {
        const primeiraTag = p.tags && p.tags[0] ? p.tags[0].toLowerCase() : '';
        const corCategoria = categoryMap[primeiraTag] ? categoryMap[primeiraTag].cor : '#6c757d';
        return `
            <div class="product-card bg-fundo-secundario rounded-lg shadow-md overflow-hidden" data-produto-id="${p.id}" style="border-top: 4px solid ${corCategoria};">
                <div class="p-4 product-card-main-area cursor-pointer">
                    <div>
                        <h3 class="font-bold text-lg">${p.nome}</h3>
                        <p class="text-sm font-semibold text-texto-secundario">${(p.precoVenda || 0).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p>
                    </div>
                </div>
                <div class="bg-fundo-principal grid grid-cols-2 gap-px">
                    <div class="text-center p-2">
                        <span class="text-xs text-texto-secundario">ARMAZÉM</span>
                        <div class="flex items-center justify-center gap-2">
                            <span class="text-2xl font-bold block">${p.stockArmazem}</span>
                            <button class="btn-add-armazem-stock bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center" title="Registar Compra para este Produto">
                                <i class="lni lni-plus"></i>
                            </button>
                        </div>
                    </div>
                    <div class="text-center p-2">
                        <span class="text-xs text-texto-secundario">LOJA</span>
                        <div class="flex items-center justify-center gap-2">
                            <span class="text-2xl font-bold block">${p.stockLoja}</span>
                            <button class="btn-move-stock bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center" title="Mover para Loja">
                                <i class="lni lni-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `
    }).join('')}</div>`;
}

function renderConteudoAbaProdutos() {
    if (!viewNode) return;
    const state = store.getState();
    const filtrosHTML = renderFiltrosDeCategoria(state.categoriasDeProduto);
    const listaHTML = renderListaProdutosFinal(state.inventario, state.categoriasDeProduto, state.fornecedores);
    const container = viewNode.querySelector('#inventario-produtos-container');
    if (container) {
        container.innerHTML = filtrosHTML + listaHTML;
    }
}

function renderListaFornecedores() {
    if (!viewNode) return;
    const fornecedoresContainer = viewNode.querySelector('#inventario-fornecedores-container');
    const fornecedores = store.getState().fornecedores;
    if (!fornecedoresContainer) return;
    if (fornecedores.length === 0) {
        fornecedoresContainer.innerHTML = `<p class="text-center text-texto-secundario p-8">Nenhum fornecedor registado. Toque em '+' para adicionar o primeiro.</p>`;
    } else {
        fornecedoresContainer.innerHTML = `<div class="space-y-3">${fornecedores.map(f => `<div class="fornecedor-card bg-fundo-secundario p-4 rounded-lg shadow-md flex justify-between items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" data-fornecedor-id="${f.id}"><div><p class="font-bold">${f.nome}</p><p class="text-sm text-texto-secundario">${f.contacto || 'Sem contacto'}</p></div><button class="btn-icon text-texto-secundario text-xl"><i class="lni lni-chevron-right"></i></button></div>`).join('')}</div>`;
    }
}

function switchTab(tabName) {
    if (!viewNode || tabName === activeTab) return;
    activeTab = tabName;
    const fab = viewNode.querySelector('#btn-fab-inventario');
    const tabProdutosBtn = viewNode.querySelector('#tab-produtos');
    const tabFornecedoresBtn = viewNode.querySelector('#tab-fornecedores');
    const produtosContainer = viewNode.querySelector('#inventario-produtos-container');
    const fornecedoresContainer = viewNode.querySelector('#inventario-fornecedores-container');
    
    fab.classList.toggle('hidden', activeTab === 'produtos');
    tabProdutosBtn.classList.toggle('active', activeTab === 'produtos');
    tabFornecedoresBtn.classList.toggle('active', activeTab === 'fornecedores');
    produtosContainer.classList.toggle('hidden', activeTab !== 'produtos');
    fornecedoresContainer.classList.toggle('hidden', activeTab !== 'fornecedores');
}

function render() {
    return `
        <style>
            .tab-btn { padding: 0.75rem 1rem; border: none; background: none; font-weight: 600; color: var(--cor-texto-secundario); border-bottom: 3px solid transparent; }
            .tab-btn.active { color: var(--cor-primaria); border-bottom-color: var(--cor-primaria); }
        </style>
        <header class="p-4 flex justify-between items-center">
            <h2 class="text-2xl font-bold">Inventário</h2>
            <button id="btn-gerir-categorias" class="btn-icon text-xl text-texto-secundario hover:text-primaria" title="Gerir Categorias">
                <i class="lni lni-tag"></i>
            </button>
        </header>
        <nav class="px-4 border-b border-borda"><div id="inventario-tabs" class="flex items-center gap-4"><button id="tab-fornecedores" class="tab-btn active" data-tab="fornecedores">Fornecedores</button><button id="tab-produtos" class="tab-btn" data-tab="produtos">Produtos</button></div></nav>
        <main class="pb-24">
            <div id="inventario-fornecedores-container" class="p-4"></div>
            <div id="inventario-produtos-container" class="px-4 hidden"></div>
        </main>
        <button id="btn-fab-inventario" class="fab"><i class="lni lni-plus"></i></button>
    `;
}

function mount() {
    viewNode = document.getElementById('app-root');
    activeTab = 'fornecedores';
    activeCategoryFilter = 'all';

    const handleViewClick = (e) => {
        const state = store.getState();
        const productCard = e.target.closest('.product-card');
        if (productCard) {
            const produtoId = productCard.dataset.produtoId;
            const produto = state.inventario.find(p => p.id === produtoId);
            if (!produto) return;

            if (e.target.closest('.btn-move-stock')) { 
                abrirModalMoverStock(produto); 
                return; 
            }
            // FLUXO CORRIGIDO: Abre o modal de compra pré-preenchido
            if (e.target.closest('.btn-add-armazem-stock')) {
                const fornecedor = state.fornecedores.find(f => f.id === produto.fornecedorId);
                if (fornecedor) {
                    const produtoCatalogo = fornecedor.catalogo.find(pCat => pCat.id === produto.catalogoId);
                    abrirModalRegistarCompra(fornecedor, produtoCatalogo);
                }
                return;
            }
            if (e.target.closest('.product-card-main-area')) { 
                abrirModalEditProduto(produto); 
                return;
            }
        }

        const fornecedorCard = e.target.closest('.fornecedor-card');
        if (fornecedorCard) {
            Router.navigateTo(`#fornecedor-detalhes/${fornecedorCard.dataset.fornecedorId}`);
            return;
        }

        const tabBtn = e.target.closest('.tab-btn');
        if (tabBtn) { switchTab(tabBtn.dataset.tab); return; }
        
        const categoryFilterBtn = e.target.closest('#category-filters-container button');
        if (categoryFilterBtn) { activeCategoryFilter = categoryFilterBtn.dataset.categoryId; renderConteudoAbaProdutos(); return; }
        
        if (e.target.closest('#btn-fab-inventario')) { if (activeTab === 'fornecedores') abrirModalAddFornecedor(); return; }
        if (e.target.closest('#btn-gerir-categorias')) { abrirModalGerirCategorias(); return; }
    };

    viewNode.addEventListener('click', handleViewClick);
    
    renderListaFornecedores();
    renderConteudoAbaProdutos();
    switchTab(activeTab);

    unsubscribe = store.subscribe(() => {
        if(viewNode) { // Garante que a view ainda está montada
            renderListaFornecedores();
            renderConteudoAbaProdutos();
        }
    });

    const originalUnmount = unmount;
    unmount = () => {
        if(viewNode) viewNode.removeEventListener('click', handleViewClick);
        originalUnmount();
    };
}

function unmount() {
    if (unsubscribe) unsubscribe();
    unsubscribe = null;
    viewNode = null;
}

export default { render, mount, unmount };