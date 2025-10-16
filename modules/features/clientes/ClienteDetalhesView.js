// /modules/features/clientes/ClienteDetalhesView.js (VERSÃO FINAL REFINADA E COMPLETA)
'use strict';

import store from '../../shared/services/Store.js';
import Router from '../../app/Router.js';
import { abrirModalAddDivida, abrirModalLiquidarDivida } from '../../shared/components/Modals.js';
import { calculateClientProfile } from './services/ClientAnalyticsService.js';
import * as Toast from '../../shared/components/Toast.js';

let unsubscribe = null;
let viewNode = null;
let clienteAtivoId = null;
let swiper = null;
let dataCalendario = new Date();
let dataSelecionada = null; // Estado para o dia do calendário selecionado
let tagifyInstance = null;

function toggleSection(sectionBodyId, chevronId) {
    const body = viewNode.querySelector(`#${sectionBodyId}`);
    const chevron = viewNode.querySelector(`#${chevronId}`);
    if (!body || !chevron) return;

    const isCollapsed = body.style.height === '0px' || body.style.height === '';

    if (isCollapsed) {
        gsap.to(body, { height: 'auto', duration: 0.3, ease: 'power1.out' });
        gsap.to(chevron, { rotation: 0, duration: 0.3 });
    } else {
        gsap.to(body, { height: 0, duration: 0.3, ease: 'power1.in' });
        gsap.to(chevron, { rotation: -90, duration: 0.3 });
    }
}

function renderCalendar(cliente) {
    const ano = dataCalendario.getFullYear();
    const mes = dataCalendario.getMonth();
    const calendarioTitulo = viewNode.querySelector('#calendario-dividas-titulo');
    const calendarioGrid = viewNode.querySelector('#calendario-dividas-grid');
    if (!calendarioTitulo || !calendarioGrid) return;

    calendarioTitulo.textContent = new Date(ano, mes).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
    calendarioGrid.innerHTML = '';

    const diasComTransacao = new Set((cliente.dividas || []).map(d => new Date(d.data).toDateString()));
    const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();

    for (let i = 0; i < primeiroDiaSemana; i++) calendarioGrid.appendChild(document.createElement('div'));

    for (let dia = 1; dia <= diasNoMes; dia++) {
        const diaAtual = new Date(ano, mes, dia);
        const diaAtualStr = diaAtual.toDateString();
        const temTransacao = diasComTransacao.has(diaAtualStr);
        const isSelected = dataSelecionada && diaAtualStr === dataSelecionada.toDateString();
        
        const diaEl = document.createElement('div');
        diaEl.textContent = dia;
        let classes = 'p-1 text-center rounded-full text-sm transition-colors duration-200';
        if (isSelected) {
            classes += ' bg-blue-500 text-white font-bold ring-2 ring-blue-300';
        } else if (temTransacao) {
            classes += ' bg-green-500 text-white font-bold cursor-pointer hover:bg-green-600';
        } else {
            classes += ' text-texto-secundario opacity-50';
        }
        diaEl.className = classes;
        if(temTransacao) diaEl.dataset.dia = dia;
        calendarioGrid.appendChild(diaEl);
    }
}

function renderListaDividas(cliente) {
    const dividasContainer = viewNode.querySelector('#lista-dividas-container');
    if (!dividasContainer) return;

    let dividasParaMostrar = [...(cliente.dividas || [])];

    if (dataSelecionada) {
        dividasParaMostrar = dividasParaMostrar.filter(d => new Date(d.data).toDateString() === dataSelecionada.toDateString());
    }

    dividasParaMostrar.sort((a, b) => new Date(b.data) - new Date(a.data));

    if (dividasParaMostrar.length === 0) {
        dividasContainer.innerHTML = `<p class="text-center text-sm text-texto-secundario py-2">${dataSelecionada ? 'Nenhuma transação neste dia.' : 'Sem histórico de dívidas.'}</p>`;
        return;
    }

    dividasContainer.innerHTML = dividasParaMostrar.map(transacao => {
        const isCredito = transacao.tipo === 'credito';
        const corValor = isCredito ? 'text-green-500' : 'text-red-500';
        const sinal = isCredito ? '' : '+';
        const valorFormatado = (Math.abs(transacao.valor) || 0).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });

        return `
            <div class="bg-fundo-principal p-3 rounded-lg flex justify-between items-center">
                <div>
                    <p class="font-semibold">${transacao.descricao}</p>
                    <p class="text-xs text-texto-secundario">${new Date(transacao.data).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short'})} às ${new Date(transacao.data).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <span class="font-bold text-lg ${corValor}">${sinal} ${valorFormatado}</span>
            </div>
        `;
    }).join('');
}

