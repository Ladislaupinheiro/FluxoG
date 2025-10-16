// /modules/features/inventario/InventarioView.js (ATUALIZADO)
'use strict';

import store from '../../shared/services/Store.js';
import Router from '../../app/Router.js'; // <-- NOVO
import { 
    abrirModalAddProduto,
    abrirModalAddFornecedor,
    abrirModalRegistarCompra,
    abrirModalGerirCategorias
} from '../../shared/components/Modals.js';

let unsubscribe = null;
let viewNode = null;
let activeTab = 'produtos';
let activeCategoryFilter = 'all';

// ... (todas as outras funções de renderização permanecem exatamente as mesmas) ...
function getCategoryMap(categorias = []) {
    return categorias.reduce((map, cat) => {
        map[cat.nome.toLowerCase()] = cat;
        return map;
    }, {});
}

function renderFiltrosDeCategoria(categorias = []) {
    const filtrosHTML = categorias.map(cat => `<button class="px-3 py-1 text-sm font-semibold rounded-full border-2 ${activeCategoryFilter === cat.id ? 'text-white' : ''}" style="${activeCategoryFilter === cat.id ? `background-color: ${cat.cor}; border-color: ${cat.cor};` : `border-color: ${cat.cor}; color: ${cat.cor};`}" data-category-id="${cat.id}">${cat.nome}</button>`).join('');
    return `<div id="category-filters-container" class="py-2 flex gap-2 overflow-x-auto"><button class="px-3 py-1 text-sm font-semibold rounded-full border-2 ${activeCategoryFilter === 'all' ? 'bg-gray-700 dark:bg-gray-200 text-white dark:text-black border-gray-700 dark:border-gray-200' : 'border-gray-400 text-gray-400'}" data-category-id="all">Todas</button>${filtrosHTML}</div>`;
}

