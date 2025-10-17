// /modules/features/atendimento/ContaDetalhesView.js (VERSÃO FINAL, COMPLETA E CORRIGIDA)
'use strict';

import store from '../../shared/services/Store.js';
import Router from '../../app/Router.js';
import { 
    abrirModalPagamento, 
    abrirModalSeletorQuantidade, 
    abrirModalAcoesPedido,
    abrirModalAcoesFlutuantes,
    abrirModalTrocarCliente
} from '../../shared/components/Modals.js';
import * as Toast from '../../shared/components/Toast.js';

function isColorLight(color) {
    const hex = color.replace('#', '');
    const c_r = parseInt(hex.substring(0, 2), 16);
    const c_g = parseInt(hex.substring(2, 4), 16);
    const c_b = parseInt(hex.substring(4, 6), 16);
    const brightness = ((c_r * 299) + (c_g * 587) + (c_b * 114)) / 1000;
    return brightness > 155;
}

let unsubscribe = null;
let viewNode = null;
let contaAtivaId = null;
let prateleiraSwiper = null;

let activePrimaryCategoryId = null;
let activeSecondaryCategoryId = null;
let selectedProductIdInSwiper = null;

function renderCategoryFilters() {
    const state = store.getState();
    const categoriasPrimarias = state.categoriasDeProduto.filter(c => c.isSystemDefault);
    
    if (categoriasPrimarias.length > 0 && !activePrimaryCategoryId) {
        activePrimaryCategoryId = categoriasPrimarias[0].id;
    }

    const categoriasSecundarias = state.categoriasDeProduto.filter(c => c.parentId === activePrimaryCategoryId);
    
    if (categoriasSecundarias.length > 0 && !activeSecondaryCategoryId) {
        activeSecondaryCategoryId = categoriasSecundarias[0].id;
    } else if (categoriasSecundarias.length === 0) {
        activeSecondaryCategoryId = null;
    }

    const primaryFiltersHTML = `
        <div class="segmented-control-container">
            ${categoriasPrimarias.map(cat => `
                <button class="segmented-control-btn ${activePrimaryCategoryId === cat.id ? 'active' : ''}" 
                        data-category-id="${cat.id}">
                    ${cat.nome}
                </button>
            `).join('')}
        </div>
    `;

    const secondaryFiltersHTML = categoriasSecundarias.map(cat => `
        <button class="secondary-filter-btn ${activeSecondaryCategoryId === cat.id ? 'active' : ''}"
                data-category-id="${cat.id}">
            ${cat.nome}
        </button>
    `).join('');
    
    return { primaryFiltersHTML, secondaryFiltersHTML };
}

function renderPrateleira() {
    if (!viewNode || !activeSecondaryCategoryId) return;

    const state = store.getState();
    const categoriaSecundaria = state.categoriasDeProduto.find(c => c.id === activeSecondaryCategoryId);
    if (!categoriaSecundaria) return;

    const produtosDaCategoria = state.inventario.filter(p => 
        p.stockLoja > 0 && p.tags && p.tags.includes(categoriaSecundaria.nome.toLowerCase())
    );

    const prateleiraWrapper = viewNode.querySelector('#prateleira-swiper-wrapper');
    if (!prateleiraWrapper) return;
    
    if (produtosDaCategoria.length === 0) {
        prateleiraWrapper.innerHTML = `<div class="swiper-slide flex items-center justify-center text-texto-secundario h-full">Nenhum produto disponível.</div>`;
    } else {
        prateleiraWrapper.innerHTML = produtosDaCategoria.map(p => `
            <div class="swiper-slide prateleira-item-container" data-product-id="${p.id}">
                <div class="stock-badges-container">
                    <div class="stock-badge bg-green-500" title="Stock na Loja"><span>${p.stockLoja}</span></div>
                    <div class="stock-badge bg-blue-500" title="Stock no Armazém"><span>${p.stockArmazem}</span></div>
                </div>
                <button class="prateleira-btn">${p.nome}</button>
                <div class="selection-indicator ${selectedProductIdInSwiper === p.id ? 'visible' : ''}"></div>
            </div>
        `).join('');
    }

    if (prateleiraSwiper) prateleiraSwiper.update();
}