function updateDOM() {
    if (!viewNode || !clienteAtivoId) return;
    
    const state = store.getState();
    const cliente = state.clientes.find(c => c.id === clienteAtivoId);
    if (!cliente) { Router.navigateTo('#clientes'); return; }

    const estatisticas = calculateClientProfile(clienteAtivoId, state);
    const dividaTotal = cliente.dividas.reduce((t, d) => d.tipo === 'debito' ? t + d.valor : t - Math.abs(d.valor), 0);

    viewNode.querySelector('#cliente-foto').src = cliente.fotoDataUrl || './icons/logo-small-192.png';
    viewNode.querySelector('#cliente-nome').textContent = cliente.nome;
    if (tagifyInstance && JSON.stringify(tagifyInstance.value.map(t => t.value)) !== JSON.stringify(cliente.tags || [])) {
        tagifyInstance.loadOriginalValues(cliente.tags || []);
    }

    viewNode.querySelector('#stat-gasto-total').textContent = (estatisticas.gastoTotal || 0).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    viewNode.querySelector('#stat-divida-total').textContent = (dividaTotal || 0).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    viewNode.querySelector('#stat-visitas').textContent = estatisticas.visitas;

    const topProdutosContainer = viewNode.querySelector('#stat-top-produtos');
    if (estatisticas.produtosPreferidos.length > 0) {
        topProdutosContainer.innerHTML = estatisticas.produtosPreferidos.map(p => `<div class="text-sm font-semibold">${p.nome} <span class="text-texto-secundario">(${p.qtd}x)</span></div>`).join('');
    } else {
        topProdutosContainer.innerHTML = `<span class="text-sm text-texto-secundario">Sem histórico de consumo.</span>`;
    }

    const comprasDoCliente = state.historicoCompras.filter(c => c.clienteId === cliente.id); // Futuro: associar compras a clientes
    const dividasDoCliente = cliente.dividas || [];
    
    const comprasBody = viewNode.querySelector('#collapsible-compras .collapsible-body-content');
    if (comprasDoCliente.length > 0) {
        comprasBody.innerHTML = ``;
    } else {
        comprasBody.innerHTML = `<p class="text-center text-sm text-texto-secundario py-4">Sem histórico de compra.</p>`;
    }
    
    const dividasBody = viewNode.querySelector('#collapsible-dividas .collapsible-body-content');
    if (dividasDoCliente.length > 0) {
        renderCalendar(cliente);
        renderListaDividas(cliente);
    } else {
        dividasBody.innerHTML = `<p class="text-center text-sm text-texto-secundario py-4">Sem histórico de dívidas.</p>`;
    }
}

function handleFotoChange(e, cliente) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        const clienteAtualizado = { ...cliente, fotoDataUrl: event.target.result };
        store.dispatch({ type: 'UPDATE_CLIENT', payload: clienteAtualizado });
        Toast.mostrarNotificacao("Foto de perfil atualizada!");
    };
    reader.readAsDataURL(file);
}

