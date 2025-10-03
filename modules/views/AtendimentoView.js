// /modules/views/AtendimentoView.js - A View Reativa de Atendimento (v7.2 - Correção de Bugs Pedido)
'use strict';

import store from '../services/Store.js';
import * as Modals from '../components/Modals.js';
import * as Toast from '../components/Toast.js';

const sel = {};
let produtoSelecionadoParaPedido = null; // Guarda o produto selecionado na busca

function querySelectors() {
    sel.listaContasAtivas = document.getElementById('lista-contas-ativas');
    sel.atendimentoEmptyState = document.getElementById('atendimento-empty-state');
    sel.btnFabAddConta = document.getElementById('btn-fab-add-conta');
    sel.formNovaConta = document.getElementById('form-nova-conta');
    sel.inputNomeConta = document.getElementById('input-nome-conta');
    sel.pagamentoMetodosContainer = document.getElementById('pagamento-metodos-container');
    sel.btnConfirmarPagamento = document.getElementById('btn-confirmar-pagamento');
    
    // Seletores para o modal de adicionar pedido
    sel.formAddPedido = document.getElementById('form-add-pedido');
    sel.inputQuantidade = document.getElementById('input-quantidade');
    sel.hiddenContaId = document.getElementById('hidden-conta-id');
    sel.inputBuscaProdutoPedido = document.getElementById('input-busca-produto-pedido');
    sel.autocompleteResults = document.getElementById('autocomplete-results');
}

/**
 * Gera o HTML para um único cartão de conta.
 * @param {object} conta - O objeto da conta.
 * @returns {string} O HTML do cartão.
 */
