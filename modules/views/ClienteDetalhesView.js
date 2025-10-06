// /modules/views/ClienteDetalhesView.js - (v11.1 - CORRIGIDO o bug de congelamento no unmount)
'use strict';

import store from '../services/Store.js';
import { abrirModalAddDivida, abrirModalLiquidarDivida } from '../components/Modals.js';
import Router from '../Router.js';

let unsubscribe = null;
let viewNode = null;
let clienteAtivoId = null;

// CORREÇÃO: O event handler foi extraído para uma função nomeada
function handleViewClick(event) {
    const target = event.target;
    const state = store.getState();
    const cliente = state.clientes.find(c => c.id === clienteAtivoId);

    if (target.closest('#btn-voltar-lista-clientes')) {
        Router.navigateTo('#clientes');
    }
    if (target.closest('#btn-abrir-modal-add-divida')) {
        abrirModalAddDivida(cliente);
    }
    if (target.closest('#btn-abrir-modal-liquidar-divida')) {
        abrirModalLiquidarDivida(cliente);
    }
}

/**
 * Calcula as estatísticas de um cliente a partir do estado da aplicação.
 * NOTA: Esta lógica será movida para um serviço de análise (utils.js) no futuro.
 * @param {string} clienteId - O ID do cliente.
 * @param {object} state - O estado completo da aplicação.
 * @returns {object} Um objeto com as estatísticas calculadas.
 */
function calcularEstatisticasCliente(clienteId, state) {
    const { historicoFechos } = state;
    const estatisticas = {
        gastoTotal: 0,
        visitas: 0,
        ticketMedio: 0,
        produtosPreferidos: {}
    };

    const contasDoCliente = historicoFechos
        .flatMap(fecho => fecho.contasFechadas || [])
        .filter(conta => conta.clienteId === clienteId);

    estatisticas.visitas = contasDoCliente.length;
    
    contasDoCliente.forEach(conta => {
        estatisticas.gastoTotal += conta.valorFinal || 0;
        conta.pedidos.forEach(pedido => {
            estatisticas.produtosPreferidos[pedido.nome] = (estatisticas.produtosPreferidos[pedido.nome] || 0) + pedido.qtd;
        });
    });

    if (estatisticas.visitas > 0) {
        estatisticas.ticketMedio = estatisticas.gastoTotal / estatisticas.visitas;
    }

    estatisticas.produtosPreferidos = Object.entries(estatisticas.produtosPreferidos)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([nome, qtd]) => ({ nome, qtd }));

    return estatisticas;
}


/**
 * Atualiza o DOM com os detalhes do cliente ativo.
 */
function updateDOM() {
    if (!viewNode || !clienteAtivoId) return;

    const state = store.getState();
    const cliente = state.clientes.find(c => c.id === clienteAtivoId);

    if (!cliente) {
        Router.navigateTo('#clientes');
        return;
    }

    const nomeClienteEl = viewNode.querySelector('#detalhes-cliente-nome');
    if (nomeClienteEl) nomeClienteEl.textContent = cliente.nome;

    const estatisticas = calcularEstatisticasCliente(clienteAtivoId, state);
    const gastoTotalEl = viewNode.querySelector('#widget-gasto-total');
    const ticketMedioEl = viewNode.querySelector('#widget-ticket-medio');
    const visitasEl = viewNode.querySelector('#widget-visitas');

    if (gastoTotalEl) gastoTotalEl.textContent = estatisticas.gastoTotal.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    if (ticketMedioEl) ticketMedioEl.textContent = estatisticas.ticketMedio.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    if (visitasEl) visitasEl.textContent = estatisticas.visitas;

    const produtosPreferidosListaEl = viewNode.querySelector('#produtos-preferidos-lista');
    if (produtosPreferidosListaEl) {
        if (estatisticas.produtosPreferidos.length === 0) {
            produtosPreferidosListaEl.innerHTML = '<p class="text-center text-texto-secundario text-sm">Nenhum histórico de consumo.</p>';
        } else {
            produtosPreferidosListaEl.innerHTML = estatisticas.produtosPreferidos.map((prod, index) => `
                <div class="flex items-center gap-3">
                    <span class="font-bold text-blue-500">${index + 1}.</span>
                    <span class="flex-grow">${prod.nome}</span>
                    <span class="text-sm text-texto-secundario">(${prod.qtd} un.)</span>
                </div>
            `).join('');
        }
    }
    
    const historicoEl = viewNode.querySelector('#detalhes-cliente-historico');
    if (historicoEl) {
        const dividaTotal = cliente.dividas.reduce((total, divida) => total + divida.valor, 0);
        viewNode.querySelector('#divida-total-valor').textContent = dividaTotal.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });

        if (cliente.dividas.length === 0) {
            historicoEl.innerHTML = '<p class="text-center text-texto-secundario text-sm py-4">Nenhuma transação de dívida registada.</p>';
        } else {
            historicoEl.innerHTML = [...cliente.dividas]
                .sort((a, b) => new Date(b.data) - new Date(a.data))
                .map(transacao => {
                    const isCredito = transacao.tipo === 'credito';
                    const corValor = isCredito ? 'text-green-500' : 'text-red-500';
                    const sinal = isCredito ? '' : '+';

                    return `
                        <div class="bg-fundo-principal p-3 rounded-lg flex justify-between items-center">
                            <div>
                                <p class="font-semibold">${transacao.descricao}</p>
                                <p class="text-xs text-texto-secundario">${new Date(transacao.data).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                            </div>
                            <span class="font-bold text-lg ${corValor}">
                                ${sinal} ${transacao.valor.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                            </span>
                        </div>
                    `;
                }).join('');
        }
    }
}

