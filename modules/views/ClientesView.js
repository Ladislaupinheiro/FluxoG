// /modules/views/ClientesView.js - A Nova View de Clientes (v7.0 - Final)
'use strict';

import store from '../services/Store.js';
import * as Modals from '../components/Modals.js';
import * as Toast from '../components/Toast.js';

const sel = {};

function querySelectors() {
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

    const clientesFiltrados = clientes.filter(cliente => 
        cliente.nome.toLowerCase().includes(termoBusca)
    );

    // LÓGICA DO ESTADO VAZIO
    if (clientes.length === 0) {
        sel.clientesEmptyState.classList.remove('hidden');
        sel.listaClientes.innerHTML = '';
        sel.inputBuscaClientes.classList.add('hidden');
        return;
    }

    // LÓGICA DA VISTA PREENCHIDA
    sel.clientesEmptyState.classList.add('hidden');
    sel.inputBuscaClientes.classList.remove('hidden');
    sel.listaClientes.innerHTML = '';

    if (clientesFiltrados.length === 0) {
        sel.listaClientes.innerHTML = `<p class="text-center text-gray-500">Nenhum cliente encontrado para "${termoBusca}".</p>`;
        return;
    }

    // Renderiza um cartão simples para cada cliente
    clientesFiltrados.forEach(cliente => {
        const card = document.createElement('div');
        card.className = 'bg-white p-4 rounded-lg shadow-md flex justify-between items-center cursor-pointer hover:bg-gray-50';
        card.dataset.clienteId = cliente.id;
        card.innerHTML = `
            <div>
                <p class="font-bold text-lg">${cliente.nome}</p>
                <p class="text-sm text-gray-500">${cliente.contacto || 'Sem contacto'}</p>
            </div>
            <button class="text-gray-400 hover:text-blue-500">
                <i class="lni lni-chevron-right text-2xl"></i>
            </button>
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
        dividas: []
    };

    store.dispatch({ type: 'ADD_CLIENT', payload: novoCliente });

    Modals.fecharModalAddCliente();
    Toast.mostrarNotificacao(`Cliente "${nome}" adicionado com sucesso.`);
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

    // Adicionar listener para clicar num cliente e ver detalhes (a ser implementado)
    sel.listaClientes.addEventListener('click', (event) => {
        const card = event.target.closest('[data-cliente-id]');
        if (card) {
            const clienteId = card.dataset.clienteId;
            console.log(`Abrir detalhes para o cliente ID: ${clienteId}`);
            // Futuramente, esta ação irá navegar para uma view de detalhes do cliente.
        }
    });

    render();
}

export default { init };