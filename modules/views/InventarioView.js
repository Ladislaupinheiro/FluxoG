// /modules/views/InventarioView.js - (v7.1 - UI Refatorada e Correção de Bug)
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

function render() {
    const state = store.getState();
    const { inventario } = state;

    if (inventario.length === 0) {
        sel.inventarioHeader.classList.add('hidden');
        sel.inventarioEmptyState.classList.remove('hidden');
        if (sel.listaInventario) sel.listaInventario.innerHTML = '';
        return;
    }
    
    if(sel.inventarioHeader) sel.inventarioHeader.classList.remove('hidden');
    if(sel.inventarioEmptyState) sel.inventarioEmptyState.classList.add('hidden');
    
    const termoBusca = sel.inputBuscaInventario.value.toLowerCase().trim();
    const inventarioParaMostrar = inventario.filter(item => 
        item.nome.toLowerCase().includes(termoBusca)
    );
    
    sel.listaInventario.innerHTML = '';

    if (inventarioParaMostrar.length === 0) {
        sel.listaInventario.innerHTML = `<div class="text-center text-gray-500 py-8">Nenhum produto encontrado.</div>`;
        return;
    }
    
    inventarioParaMostrar.forEach(item => {
        const isLowStock = item.stockGeleira > 0 && item.stockGeleira <= item.stockMinimo;
        const card = document.createElement('div');
        card.className = 'bg-white p-4 rounded-lg shadow-md';
        card.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="text-xl font-bold">${item.nome}</h3>
                    <p class="text-gray-500">${item.preco.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p>
                </div>
                <div class="flex gap-2">
                    <button class="btn-icon btn-editar-produto text-gray-400 hover:text-blue-500" data-id="${item.id}" title="Editar Produto"><i class="lni lni-pencil-alt"></i></button>
                    <button class="btn-icon btn-apagar-produto text-gray-400 hover:text-red-500" data-id="${item.id}" title="Apagar Produto"><i class="lni lni-trash-can"></i></button>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4 mt-4 text-center">
                <div>
                    <p class="text-sm text-gray-500">Armazém</p>
                    <p class="text-2xl font-bold">${item.stockArmazem}</p>
                    <button class="btn-add-stock-small btn-adicionar-stock" data-id="${item.id}" title="Adicionar Stock ao Armazém">
                        <i class="lni lni-plus"></i>
                    </button>
                </div>
                <div>
                    <p class="text-sm text-gray-500 ${isLowStock ? 'text-red-500 animate-pulse' : ''}">Loja</p>
                    <p class="text-2xl font-bold ${isLowStock ? 'text-red-500' : ''}">${item.stockGeleira}</p>
                    <button class="btn-add-stock-small btn-mover-stock" data-id="${item.id}" title="Mover Stock para a Loja">
                        <i class="lni lni-plus"></i>
                    </button>
                </div>
            </div>
        `;
        sel.listaInventario.appendChild(card);
    });
}

function handleAddProduto(event) {
    event.preventDefault();
    const nome = sel.inputProdutoNome.value.trim();
    const preco = parseFloat(sel.inputProdutoPreco.value);
    const stock = parseInt(sel.inputProdutoStock.value);
    const stockMinimo = parseInt(sel.inputProdutoStockMinimo.value);
    if (!nome || isNaN(preco) || preco <= 0 || isNaN(stock) || stock < 0 || isNaN(stockMinimo) || stockMinimo < 0) {
        Toast.mostrarNotificacao("Dados inválidos. Verifique os valores.", "erro"); return;
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
    const produtoAtualizado = { ...produto, nome: sel.inputEditProdutoNome.value.trim(), preco: parseFloat(sel.inputEditProdutoPreco.value), stockMinimo: parseInt(sel.inputEditProdutoStockMinimo.value) };
    store.dispatch({ type: 'UPDATE_PRODUCT', payload: produtoAtualizado });
    Modals.fecharModalEditProduto();
    Toast.mostrarNotificacao(`Produto "${produtoAtualizado.nome}" atualizado!`);
}

function handleAddStock(event) {
    event.preventDefault();
    const produtoId = sel.hiddenAddStockId.value;
    const quantidade = parseInt(sel.inputAddStockQuantidade.value);
    if (isNaN(quantidade) || quantidade === 0) {
        Toast.mostrarNotificacao("Insira um número válido diferente de zero.", "erro"); return;
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
        Toast.mostrarNotificacao("A quantidade deve ser um número positivo.", "erro"); return;
    }
    if (quantidade > produto.stockArmazem) {
        Toast.mostrarNotificacao(`Apenas ${produto.stockArmazem} un. disponíveis no armazém.`, "erro"); return;
    }
    store.dispatch({ type: 'MOVE_STOCK', payload: { produtoId, quantidade } });
    Modals.fecharModalMoverStock();
    Toast.mostrarNotificacao(`${quantidade} un. de ${produto.nome} movidas para a loja.`);
}

function init() {
    querySelectors();
    store.subscribe(render);

    if (sel.btnFabAddProduto) sel.btnFabAddProduto.addEventListener('click', Modals.abrirModalAddProduto);
    if (sel.inputBuscaInventario) sel.inputBuscaInventario.addEventListener('input', render);
    
    if (sel.formAddProduto) sel.formAddProduto.addEventListener('submit', handleAddProduto);
    if (sel.formEditProduto) sel.formEditProduto.addEventListener('submit', handleEditProduto);
    if (sel.formAddStock) sel.formAddStock.addEventListener('submit', handleAddStock);
    if (sel.formMoverStock) sel.formMoverStock.addEventListener('submit', handleMoverStock);
    
    if (sel.listaInventario) {
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
            if (target.classList.contains('btn-adicionar-stock')) {
                Modals.abrirModalAddStock(produto);
            }
            if (target.classList.contains('btn-mover-stock')) {
                Modals.abrirModalMoverStock(produto);
            }
            if (target.classList.contains('btn-apagar-produto')) {
                Modals.abrirModalConfirmacao(
                    `Apagar ${produto.nome}?`,
                    "Esta ação não pode ser desfeita. O produto será removido permanentemente do inventário.",
                    () => {
                        store.dispatch({ type: 'DELETE_PRODUCT', payload: produtoId });
                        Toast.mostrarNotificacao(`Produto "${produto.nome}" apagado com sucesso.`);
                    }
                );
            }
        });
    }

    render();
}

export default { init };