// /modules/views/ClientesView.js - A View de Clientes (v7.4 - Navegação para Detalhes)
'use strict';

import store from '../services/Store.js';
import * as Modals from '../components/Modals.js';
import * as Toast from '../components/Toast.js';
import ClienteDetalhesView from './ClienteDetalhesView.js';

const sel = {};

function querySelectors() {
    sel.clientesView = document.getElementById('tab-clientes');
    sel.clientesHeader = document.getElementById('clientes-header');
    sel.clientesEmptyState = document.getElementById('clientes-empty-state');
    sel.listaClientes = document.getElementById('lista-clientes');
    sel.inputBuscaClientes = document.getElementById('input-busca-clientes');
    sel.btnFabAddCliente = document.getElementById('btn-fab-add-cliente');
    sel.formAddCliente = document.getElementById('form-add-cliente');
    sel.inputClienteNome = document.getElementById('input-cliente-nome');
    sel.inputClienteContacto = document.getElementById('input-cliente-contacto');
    sel.inputClienteCategoria = document.getElementById('input-cliente-categoria');
}

/**
 * Função principal de renderização para a View de Clientes.
 */
function render() {
    const state = store.getState();
    const { clientes } = state;
    const termoBusca = sel.inputBuscaClientes.value.toLowerCase().trim();

    // LÓGICA DE BUSCA CONDICIONAL: Mostra a busca apenas se houver mais de 7 clientes.
    if (clientes.length > 7) {
        sel.clientesHeader.classList.remove('hidden');
    } else {
        sel.clientesHeader.classList.add('hidden');
    }

    // LÓGICA DO ESTADO VAZIO
    if (clientes.length === 0) {
        sel.clientesEmptyState.classList.remove('hidden');
        sel.listaClientes.classList.add('hidden');
        return;
    }

    // LÓGICA DA VISTA PREENCHIDA
    sel.clientesEmptyState.classList.add('hidden');
    sel.listaClientes.classList.remove('hidden');
    sel.listaClientes.innerHTML = '';

    const clientesFiltrados = clientes.filter(cliente => 
        cliente.nome.toLowerCase().includes(termoBusca)
    );

    if (clientesFiltrados.length === 0) {
        sel.listaClientes.innerHTML = `<p class="text-center text-gray-500">Nenhum cliente encontrado para "${termoBusca}".</p>`;
        return;
    }

    clientesFiltrados.forEach(cliente => {
        const dividaTotal = cliente.dividas.reduce((total, divida) => total + divida.valor, 0);
        const corDivida = dividaTotal > 0 ? 'text-red-500' : 'text-green-500';

        const card = document.createElement('div');
        card.className = 'bg-white p-4 rounded-lg shadow-md flex justify-between items-center cursor-pointer hover:bg-gray-50';
        card.dataset.clienteId = cliente.id;
        card.innerHTML = `
            <div>
                <p class="font-bold text-lg">${cliente.nome}</p>
                <p class="text-sm text-gray-500">${cliente.contacto || 'Sem contacto'}</p>
            </div>
            <div class="text-right">
                <span class="font-semibold text-lg ${corDivida}">${dividaTotal.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                <p class="text-xs text-gray-400">Dívida</p>
            </div>
        `;
        sel.listaClientes.appendChild(card);
    });
}

/**
 * Handler para adicionar um novo cliente, despachando a ação para o store.
 */
function handleAddCliente(event) {
    event.preventDefault();
    const nome = sel.inputClienteNome.value.trim();
    const contacto = sel.inputClienteContacto.value.trim();
    const categoria = sel.inputClienteCategoria.value.trim();
    
    if (!nome) {
        Toast.mostrarNotificacao("O nome do cliente é obrigatório.", "erro");
        return;
    }

    const novoCliente = {
        id: crypto.randomUUID(),
        nome,
        contacto,
        categoria,
        dataRegisto: new Date().toISOString(),
        dividas: [],
        vasilhames: []
    };

    store.dispatch({ type: 'ADD_CLIENT', payload: novoCliente });

    Modals.fecharModalAddCliente();
    Toast.mostrarNotificacao(`Cliente "${nome}" adicionado com sucesso.`);
}

/**
 * Esconde a view da lista de clientes e o FAB correspondente.
 */
function hide() {
    sel.clientesView.classList.add('hidden');
    sel.btnFabAddCliente.classList.add('hidden');
}

/**
 * Mostra a view da lista de clientes e o FAB correspondente.
 */
function show() {
    sel.clientesView.classList.remove('hidden');
    sel.btnFabAddCliente.classList.remove('hidden');
    render(); // Garante que a lista está atualizada ao voltar
}


/**
 * Função de inicialização da View.
 */
function init() {
    querySelectors();
    store.subscribe(render);

    sel.btnFabAddCliente.addEventListener('click', Modals.abrirModalAddCliente);
    sel.formAddCliente.addEventListener('submit', handleAddCliente);
    sel.inputBuscaClientes.addEventListener('input', render);

    sel.listaClientes.addEventListener('click', (event) => {
        const card = event.target.closest('[data-cliente-id]');
        if (card) {
            const clienteId = card.dataset.clienteId;
            hide(); // Esconde a view atual
            ClienteDetalhesView.show(clienteId); // Mostra e renderiza a view de detalhes
        }
    });

    render();
}

export default { init, show, hide };