function render(clienteId) {
    const cliente = store.getState().clientes.find(c => c.id === clienteId);
    if (!cliente) return `<p class="p-4 text-center">Cliente não encontrado.</p>`;
    
    return `
        <style>
            .section-header { cursor: pointer; }
            .collapsible-body { height: 0; overflow: hidden; }
            .tagify{ --tags-border-color: transparent; padding: 0; }
            .tagify__input { text-align: center; }
        </style>
        <header class="p-4 flex items-center"><button id="btn-voltar-clientes" class="p-2 -ml-2 text-2xl text-texto-secundario hover:text-primaria"><i class="lni lni-arrow-left"></i></button></header>
        <main class="p-4 space-y-6 pb-24">
            <section id="perfil-cliente" class="text-center space-y-3">
                <div class="relative inline-block">
                    <img id="cliente-foto" src="${cliente.fotoDataUrl || './icons/logo-small-192.png'}" alt="Foto de perfil" class="w-24 h-24 rounded-full object-cover mx-auto bg-fundo-secundario border-4 border-fundo-secundario shadow-md cursor-pointer">
                    <input type="file" id="input-foto-cliente" class="hidden" accept="image/*">
                    <div class="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1 cursor-pointer"><i class="lni lni-pencil text-white text-xs"></i></div>
                </div>
                <h2 id="cliente-nome" class="text-2xl font-bold">${cliente.nome}</h2>
                <input id="cliente-tags-input" class="w-full text-center bg-transparent" value="${(cliente.tags || []).join(',')}">
            </section>
            
            <section id="stats-carousel" class="swiper bg-fundo-secundario rounded-lg shadow-md p-4">
                <div class="swiper-wrapper">
                    <div class="swiper-slide text-center"><span id="stat-gasto-total" class="text-3xl font-bold block text-green-500"></span><span class="text-xs text-texto-secundario">Gasto Total</span></div>
                    <div class="swiper-slide text-center"><span id="stat-divida-total" class="text-3xl font-bold block text-red-500"></span><span class="text-xs text-texto-secundario">Dívida Atual</span></div>
                    <div class="swiper-slide text-center"><span id="stat-visitas" class="text-3xl font-bold block"></span><span class="text-xs text-texto-secundario">Nº de Visitas</span></div>
                    <div class="swiper-slide text-center space-y-1">
                        <div id="stat-top-produtos"></div>
                        <span class="text-xs text-texto-secundario">Top Produtos</span>
                    </div>
                </div>
                <div class="swiper-pagination !-bottom-1"></div>
            </section>

            <section id="collapsible-compras">
                <div class="section-header flex justify-between items-center py-2">
                    <h3 class="font-bold">Histórico de Compras</h3>
                    <i id="chevron-compras" class="lni lni-chevron-down transform -rotate-90"></i>
                </div>
                <div class="collapsible-body"><div class="collapsible-body-content bg-fundo-secundario rounded-lg shadow-md p-4"></div></div>
            </section>

            <section id="collapsible-dividas">
                <div class="section-header flex justify-between items-center py-2">
                    <h3 class="font-bold">Histórico de Dívidas</h3>
                    <i id="chevron-dividas" class="lni lni-chevron-down transform -rotate-90"></i>
                </div>
                <div class="collapsible-body"><div class="collapsible-body-content bg-fundo-secundario rounded-lg shadow-md p-4 space-y-2">
                    <div class="flex justify-between items-center mb-2">
                        <button id="btn-mes-anterior" class="p-1"><i class="lni lni-chevron-left"></i></button>
                        <h4 id="calendario-dividas-titulo" class="font-bold"></h4>
                        <button id="btn-mes-seguinte" class="p-1"><i class="lni lni-chevron-right"></i></button>
                    </div>
                    <div id="calendario-dividas-grid" class="grid grid-cols-7 gap-1 mb-4"></div>
                    <div id="lista-dividas-container" class="space-y-2"></div>
                </div></div>
            </section>
        </main>
        <div class="fixed bottom-16 right-4 flex flex-col items-center gap-2 z-50">
            <button id="btn-liquidar-divida" class="w-12 h-12 bg-green-500 text-white rounded-full shadow-lg flex items-center justify-center text-xl" title="Liquidar Dívida"><i class="lni lni-checkmark"></i></button>
            <button id="btn-add-divida" class="w-14 h-14 bg-green-500 text-white rounded-full shadow-lg flex items-center justify-center text-2xl" title="Adicionar Dívida"><i class="lni lni-plus"></i></button>
        </div>
    `;
}

