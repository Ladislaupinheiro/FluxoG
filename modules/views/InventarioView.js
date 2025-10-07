// /modules/views/InventarioView.js - v13.1 (CORRIGIDO)
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

function renderProducts() {
    if (!viewNode) return;

    const state = store.getState();
    const { inventario } = state;
    const listaInventarioEl = viewNode.querySelector('#lista-inventario');
    const inventarioHeaderEl = viewNode.querySelector('#inventario-header');
    const inventarioEmptyStateEl = viewNode.querySelector('#inventario-empty-state');
    const inputBuscaInventarioEl = viewNode.querySelector('#input-busca-inventario');

    if (inventario.length > 5) inventarioHeaderEl.classList.remove('hidden');
    else inventarioHeaderEl.classList.add('hidden');

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
            <div id="produto-${item.id}" class="bg-fundo-secundario p-4 rounded-lg shadow-md" data-product-id="${item.id}">
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="text-xl font-bold">${item.nome}</h3>
                        <div class="text-sm">
                            <span class="text-texto-secundario">Venda:</span>
                            <strong class="text-texto-principal">${(item.precoVenda || 0).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</strong>
                        </div>
                        <div class="text-xs text-green-600 dark:text-green-400">
                            <span class="text-texto-secundario">Custo:</span>
                            <strong class="font-semibold">${(item.custoUnitario || 0).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</strong>
                        </div>
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

function handleCardClick(event) {
    const target = event.target.closest('button');
    if (!target) return;

    // A delegação foca-se apenas nos botões DENTRO dos cards
    const card = target.closest('[data-product-id]');
    if (!card) return;

    const produtoId = card.dataset.productId;
    const produto = store.getState().inventario.find(p => p.id === produtoId);
    if (!produto) return;

    if (target.classList.contains('btn-editar-produto')) abrirModalEditProduto(produto);
    else if (target.classList.contains('btn-adicionar-stock')) abrirModalAddStock(produto);
    else if (target.classList.contains('btn-mover-stock')) abrirModalMoverStock(produto);
    else if (target.classList.contains('btn-apagar-produto')) {
        abrirModalConfirmacao(`Apagar ${produto.nome}?`, "Esta ação não pode ser desfeita.", () => {
            store.dispatch({ type: 'DELETE_PRODUCT', payload: produtoId });
            Toast.mostrarNotificacao(`Produto "${produto.nome}" apagado.`);
        });
    }
}

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

function mount(productId) {
    viewNode = document.getElementById('app-root');
    unsubscribe = store.subscribe(renderProducts);
    renderProducts();

    // Listeners
    viewNode.querySelector('#input-busca-inventario')?.addEventListener('input', renderProducts);
    viewNode.querySelector('#lista-inventario')?.addEventListener('click', handleCardClick);
    
    // LINHA CORRIGIDA: Listener para o botão FAB
    viewNode.querySelector('#btn-fab-add-produto')?.addEventListener('click', abrirModalAddProduto);
    
    if (productId) {
        setTimeout(() => {
            const targetCard = viewNode.querySelector(`#produto-${productId}`);
            if (targetCard) {
                targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // GSAP não está importado, então usamos uma animação CSS simples por enquanto
                targetCard.style.transition = 'background-color 1.5s ease-out';
                targetCard.style.backgroundColor = 'rgba(59, 130, 246, 0.3)';
                setTimeout(() => targetCard.style.backgroundColor = 'transparent', 1500);
            }
        }, 100);
    }
}

function unmount() {
    if (unsubscribe) unsubscribe();
    // A remoção dos listeners individuais não é estritamente necessária aqui
    // porque o innerHTML do app-root será substituído pelo router, destruindo-os.
    unsubscribe = null;
    viewNode = null;
}

export default { render, mount, unmount };