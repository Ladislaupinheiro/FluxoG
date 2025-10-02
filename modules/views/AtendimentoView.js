// /modules/views/AtendimentoView.js - A View Reativa de Atendimento (v7.0 - Final)
'use strict';

import store from '../services/Store.js';
import * as Modals from '../components/Modals.js';
import * as Toast from '../components/Toast.js';

const sel = {};

function querySelectors() {
    sel.atendimentoHeader = document.getElementById('atendimento-header');
    sel.atendimentoEmptyState = document.getElementById('atendimento-empty-state');
    sel.vistaClienteAtivo = document.getElementById('vista-cliente-ativo');
    sel.seletorCliente = document.getElementById('seletor-cliente');
    sel.btnFabAddConta = document.getElementById('btn-fab-add-conta');
    sel.formNovaConta = document.getElementById('form-nova-conta');
    sel.inputNomeConta = document.getElementById('input-nome-conta');
    // Adicionar outros seletores necessários para esta view
    sel.pagamentoMetodosContainer = document.getElementById('pagamento-metodos-container');
    sel.btnConfirmarPagamento = document.getElementById('btn-confirmar-pagamento');
    sel.formAddPedido = document.getElementById('form-add-pedido');
    sel.inputQuantidade = document.getElementById('input-quantidade');
    sel.hiddenContaId = document.getElementById('hidden-conta-id');
}

/**
 * Renderiza o cartão do cliente atualmente selecionado.
 */
function renderVistaClienteAtivo() {
    const state = store.getState();
    const idContaSelecionada = parseInt(sel.seletorCliente.value);
    const conta = state.contasAtivas.find(c => c.id === idContaSelecionada);
    
    sel.vistaClienteAtivo.innerHTML = '';

    if (!conta) {
        const p = document.createElement('p');
        p.className = 'text-center text-gray-500 py-8';
        p.textContent = 'Selecione uma conta para ver os detalhes.';
        sel.vistaClienteAtivo.appendChild(p);
        return;
    }

    const subtotal = conta.pedidos.reduce((total, p) => total + (p.preco * p.qtd), 0);
    const contaEstaVazia = conta.pedidos.length === 0;

    const pedidosHTML = conta.pedidos.length > 0
        ? conta.pedidos.map((pedido, index) => `
            <div class="flex justify-between items-center py-2 border-b">
                <span>${pedido.qtd}x ${pedido.nome}</span>
                <div class="flex items-center gap-4">
                    <span class="font-semibold">${(pedido.preco * pedido.qtd).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                    <button class="btn-icon btn-remover-item text-red-500 hover:text-red-700" data-index="${index}" data-id="${conta.id}" title="Remover Item">
                        <i class="lni lni-trash-can"></i>
                    </button>
                </div>
            </div>
        `).join('')
        : '<p class="text-center text-gray-500 py-4">Nenhum pedido nesta conta.</p>';

    const cartaoCliente = document.createElement('div');
    cartaoCliente.className = 'bg-white p-4 rounded-lg shadow-md';
    cartaoCliente.innerHTML = `
        <div class="flex justify-between items-center border-b pb-2 mb-4">
            <div class="flex items-center gap-2">
                <h3 class="text-xl font-bold">${conta.nome}</h3>
                <button class="btn-icon btn-editar-nome text-lg text-gray-500 hover:text-blue-500" data-id="${conta.id}" title="Editar Nome">
                    <i class="lni lni-pencil"></i>
                </button>
            </div>
        </div>
        <div class="mb-4">${pedidosHTML}</div>
        <div class="mt-4 pt-4 border-t">
            <div class="flex justify-between font-bold text-lg">
                <span>Subtotal:</span>
                <span>${subtotal.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
            </div>
        </div>
        <div class="flex gap-2 mt-4">
            <button class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded btn-adicionar-pedido" data-id="${conta.id}">+ Adicionar Pedido</button>
            <button class="w-full text-white font-bold py-2 px-4 rounded btn-finalizar-pagamento ${contaEstaVazia ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}" data-id="${conta.id}" ${contaEstaVazia ? 'disabled' : ''}>Finalizar Pagamento</button>
        </div>
    `;
    sel.vistaClienteAtivo.appendChild(cartaoCliente);
}

/**
 * Renderiza o seletor de clientes com base nas contas ativas.
 */
