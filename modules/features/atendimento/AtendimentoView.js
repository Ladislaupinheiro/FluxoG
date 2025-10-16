// /modules/features/atendimento/AtendimentoView.js (VERSÃO FINAL OTIMIZADA)
'use strict';

import store from '../../shared/services/Store.js';
import Router from '../../app/Router.js';
import { abrirModalAddCliente } from '../../shared/components/Modals.js';

let unsubscribe = null;
let viewNode = null;
let activeFilter = 'todos';
let searchTerm = '';

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
        <div class="bg-fundo-secundario p-3 rounded-lg shadow-md flex justify-between items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" data-cliente-id="${cliente.id}" data-cliente-nome="${cliente.nome}">
            <div class="flex items-center gap-3">
                <img src="${cliente.fotoDataUrl || './icons/logo-small-192.png'}" alt="Foto de ${cliente.nome}" class="w-12 h-12 rounded-full object-cover bg-fundo-principal">
                <p class="font-bold text-lg">${cliente.nome}</p>
            </div>
            <i class="lni lni-chevron-right text-texto-secundario text-xl"></i>
        </div>
    `).join('');
}

function updateFilterButtons() {
    if(!viewNode) return;
    viewNode.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === activeFilter);
    });
}

function render() {
    return `
        <style>
            .filter-btn { padding: 0.5rem 1rem; border-radius: 9999px; font-weight: 600; background-color: var(--cor-fundo-principal); color: var(--cor-texto-secundario); border: 2px solid var(--cor-borda); }
            .filter-btn.active { background-color: var(--cor-primaria); color: white; border-color: var(--cor-primaria); }
        </style>
        <header class="p-4 space-y-4">
            <h2 class="text-2xl font-bold">Atendimento</h2>
            <input type="search" id="input-busca-cliente" class="w-full p-3 border border-borda rounded-lg bg-fundo-principal" placeholder="Encontrar cliente...">
        </header>
        <nav class="px-4 pb-4 flex gap-2 overflow-x-auto">
            <button class="filter-btn" data-filter="todos">Todos</button>
            <button class="filter-btn" data-filter="ativos">Ativos</button>
            <button class="filter-btn" data-filter="kilapeiros">Kilapeiros</button>
            <button class="filter-btn" data-filter="novos">Novos</button>
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

    const handleViewClick = (e) => {
        const filterBtn = e.target.closest('.filter-btn');
        const fab = e.target.closest('#btn-fab-add-cliente');
        const clienteCard = e.target.closest('[data-cliente-id]');

        if (filterBtn) {
            activeFilter = filterBtn.dataset.filter;
            updateFilterButtons();
            renderClientList();
            return;
        }

        if (fab) {
            // Chama o modal e passa o callback para o fluxo rápido
            abrirModalAddCliente((novoCliente) => {
                const novaConta = {
                    id: crypto.randomUUID(),
                    nome: novoCliente.nome,
                    clienteId: novoCliente.id
                };
                store.dispatch({ type: 'ADD_ACCOUNT', payload: novaConta });
                Router.navigateTo(`#conta-detalhes/${novaConta.id}`);
            });
            return;
        }

        if (clienteCard) {
            const { clienteId, clienteNome } = clienteCard.dataset;
            const state = store.getState();
            let contaAtiva = state.contasAtivas.find(c => c.clienteId === clienteId && c.status === 'ativa');
            let contaId;
            if (contaAtiva) {
                contaId = contaAtiva.id;
            } else {
                const novaConta = { id: crypto.randomUUID(), nome: clienteNome, clienteId: clienteId };
                store.dispatch({ type: 'ADD_ACCOUNT', payload: novaConta });
                contaId = novaConta.id;
            }
            Router.navigateTo(`#conta-detalhes/${contaId}`);
            return;
        }
    };

    const handleSearch = e => {
        searchTerm = e.target.value.toLowerCase();
        renderClientList();
    };

    viewNode.addEventListener('click', handleViewClick);
    viewNode.querySelector('#input-busca-cliente').addEventListener('input', handleSearch);
    
    const updateAll = () => {
        updateFilterButtons();
        renderClientList();
    }

    updateAll();
    unsubscribe = store.subscribe(updateAll);

    const originalUnmount = unmount;
    unmount = () => {
        if(viewNode) {
            viewNode.removeEventListener('click', handleViewClick);
            const searchInput = viewNode.querySelector('#input-busca-cliente');
            if(searchInput) searchInput.removeEventListener('input', handleSearch);
        }
        originalUnmount();
    };
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