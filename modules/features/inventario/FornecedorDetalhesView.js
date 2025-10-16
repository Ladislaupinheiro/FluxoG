// /modules/features/inventario/FornecedorDetalhesView.js (VERSÃO FINAL COM CALENDÁRIO E EXPORTAÇÃO)
'use strict';

import store from '../../shared/services/Store.js';
import Router from '../../app/Router.js';
import { abrirModalAddProdutoCatalogo, abrirModalRegistarCompra, abrirModalExportarCompras } from '../../shared/components/Modals.js';

let unsubscribe = null;
let viewNode = null;
let fornecedorAtivoId = null;
let dataCalendario = new Date();
let dataSelecionada = null;

function renderComprasCalendar(fornecedor) {
    const ano = dataCalendario.getFullYear();
    const mes = dataCalendario.getMonth();
    const calendarioTitulo = viewNode.querySelector('#calendario-compras-titulo');
    const calendarioGrid = viewNode.querySelector('#calendario-compras-grid');
    if (!calendarioTitulo || !calendarioGrid) return;

    calendarioTitulo.textContent = new Date(ano, mes).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
    calendarioGrid.innerHTML = '';

    const comprasDoFornecedor = store.getState().historicoCompras.filter(c => c.fornecedorId === fornecedor.id);
    const diasComCompras = new Set(comprasDoFornecedor.map(c => new Date(c.data).toDateString()));
    const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();

    for (let i = 0; i < primeiroDiaSemana; i++) calendarioGrid.appendChild(document.createElement('div'));

    for (let dia = 1; dia <= diasNoMes; dia++) {
        const diaAtual = new Date(ano, mes, dia);
        const diaAtualStr = diaAtual.toDateString();
        const temCompra = diasComCompras.has(diaAtualStr);
        const isSelected = dataSelecionada && diaAtualStr === dataSelecionada.toDateString();
        
        const diaEl = document.createElement('div');
        diaEl.textContent = dia;
        let classes = 'p-1 text-center rounded-full text-sm transition-colors duration-200';
        if (isSelected) {
            classes += ' bg-blue-500 text-white font-bold ring-2 ring-blue-300';
        } else if (temCompra) {
            classes += ' bg-green-500 text-white font-bold cursor-pointer hover:bg-green-600';
        } else {
            classes += ' text-texto-secundario opacity-50';
        }
        diaEl.className = classes;
        if(temCompra) diaEl.dataset.dia = dia;
        calendarioGrid.appendChild(diaEl);
    }
}

function renderListaComprasDoDia(fornecedor) {
    const listaContainer = viewNode.querySelector('#lista-compras-dia-container');
    if (!listaContainer) return;

    const state = store.getState();
    let comprasParaMostrar = state.historicoCompras.filter(c => c.fornecedorId === fornecedor.id);

    if (dataSelecionada) {
        comprasParaMostrar = comprasParaMostrar.filter(c => new Date(c.data).toDateString() === dataSelecionada.toDateString());
    } else {
        listaContainer.innerHTML = `<p class="text-center text-sm text-texto-secundario py-2">Selecione um dia no calendário para ver os detalhes.</p>`;
        return;
    }

    if (comprasParaMostrar.length === 0) {
        listaContainer.innerHTML = `<p class="text-center text-sm text-texto-secundario py-2">Nenhuma compra registada neste dia.</p>`;
        return;
    }

    listaContainer.innerHTML = comprasParaMostrar.map(compra => {
        const produtoCatalogo = fornecedor.catalogo.find(p => p.id === compra.produtoCatalogoId);
        const nomeProduto = produtoCatalogo ? produtoCatalogo.nome : 'Produto removido';

        return `
            <div class="bg-fundo-principal p-3 rounded-lg flex justify-between items-center">
                <div>
                    <p class="font-semibold">${compra.quantidade}x ${nomeProduto}</p>
                </div>
                <span class="font-bold">${(compra.valorTotal).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
            </div>
        `;
    }).join('');
}