function renderSeletorDeClientes(contasAtivas) {
    const clienteSelecionadoAnteriormente = sel.seletorCliente.value;
    sel.seletorCliente.innerHTML = '<option value="">Nenhuma conta selecionada</option>';

    contasAtivas.forEach(conta => {
        const option = document.createElement('option');
        option.value = conta.id;
        option.textContent = conta.nome;
        sel.seletorCliente.appendChild(option);
    });

    if (contasAtivas.some(c => c.id == clienteSelecionadoAnteriormente)) {
        sel.seletorCliente.value = clienteSelecionadoAnteriormente;
    } else {
        sel.seletorCliente.value = "";
    }
}


/**
 * Função principal de renderização para a View de Atendimento.
 */
function render() {
    const state = store.getState();
    const contasAtivas = state.contasAtivas.filter(c => c.status === 'ativa');

    if (contasAtivas.length === 0) {
        sel.atendimentoHeader.classList.add('hidden');
        sel.atendimentoEmptyState.classList.remove('hidden');
        sel.vistaClienteAtivo.innerHTML = '';
        return;
    }

    sel.atendimentoHeader.classList.remove('hidden');
    sel.atendimentoEmptyState.classList.add('hidden');

    renderSeletorDeClientes(contasAtivas);
    renderVistaClienteAtivo();
}

// --- Handlers que despacham Ações ---

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

    const maxId = state.contasAtivas.reduce((max, c) => c.id > max ? c.id : max, 0);
    const novaContaObj = { id: maxId + 1, nome: nomeConta, pedidos: [], dataAbertura: new Date().toISOString(), status: 'ativa' };

    store.dispatch({ type: 'ADD_ACCOUNT', payload: novaContaObj });
    
    Modals.fecharModalNovaConta();
    
    setTimeout(() => {
        sel.seletorCliente.value = novaContaObj.id;
        renderVistaClienteAtivo();
        Toast.mostrarNotificacao(`Conta "${nomeConta}" criada com sucesso!`);
    }, 0);
}

function handleFinalizarPagamento() {
    const contaId = parseInt(sel.pagamentoContaIdInput.value);
    const metodoBtn = sel.pagamentoMetodosContainer.querySelector('.border-blue-500');
    if (!metodoBtn) {
        Toast.mostrarNotificacao("Selecione um método de pagamento.", "erro");
        return;
    }
    const metodoPagamento = metodoBtn.dataset.metodo;

    store.dispatch({ type: 'FINALIZE_PAYMENT', payload: { contaId, metodoPagamento } });
    
    Modals.fecharModalPagamento();
    Toast.mostrarNotificacao("Conta finalizada com sucesso!");
}


/**
 * Função de inicialização da View de Atendimento.
 */
function init() {
    querySelectors();
    store.subscribe(render);

    sel.btnFabAddConta.addEventListener('click', Modals.abrirModalNovaConta);
    sel.formNovaConta.addEventListener('submit', handleCriarNovaConta);
    sel.seletorCliente.addEventListener('change', renderVistaClienteAtivo);
    sel.btnConfirmarPagamento.addEventListener('click', handleFinalizarPagamento);

    sel.vistaClienteAtivo.addEventListener('click', (event) => {
        const target = event.target.closest('button');
        if (!target) return;

        const idConta = parseInt(target.dataset.id);
        const state = store.getState();
        const conta = state.contasAtivas.find(c => c.id === idConta);
        
        if (target.classList.contains('btn-adicionar-pedido')) {
            Modals.abrirModalAddPedido(idConta);
        }
        if (target.classList.contains('btn-finalizar-pagamento')) {
            Modals.abrirModalPagamento(conta);
        }
        // ... outros handlers para editar nome, remover item, etc.
    });

    sel.pagamentoMetodosContainer.addEventListener('click', (event) => {
        const target = event.target.closest('.pagamento-metodo-btn');
        if (!target) return;
        sel.pagamentoMetodosContainer.querySelectorAll('.pagamento-metodo-btn').forEach(btn => {
            btn.classList.remove('border-blue-500', 'bg-blue-100', 'font-bold');
            btn.classList.add('border-gray-300');
        });
        target.classList.add('border-blue-500', 'bg-blue-100', 'font-bold');
        sel.btnConfirmarPagamento.disabled = false;
        sel.btnConfirmarPagamento.classList.remove('bg-gray-400', 'cursor-not-allowed');
        sel.btnConfirmarPagamento.classList.add('bg-blue-500', 'hover:bg-blue-600');
    });

    render();
}

export default { init };