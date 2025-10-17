// /modules/features/clientes/ClienteDetalhesView.js (VERSÃO CORRETA E FUNCIONAL)
'use strict';

import store from '../../shared/services/Store.js';
import Router from '../../app/Router.js';
import { calculateClientProfile } from './services/ClientAnalyticsService.js';
import { 
    abrirModalAddDivida, 
    abrirModalLiquidarDivida, 
    abrirModalEditCliente,
    abrirModalConfirmacao 
} from '../../shared/components/Modals.js';
import * as Toast from '../../shared/components/Toast.js';

let unsubscribe = null;
let viewNode = null;

function renderDividas(cliente) {
    if (!cliente.dividas || cliente.dividas.length === 0) {
        return `<p class="text-center text-sm text-texto-secundario py-4">Nenhuma dívida ou pagamento registado.</p>`;
    }
    return cliente.dividas
        .sort((a, b) => new Date(b.data) - new Date(a.data))
        .map(divida => {
            const isDebito = divida.tipo === 'debito';
            const corValor = isDebito ? 'text-red-500' : 'text-green-500';
            const sinal = isDebito ? '-' : '+';
            return `
                <div class="flex justify-between items-center bg-fundo-principal p-3 rounded-lg">
                    <div>
                        <p class="font-semibold">${divida.descricao}</p>
                        <p class="text-xs text-texto-secundario">${new Date(divida.data).toLocaleDateString('pt-PT')}</p>
                    </div>
                    <span class="font-bold ${corValor}">${sinal} ${(Math.abs(divida.valor)).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                </div>
            `;
        }).join('');
}

function render(clienteId) {
    const state = store.getState();
    const cliente = state.clientes.find(c => c.id === clienteId);
    if (!cliente) return `<p class="p-4 text-center">Cliente não encontrado.</p>`;

    const profile = calculateClientProfile(clienteId, state);
    const dividaTotal = cliente.dividas.reduce((total, d) => total + (d.tipo === 'debito' ? d.valor : -Math.abs(d.valor)), 0);

    return `
        <section class="pb-24">
            <header class="p-4 flex justify-between items-center">
                <button id="btn-voltar-clientes" class="p-2 -ml-2 text-2xl text-texto-secundario"><i class="lni lni-arrow-left"></i></button>
                <h2 class="text-2xl font-bold">Perfil do Cliente</h2>
                <button id="btn-apagar-cliente" class="text-xl text-red-500"><i class="lni lni-trash-can"></i></button>
            </header>

            <div class="p-4 space-y-6">
                <div class="flex flex-col items-center text-center space-y-2">
                    <img src="${cliente.fotoDataUrl || './icons/logo-small-192.png'}" alt="Foto de ${cliente.nome}" class="w-24 h-24 rounded-full object-cover bg-fundo-secundario ring-4 ring-primaria/50">
                    <h3 class="text-2xl font-bold">${cliente.nome}</h3>
                    <p class="text-texto-secundario">${cliente.contacto || 'Sem contacto'}</p>
                    <button id="btn-editar-cliente" class="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">Editar Dados</button>
                </div>
                
                <div class="grid grid-cols-3 gap-4 text-center bg-fundo-secundario p-4 rounded-lg shadow-md">
                    <div>
                        <span class="block font-bold text-lg">${profile.visitas}</span>
                        <span class="text-xs text-texto-secundario">Visitas</span>
                    </div>
                    <div>
                        <span class="block font-bold text-lg">${profile.gastoTotal.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                        <span class="text-xs text-texto-secundario">Gasto Total</span>
                    </div>
                    <div>
                        <span class="block font-bold text-lg">${profile.ticketMedio.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                        <span class="text-xs text-texto-secundario">Ticket Médio</span>
                    </div>
                </div>

                <div class="bg-fundo-secundario p-4 rounded-lg shadow-md">
                    <div class="flex justify-between items-center mb-3">
                        <div>
                            <h4 class="text-lg font-semibold">Conta Corrente</h4>
                            <p class="text-2xl font-bold ${dividaTotal > 0 ? 'text-red-500' : 'text-green-500'}">
                                ${dividaTotal.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                            </p>
                        </div>
                        <div class="flex gap-2">
                            <button id="btn-liquidar-divida" class="bg-green-500 text-white font-bold py-2 px-4 rounded-lg" ${dividaTotal <= 0 ? 'disabled' : ''}>Pagar</button>
                            <button id="btn-add-divida" class="bg-red-500 text-white font-bold py-2 px-4 rounded-lg">+</button>
                        </div>
                    </div>
                    <div id="lista-dividas-container" class="space-y-2 max-h-60 overflow-y-auto">
                        ${renderDividas(cliente)}
                    </div>
                </div>
            </div>
        </section>
    `;
}

function mount(clienteId) {
    viewNode = document.getElementById('app-root');
    const update = () => {
        if (!viewNode) return;
        viewNode.innerHTML = render(clienteId);
    };

    const handleViewClick = (e) => {
        const state = store.getState();
        const cliente = state.clientes.find(c => c.id === clienteId);
        if (!cliente) return;

        if (e.target.closest('#btn-voltar-clientes')) { Router.navigateTo('#clientes'); return; }
        if (e.target.closest('#btn-editar-cliente')) { abrirModalEditCliente(cliente); return; }
        if (e.target.closest('#btn-add-divida')) { abrirModalAddDivida(cliente); return; }
        if (e.target.closest('#btn-liquidar-divida')) { abrirModalLiquidarDivida(cliente); return; }
        if (e.target.closest('#btn-apagar-cliente')) {
            abrirModalConfirmacao(
                `Apagar ${cliente.nome}?`,
                'Esta ação é irreversível e irá apagar todo o histórico de dívidas e gastos deste cliente.',
                () => {
                    store.dispatch({ type: 'DELETE_CLIENT', payload: cliente.id });
                    Toast.mostrarNotificacao(`Cliente ${cliente.nome} apagado.`);
                    Router.navigateTo('#clientes');
                }
            );
            return;
        }
    };

    update(); // Renderiza a primeira vez
    viewNode.addEventListener('click', handleViewClick);
    unsubscribe = store.subscribe(update); // Subscreve para re-renderizar em caso de mudanças
    
    // Sobrescreve o unmount para limpar o event listener
    const originalUnmount = unmount;
    unmount = () => {
        if(viewNode) viewNode.removeEventListener('click', handleViewClick);
        originalUnmount();
    };
}

function unmount() {
    if (unsubscribe) unsubscribe();
    unsubscribe = null;
    viewNode = null;
}

export default { render, mount, unmount };