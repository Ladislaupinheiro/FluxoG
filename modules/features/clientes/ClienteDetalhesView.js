// /modules/features/clientes/ClienteDetalhesView.js
'use strict';

import store from '../../shared/services/Store.js';
import { abrirModalAddDivida, abrirModalLiquidarDivida } from '../../shared/components/Modals.js';
import Router from '../../app/Router.js';
import { calculateClientProfile } from './services/ClientAnalyticsService.js'; // <-- CAMINHO E FUNÇÃO ATUALIZADOS
import { formatarMoeda } from '../../shared/lib/utils.js';
import * as Toast from '../../shared/components/Toast.js';

let unsubscribe = null;
let viewNode = null;
let clienteAtivoId = null;


function handleViewClick(event) {
    const target = event.target;

    if (target.closest('#btn-voltar-lista-clientes')) {
        Router.navigateTo('#clientes');
        return;
    }

    const state = store.getState();
    const cliente = state.clientes.find(c => c.id === clienteAtivoId);

    if (!cliente) {
        Toast.mostrarNotificacao("Erro ao encontrar dados do cliente. A recarregar.", "erro");
        Router.navigateTo('#clientes');
        return;
    }
    
    if (target.closest('#btn-abrir-modal-add-divida')) {
        abrirModalAddDivida(cliente);
    }
    if (target.closest('#btn-abrir-modal-liquidar-divida')) {
        const dividaTotal = cliente.dividas.reduce((total, d) => {
            if (d.tipo === 'debito') return total + d.valor;
            if (d.tipo === 'credito') return total - Math.abs(d.valor);
            return total;
        }, 0);

        if (dividaTotal <= 0) {
            Toast.mostrarNotificacao("Este cliente não tem dívidas para liquidar.", "info");
            return;
        }
        abrirModalLiquidarDivida(cliente);
    }
}


function updateDOM() {
    if (!viewNode || !clienteAtivoId) return;
    const state = store.getState();
    const cliente = state.clientes.find(c => c.id === clienteAtivoId);

    if (!cliente) {
        // A navegação agora é tratada de forma mais segura no handleViewClick
        return;
    }

    viewNode.querySelector('#detalhes-cliente-nome').textContent = cliente.nome;
    // Utiliza a função do novo serviço dedicado
    const estatisticas = calculateClientProfile(clienteAtivoId, state);
    
    viewNode.querySelector('#widget-gasto-total').textContent = formatarMoeda(estatisticas.gastoTotal);
    viewNode.querySelector('#widget-ticket-medio').textContent = formatarMoeda(estatisticas.ticketMedio);
    viewNode.querySelector('#widget-visitas').textContent = estatisticas.visitas;

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
        const dividaTotal = cliente.dividas.reduce((total, divida) => {
            if (divida.tipo === 'debito') return total + divida.valor;
            if (divida.tipo === 'credito') return total - Math.abs(divida.valor);
            return total;
        }, 0);
        viewNode.querySelector('#divida-total-valor').textContent = formatarMoeda(dividaTotal);
        
        const btnLiquidar = viewNode.querySelector('#btn-abrir-modal-liquidar-divida');
        if (dividaTotal <= 0) {
            btnLiquidar.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            btnLiquidar.classList.remove('opacity-50', 'cursor-not-allowed');
        }


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
                                ${sinal} ${formatarMoeda(Math.abs(transacao.valor))} 
                            </span>
                        </div>
                    `;
                }).join('');
        }
    }
}

function render(clienteId) {
    const cliente = store.getState().clientes.find(c => c.id === clienteId);
    if (!cliente) return `<p class="p-4 text-center text-red-500">Cliente não encontrado.</p>`;

    return `
        <section id="view-cliente-detalhes" class="p-4 space-y-6 pb-20">
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
                    <div><span id="widget-gasto-total" class="text-2xl font-bold block"></span><span class="text-xs text-texto-secundario">Gasto Total</span></div>
                    <div><span id="widget-ticket-medio" class="text-2xl font-bold block"></span><span class="text-xs text-texto-secundario">Ticket Médio</span></div>
                    <div><span id="widget-visitas" class="text-2xl font-bold block"></span><span class="text-xs text-texto-secundario">Visitas</span></div>
                </div>
            </div>

            <div class="bg-fundo-secundario p-4 rounded-lg shadow-md">
                <h3 class="text-sm font-semibold text-texto-secundario mb-3">Top 3 Produtos Preferidos</h3>
                <div id="produtos-preferidos-lista" class="space-y-2"></div>
            </div>

            <div class="bg-fundo-secundario p-4 rounded-lg shadow-md">
                 <div class="flex justify-between items-center mb-3">
                    <h3 class="text-sm font-semibold text-texto-secundario">Gestão de Dívidas</h3>
                    <span id="divida-total-valor" class="text-xl font-bold text-red-500"></span>
                </div>
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <button id="btn-abrir-modal-add-divida" class="bg-red-500 text-white font-bold py-3 px-4 rounded-lg shadow hover:bg-red-600">Adicionar Dívida</button>
                    <button id="btn-abrir-modal-liquidar-divida" class="bg-green-500 text-white font-bold py-3 px-4 rounded-lg shadow hover:bg-green-600 transition-opacity">Liquidar Dívida</button>
                </div>
                <h4 class="text-xs font-semibold text-texto-secundario mb-2 border-t border-borda pt-3">HISTÓRICO DE TRANSAÇÕES</h4>
                <div id="detalhes-cliente-historico" class="space-y-2 max-h-48 overflow-y-auto"></div>
            </div>
        </section>
    `;
}

function mount(clienteId) {
    viewNode = document.getElementById('app-root');
    clienteAtivoId = clienteId;
    updateDOM();
    unsubscribe = store.subscribe(updateDOM);
    viewNode.addEventListener('click', handleViewClick);
}

function unmount() {
    if (unsubscribe) unsubscribe();
    if (viewNode) viewNode.removeEventListener('click', handleViewClick);
    viewNode = null;
    clienteAtivoId = null;
    unsubscribe = null;
}

export default {
    render,
    mount,
    unmount
};