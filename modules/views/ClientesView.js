// /modules/views/ClientesView.js
'use strict';

import store from '../services/Store.js';
import { abrirModalAddCliente } from '../components/Modals.js';
import { getRankedClients } from '../services/AnalyticsService.js';
import Router from '../Router.js';
import { formatarMoeda } from '../services/utils.js'; // NOVO

let unsubscribe = null;
let viewNode = null;

/**
 * Função principal de renderização para a View de Clientes.
 */
function render() {
    if (!viewNode) return;
    
    const state = store.getState();
    const inputBuscaClientes = viewNode.querySelector('#input-busca-clientes');
    const termoBusca = inputBuscaClientes ? inputBuscaClientes.value.toLowerCase().trim() : '';

    const clientesRankeados = getRankedClients(state); // Agora retorna dados em tempo real

    const clientesHeader = viewNode.querySelector('#clientes-header');
    const clientesEmptyState = viewNode.querySelector('#clientes-empty-state');
    const listaClientes = viewNode.querySelector('#lista-clientes');

    if (clientesRankeados.length > 5) {
        clientesHeader.classList.remove('hidden');
    } else {
        clientesHeader.classList.add('hidden');
    }

    if (clientesRankeados.length === 0) {
        clientesEmptyState.classList.remove('hidden');
        listaClientes.classList.add('hidden');
        return;
    }

    clientesEmptyState.classList.add('hidden');
    listaClientes.classList.remove('hidden');
    listaClientes.innerHTML = '';

    const clientesFiltrados = clientesRankeados.filter(cliente => 
        cliente.nome.toLowerCase().includes(termoBusca)
    );

    if (clientesFiltrados.length === 0 && termoBusca) {
        listaClientes.innerHTML = `<p class="text-center text-texto-secundario p-4">Nenhum cliente encontrado para "${termoBusca}".</p>`;
        return;
    }

    clientesFiltrados.forEach((cliente, index) => {
        const dividaTotal = cliente.dividas.reduce((total, divida) => {
            if (divida.tipo === 'debito') return total + divida.valor;
            if (divida.tipo === 'credito') return total - Math.abs(divida.valor);
            return total;
        }, 0);
        const corDivida = dividaTotal > 0 ? 'text-red-500' : 'text-green-500';
        
        const rankingBadge = index < 3 && cliente.gastoTotal > 0
            ? `<span class="text-xl" title="Top ${index + 1} Cliente">👑</span>` 
            : '<span class="text-xl w-6"></span>'; // Placeholder para alinhar

        const card = document.createElement('div');
        card.className = 'bg-fundo-secundario p-4 rounded-lg shadow-md flex justify-between items-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700';
        card.dataset.clienteId = cliente.id;
        card.innerHTML = `
            <div class="flex items-center gap-3">
                ${rankingBadge}
                <div>
                    <p class="font-bold text-lg">${cliente.nome}</p>
                    <p class="text-sm text-texto-secundario">Dívida: <span class="${corDivida}">${formatarMoeda(dividaTotal)}</span></p>
                </div>
            </div>
            <div class="text-right">
                <span class="font-semibold text-lg text-blue-500">${formatarMoeda(cliente.gastoTotal)}</span>
                <p class="text-xs text-texto-secundario">Gasto Total</p>
            </div>
        `;
        listaClientes.appendChild(card);
    });
}


function getHTML() {
    return `
        <header id="clientes-header" class="p-4 hidden">
            <input type="search" id="input-busca-clientes" class="w-full p-2 border border-borda rounded-md bg-fundo-principal" placeholder="Buscar cliente...">
        </header>

        <div id="clientes-empty-state" class="text-center p-8 hidden">
            <i class="lni lni-users text-6xl text-gray-300 dark:text-gray-600"></i>
            <h3 class="mt-4 text-xl font-semibold">Nenhum cliente registado</h3>
            <p class="text-texto-secundario">Toque no botão '+' para começar.</p>
        </div>

        <div id="lista-clientes" class="p-4 space-y-3"></div>

        <button id="btn-fab-add-cliente" class="fab z-50">
            <i class="lni lni-plus"></i>
        </button>
    `;
}

function mount() {
    viewNode = document.getElementById('app-root');
    
    unsubscribe = store.subscribe(render);

    const inputBuscaClientes = viewNode.querySelector('#input-busca-clientes');
    const listaClientes = viewNode.querySelector('#lista-clientes');
    const btnFabAddCliente = viewNode.querySelector('#btn-fab-add-cliente');

    if(inputBuscaClientes) inputBuscaClientes.addEventListener('input', render);
    if(btnFabAddCliente) btnFabAddCliente.addEventListener('click', abrirModalAddCliente);

    if(listaClientes) {
        listaClientes.addEventListener('click', (event) => {
            const card = event.target.closest('[data-cliente-id]');
            if (card) {
                const clienteId = card.dataset.clienteId;
                Router.navigateTo(`#cliente-detalhes/${clienteId}`);
            }
        });
    }

    render();
}

function unmount() {
    if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
    }
    viewNode = null;
}

export default {
    render: getHTML,
    mount,
    unmount
};