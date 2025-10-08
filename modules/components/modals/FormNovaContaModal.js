// /modules/components/modals/FormNovaContaModal.js
'use strict';

import store from '../../services/Store.js';
import * as Toast from '../Toast.js';
import { debounce } from '../../services/utils.js';
import { abrirModalAddCliente } from '../Modals.js';

// Variável de estado do modal
let clienteSelecionado = null;

function renderizarResultadosBusca(termo) {
    const resultadosContainer = document.getElementById('busca-cliente-resultados');
    const inputBusca = document.getElementById('input-busca-cliente-conta');
    if (!resultadosContainer || !inputBusca) return;

    if (!termo || termo.length < 2) {
        resultadosContainer.innerHTML = '';
        resultadosContainer.classList.add('hidden');
        return;
    }

    const clientes = store.getState().clientes;
    const resultados = clientes.filter(c => c.nome.toLowerCase().includes(termo.toLowerCase()));

    if (resultados.length > 0) {
        resultadosContainer.innerHTML = resultados.map(cliente => `
            <div class="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer" data-cliente-id="${cliente.id}" data-cliente-nome="${cliente.nome}">
                ${cliente.nome}
            </div>
        `).join('');
        resultadosContainer.classList.remove('hidden');
    } else {
        resultadosContainer.innerHTML = '<p class="p-2 text-sm text-center text-texto-secundario">Nenhum cliente encontrado.</p>';
        resultadosContainer.classList.remove('hidden');
    }
}

export const render = () => `
<div id="modal-nova-conta-overlay" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4">
    <form id="form-nova-conta" class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-sm">
        <header class="flex justify-between items-center p-4 border-b border-borda">
            <h3 class="text-xl font-bold">Criar Nova Conta</h3>
            <button type="button" class="btn-fechar-modal text-2xl">&times;</button>
        </header>
        
        <div class="p-4">
            <div id="tabs-conta-tipo" class="flex border-b border-borda mb-4">
                <button type="button" class="tab-btn active" data-modo="registado">Cliente Registado</button>
                <button type="button" class="tab-btn" data-modo="avulsa">Conta Avulsa</button>
            </div>

            <div id="modo-registado" class="space-y-4">
                <div class="relative">
                    <label for="input-busca-cliente-conta" class="block text-sm font-medium mb-1">Buscar Cliente</label>
                    <input type="search" id="input-busca-cliente-conta" class="w-full p-2 border border-borda rounded-md bg-fundo-input" placeholder="Digite o nome do cliente...">
                    <div id="busca-cliente-resultados" class="absolute w-full bg-fundo-secundario border border-borda rounded-b-lg shadow-lg z-10 max-h-32 overflow-y-auto hidden"></div>
                </div>
                <p class="text-center text-sm text-texto-secundario">ou</p>
                <button type="button" id="btn-registar-novo-cliente-inline" class="w-full text-blue-600 dark:text-blue-400 font-semibold py-2 px-4 rounded-lg border-2 border-dashed border-blue-500 hover:bg-blue-500/10">
                    + Registar Novo Cliente
                </button>
            </div>

            <div id="modo-avulsa" class="hidden">
                <label for="input-nome-conta-avulsa" class="block text-sm font-medium mb-1">Nome da Conta / Mesa</label>
                <input type="text" id="input-nome-conta-avulsa" class="w-full p-2 border border-borda rounded-md bg-fundo-input" placeholder="Ex: Mesa 5, Balcão">
            </div>
        </div>

        <footer class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
            <button type="submit" id="btn-submit-nova-conta" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Iniciar Atendimento</button>
        </footer>
        <style>
            .tab-btn { flex: 1; padding: 0.75rem; border: none; background: none; font-weight: 600; color: var(--cor-texto-secundario); border-bottom: 3px solid transparent; }
            .tab-btn.active { color: var(--cor-primaria); border-bottom-color: var(--cor-primaria); }
        </style>
    </form>
</div>`;

export const mount = (closeModal) => {
    clienteSelecionado = null;
    let modoAtual = 'registado';

    const form = document.getElementById('form-nova-conta');
    const tabsContainer = document.getElementById('tabs-conta-tipo');
    const modoRegistadoDiv = document.getElementById('modo-registado');
    const modoAvulsaDiv = document.getElementById('modo-avulsa');
    const inputBusca = document.getElementById('input-busca-cliente-conta');
    const inputAvulsa = document.getElementById('input-nome-conta-avulsa');
    const resultadosContainer = document.getElementById('busca-cliente-resultados');
    
    // Lógica das abas
    tabsContainer.addEventListener('click', e => {
        const target = e.target.closest('.tab-btn');
        if (!target) return;

        tabsContainer.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        target.classList.add('active');
        
        modoAtual = target.dataset.modo;

        modoRegistadoDiv.classList.toggle('hidden', modoAtual !== 'registado');
        modoAvulsaDiv.classList.toggle('hidden', modoAtual !== 'avulsa');
        
        clienteSelecionado = null;
        inputBusca.value = '';
        inputAvulsa.value = '';
        resultadosContainer.classList.add('hidden');
    });

    // Lógica da busca
    inputBusca.addEventListener('input', debounce(e => renderizarResultadosBusca(e.target.value), 300));
    
    resultadosContainer.addEventListener('click', e => {
        const target = e.target.closest('[data-cliente-id]');
        if(target) {
            clienteSelecionado = { id: target.dataset.clienteId, nome: target.dataset.clienteNome };
            inputBusca.value = clienteSelecionado.nome;
            resultadosContainer.classList.add('hidden');
        }
    });

    // Botão para registar novo cliente
    document.getElementById('btn-registar-novo-cliente-inline').addEventListener('click', () => {
        abrirModalAddCliente();
    });

    // Submissão do formulário
    form.addEventListener('submit', e => {
        e.preventDefault();

        let nomeConta, clienteId;
        
        if (modoAtual === 'registado') {
            if (!clienteSelecionado) {
                return Toast.mostrarNotificacao("Por favor, selecione um cliente da lista ou crie um novo.", "erro");
            }
            nomeConta = clienteSelecionado.nome;
            clienteId = clienteSelecionado.id;
        } else { // modo 'avulsa'
            nomeConta = inputAvulsa.value.trim();
            if (!nomeConta) {
                return Toast.mostrarNotificacao("O nome da conta não pode estar vazio.", "erro");
            }
        }
        
        if (store.getState().contasAtivas.some(c => c.status === 'ativa' && c.nome.toLowerCase() === nomeConta.toLowerCase())) {
            return Toast.mostrarNotificacao(`Já existe uma conta ativa com o nome "${nomeConta}".`, "erro");
        }

        store.dispatch({ type: 'ADD_ACCOUNT', payload: { nome: nomeConta, clienteId: clienteId || null } });
        Toast.mostrarNotificacao(`Conta "${nomeConta}" criada com sucesso!`);
        closeModal();
    });

    form.querySelector('.btn-fechar-modal').addEventListener('click', closeModal);
    document.getElementById('modal-nova-conta-overlay').addEventListener('click', e => {
        if (e.target.id === 'modal-nova-conta-overlay') closeModal();
    });
};

export const unmount = () => {
    clienteSelecionado = null;
};