function renderContaCard(conta) {
    const subtotal = conta.pedidos.reduce((total, p) => total + (p.preco * p.qtd), 0);
    const contaEstaVazia = conta.pedidos.length === 0;

    const pedidosHTML = contaEstaVazia
        ? '<p class="text-center text-gray-500 py-4">Nenhum pedido nesta conta.</p>'
        : conta.pedidos.map((pedido, index) => `
            <div class="flex justify-between items-center py-2 border-b last:border-b-0">
                <span>${pedido.qtd}x ${pedido.nome}</span>
                <div class="flex items-center gap-4">
                    <span class="font-semibold">${(pedido.preco * pedido.qtd).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                    <button class="btn-icon btn-remover-item text-red-500 hover:text-red-700" data-index="${index}" title="Remover Item">
                        <i class="lni lni-trash-can"></i>
                    </button>
                </div>
            </div>
        `).join('');

    return `
        <div class="conta-card bg-white rounded-lg shadow-md overflow-hidden" data-id="${conta.id}">
            <div class="card-header p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50">
                <h3 class="text-xl font-bold">${conta.nome}</h3>
                <div class="text-right">
                    <span class="font-bold text-lg block">${subtotal.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                    <span class="text-xs text-gray-500">${conta.pedidos.length} Itens</span>
                </div>
            </div>
            <div class="card-body border-t border-gray-200" style="display: none;">
                <div class="p-4">${pedidosHTML}</div>
                <div class="p-4 bg-gray-50 flex gap-2">
                    <button class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded btn-adicionar-pedido">+ Pedido</button>
                    <button class="w-full text-white font-bold py-2 px-4 rounded btn-finalizar-pagamento ${contaEstaVazia ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}" ${contaEstaVazia ? 'disabled' : ''}>Finalizar</button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Função principal de renderização para a View de Atendimento.
 */
function render() {
    const state = store.getState();
    const contasAtivas = state.contasAtivas.filter(c => c.status === 'ativa');

    if (contasAtivas.length === 0) {
        sel.atendimentoEmptyState.classList.remove('hidden');
        sel.listaContasAtivas.classList.add('hidden');
    } else {
        sel.atendimentoEmptyState.classList.add('hidden');
        sel.listaContasAtivas.classList.remove('hidden');
        sel.listaContasAtivas.innerHTML = contasAtivas.map(renderContaCard).join('');
    }
}

function handleCriarNovaConta(event) {
    event.preventDefault();
    const nomeConta = sel.inputNomeConta.value.trim();
    if (!nomeConta) {
        Toast.mostrarNotificacao("O nome da conta não pode estar vazio.", "erro");
        return;
    }

    const state = store.getState();
    if (state.contasAtivas.some(c => c.status === 'ativa' && c.nome.toLowerCase() === nomeConta.toLowerCase())) {
        Toast.mostrarNotificacao(`Já existe uma conta ativa com o nome "${nomeConta}".`, "erro");
        return;
    }

    const novaContaObj = { id: crypto.randomUUID(), nome: nomeConta, pedidos: [], dataAbertura: new Date().toISOString(), status: 'ativa' };
    store.dispatch({ type: 'ADD_ACCOUNT', payload: novaContaObj });
    
    Modals.fecharModalAddPedido();
    Toast.mostrarNotificacao(`Conta "${nomeConta}" criada com sucesso!`);
}

function handleFinalizarPagamento(conta) {
    if (!conta) return;
    Modals.abrirModalPagamento(conta);
}

/**
 * Função de inicialização da View de Atendimento.
 */
function init() {
    querySelectors();
    store.subscribe(render);

    sel.btnFabAddConta.addEventListener('click', Modals.abrirModalNovaConta);
    sel.formNovaConta.addEventListener('submit', handleCriarNovaConta);
    
    // --- LISTENERS PARA O MODAL DE PEDIDO ---

    // Listener para a busca de produtos
    sel.inputBuscaProdutoPedido.addEventListener('input', () => {
        const termo = sel.inputBuscaProdutoPedido.value.toLowerCase();
        const state = store.getState();
        produtoSelecionadoParaPedido = null; // Limpa seleção anterior ao digitar

        if (termo.length < 2) {
            sel.autocompleteResults.classList.add('hidden');
            return;
        }

        const resultados = state.inventario.filter(p => p.nome.toLowerCase().includes(termo) && p.stockGeleira > 0);
        
        sel.autocompleteResults.innerHTML = '';
        if (resultados.length > 0) {
            resultados.forEach(produto => {
                const item = document.createElement('div');
                item.className = 'p-2 hover:bg-gray-100 cursor-pointer';
                item.textContent = `${produto.nome} (Disp: ${produto.stockGeleira})`;
                item.addEventListener('click', () => {
                    sel.inputBuscaProdutoPedido.value = produto.nome;
                    produtoSelecionadoParaPedido = produto; // Guarda o objeto completo
                    sel.autocompleteResults.classList.add('hidden');
                });
                sel.autocompleteResults.appendChild(item);
            });
            sel.autocompleteResults.classList.remove('hidden');
        } else {
            sel.autocompleteResults.classList.add('hidden');
        }
    });

    // Listener para a submissão do formulário de pedido
    sel.formAddPedido.addEventListener('submit', (event) => {
        event.preventDefault(); // Previne o reload da página
        const contaId = sel.hiddenContaId.value;
        const quantidade = parseInt(sel.inputQuantidade.value);

        if (!produtoSelecionadoParaPedido) {
            Toast.mostrarNotificacao("Por favor, selecione um produto válido da lista.", "erro");
            return;
        }
        if (isNaN(quantidade) || quantidade <= 0) {
            Toast.mostrarNotificacao("Por favor, insira uma quantidade válida.", "erro");
            return;
        }
        if (quantidade > produtoSelecionadoParaPedido.stockGeleira) {
            Toast.mostrarNotificacao(`Stock insuficiente. Apenas ${produtoSelecionadoParaPedido.stockGeleira} disponíveis.`, "erro");
            return;
        }

        store.dispatch({
            type: 'ADD_ORDER_ITEM',
            payload: {
                contaId,
                produto: produtoSelecionadoParaPedido,
                quantidade
            }
        });

        Toast.mostrarNotificacao("Pedido adicionado com sucesso.");
        Modals.fecharModalAddPedido();
        produtoSelecionadoParaPedido = null; // Limpa a seleção
    });

    // --- LISTENER PRINCIPAL DA VIEW ---
    
    sel.listaContasAtivas.addEventListener('click', (event) => {
        const cardHeader = event.target.closest('.card-header');
        const card = event.target.closest('.conta-card');
        if (!card) return;

        const contaId = card.dataset.id;
        const state = store.getState();
        const conta = state.contasAtivas.find(c => c.id === contaId);

        if (cardHeader) {
            const cardBody = card.querySelector('.card-body');
            const isExpanded = card.classList.contains('expanded');

            document.querySelectorAll('.conta-card.expanded').forEach(otherCard => {
                if (otherCard !== card) {
                    const otherBody = otherCard.querySelector('.card-body');
                    gsap.to(otherBody, { height: 0, duration: 0.3, onComplete: () => { otherBody.style.display = 'none'; } });
                    otherCard.classList.remove('expanded');
                }
            });

            if (isExpanded) {
                gsap.to(cardBody, { height: 0, duration: 0.3, onComplete: () => { cardBody.style.display = 'none'; } });
                card.classList.remove('expanded');
            } else {
                cardBody.style.display = 'block';
                gsap.fromTo(cardBody, { height: 0 }, { height: 'auto', duration: 0.3 });
                card.classList.add('expanded');
            }
        }
        
        const targetButton = event.target.closest('button');
        if (!targetButton || !conta) return;
        
        if (targetButton.classList.contains('btn-adicionar-pedido')) {
            Modals.abrirModalAddPedido(contaId);
        }
        if (targetButton.classList.contains('btn-finalizar-pagamento')) {
            handleFinalizarPagamento(conta);
        }
        if (targetButton.classList.contains('btn-remover-item')) {
            const itemIndex = parseInt(targetButton.dataset.index, 10);
            store.dispatch({ type: 'REMOVE_ORDER_ITEM', payload: { contaId, itemIndex } });
            Toast.mostrarNotificacao("Item removido com sucesso.");
        }
    });

    render();
}

export default { init };