function renderOrderList(conta) {
    if (!conta || conta.pedidos.length === 0) {
        return `<p class="text-center text-texto-secundario p-4">Nenhum pedido nesta conta.</p>`;
    }

    const state = store.getState();
    const pedidosAgrupados = {};

    conta.pedidos.forEach(item => {
        const produto = state.inventario.find(p => p.id === item.produtoId);
        if (!produto || !produto.tags || produto.tags.length === 0) return;
        const tagSecundariaNome = produto.tags[0].toLowerCase();
        const categoriaSecundaria = state.categoriasDeProduto.find(c => c.nome.toLowerCase() === tagSecundariaNome);
        const categoriaPrimaria = categoriaSecundaria ? state.categoriasDeProduto.find(c => c.id === categoriaSecundaria.parentId) : null;
        const grupoId = categoriaPrimaria ? categoriaPrimaria.id : 'sem-categoria';
        if (!pedidosAgrupados[grupoId]) {
            pedidosAgrupados[grupoId] = { nome: categoriaPrimaria ? categoriaPrimaria.nome : 'Outros', cor: categoriaPrimaria ? categoriaPrimaria.cor : '#6B7280', items: [] };
        }
        pedidosAgrupados[grupoId].items.push(item);
    });

    return Object.values(pedidosAgrupados).map(grupo => {
        const textColorClass = isColorLight(grupo.cor) ? 'text-gray-800' : 'text-white';
        const itemsHTML = grupo.items.map(item => `
            <div class="order-card ${textColorClass}" style="background-color: ${grupo.cor};" data-pedido-id="${item.id}">
                <div class="flex-grow">
                    <span class="font-bold text-lg">${item.qtd}x ${item.nome}</span>
                    <p class="text-sm font-semibold opacity-90">${(item.preco * item.qtd).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p>
                </div>
                <span class="price-badge">${(item.preco).toLocaleString('pt-AO', { minimumFractionDigits: 0 })} Kz</span>
                <button class="btn-item-actions text-xl p-2 -mr-2"><i class="lni lni-more-alt"></i></button>
            </div>
        `).join('');

        return `
            <details class="accordion-item" open>
                <summary class="accordion-header">
                    <h3 class="font-bold text-texto-secundario text-lg">${grupo.nome}</h3>
                    <i class="accordion-icon lni lni-chevron-down"></i>
                </summary>
                <div class="accordion-content">
                    ${itemsHTML}
                </div>
            </details>
        `;
    }).join('');
}

function render(contaId) {
    const state = store.getState();
    const conta = state.contasAtivas.find(c => c.id === contaId);
    const cliente = conta ? state.clientes.find(c => c.id === conta.clienteId) : null;
    if (!conta || !cliente) return `<p class="p-4 text-center">Conta ou cliente não encontrado.</p>`;

    const { primaryFiltersHTML, secondaryFiltersHTML } = renderCategoryFilters();
    const totalAPagar = conta.pedidos.reduce((total, p) => total + (p.preco * p.qtd), 0);

    return `
        <header class="p-4 sticky top-0 bg-fundo-principal z-10 shadow-sm space-y-4">
            <div class="flex items-center justify-between gap-2">
                <button id="btn-voltar-atendimento" class="p-2 -ml-2 text-2xl text-texto-secundario"><i class="lni lni-arrow-left"></i></button>
                ${primaryFiltersHTML}
            </div>
            <div class="filter-bar flex gap-2 overflow-x-auto">
                ${secondaryFiltersHTML}
            </div>
        </header>

        <main class="p-4 space-y-6 pb-40">
            <div class="bg-fundo-secundario p-4 rounded-lg shadow-md">
                <div class="flex justify-between items-start">
                    <div class="flex items-center gap-3">
                        <img src="${cliente.fotoDataUrl || './icons/logo-small-192.png'}" alt="Foto de ${cliente.nome}" class="w-10 h-10 rounded-full object-cover bg-fundo-principal">
                        <span class="font-bold text-xl">${cliente.nome}</span>
                        <button class="btn-client-actions text-texto-secundario p-1 -ml-1"><i class="lni lni-chevron-down"></i></button>
                    </div>
                    <div class="text-right">
                         <span class="text-xs font-semibold text-texto-secundario">Total a pagar</span>
                         <span class="font-extrabold text-2xl block text-green-500">${totalAPagar.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                    </div>
                </div>
            </div>
            <div id="order-list-container" class="space-y-4">
                ${renderOrderList(conta)}
            </div>
        </main>

        <footer class="fixed bottom-0 left-0 w-full bg-fundo-secundario shadow-lg p-4 space-y-3 border-t border-borda z-20">
            <div id="prateleira-container" class="bg-fundo-principal">
                <div id="prateleira-swiper" class="swiper h-20">
                    <div id="prateleira-swiper-wrapper" class="swiper-wrapper"></div>
                </div>
            </div>
            <div class="flex gap-2">
                <button id="btn-pagar" class="flex-grow bg-blue-600 text-white font-bold py-3 rounded-lg shadow-lg">Pagar</button>
                <button id="btn-pagar-actions" class="w-12 bg-blue-800 text-white font-bold py-3 rounded-lg shadow-lg"><i class="lni lni-chevron-down"></i></button>
            </div>
        </footer>
    `;
}

