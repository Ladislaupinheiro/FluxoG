// /modules/features/inventario/FornecedorDetalhesView.js (VERSÃO FINAL INTERATIVA)
'use strict';

import store from '../../shared/services/Store.js';
import Router from '../../app/Router.js';
import { abrirModalAddProdutoCatalogo, abrirModalRegistarCompra } from '../../shared/components/Modals.js';

let unsubscribe = null;
let viewNode = null;
let fornecedorAtivoId = null;

function renderConteudo() {
    if (!viewNode || !fornecedorAtivoId) return;

    const state = store.getState();
    const fornecedor = state.fornecedores.find(f => f.id === fornecedorAtivoId);

    if (!fornecedor) {
        viewNode.innerHTML = `<p class="p-4 text-center text-red-500">Fornecedor não encontrado.</p>`;
        return;
    }

    // Renderiza o catálogo de produtos do fornecedor
    const catalogoContainer = viewNode.querySelector('#catalogo-produtos-container');
    if (catalogoContainer) {
        if (!fornecedor.catalogo || fornecedor.catalogo.length === 0) {
            catalogoContainer.innerHTML = `<p class="text-center text-texto-secundario text-sm py-4">Nenhum produto no catálogo deste fornecedor.</p>`;
        } else {
            catalogoContainer.innerHTML = fornecedor.catalogo.map(p => `
                <div class="bg-fundo-principal p-3 rounded-lg flex justify-between items-center">
                    <span class="font-semibold">${p.nome}</span>
                </div>
            `).join('<div class="border-b border-borda my-1"></div>');
        }
    }

    // Renderiza o histórico de compras
    const historicoContainer = viewNode.querySelector('#historico-compras-container');
    if (historicoContainer) {
        const comprasDoFornecedor = state.historicoCompras.filter(c => c.fornecedorId === fornecedorAtivoId);
        if (comprasDoFornecedor.length === 0) {
            historicoContainer.innerHTML = `<p class="text-center text-texto-secundario text-sm py-4">Nenhuma compra registada para este fornecedor.</p>`;
        } else {
            historicoContainer.innerHTML = comprasDoFornecedor.sort((a,b) => new Date(b.data) - new Date(a.data)).map(c => `
                <div class="bg-fundo-principal p-3 rounded-lg flex justify-between items-center">
                    <div>
                        <p class="font-semibold">${new Date(c.data).toLocaleDateString('pt-PT', {day: '2-digit', month: 'short', year: 'numeric'})}</p>
                    </div>
                    <span class="font-bold">${(c.valorTotal).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                </div>
            `).join('<div class="border-b border-borda my-1"></div>');
        }
    }
}


function render(fornecedorId) {
    const fornecedor = store.getState().fornecedores.find(f => f.id === fornecedorId);
    if (!fornecedor) return `<p class="p-4 text-center">Fornecedor não encontrado.</p>`;

    return `
        <section id="view-fornecedor-detalhes" class="p-4 space-y-6 pb-24">
            <header class="flex items-center gap-4">
                <button id="btn-voltar-inventario" class="p-2 -ml-2 text-2xl text-texto-secundario hover:text-primaria">
                    <i class="lni lni-arrow-left"></i>
                </button>
                <h2 class="text-2xl font-bold">${fornecedor.nome}</h2>
            </header>

            <div class="bg-fundo-secundario p-4 rounded-lg shadow-md">
                <div class="flex justify-between items-center mb-3">
                    <h3 class="text-lg font-semibold">Catálogo de Produtos</h3>
                    <button id="btn-add-produto-catalogo" class="text-sm font-bold bg-blue-600 text-white py-1 px-3 rounded-md hover:bg-blue-700">+ Add Catálogo</button>
                </div>
                <div id="catalogo-produtos-container" class="space-y-2 max-h-48 overflow-y-auto"></div>
            </div>

            <div class="bg-fundo-secundario p-4 rounded-lg shadow-md">
                <h3 class="text-lg font-semibold mb-3">Minhas Compras</h3>
                <div id="historico-compras-container" class="space-y-2 max-h-48 overflow-y-auto"></div>
            </div>
            
            <div class="p-4 fixed bottom-16 left-0 w-full bg-fundo-principal border-t border-borda">
                 <button id="btn-abrir-modal-compra" class="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:bg-green-700">Registar Nova Compra</button>
            </div>
        </section>
    `;
}

function mount(fornecedorId) {
    viewNode = document.getElementById('app-root');
    fornecedorAtivoId = fornecedorId;

    const handleViewClick = (e) => {
        const state = store.getState();
        const fornecedor = state.fornecedores.find(f => f.id === fornecedorAtivoId);

        if (e.target.closest('#btn-voltar-inventario')) {
            Router.navigateTo('#inventario');
            return;
        }
        if (e.target.closest('#btn-add-produto-catalogo')) {
            if(fornecedor) abrirModalAddProdutoCatalogo(fornecedor);
            return;
        }
        if (e.target.closest('#btn-abrir-modal-compra')) {
            if(fornecedor) abrirModalRegistarCompra(fornecedor); // Passamos o fornecedor para o modal
            return;
        }
    };

    viewNode.addEventListener('click', handleViewClick);

    renderConteudo();
    unsubscribe = store.subscribe(renderConteudo);
    
    // Anexa a função de limpeza ao unmount
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
    fornecedorAtivoId = null;
}

export default {
    render,
    mount,
    unmount
};