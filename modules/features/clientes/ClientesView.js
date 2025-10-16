// /modules/features/clientes/ClientesView.js (REATORADO)
'use strict';

import store from '../../shared/services/Store.js';
import Router from '../../app/Router.js';
import { abrirModalAddCliente } from '../../shared/components/Modals.js';
import { getRankedClients } from './services/ClientAnalyticsService.js';

let unsubscribe = null;
let viewNode = null;
let activeFilter = 'todos';
let searchTerm = '';

const temDivida = cliente => cliente.dividas.reduce((total, d) => d.tipo === 'debito' ? total + d.valor : total - Math.abs(d.valor), 0) > 0;
const isNovo = cliente => (new Date() - new Date(cliente.dataRegisto)) / (1000 * 60 * 60 * 24) <= 7;

function renderClientList() {
    if (!viewNode) return;

    const state = store.getState();
    const clientesRankeados = getRankedClients(state); // Usa o serviço para obter os clientes com gasto total calculado
    
    let clientesFiltrados = clientesRankeados;

    // Aplica o filtro por tag
    switch (activeFilter) {
        case 'kilapeiros':
            clientesFiltrados = clientesRankeados.filter(temDivida);
            break;
        case 'novos':
            clientesFiltrados = clientesRankeados.filter(isNovo);
            break;
        case 'pagantes':
            clientesFiltrados = clientesRankeados.filter(c => !temDivida(c));
            break;
    }

    // Aplica o filtro de busca por texto
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
                    <div class="flex gap-2 mt-1">
                        ${(cliente.tags || []).map(tag => `<span class="text-xs font-semibold bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full">${tag}</span>`).join('')}
                    </div>
                </div>
            </div>
            <div class="text-right">
                <span class="font-bold text-lg text-green-500">${(cliente.gastoTotal || 0).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                <span class="text-xs text-texto-secundario block">Gasto Total</span>
            </div>
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
            .filter-btn { padding: 0.5rem 1rem; border-radius: 9999px; font-weight: 600; background-color: var(--cor-fundo-principal); color: var(--cor-texto-secundario); border: 2px solid transparent; }
            .filter-btn.active { background-color: #16a34a; color: white; } /* Cor verde do wireframe */
        </style>
        <header class="p-4 space-y-4">
            <h2 class="text-2xl font-bold">Clientes</h2>
            <input type="search" id="input-busca-cliente-relatorio" class="w-full p-3 border border-borda rounded-lg bg-fundo-principal" placeholder="Encontrar cliente...">
        </header>
        <nav class="px-4 pb-4 flex gap-2 items-center">
            <button class="text-2xl">+</button>
            <button class="filter-btn" data-filter="pagantes">Pagantes</button>
            <button class="filter-btn active" data-filter="kilapeiros">Kilapeiros</button>
            <button class="filter-btn" data-filter="novos">Novos</button>
        </nav>
        <main class="p-4 space-y-3 pb-24">
            <div id="lista-clientes-relatorio"></div>
        </main>
        <button id="btn-fab-add-cliente-relatorio" class="fab bg-green-500"><i class="lni lni-plus"></i></button>
    `;
}

function mount() {
    viewNode = document.getElementById('app-root');
    activeFilter = 'kilapeiros'; // Filtro padrão conforme wireframe
    searchTerm = '';

    const handleViewClick = (e) => {
        const filterBtn = e.target.closest('.filter-btn');
        const fab = e.target.closest('#btn-fab-add-cliente-relatorio');
        const clienteCard = e.target.closest('[data-cliente-id]');

        if (filterBtn) {
            activeFilter = filterBtn.dataset.filter;
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

    viewNode.addEventListener('click', handleViewClick);
    viewNode.querySelector('#input-busca-cliente-relatorio').addEventListener('input', handleSearch);
    
    const updateAll = () => {
        updateFilterButtons();
        renderClientList();
    }

    updateAll();
    unsubscribe = store.subscribe(updateAll);

    // Lógica de limpeza
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