function updateDOM() {
    if (!viewNode || !fornecedorAtivoId) return;

    const state = store.getState();
    const fornecedor = state.fornecedores.find(f => f.id === fornecedorAtivoId);
    if (!fornecedor) { Router.navigateTo('#inventario'); return; }

    const catalogoContainer = viewNode.querySelector('#catalogo-produtos-container');
    if (catalogoContainer) {
        if (!fornecedor.catalogo || fornecedor.catalogo.length === 0) {
            catalogoContainer.innerHTML = `<p class="text-center text-texto-secundario text-sm py-4">Nenhum produto no catálogo.</p>`;
        } else {
            catalogoContainer.innerHTML = fornecedor.catalogo.map(p => `<div class="bg-fundo-principal p-3 rounded-lg"><span class="font-semibold">${p.nome}</span></div>`).join('<div class="border-b border-borda my-1"></div>');
        }
    }

    renderComprasCalendar(fornecedor);
    renderListaComprasDoDia(fornecedor);
}

function render(fornecedorId) {
    const fornecedor = store.getState().fornecedores.find(f => f.id === fornecedorId);
    if (!fornecedor) return `<p class="p-4 text-center">Fornecedor não encontrado.</p>`;

    return `
        <section id="view-fornecedor-detalhes" class="p-4 space-y-6 pb-24">
            <header class="flex items-center gap-4">
                <button id="btn-voltar-inventario" class="p-2 -ml-2 text-2xl text-texto-secundario hover:text-primaria"><i class="lni lni-arrow-left"></i></button>
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
                <div class="flex justify-between items-center mb-3">
                    <h3 class="text-lg font-semibold">Minhas Compras</h3>
                    <button id="btn-exportar-compras" class="text-sm font-semibold text-blue-600 hover:underline">Exportar</button>
                </div>
                <div class="flex justify-between items-center mb-2">
                    <button id="btn-mes-anterior-compras" class="p-1"><i class="lni lni-chevron-left"></i></button>
                    <h4 id="calendario-compras-titulo" class="font-bold"></h4>
                    <button id="btn-mes-seguinte-compras" class="p-1"><i class="lni lni-chevron-right"></i></button>
                </div>
                <div id="calendario-compras-grid" class="grid grid-cols-7 gap-1 mb-4"></div>
                <div id="lista-compras-dia-container" class="space-y-2"></div>
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
    dataCalendario = new Date();
    dataSelecionada = null;

    const handleViewClick = (e) => {
        const state = store.getState();
        const fornecedor = state.fornecedores.find(f => f.id === fornecedorAtivoId);
        if (!fornecedor) return;

        if (e.target.closest('#btn-voltar-inventario')) { Router.navigateTo('#inventario'); return; }
        if (e.target.closest('#btn-add-produto-catalogo')) { abrirModalAddProdutoCatalogo(fornecedor); return; }
        if (e.target.closest('#btn-abrir-modal-compra')) { abrirModalRegistarCompra(fornecedor); return; }
        if (e.target.closest('#btn-exportar-compras')) { abrirModalExportarCompras(); return; }

        if (e.target.closest('#btn-mes-anterior-compras')) { dataCalendario.setMonth(dataCalendario.getMonth() - 1); updateDOM(); return; }
        if (e.target.closest('#btn-mes-seguinte-compras')) { dataCalendario.setMonth(dataCalendario.getMonth() + 1); updateDOM(); return; }
        
        const diaBtn = e.target.closest('#calendario-compras-grid [data-dia]');
        if (diaBtn) {
            const dia = parseInt(diaBtn.dataset.dia, 10);
            const dataClicada = new Date(dataCalendario.getFullYear(), dataCalendario.getMonth(), dia);
            dataSelecionada = (dataSelecionada && dataClicada.toDateString() === dataSelecionada.toDateString()) ? null : dataClicada;
            updateDOM();
        }
    };

    viewNode.addEventListener('click', handleViewClick);
    updateDOM();
    unsubscribe = store.subscribe(updateDOM);
    
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

export default { render, mount, unmount };