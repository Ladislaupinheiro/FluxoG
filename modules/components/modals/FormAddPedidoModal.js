// /modules/components/modals/FormAddPedidoModal.js
'use strict';

import store from '../../services/Store.js';
import * as Toast from '../Toast.js';
import { debounce } from '../../services/utils.js';

let produtoSelecionadoParaPedido = null;
let listeners = []; // Para gerir os event listeners e removê-los no unmount

const handleBuscaProduto = (e) => {
    const inputBusca = e.target;
    const autocompleteResults = document.getElementById('autocomplete-results');
    const detalhesProduto = document.getElementById('detalhes-produto-selecionado');
    const termo = inputBusca.value.toLowerCase();
    
    produtoSelecionadoParaPedido = null;
    detalhesProduto.classList.add('hidden');

    if (termo.length < 2) {
        autocompleteResults.innerHTML = '';
        autocompleteResults.classList.add('hidden');
        return;
    }

    const resultados = store.getState().inventario.filter(p => p.nome.toLowerCase().includes(termo) && p.stockLoja > 0);
    autocompleteResults.innerHTML = '';

    if (resultados.length > 0) {
        resultados.forEach(produto => {
            const item = document.createElement('div');
            item.className = 'p-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer';
            item.textContent = `${produto.nome} (Disp: ${produto.stockLoja})`;
            
            const selectHandler = () => {
                inputBusca.value = produto.nome;
                produtoSelecionadoParaPedido = produto;
                autocompleteResults.classList.add('hidden');
                
                document.getElementById('pedido-nome-produto').textContent = produto.nome;
                document.getElementById('pedido-preco-produto').textContent = produto.precoVenda.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
                document.getElementById('pedido-stock-disponivel').textContent = produto.stockLoja;
                
                const inputQtd = document.getElementById('input-quantidade');
                inputQtd.max = produto.stockLoja;
                inputQtd.focus();
                
                detalhesProduto.classList.remove('hidden');
            };
            item.addEventListener('click', selectHandler);
            
            listeners.push({ el: item, type: 'click', handler: selectHandler });
        });
        autocompleteResults.classList.remove('hidden');
    } else {
        autocompleteResults.innerHTML = `<div class="p-2 text-center text-sm text-gray-500">Nenhum produto encontrado.</div>`;
        autocompleteResults.classList.remove('hidden');
    }
};

export const render = (conta) => `
<div id="modal-add-pedido-overlay" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4">
    <form id="form-add-pedido" class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-sm">
        <header class="flex justify-between items-center p-4 border-b border-borda">
            <h3 class="text-xl font-bold">Adicionar Pedido a ${conta.nome}</h3>
            <button type="button" class="btn-fechar-modal text-2xl">&times;</button>
        </header>
        <div class="p-4 space-y-4">
            <div class="relative">
                <label for="input-busca-produto-pedido" class="block text-sm font-medium mb-1">Buscar Produto (na Loja)</label>
                <input type="search" id="input-busca-produto-pedido" class="w-full p-2 border border-borda rounded-md bg-fundo-principal" placeholder="Comece a digitar o nome..." autocomplete="off">
                <div id="autocomplete-results" class="absolute w-full bg-fundo-secundario border border-borda rounded-b-lg shadow-lg z-10 max-h-40 overflow-y-auto hidden"></div>
            </div>
            <div id="detalhes-produto-selecionado" class="hidden p-3 bg-blue-50 dark:bg-gray-700 rounded-lg space-y-2">
                <div class="flex justify-between items-center">
                    <span class="font-bold text-lg" id="pedido-nome-produto"></span>
                    <span class="font-semibold text-blue-600 dark:text-blue-400" id="pedido-preco-produto"></span>
                </div>
                <div class="text-sm text-texto-secundario">Stock disponível na Loja: <span id="pedido-stock-disponivel" class="font-bold"></span></div>
                <div>
                    <label for="input-quantidade" class="block text-sm font-medium mb-1">Quantidade</label>
                    <input type="number" id="input-quantidade" required min="1" class="w-full p-2 border border-borda rounded-md bg-fundo-principal" value="1">
                </div>
            </div>
        </div>
        <footer class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Adicionar à Conta</button>
        </footer>
    </form>
</div>`;

export const mount = (closeModal, contaId) => {
    const conta = store.getState().contasAtivas.find(c => c.id === contaId);
    if (!conta) return closeModal();

    const form = document.getElementById('form-add-pedido');
    const inputBusca = document.getElementById('input-busca-produto-pedido');
    inputBusca.focus();
    
    const debouncedHandler = debounce(handleBuscaProduto, 300);
    inputBusca.addEventListener('input', debouncedHandler);
    listeners.push({ el: inputBusca, type: 'input', handler: debouncedHandler });

    const submitHandler = (e) => {
        e.preventDefault();
        const quantidade = parseInt(form.querySelector('#input-quantidade').value);

        if (!produtoSelecionadoParaPedido) {
            return Toast.mostrarNotificacao("Selecione um produto válido da lista.", "erro");
        }
        if (isNaN(quantidade) || quantidade <= 0) {
            return Toast.mostrarNotificacao("Insira uma quantidade válida.", "erro");
        }
        if (quantidade > produtoSelecionadoParaPedido.stockLoja) {
            return Toast.mostrarNotificacao(`Stock insuficiente. Apenas ${produtoSelecionadoParaPedido.stockLoja} disponíveis.`, "erro");
        }
        
        store.dispatch({ type: 'ADD_ORDER_ITEM', payload: { contaId, produto: produtoSelecionadoParaPedido, quantidade } });
        Toast.mostrarNotificacao("Pedido adicionado.");
        closeModal();
    };
    form.addEventListener('submit', submitHandler);
    listeners.push({ el: form, type: 'submit', handler: submitHandler });

    const closeBtn = form.querySelector('.btn-fechar-modal');
    closeBtn.addEventListener('click', closeModal);
    listeners.push({ el: closeBtn, type: 'click', handler: closeModal });

    const overlay = document.getElementById('modal-add-pedido-overlay');
    const overlayClickHandler = e => { if (e.target.id === 'modal-add-pedido-overlay') closeModal(); };
    overlay.addEventListener('click', overlayClickHandler);
    listeners.push({ el: overlay, type: 'click', handler: overlayClickHandler });
};

export const unmount = () => {
    listeners.forEach(({ el, type, handler }) => el.removeEventListener(type, handler));
    listeners = [];
    produtoSelecionadoParaPedido = null;
};