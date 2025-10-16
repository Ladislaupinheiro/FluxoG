// /modules/features/atendimento/AtendimentoView.js (VERSÃO FINAL INTERATIVA)
'use strict';

import store from '../../shared/services/Store.js';
import Router from '../../app/Router.js';
import { abrirModalAddCliente } from '../../shared/components/Modals.js';

let unsubscribe = null;
let viewNode = null;
let activeFilter = 'todos';
let searchTerm = '';

// ... (Funções de filtro: temDivida, isNovo, isAtivo - sem alterações)
const temDivida = cliente => cliente.dividas.reduce((total, d) => d.tipo === 'debito' ? total + d.valor : total - Math.abs(d.valor), 0) > 0;
const isNovo = cliente => (new Date() - new Date(cliente.dataRegisto)) / (1000 * 60 * 60 * 24) <= 7;
const isAtivo = (cliente, contasAtivas) => contasAtivas.some(c => c.clienteId === cliente.id && c.status === 'ativa');


function renderClientList() {
    if (!viewNode) return;
    const state = store.getState();
    const { clientes, contasAtivas } = state;
    let clientesFiltrados = clientes;

    switch (activeFilter) {
        case 'ativos':
            clientesFiltrados = clientes.filter(c => isAtivo(c, contasAtivas));
            break;
        case 'kilapeiros':
            clientesFiltrados = clientes.filter(temDivida);
            break;
        case 'novos':
            clientesFiltrados = clientes.filter(isNovo);
            break;
    }
    if (searchTerm) {
        clientesFiltrados = clientesFiltrados.filter(c => c.nome.toLowerCase().includes(searchTerm));
    }

    const listaContainer = viewNode.querySelector('#lista-clientes-atendimento');
    if (!listaContainer) return;
    if (clientesFiltrados.length === 0) {
        listaContainer.innerHTML = `<p class="text-center text-texto-secundario p-8">Nenhum cliente encontrado.</p>`;
        return;
    }

    listaContainer.innerHTML = clientesFiltrados.map(cliente => `
        <div class="bg-fundo-secundario p-4 rounded-lg shadow-md flex justify-between items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" data-cliente-id="${cliente.id}" data-cliente-nome="${cliente.nome}">
            <p class="font-bold text-lg">${cliente.nome}</p>
            <i class="lni lni-chevron-right text-texto-secundario"></i>
        </div>
    `).join('');
}

function updateFilterButtons() {
    if(!viewNode) return;
    viewNode.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.dataset.filter === activeFilter) {
            btn.classList.add('bg-blue-600', 'text-white');
            btn.classList.remove('bg-fundo-principal', 'text-texto-secundario');
        } else {
            btn.classList.remove('bg-blue-600', 'text-white');
            btn.classList.add('bg-fundo-principal', 'text-texto-secundario');
        }
    });
}

function render() {
    return `
        <header class="p-4 space-y-4">
            <h2 class="text-2xl font-bold">Atendimento</h2>
            <input type="search" id="input-busca-cliente" class="w-full p-3 border border-borda rounded-lg bg-fundo-principal" placeholder="Encontrar cliente...">
        </header>
        <nav class="px-4 pb-4 flex gap-2">
            <button class="filter-btn px-4 py-2 rounded-lg font-semibold text-sm" data-filter="todos">Todos</button>
            <button class="filter-btn px-4 py-2 rounded-lg font-semibold text-sm" data-filter="ativos">Ativos</button>
            <button class="filter-btn px-4 py-2 rounded-lg font-semibold text-sm" data-filter="kilapeiros">Kilapeiros</button>
            <button class="filter-btn px-4 py-2 rounded-lg font-semibold text-sm" data-filter="novos">Novos</button>
        </nav>
        <main class="p-4 space-y-3 pb-24">
            <div id="lista-clientes-atendimento"></div>
        </main>
        <button id="btn-fab-add-cliente" class="fab"><i class="lni lni-plus"></i></button>
    `;
}

function mount() {
    viewNode = document.getElementById('app-root');
    activeFilter = 'todos';
    searchTerm = '';

    const inputBusca = viewNode.querySelector('#input-busca-cliente');
    const filtersContainer = viewNode.querySelector('nav');
    const fab = viewNode.querySelector('#btn-fab-add-cliente');
    const listaContainer = viewNode.querySelector('#lista-clientes-atendimento');

    inputBusca.addEventListener('input', e => {
        searchTerm = e.target.value.toLowerCase();
        renderClientList();
    });

    filtersContainer.addEventListener('click', e => {
        const target = e.target.closest('.filter-btn');
        if (target && target.dataset.filter) {
            activeFilter = target.dataset.filter;
            updateFilterButtons();
            renderClientList();
        }
    });

    fab.addEventListener('click', abrirModalAddCliente);
    
    listaContainer.addEventListener('click', e => {
        const clienteCard = e.target.closest('[data-cliente-id]');
        if (clienteCard) {
            const { clienteId, clienteNome } = clienteCard.dataset;
            const state = store.getState();
            
            // Procura por uma conta já ativa para este cliente
            let contaAtiva = state.contasAtivas.find(c => c.clienteId === clienteId && c.status === 'ativa');
            
            let contaId;

            if (contaAtiva) {
                contaId = contaAtiva.id;
            } else {
                // Se não houver conta ativa, cria uma nova
                const novaConta = {
                    id: crypto.randomUUID(),
                    nome: clienteNome,
                    clienteId: clienteId
                };
                store.dispatch({ type: 'ADD_ACCOUNT', payload: novaConta });
                contaId = novaConta.id;
            }
            
            Router.navigateTo(`#conta-detalhes/${contaId}`);
        }
    });
    
    const updateAll = () => {
        updateFilterButtons();
        renderClientList();
    }

    updateAll();
    unsubscribe = store.subscribe(updateAll);
}

function unmount() {
    if (unsubscribe) unsubscribe();
    unsubscribe = null;
    viewNode = null;
}

export default {
    render,
    mount,
    unmount
};