/**
 * Retorna o HTML do ecrã de Detalhes do Cliente.
 */
function render(clienteId) {
    const cliente = store.getState().clientes.find(c => c.id === clienteId);

    if (!cliente) {
        return `<p class="p-4 text-center text-red-500">Cliente não encontrado.</p>`;
    }

    return `
        <section id="view-cliente-detalhes" class="p-4 space-y-6">
            <header class="flex items-center">
                <button id="btn-voltar-lista-clientes" class="p-2 -ml-2 text-2xl text-texto-secundario hover:text-primaria">
                    <i class="lni lni-arrow-left"></i>
                </button>
                <h2 id="detalhes-cliente-nome" class="text-2xl font-bold text-center flex-grow"></h2>
                <div class="w-8"></div>
            </header>

            <div class="bg-fundo-secundario p-4 rounded-lg shadow-md">
                <h3 class="text-sm font-semibold text-texto-secundario mb-3">Resumo do Cliente</h3>
                <div id="resumo-cliente-widgets" class="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <span id="widget-gasto-total" class="text-2xl font-bold block">Kz 0,00</span>
                        <span class="text-xs text-texto-secundario">Gasto Total</span>
                    </div>
                    <div>
                        <span id="widget-ticket-medio" class="text-2xl font-bold block">Kz 0,00</span>
                        <span class="text-xs text-texto-secundario">Ticket Médio</span>
                    </div>
                    <div>
                        <span id="widget-visitas" class="text-2xl font-bold block">0</span>
                        <span class="text-xs text-texto-secundario">Visitas</span>
                    </div>
                </div>
            </div>

            <div class="bg-fundo-secundario p-4 rounded-lg shadow-md">
                <h3 class="text-sm font-semibold text-texto-secundario mb-3">Top 3 Produtos Preferidos</h3>
                <div id="produtos-preferidos-lista" class="space-y-2"></div>
            </div>

            <div class="bg-fundo-secundario p-4 rounded-lg shadow-md">
                 <div class="flex justify-between items-center mb-3">
                    <h3 class="text-sm font-semibold text-texto-secundario">Gestão de Dívidas</h3>
                    <span id="divida-total-valor" class="text-xl font-bold text-red-500">Kz 0,00</span>
                </div>
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <button id="btn-abrir-modal-add-divida" class="bg-red-500 text-white font-bold py-3 px-4 rounded-lg shadow hover:bg-red-600">Adicionar Dívida</button>
                    <button id="btn-abrir-modal-liquidar-divida" class="bg-green-500 text-white font-bold py-3 px-4 rounded-lg shadow hover:bg-green-600">Liquidar Dívida</button>
                </div>
                <h4 class="text-xs font-semibold text-texto-secundario mb-2 border-t border-borda pt-3">HISTÓRICO DE TRANSAÇÕES</h4>
                <div id="detalhes-cliente-historico" class="space-y-2 max-h-48 overflow-y-auto"></div>
            </div>
        </section>
    `;
}

/**
 * Adiciona os event listeners ao ecrã após ser renderizado.
 */
function mount(clienteId) {
    viewNode = document.getElementById('app-root');
    clienteAtivoId = clienteId;

    updateDOM();
    unsubscribe = store.subscribe(updateDOM);

    // CORREÇÃO: Adiciona o listener nomeado ao viewNode
    viewNode.addEventListener('click', handleViewClick);
}

/**
 * Remove os listeners e anula a inscrição no store.
 */
function unmount() {
    if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
    }
    
    // CORREÇÃO: Remove o listener específico e não destrói o viewNode
    if (viewNode) {
        viewNode.removeEventListener('click', handleViewClick);
    }

    viewNode = null;
    clienteAtivoId = null;
}

export default {
    render,
    mount,
    unmount
};