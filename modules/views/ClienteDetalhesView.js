// /modules/views/ClienteDetalhesView.js - (v7.5 - Lógica de Crédito e Correção de Render)
'use strict';

import store from '../services/Store.js';
import * as Modals from '../components/Modals.js';
import * as Toast from '../components/Toast.js';
import ClientesView from './ClientesView.js';

const sel = {};
let clienteAtivoId = null; // Guarda o ID do cliente que estamos a ver

function querySelectors() {
    sel.view = document.getElementById('tab-cliente-detalhes');
    sel.btnVoltar = document.getElementById('btn-voltar-lista-clientes');
    sel.nomeClienteEl = document.getElementById('detalhes-cliente-nome');
    sel.dividaLabelEl = sel.view.querySelector('.font-semibold.text-gray-600'); // Novo seletor para o label
    sel.dividaTotalEl = document.getElementById('detalhes-cliente-divida-total');
    sel.historicoEl = document.getElementById('detalhes-cliente-historico');
    
    sel.btnAbrirModalAddDivida = document.getElementById('btn-abrir-modal-add-divida');
    sel.btnAbrirModalLiquidarDivida = document.getElementById('btn-abrir-modal-liquidar-divida');

    sel.formAddDivida = document.getElementById('form-add-divida');
    sel.inputDividaValor = document.getElementById('input-divida-valor');
    sel.inputDividaDescricao = document.getElementById('input-divida-descricao');

    sel.formLiquidarDivida = document.getElementById('form-liquidar-divida');
    sel.inputLiquidarValor = document.getElementById('input-liquidar-valor');
}

/**
 * Função principal de renderização para a view de detalhes.
 */
function render() {
    if (!clienteAtivoId) return;

    const state = store.getState();
    const cliente = state.clientes.find(c => c.id === clienteAtivoId);

    if (!cliente) {
        Toast.mostrarNotificacao("Cliente não encontrado.", "erro");
        hide();
        ClientesView.show();
        return;
    }

    sel.nomeClienteEl.textContent = cliente.nome;

    const dividaTotal = cliente.dividas.reduce((total, divida) => total + divida.valor, 0);

    // Lógica de UI para Dívida vs. Crédito
    if (dividaTotal > 0) {
        sel.dividaLabelEl.textContent = 'Dívida Total';
        sel.dividaTotalEl.textContent = dividaTotal.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
        sel.dividaTotalEl.className = 'block text-4xl font-bold text-red-600 my-1';
    } else {
        sel.dividaLabelEl.textContent = 'Crédito Disponível';
        sel.dividaTotalEl.textContent = Math.abs(dividaTotal).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
        sel.dividaTotalEl.className = 'block text-4xl font-bold text-green-600 my-1';
    }


    // Renderiza o histórico
    sel.historicoEl.innerHTML = '';
    if (cliente.dividas.length === 0) {
        sel.historicoEl.innerHTML = '<p class="text-center text-gray-500">Nenhuma transação registada.</p>';
        return;
    }

    [...cliente.dividas].sort((a, b) => new Date(b.data) - new Date(a.data)).forEach(transacao => {
        const isCredito = transacao.tipo === 'credito';
        const corValor = isCredito ? 'text-green-500' : 'text-red-500';
        const sinal = isCredito ? '' : '+';

        const itemEl = document.createElement('div');
        itemEl.className = 'bg-white p-3 rounded-lg shadow-sm flex justify-between items-center';
        itemEl.innerHTML = `
            <div>
                <p class="font-semibold">${transacao.descricao}</p>
                <p class="text-xs text-gray-500">${new Date(transacao.data).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            </div>
            <span class="font-bold text-lg ${corValor}">
                ${sinal} ${transacao.valor.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
            </span>
        `;
        sel.historicoEl.appendChild(itemEl);
    });
}

function show(clienteId) {
    clienteAtivoId = clienteId;
    sel.view.classList.remove('hidden');
    render();
}

function hide() {
    clienteAtivoId = null;
    sel.view.classList.add('hidden');
}

// --- Handlers ---

function handleAddDivida(event) {
    event.preventDefault();
    const valor = parseFloat(sel.inputDividaValor.value);
    const descricao = sel.inputDividaDescricao.value.trim();

    if (!valor || valor <= 0 || !descricao) {
        Toast.mostrarNotificacao("Por favor, preencha todos os campos com valores válidos.", "erro");
        return;
    }

    store.dispatch({
        type: 'ADD_DEBT',
        payload: { clienteId: clienteAtivoId, valor, descricao }
    });

    Toast.mostrarNotificacao("Dívida adicionada com sucesso.");
    Modals.fecharModalAddDivida();
}

function handleLiquidarDivida(event) {
    event.preventDefault();
    const valor = parseFloat(sel.inputLiquidarValor.value);

    if (!valor || valor <= 0) {
        Toast.mostrarNotificacao("Por favor, insira um valor de pagamento válido.", "erro");
        return;
    }

    store.dispatch({
        type: 'SETTLE_DEBT',
        payload: { clienteId: clienteAtivoId, valor }
    });

    Toast.mostrarNotificacao("Pagamento registado com sucesso.");
    Modals.fecharModalLiquidarDivida();
}

function init() {
    querySelectors();
    store.subscribe(render);
    
    sel.btnVoltar.addEventListener('click', () => {
        hide();
        ClientesView.show();
    });

    sel.btnAbrirModalAddDivida.addEventListener('click', () => {
        const cliente = store.getState().clientes.find(c => c.id === clienteAtivoId);
        Modals.abrirModalAddDivida(cliente);
    });

    sel.btnAbrirModalLiquidarDivida.addEventListener('click', () => {
        const cliente = store.getState().clientes.find(c => c.id === clienteAtivoId);
        Modals.abrirModalLiquidarDivida(cliente);
    });

    sel.formAddDivida.addEventListener('submit', handleAddDivida);
    sel.formLiquidarDivida.addEventListener('submit', handleLiquidarDivida);
}

export default { init, show, hide };