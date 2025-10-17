// /modules/features/atendimento/components/ModalTrocarCliente.js (NOVO)
'use strict';

import store from '../../../shared/services/Store.js';
import { debounce } from '../../../shared/lib/utils.js';

function renderizarResultadosBusca(termo, contaId) {
    const resultadosContainer = document.getElementById('trocar-cliente-resultados');
    if (!resultadosContainer) return;

    if (!termo || termo.length < 1) {
        resultadosContainer.innerHTML = '<p class="text-center text-sm text-texto-secundario p-4">Comece a digitar para encontrar um cliente.</p>';
        return;
    }

    const { clientes, contasAtivas } = store.getState();
    // Exclui o cliente que já é o titular da conta
    const contaAtual = contasAtivas.find(c => c.id === contaId);
    const clienteAtualId = contaAtual ? contaAtual.clienteId : null;

    const resultados = clientes.filter(c => 
        c.id !== clienteAtualId && c.nome.toLowerCase().includes(termo.toLowerCase())
    );

    if (resultados.length > 0) {
        resultadosContainer.innerHTML = resultados.map(cliente => `
            <div class="p-3 hover:bg-fundo-principal rounded-md cursor-pointer flex items-center gap-3" data-cliente-id="${cliente.id}" data-cliente-nome="${cliente.nome}">
                <img src="${cliente.fotoDataUrl || './icons/logo-small-192.png'}" alt="Foto de ${cliente.nome}" class="w-10 h-10 rounded-full object-cover bg-fundo-principal">
                <span class="font-semibold">${cliente.nome}</span>
            </div>
        `).join('');
    } else {
        resultadosContainer.innerHTML = '<p class="p-4 text-sm text-center text-texto-secundario">Nenhum outro cliente encontrado com esse nome.</p>';
    }
}

export const render = (conta) => {
    const cliente = store.getState().clientes.find(c => c.id === conta.clienteId);
    return `
<div id="modal-trocar-cliente-overlay" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4">
    <div class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-sm flex flex-col max-h-[70vh]">
        <header class="p-4 border-b border-borda">
            <h3 class="text-xl font-bold">Trocar Titular da Conta</h3>
            <p class="text-sm text-texto-secundario">Titular atual: ${cliente ? cliente.nome : 'N/A'}</p>
        </header>
        <div class="p-4">
            <input type="search" id="input-busca-trocar-cliente" class="w-full p-2 border border-borda rounded-md bg-fundo-input" placeholder="Encontrar novo titular...">
        </div>
        <div id="trocar-cliente-resultados" class="overflow-y-auto px-4 pb-4 flex-grow">
             <p class="text-center text-sm text-texto-secundario p-4">Comece a digitar para encontrar um cliente.</p>
        </div>
        <footer class="p-2 border-t border-borda text-center">
            <button id="btn-cancelar-troca" class="text-sm text-texto-secundario font-semibold hover:underline p-2">Cancelar</button>
        </footer>
    </div>
</div>`;
};

export const mount = (closeModal, conta, onConfirm) => {
    const inputBusca = document.getElementById('input-busca-trocar-cliente');
    const resultadosContainer = document.getElementById('trocar-cliente-resultados');
    inputBusca.focus();

    inputBusca.addEventListener('input', debounce(e => renderizarResultadosBusca(e.target.value, conta.id), 250));
    
    resultadosContainer.addEventListener('click', e => {
        const target = e.target.closest('[data-cliente-id]');
        if(target) {
            const { clienteId, clienteNome } = target.dataset;
            if (typeof onConfirm === 'function') {
                onConfirm({ clienteId, clienteNome });
            }
            closeModal();
        }
    });

    document.getElementById('btn-cancelar-troca')?.addEventListener('click', closeModal);
    document.getElementById('modal-trocar-cliente-overlay')?.addEventListener('click', e => {
        if (e.target.id === 'modal-trocar-cliente-overlay') closeModal();
    });
};

export const unmount = () => {};