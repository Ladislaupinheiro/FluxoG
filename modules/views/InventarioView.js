// /modules/views/InventarioView.js - (v7.0 - Final Corrigido)
'use strict';

import store from '../services/Store.js';
import * as Modals from '../components/Modals.js';
import * as Toast from '../components/Toast.js';

const sel = {};

function querySelectors() {
    sel.inventarioHeader = document.getElementById('inventario-header');
    sel.listaInventario = document.getElementById('lista-inventario');
    sel.inputBuscaInventario = document.getElementById('input-busca-inventario');
    sel.inventarioEmptyState = document.getElementById('inventario-empty-state');
    sel.btnFabAddProduto = document.getElementById('btn-fab-add-produto');

    // Seletores de Modais relacionados ao Inventário
    sel.formAddProduto = document.getElementById('form-add-produto');
    sel.inputProdutoNome = document.getElementById('input-produto-nome');
    sel.inputProdutoPreco = document.getElementById('input-produto-preco');
    sel.inputProdutoStock = document.getElementById('input-produto-stock');
    sel.inputProdutoStockMinimo = document.getElementById('input-produto-stock-minimo');

    sel.formEditProduto = document.getElementById('form-edit-produto');
    sel.hiddenEditProdutoId = document.getElementById('hidden-edit-produto-id');
    sel.inputEditProdutoNome = document.getElementById('input-edit-produto-nome');
    sel.inputEditProdutoPreco = document.getElementById('input-edit-produto-preco');
    sel.inputEditProdutoStockMinimo = document.getElementById('input-edit-produto-stock-minimo');
    
    sel.formAddStock = document.getElementById('form-add-stock');
    sel.hiddenAddStockId = document.getElementById('hidden-add-stock-id');
    sel.inputAddStockQuantidade = document.getElementById('input-add-stock-quantidade');
    
    sel.formMoverStock = document.getElementById('form-mover-stock');
    sel.hiddenMoverStockId = document.getElementById('hidden-mover-stock-id');
    sel.inputMoverStockQuantidade = document.getElementById('input-mover-stock-quantidade');
}

/**
 * Função principal de renderização para a View de Inventário.
 */