function renderListaProdutosFinal(inventario = [], categorias = []) {
    const categoryMap = getCategoryMap(categorias);
    const produtosFiltrados = activeCategoryFilter === 'all' ? inventario : inventario.filter(p => { const categoriaDoFiltro = categorias.find(c => c.id === activeCategoryFilter); return p.tags && categoriaDoFiltro && p.tags.includes(categoriaDoFiltro.nome.toLowerCase()); });
    if (produtosFiltrados.length === 0) { return `<p class="text-center text-texto-secundario p-8">Nenhum produto encontrado para esta categoria.</p>`; }
    return `<div class="space-y-4">${produtosFiltrados.map(p => { const stockArmazemTotal = p.stockArmazemLotes.reduce((total, lote) => total + lote.quantidade, 0); const primeiraTag = p.tags && p.tags[0] ? p.tags[0].toLowerCase() : ''; const corCategoria = categoryMap[primeiraTag] ? categoryMap[primeiraTag].cor : '#6c757d'; return `<div class="bg-fundo-secundario rounded-lg shadow-md overflow-hidden" data-produto-id="${p.id}" style="border-top: 4px solid ${corCategoria};"><div class="p-4"><div class="flex justify-between items-start"><div><h3 class="font-bold text-lg">${p.nome}</h3><p class="text-sm font-semibold" style="color: ${corCategoria};">${p.tags.join(', ')}</p></div><span class="font-extrabold text-xl">${(p.precoVenda || 0).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span></div><div class="grid grid-cols-2 gap-4 text-center mt-4 border-t border-borda pt-2"><div><span class="text-2xl font-bold block">${p.stockLoja}</span><span class="text-xs text-texto-secundario">NA LOJA</span></div><div><span class="text-2xl font-bold block">${stockArmazemTotal}</span><span class="text-xs text-texto-secundario">NO ARMAZÉM</span></div></div></div><div class="bg-fundo-principal p-2 flex justify-end gap-2"><button class="text-sm font-semibold text-blue-600 hover:underline">Editar</button><button class="text-sm font-semibold text-blue-600 hover:underline">Mover Stock</button></div></div>` }).join('')}</div>`;
}

function renderConteudoAbaProdutos() {
    const state = store.getState();
    const filtrosHTML = renderFiltrosDeCategoria(state.categoriasDeProduto);
    const listaHTML = renderListaProdutosFinal(state.inventario, state.categoriasDeProduto);
    viewNode.querySelector('#inventario-produtos-container').innerHTML = filtrosHTML + listaHTML;
}

function renderListaFornecedores(fornecedores = []) {
    if (fornecedores.length === 0) { return `<p class="text-center text-texto-secundario p-8">Nenhum fornecedor registado. Toque em '+' para adicionar o primeiro.</p>`; }
    return `<div class="space-y-3">${fornecedores.map(f => `<div class="bg-fundo-secundario p-4 rounded-lg shadow-md flex justify-between items-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700" data-fornecedor-id="${f.id}"><div><p class="font-bold">${f.nome}</p><p class="text-sm text-texto-secundario">${f.contacto || 'Sem contacto'}</p></div><button class="btn-icon text-texto-secundario text-xl"><i class="lni lni-chevron-right"></i></button></div>`).join('')}</div>`;
}

function renderContent() {
    if (!viewNode) return;
    renderConteudoAbaProdutos();
    const fornecedoresContainer = viewNode.querySelector('#inventario-fornecedores-container');
    if (fornecedoresContainer) {
        fornecedoresContainer.innerHTML = renderListaFornecedores(store.getState().fornecedores);
    }
}

function switchTab(tabName) {
    if (!viewNode || tabName === activeTab) return;
    activeTab = tabName;
    const tabProdutosBtn = viewNode.querySelector('#tab-produtos');
    const tabFornecedoresBtn = viewNode.querySelector('#tab-fornecedores');
    const produtosContainer = viewNode.querySelector('#inventario-produtos-container');
    const fornecedoresContainer = viewNode.querySelector('#inventario-fornecedores-container');
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
            #category-filters-container::-webkit-scrollbar { display: none; }
        </style>
        <header class="p-4 flex justify-between items-center">
            <h2 class="text-2xl font-bold">Inventário</h2>
            <div class="flex items-center gap-2">
                <button id="btn-gerir-categorias" class="btn-icon text-xl text-texto-secundario hover:text-primaria" title="Gerir Categorias"><i class="lni lni-tag"></i></button>
                <button id="btn-registar-compra" class="flex items-center gap-2 bg-green-600 text-white font-bold text-sm py-2 px-3 rounded-lg shadow-md hover:bg-green-700"><i class="lni lni-cart-full"></i><span>Registar Compra</span></button>
            </div>
        </header>
        <nav class="px-4 border-b border-borda"><div id="inventario-tabs" class="flex items-center gap-4"><button id="tab-produtos" class="tab-btn active" data-tab="produtos">Produtos</button><button id="tab-fornecedores" class="tab-btn" data-tab="fornecedores">Fornecedores</button></div></nav>
        <main class="pb-24">
            <div id="inventario-produtos-container" class="px-4"></div>
            <div id="inventario-fornecedores-container" class="p-4 hidden"></div>
        </main>
        <button id="btn-fab-inventario" class="fab"><i class="lni lni-plus"></i></button>
    `;
}

function mount() {
    viewNode = document.getElementById('app-root');
    activeTab = 'produtos';
    activeCategoryFilter = 'all';

    viewNode.addEventListener('click', (e) => {
        const fab = e.target.closest('#btn-fab-inventario');
        const btnRegistarCompra = e.target.closest('#btn-registar-compra');
        const btnGerirCategorias = e.target.closest('#btn-gerir-categorias');
        const tabBtn = e.target.closest('.tab-btn');
        const categoryFilterBtn = e.target.closest('#category-filters-container button');
        const fornecedorCard = e.target.closest('[data-fornecedor-id]'); // <-- NOVO

        if (tabBtn) {
            switchTab(tabBtn.dataset.tab);
            return;
        }
        if (fab) {
            if (activeTab === 'produtos') abrirModalAddProduto();
            else abrirModalAddFornecedor();
            return;
        }
        if (btnRegistarCompra) {
            abrirModalRegistarCompra();
            return;
        }
        if (btnGerirCategorias) {
            abrirModalGerirCategorias();
            return;
        }
        if (categoryFilterBtn) {
            activeCategoryFilter = categoryFilterBtn.dataset.categoryId;
            renderConteudoAbaProdutos();
            return;
        }
        if (fornecedorCard) { // <-- NOVO
            const fornecedorId = fornecedorCard.dataset.fornecedorId;
            Router.navigateTo(`#fornecedor-detalhes/${fornecedorId}`);
            return;
        }
    });

    renderContent();
    unsubscribe = store.subscribe(renderContent);
}

function unmount() {
    if (unsubscribe) unsubscribe();
    unsubscribe = null;
    viewNode = null;
}

export default { render, mount, unmount };