function mount(clienteId) {
    viewNode = document.getElementById('app-root');
    clienteAtivoId = clienteId;
    dataCalendario = new Date();
    dataSelecionada = null;

    const state = store.getState();
    const cliente = state.clientes.find(c => c.id === clienteAtivoId);
    if (!cliente) { Router.navigateTo('#clientes'); return; }

    const handleViewClick = (e) => {
        if (e.target.closest('#btn-voltar-clientes')) Router.navigateTo('#clientes');
        if (e.target.closest('#cliente-foto, #perfil-cliente .lni-pencil')) viewNode.querySelector('#input-foto-cliente').click();
        if (e.target.closest('#collapsible-compras .section-header')) toggleSection('collapsible-compras .collapsible-body-content', 'chevron-compras');
        if (e.target.closest('#collapsible-dividas .section-header')) toggleSection('collapsible-dividas .collapsible-body-content', 'chevron-dividas');
        if (e.target.closest('#btn-mes-anterior')) { dataCalendario.setMonth(dataCalendario.getMonth() - 1); updateDOM(); }
        if (e.target.closest('#btn-mes-seguinte')) { dataCalendario.setMonth(dataCalendario.getMonth() + 1); updateDOM(); }
        if (e.target.closest('#btn-add-divida')) abrirModalAddDivida(cliente);
        if (e.target.closest('#btn-liquidar-divida')) abrirModalLiquidarDivida(cliente);
        
        const diaBtn = e.target.closest('#calendario-dividas-grid [data-dia]');
        if (diaBtn) {
            const dia = parseInt(diaBtn.dataset.dia, 10);
            const dataClicada = new Date(dataCalendario.getFullYear(), dataCalendario.getMonth(), dia);
            dataSelecionada = (dataSelecionada && dataClicada.toDateString() === dataSelecionada.toDateString()) ? null : dataClicada;
            updateDOM();
        }
    };

    viewNode.addEventListener('click', handleViewClick);
    viewNode.querySelector('#input-foto-cliente').addEventListener('change', (e) => handleFotoChange(e, cliente));

    const tagsInput = viewNode.querySelector('#cliente-tags-input');
    tagifyInstance = new Tagify(tagsInput, {
        whitelist: (state.tagsDeCliente || []).map(t => t.nome),
        dropdown: { enabled: 0 }
    });
    const onTagChange = () => {
        const novasTags = tagifyInstance.value.map(t => t.value);
        if(JSON.stringify(novasTags) !== JSON.stringify(cliente.tags || [])) {
            const clienteAtualizado = { ...cliente, tags: novasTags };
            store.dispatch({ type: 'UPDATE_CLIENT', payload: clienteAtualizado });
        }
    };
    tagifyInstance.on('add', onTagChange).on('remove', onTagChange).on('blur', onTagChange);

    updateDOM();
    unsubscribe = store.subscribe(updateDOM);

    swiper = new Swiper('#stats-carousel', {
        pagination: { el: '.swiper-pagination', clickable: true },
        autoplay: { delay: 4000 }
    });
    
    const originalUnmount = unmount;
    unmount = () => {
        viewNode.removeEventListener('click', handleViewClick);
        if (tagifyInstance) tagifyInstance.destroy();
        originalUnmount();
    };
}

function unmount() {
    if (unsubscribe) unsubscribe();
    if (swiper) swiper.destroy(true, true);
    swiper = null;
    unsubscribe = null;
    viewNode = null;
    clienteAtivoId = null;
    tagifyInstance = null;
}

export default { render, mount, unmount };