function render() {
    const state = store.getState();
    const { inventario } = state;

    // LÓGICA DO ESTADO VAZIO
    if (inventario.length === 0) {
        sel.inventarioHeader.classList.add('hidden');
        sel.inventarioEmptyState.classList.remove('hidden');
        sel.listaInventario.innerHTML = '';
        return;
    }
    
    // LÓGICA DA VISTA PREENCHIDA
    sel.inventarioHeader.classList.remove('hidden');
    sel.inventarioEmptyState.classList.add('hidden');
    
    const termoBusca = sel.inputBuscaInventario.value.toLowerCase().trim();
    const inventarioParaMostrar = inventario.filter(item => 
        item.nome.toLowerCase().includes(termoBusca)
    );
    sel.listaInventario.innerHTML = '';

    if (inventarioParaMostrar.length === 0 && termoBusca) {
        sel.listaInventario.innerHTML = `<p class="text-center text-gray-500 py-8">Nenhum produto encontrado para "${termoBusca}".</p>`;
        return;
    }
    
    inventarioParaMostrar.forEach(item => {
        const isLowStock = item.stockGeleira > 0 && item.stockGeleira <= item.stockMinimo;
        const destaqueClasse = isLowStock ? 'border-2 border-red-500 bg-red-50' : 'shadow-md';

        const card = document.createElement('div');
        card.className = `bg-white p-4 rounded-lg ${destaqueClasse}`;
        card.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <div>
                    <p class="font-bold text-lg">${item.nome}</p>
                    <p class="text-sm text-gray-600">Preço: ${item.preco.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p>
                </div>
                <button class="btn-icon btn-editar-produto text-xl text-gray-500 hover:text-blue-500" data-id="${item.id}" title="Editar Produto">
                    <i class="lni lni-pencil"></i>
                </button>
            </div>
            <div class="grid grid-cols-2 gap-4 text-center border-t border-b py-2 my-2">
                <div>
                    <p class="text-xs text-gray-500">ARMAZÉM</p>
                    <p class="font-bold text-2xl">${item.stockArmazem}</p>
                </div>
                <div>
                    <p class="text-xs text-blue-500">GELEIRA</p>
                    <p class="font-bold text-2xl text-blue-500">${item.stockGeleira}</p>
                </div>
            </div>
            <div class="flex justify-end items-center gap-4 mt-2">
                 <button class="btn-icon btn-adicionar-armazem text-2xl text-green-500 hover:text-green-700" data-id="${item.id}" title="Adicionar ao Armazém">
                    <i class="lni lni-box"></i>
                </button>
                <button class="btn-icon btn-mover-geleira text-2xl text-blue-500 hover:text-blue-700" data-id="${item.id}" title="Mover para Geleira">
                    <i class="lni lni-arrow-right-circle"></i>
                </button>
            </div>
        `;
        sel.listaInventario.appendChild(card);
    });
}

// --- Handlers que despacham Ações ---

function handleAddProduto(event) {
    event.preventDefault();
    const nome = sel.inputProdutoNome.value.trim();
    const preco = parseFloat(sel.inputProdutoPreco.value);
    const stock = parseInt(sel.inputProdutoStock.value);
    const stockMinimo = parseInt(sel.inputProdutoStockMinimo.value);

    if (!nome || isNaN(preco) || preco <= 0 || isNaN(stock) || stock < 0 || isNaN(stockMinimo) || stockMinimo < 0) {
        Toast.mostrarNotificacao("Dados inválidos. Verifique os valores.", "erro");
        return;
    }

    const novoProduto = { id: crypto.randomUUID(), nome, preco, stockArmazem: stock, stockGeleira: 0, stockMinimo };
    
    store.dispatch({ type: 'ADD_PRODUCT', payload: novoProduto });
    
    Modals.fecharModalAddProduto();
    Toast.mostrarNotificacao(`Produto "${nome}" adicionado!`);
}

function handleEditProduto(event) {
    event.preventDefault();
    const id = sel.hiddenEditProdutoId.value;
    const state = store.getState();
    const produto = state.inventario.find(p => p.id === id);
    if (!produto) return;

    const produtoAtualizado = {
        ...produto,
        nome: sel.inputEditProdutoNome.value.trim(),
        preco: parseFloat(sel.inputEditProdutoPreco.value),
        stockMinimo: parseInt(sel.inputEditProdutoStockMinimo.value)
    };
    
    store.dispatch({ type: 'UPDATE_PRODUCT', payload: produtoAtualizado });

    Modals.fecharModalEditProduto();
    Toast.mostrarNotificacao(`Produto "${produtoAtualizado.nome}" atualizado!`);
}

function handleAddStock(event) {
    event.preventDefault();
    const produtoId = sel.hiddenAddStockId.value;
    const quantidade = parseInt(sel.inputAddStockQuantidade.value);
    
    if (isNaN(quantidade) || quantidade === 0) {
        Toast.mostrarNotificacao("Insira um número válido diferente de zero.", "erro");
        return;
    }

    store.dispatch({ type: 'ADD_STOCK', payload: { produtoId, quantidade } });

    Modals.fecharModalAddStock();
    Toast.mostrarNotificacao(quantidade > 0 ? `${quantidade} un. adicionadas.` : `${Math.abs(quantidade)} un. removidas.`);
}

function handleMoverStock(event) {
    event.preventDefault();
    const produtoId = sel.hiddenMoverStockId.value;
    const quantidade = parseInt(sel.inputMoverStockQuantidade.value);
    
    const state = store.getState();
    const produto = state.inventario.find(p => p.id === produtoId);

    if (!produto || isNaN(quantidade) || quantidade <= 0) {
        Toast.mostrarNotificacao("A quantidade deve ser um número positivo.", "erro");
        return;
    }
    if (quantidade > produto.stockArmazem) {
        Toast.mostrarNotificacao(`Apenas ${produto.stockArmazem} un. disponíveis no armazém.`, "erro");
        return;
    }
    
    store.dispatch({ type: 'MOVE_STOCK', payload: { produtoId, quantidade } });

    Modals.fecharModalMoverStock();
    Toast.mostrarNotificacao(`${quantidade} un. de ${produto.nome} movidas para a geleira.`);
}

/**
 * Função de inicialização da View.
 */
function init() {
    querySelectors();
    store.subscribe(render);

    sel.btnFabAddProduto.addEventListener('click', Modals.abrirModalAddProduto);
    sel.inputBuscaInventario.addEventListener('input', render);
    
    sel.formAddProduto.addEventListener('submit', handleAddProduto);
    sel.formEditProduto.addEventListener('submit', handleEditProduto);
    sel.formAddStock.addEventListener('submit', handleAddStock);
    sel.formMoverStock.addEventListener('submit', handleMoverStock);
    
    sel.listaInventario.addEventListener('click', (event) => {
        const target = event.target.closest('button');
        if (!target) return;
        
        const produtoId = target.dataset.id;
        const state = store.getState();
        const produto = state.inventario.find(p => p.id === produtoId);
        if (!produto) return;

        if (target.classList.contains('btn-editar-produto')) {
            Modals.abrirModalEditProduto(produto);
        }
        if (target.classList.contains('btn-adicionar-armazem')) {
            Modals.abrirModalAddStock(produto);
        }
        if (target.classList.contains('btn-mover-geleira')) {
            Modals.abrirModalMoverStock(produto);
        }
    });

    render();
}

export default { init };