export const mount = (contaId) => {
    viewNode = document.getElementById('app-root');
    contaAtivaId = contaId;
    
    const bottomNav = document.getElementById('bottom-nav');
    if (bottomNav) bottomNav.style.display = 'none';

    const updateView = () => { 
        const state = store.getState();
        const conta = state.contasAtivas.find(c => c.id === contaAtivaId);
        if(!conta) { Router.navigateTo('#atendimento'); return; }
        
        const currentPrimary = activePrimaryCategoryId;
        const currentSecondary = activeSecondaryCategoryId;
        viewNode.innerHTML = render(contaId);
        activePrimaryCategoryId = currentPrimary;
        activeSecondaryCategoryId = currentSecondary;
        renderPrateleira();
        
        if(prateleiraSwiper) prateleiraSwiper.destroy(true, true);
        prateleiraSwiper = new Swiper('#prateleira-swiper', {
            slidesPerView: 3,
            spaceBetween: 8,
        });
    };
    
    const handleViewClick = (e) => {
        const state = store.getState();
        const conta = state.contasAtivas.find(c => c.id === contaAtivaId);
        const cliente = conta ? state.clientes.find(c => c.id === conta.clienteId) : null;
        if (!conta || !cliente) return;

        if (e.target.closest('#btn-voltar-atendimento')) { Router.navigateTo('#atendimento'); return; }
        
        const primaryFilterBtn = e.target.closest('.segmented-control-btn');
        if (primaryFilterBtn) {
            activePrimaryCategoryId = primaryFilterBtn.dataset.categoryId;
            const subcategorias = state.categoriasDeProduto.filter(c => c.parentId === activePrimaryCategoryId);
            activeSecondaryCategoryId = subcategorias.length > 0 ? subcategorias[0].id : null;
            selectedProductIdInSwiper = null;
            updateView();
            return;
        }

        const secondaryFilterBtn = e.target.closest('.secondary-filter-btn');
        if (secondaryFilterBtn) {
            activeSecondaryCategoryId = secondaryFilterBtn.dataset.categoryId;
            selectedProductIdInSwiper = null;
            viewNode.querySelectorAll('.secondary-filter-btn').forEach(btn => btn.classList.remove('active'));
            secondaryFilterBtn.classList.add('active');
            renderPrateleira();
            return;
        }

        const prateleiraItem = e.target.closest('.prateleira-item-container');
        if (prateleiraItem) {
            const produtoId = prateleiraItem.dataset.productId;
            const produto = state.inventario.find(p => p.id === produtoId);

            selectedProductIdInSwiper = produtoId;
            viewNode.querySelectorAll('.selection-indicator').forEach(ind => ind.classList.remove('visible'));
            prateleiraItem.querySelector('.selection-indicator').classList.add('visible');

            if (produto) {
                abrirModalSeletorQuantidade(produto.nome, 0, (quantidade) => {
                    store.dispatch({ type: 'ADD_ORDER_ITEM', payload: { contaId, produto, quantidade } });
                    Toast.mostrarNotificacao(`${quantidade}x ${produto.nome} adicionado(s).`);
                });
            }
            return;
        }
        
        // --- LÓGICA RESTAURADA ---
        const itemActionsBtn = e.target.closest('.btn-item-actions');
        if (itemActionsBtn) {
            const pedidoId = itemActionsBtn.closest('.order-card').dataset.pedidoId;
            const pedido = conta.pedidos.find(p => p.id === pedidoId);
            if (pedido) {
                abrirModalAcoesPedido(pedido,
                    () => {
                        abrirModalSeletorQuantidade(pedido.nome, pedido.qtd, (novaQuantidade) => {
                            store.dispatch({ type: 'UPDATE_ORDER_ITEM_QTD', payload: { contaId, pedidoId, novaQuantidade } });
                        });
                    },
                    () => {
                        store.dispatch({ type: 'REMOVE_ORDER_ITEM', payload: { contaId, pedidoId } });
                    }
                );
            }
            return;
        }

        // --- LÓGICA RESTAURADA ---
        if (e.target.closest('.btn-client-actions')) {
            const botoesCliente = [
                { acao: 'ver_perfil', texto: 'Ver Perfil do Cliente', icone: 'lni-user', callback: () => Router.navigateTo(`#cliente-detalhes/${cliente.id}`) },
                { acao: 'trocar_titular', texto: 'Trocar Titular da Conta', icone: 'lni-users', callback: () => {
                    abrirModalTrocarCliente(conta, (novoTitular) => {
                        store.dispatch({ type: 'CHANGE_ACCOUNT_CLIENT', payload: { contaId: conta.id, novoClienteId: novoTitular.clienteId, novoClienteNome: novoTitular.clienteNome } });
                        Toast.mostrarNotificacao(`Conta transferida para ${novoTitular.clienteNome}.`);
                    });
                }}
            ];
            abrirModalAcoesFlutuantes('Ações do Cliente', botoesCliente);
            return;
        }

        // --- LÓGICA RESTAURADA ---
        if (e.target.closest('#btn-pagar')) {
            if(conta.pedidos.length > 0) abrirModalPagamento(conta);
            else Toast.mostrarNotificacao("Adicione pedidos à conta antes de pagar.", "erro");
            return;
        }
        
        if (e.target.closest('#btn-pagar-actions')) {
            const totalAPagar = conta.pedidos.reduce((total, p) => total + (p.preco * p.qtd), 0);
            if (totalAPagar <= 0) {
                return Toast.mostrarNotificacao("Adicione pedidos à conta antes de escolher uma ação.", "erro");
            }
            const botoesPagamento = [
                { 
                    acao: 'add_divida', 
                    texto: 'Adicionar Total à Dívida', 
                    icone: 'lni-book', 
                    cor: '#EF4444', 
                    callback: () => {
                        store.dispatch({ type: 'ADD_DEBT', payload: { clienteId: cliente.id, valor: totalAPagar, descricao: `Consumo da conta #${conta.nome}` } });
                        Toast.mostrarNotificacao(`Dívida de ${totalAPagar.toLocaleString('pt-AO',{style:'currency', currency:'AOA'})} adicionada a ${cliente.nome}.`);
                    }
                }
            ];
            abrirModalAcoesFlutuantes('Opções de Pagamento', botoesPagamento);
            return;
        }
    };
    
    viewNode.addEventListener('click', handleViewClick);
    updateView();

    unsubscribe = store.subscribe(() => { 
        if (!viewNode) return;
        const conta = store.getState().contasAtivas.find(c => c.id === contaAtivaId);
        
        if(!conta || conta.status === 'fechada') {
            Toast.mostrarNotificacao("Conta finalizada.", "sucesso");
            if(unsubscribe) unsubscribe(); 
            Router.navigateTo('#atendimento');
            return;
        }
        
        const orderListContainer = viewNode.querySelector('#order-list-container');
        if(orderListContainer) orderListContainer.innerHTML = renderOrderList(conta);

        const totalEl = viewNode.querySelector('.font-extrabold.text-2xl');
        if (totalEl) totalEl.textContent = conta.pedidos.reduce((total, p) => total + (p.preco * p.qtd), 0).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    });
};

export const unmount = () => { 
    if (unsubscribe) unsubscribe();
    if (prateleiraSwiper) prateleiraSwiper.destroy(true, true);
    
    const bottomNav = document.getElementById('bottom-nav');
    if (bottomNav) bottomNav.style.display = 'grid';

    unsubscribe = null;
    viewNode = null;
    contaAtivaId = null;
    prateleiraSwiper = null;
    activePrimaryCategoryId = null;
    activeSecondaryCategoryId = null;
    selectedProductIdInSwiper = null;
 };

export default { render, mount, unmount };