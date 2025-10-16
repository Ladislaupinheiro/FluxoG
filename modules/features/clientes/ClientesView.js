// /modules/features/clientes/ClientesView.js (CORRIGIDO)
'use strict';

import store from '../../shared/services/Store.js';
import Router from '../../app/Router.js';
import { abrirModalAddCliente } from '../../shared/components/Modals.js';
import { getRankedClients } from './services/ClientAnalyticsService.js';

let unsubscribe = null;
let viewNode = null;
let activeFilter = 'todos';
let searchTerm = '';

// Funções de filtro
const isNovo = cliente => (new Date() - new Date(cliente.dataRegisto)) / (1000 * 60 * 60 * 24) <= 7;
// CORREÇÃO: A função agora compara em minúsculas para ser insensível a 'case'.
const temTag = (cliente, tag) => cliente.tags && cliente.tags.some(t => t.toLowerCase() === tag.toLowerCase());

function renderClientList() {
    if (!viewNode) return;

    const state = store.getState();
    const clientesRankeados = getRankedClients(state);
    
    let clientesFiltrados = clientesRankeados;

    switch (activeFilter) {
        case 'novos':
            clientesFiltrados = clientesRankeados.filter(isNovo);
            break;
        case 'todos':
            break;
        default:
            clientesFiltrados = clientesRankeados.filter(c => temTag(c, activeFilter));
            break;
    }

    if (searchTerm) {
        clientesFiltrados = clientesFiltrados.filter(c => c.nome.toLowerCase().includes(searchTerm));
    }

    const listaContainer = viewNode.querySelector('#lista-clientes-relatorio');
    if (!listaContainer) return;

    if (clientesFiltrados.length === 0) {
        listaContainer.innerHTML = `<p class="text-center text-texto-secundario p-8">Nenhum cliente encontrado.</p>`;
        return;
    }

    listaContainer.innerHTML = clientesFiltrados.map(cliente => `
        <div class="bg-fundo-secundario p-3 rounded-lg shadow-md flex justify-between items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" data-cliente-id="${cliente.id}">
            <div class="flex items-center gap-3">
                <img src="${cliente.fotoDataUrl || './icons/logo-small-192.png'}" alt="Foto de ${cliente.nome}" class="w-12 h-12 rounded-full object-cover bg-fundo-principal">
                <div>
                    <p class="font-bold text-lg">${cliente.nome}</p>
                    <div class="flex gap-2 mt-1 flex-wrap">
                        ${(cliente.tags || []).map(tag => `<span class="text-xs font-semibold bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full capitalize">${tag}</span>`).join('')}
                    </div>
                </div>
            </div>
            <div class="text-right flex-shrink-0 ml-2">
                <span class="font-bold text-lg text-green-500">${(cliente.gastoTotal || 0).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                <span class="text-xs text-texto-secundario block">Gasto Total</span>
            </div>
        </div>
    `).join('');
}

function updateFilterButtons() {
    if(!viewNode) return;
    viewNode.querySelectorAll('.filter-btn').forEach(btn => {
        // CORREÇÃO: Compara sempre em minúsculas
        btn.classList.toggle('active', btn.dataset.filter.toLowerCase() === activeFilter);
    });
}

function render() {
    const state = store.getState();
    // CORREÇÃO: Garante que o data-filter é sempre em minúsculas
    const userTagsHTML = state.tagsDeCliente.map(tag => 
        `<button class="filter-btn" data-filter="${tag.nome.toLowerCase()}">${tag.nome}</button>`
    ).join('');

    return `
        <style>
            .filter-btn { padding: 0.5rem 1rem; border-radius: 9999px; font-weight: 600; background-color: var(--cor-fundo-principal); color: var(--cor-texto-secundario); border: 2px solid var(--cor-borda); white-space: nowrap; text-transform: capitalize; }
            .filter-btn.active { background-color: var(--cor-primaria); color: white; border-color: var(--cor-primaria); }
        </style>
        <header class="p-4 space-y-4">
            <h2 class="text-2xl font-bold">Clientes</h2>
            
            <input type="search" id="input-busca-cliente-relatorio" class="search-bar w-full p-3 border border-borda bg-fundo-principal" placeholder="Encontrar cliente...">
        </header>
        <nav class="filter-bar px-4 pb-4 flex gap-2 overflow-x-auto">
            <button class="filter-btn active" data-filter="todos">Todos</button>
            <button class="filter-btn" data-filter="novos">Novos</button>
            ${userTagsHTML}
        </nav>
        <main class="p-4 space-y-3 pb-24">
            <div id="lista-clientes-relatorio"></div>
        </main>
        <button id="btn-fab-add-cliente-relatorio" class="fab"><i class="lni lni-plus"></i></button>
    `;
}

function mount() {
    viewNode = document.getElementById('app-root');
    activeFilter = 'todos';
    searchTerm = '';

    const handleViewClick = (e) => {
        const filterBtn = e.target.closest('.filter-btn');
        const fab = e.target.closest('#btn-fab-add-cliente-relatorio');
        const clienteCard = e.target.closest('[data-cliente-id]');

        if (filterBtn) {
            // CORREÇÃO: Guarda o filtro sempre em minúsculas
            activeFilter = filterBtn.dataset.filter.toLowerCase();
            updateFilterButtons();
            renderClientList();
            return;
        }
        if (fab) {
            abrirModalAddCliente();
            return;
        }
        if (clienteCard) {
            const clienteId = clienteCard.dataset.clienteId;
            Router.navigateTo(`#cliente-detalhes/${clienteId}`);
            return;
        }
    };

    const handleSearch = e => {
        searchTerm = e.target.value.toLowerCase();
        renderClientList();
    };

    const renderAll = () => {
        const currentSearchTerm = viewNode.querySelector('#input-busca-cliente-relatorio')?.value || '';
        viewNode.innerHTML = render();
        viewNode.querySelector('#input-busca-cliente-relatorio').value = currentSearchTerm;
        updateFilterButtons();
        renderClientList();
    }

    viewNode.addEventListener('click', handleViewClick);
    viewNode.querySelector('#input-busca-cliente-relatorio').addEventListener('input', handleSearch);
    
    renderAll();
    unsubscribe = store.subscribe(renderAll);

    const originalUnmount = unmount;
    unmount = () => {
        if(viewNode) {
            viewNode.removeEventListener('click', handleViewClick);
            const searchInput = viewNode.querySelector('#input-busca-cliente-relatorio');
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