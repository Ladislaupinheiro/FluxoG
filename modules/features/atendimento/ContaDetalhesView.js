// /modules/features/atendimento/ContaDetalhesView.js (FINAL E FUNCIONAL)
'use strict';

import store from '../../shared/services/Store.js';
import Router from '../../app/Router.js';
import { 
    abrirModalPagamento, 
    abrirModalSeletorQuantidade, 
    abrirModalAcoesPedido,
    abrirModalAcoesFlutuantes,
    abrirModalTrocarCliente,
    abrirModalAddDivida
} from '../../shared/components/Modals.js';
import * as Toast from '../../shared/components/Toast.js';

let unsubscribe = null;
let viewNode = null;
let contaAtivaId = null;
let prateleiraSwiper = null;

// Estado local da View para gerir a navegação de categorias
let activePrimaryCategoryId = null;
let activeSecondaryCategoryId = null;

/**
 * Renderiza os filtros de categoria primários e secundários.
 */
function renderCategoryFilters() {
    const state = store.getState();
    const categoriasPrimarias = state.categoriasDeProduto.filter(c => !c.parentId);
    
    if (categoriasPrimarias.length > 0 && !activePrimaryCategoryId) {
        activePrimaryCategoryId = categoriasPrimarias[0].id;
    }

    const categoriasSecundarias = state.categoriasDeProduto.filter(c => c.parentId === activePrimaryCategoryId);
    
    if (categoriasSecundarias.length > 0 && !activeSecondaryCategoryId) {
        activeSecondaryCategoryId = categoriasSecundarias[0].id;
    }

    const primaryFiltersHTML = categoriasPrimarias.map(cat => `
        <button class="primary-filter-btn px-4 py-1 text-sm font-semibold rounded-lg border-2 whitespace-nowrap ${activePrimaryCategoryId === cat.id ? 'text-white' : ''}" 
                style="${activePrimaryCategoryId === cat.id ? `background-color: ${cat.cor}; border-color: ${cat.cor};` : `border-color: ${cat.cor}; color: ${cat.cor};`}"
                data-category-id="${cat.id}">
            ${cat.nome}
        </button>
    `).join('');

    const secondaryFiltersHTML = categoriasSecundarias.map(cat => `
        <button class="secondary-filter-btn px-4 py-1 text-sm font-semibold rounded-lg border whitespace-nowrap ${activeSecondaryCategoryId === cat.id ? 'bg-gray-200 dark:bg-gray-700 border-gray-400' : 'border-gray-300 dark:border-gray-600'}"
                data-category-id="${cat.id}">
            ${cat.nome}
        </button>
    `).join('');
    
    return { primaryFiltersHTML, secondaryFiltersHTML };
}

/**
 * Renderiza a prateleira de produtos com base na categoria secundária ativa.
 */
function renderPrateleira() {
    if (!viewNode || !activeSecondaryCategoryId) return;

    const state = store.getState();
    const categoriaSecundaria = state.categoriasDeProduto.find(c => c.id === activeSecondaryCategoryId);
    if (!categoriaSecundaria) return;

    const produtosDaCategoria = state.inventario.filter(p => p.tags && p.tags.includes(categoriaSecundaria.nome.toLowerCase()));
    const prateleiraWrapper = viewNode.querySelector('#prateleira-swiper-wrapper');

    if (!prateleiraWrapper) return;
    
    if (produtosDaCategoria.length === 0) {
        prateleiraWrapper.innerHTML = `<div class="swiper-slide flex items-center justify-center text-texto-secundario">Nenhum produto nesta categoria.</div>`;
    } else {
        prateleiraWrapper.innerHTML = produtosDaCategoria.map(p => {
            return `
            <div class="swiper-slide">
                <button class="prateleira-btn w-full h-full flex flex-col items-center justify-center rounded-lg p-2 text-center bg-fundo-principal border border-borda" data-product-id="${p.id}">
                    <span class="font-bold text-sm leading-tight">${p.nome}</span>
                    <div class="flex gap-2 mt-1">
                        <span class="text-xs font-mono bg-green-100 text-green-800 px-1 rounded">LOJ ${p.stockLoja}</span>
                        <span class="text-xs font-mono bg-blue-100 text-blue-800 px-1 rounded">ARM ${p.stockArmazem}</span>
                    </div>
                </button>
            </div>
        `}).join('');
    }
    if (prateleiraSwiper) {
        prateleiraSwiper.update();
        prateleiraSwiper.slideTo(0);
    }
}


/**
 * Renderiza a lista de pedidos agrupados por categoria.
 */
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
            pedidosAgrupados[grupoId] = { 
                nome: categoriaPrimaria ? categoriaPrimaria.nome : 'Outros',
                cor: categoriaPrimaria ? categoriaPrimaria.cor : '#808080',
                items: [] 
            };
        }
        pedidosAgrupados[grupoId].items.push(item);
    });

    return Object.values(pedidosAgrupados).map(grupo => {
        const itemsHTML = grupo.items.map(item => `
            <div class="p-3 rounded-lg flex justify-between items-center" style="background-color: ${grupo.cor}33;">
                <div>
                    <span class="font-bold">${item.qtd}x ${item.nome}</span>
                    <p class="text-sm font-semibold">${(item.preco * item.qtd).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p>
                </div>
                <button class="btn-item-actions text-xl p-2 -mr-2" data-pedido-id="${item.id}"><i class="lni lni-more-alt"></i></button>
            </div>
        `).join('');

        return `
            <div class="space-y-2">
                <h3 class="font-bold text-texto-secundario">${grupo.nome}</h3>
                ${itemsHTML}
            </div>
        `;
    }).join('<hr class="my-3 border-borda">');
}

function render(contaId) {
    const state = store.getState();
    const conta = state.contasAtivas.find(c => c.id === contaId);
    const cliente = conta ? state.clientes.find(c => c.id === conta.clienteId) : null;
    if (!conta || !cliente) return `<p class="p-4 text-center">Conta ou cliente não encontrado.</p>`;

    const { primaryFiltersHTML, secondaryFiltersHTML } = renderCategoryFilters();
    const totalAPagar = conta.pedidos.reduce((total, p) => total + (p.preco * p.qtd), 0);

    return `
        <style>
            .category-filters::-webkit-scrollbar { display: none; }
            .prateleira-btn { min-width: 100px; }
        </style>

        <header class="p-4 sticky top-0 bg-fundo-principal z-10 shadow-sm space-y-3">
            <div class="flex items-center gap-2">
                <button id="btn-voltar-atendimento" class="p-2 -ml-2 text-2xl text-texto-secundario"><i class="lni lni-arrow-left"></i></button>
                <div id="primary-filters-container" class="category-filters flex gap-2 overflow-x-auto">
                    ${primaryFiltersHTML}
                </div>
            </div>
            <div id="secondary-filters-container" class="category-filters flex gap-2 overflow-x-auto">
                ${secondaryFiltersHTML}
            </div>
        </header>

        <main class="p-4 space-y-4">
            <div class="bg-fundo-secundario p-4 rounded-lg shadow-md">
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-2">
                        <img src="${cliente.fotoDataUrl || './icons/logo-small-192.png'}" alt="Foto de ${cliente.nome}" class="w-10 h-10 rounded-full object-cover bg-fundo-principal">
                        <span class="font-bold text-lg">${cliente.nome}</span>
                        <button class="btn-client-actions text-texto-secundario p-1 -ml-1"><i class="lni lni-chevron-down"></i></button>
                    </div>
                    <div class="text-right">
                         <span class="text-xs">Total a pagar</span>
                         <span class="font-extrabold text-2xl block text-green-500">${totalAPagar.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                    </div>
                </div>
                <hr class="my-4 border-borda">
                <div id="order-list-container" class="space-y-4 max-h-[calc(100vh-480px)] overflow-y-auto">
                    ${renderOrderList(conta)}
                </div>
            </div>
        </main>

        <footer class="fixed bottom-0 left-0 w-full bg-fundo-secundario shadow-lg p-4 space-y-2 border-t border-borda">
            <div id="prateleira-swiper" class="swiper h-20">
                <div id="prateleira-swiper-wrapper" class="swiper-wrapper"></div>
            </div>
            <div class="flex gap-2">
                <button id="btn-pagar" class="flex-grow bg-blue-600 text-white font-bold py-3 rounded-lg shadow-lg">Pagar</button>
                <button id="btn-pagar-actions" class="w-12 bg-blue-800 text-white font-bold py-3 rounded-lg shadow-lg"><i class="lni lni-chevron-down"></i></button>
            </div>
        </footer>
    `;
}

function mount(contaId) {
    viewNode = document.getElementById('app-root');
    contaAtivaId = contaId;
    activePrimaryCategoryId = null;
    activeSecondaryCategoryId = null;

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
            slidesPerView: 'auto',
            spaceBetween: 8,
        });
    };
    
    const handleViewClick = (e) => {
        const state = store.getState();
        const conta = state.contasAtivas.find(c => c.id === contaAtivaId);
        const cliente = conta ? state.clientes.find(c => c.id === conta.clienteId) : null;
        if (!conta || !cliente) return;

        if (e.target.closest('#btn-voltar-atendimento')) { Router.navigateTo('#atendimento'); return; }
        
        const primaryFilterBtn = e.target.closest('.primary-filter-btn');
        if (primaryFilterBtn) {
            activePrimaryCategoryId = primaryFilterBtn.dataset.categoryId;
            activeSecondaryCategoryId = null;
            updateView();
            return;
        }

        const secondaryFilterBtn = e.target.closest('.secondary-filter-btn');
        if (secondaryFilterBtn) {
            activeSecondaryCategoryId = secondaryFilterBtn.dataset.categoryId;
            viewNode.querySelectorAll('.secondary-filter-btn').forEach(btn => {
                const isActive = btn.dataset.categoryId === activeSecondaryCategoryId;
                btn.classList.toggle('bg-gray-200', isActive);
                btn.classList.toggle('dark:bg-gray-700', isActive);
                btn.classList.toggle('border-gray-400', isActive);
            });
            renderPrateleira();
            return;
        }

        const prateleiraBtn = e.target.closest('.prateleira-btn');
        if (prateleiraBtn) {
            const produtoId = prateleiraBtn.dataset.productId;
            const produto = state.inventario.find(p => p.id === produtoId);
            if (produto) {
                abrirModalSeletorQuantidade(produto.nome, 0, (quantidade) => {
                    store.dispatch({ type: 'ADD_ORDER_ITEM', payload: { contaId, produto, quantidade } });
                    Toast.mostrarNotificacao(`${quantidade}x ${produto.nome} adicionado(s).`);
                });
            }
            return;
        }
        
        const itemActionsBtn = e.target.closest('.btn-item-actions');
        if (itemActionsBtn) {
            const pedidoId = itemActionsBtn.dataset.pedidoId;
            const pedido = conta.pedidos.find(p => p.id === pedidoId);
            if (pedido) {
                abrirModalAcoesPedido(pedido,
                    () => { // onEdit
                        abrirModalSeletorQuantidade(pedido.nome, pedido.qtd, (novaQuantidade) => {
                            store.dispatch({ type: 'UPDATE_ORDER_ITEM_QTD', payload: { contaId, pedidoId, novaQuantidade } });
                            Toast.mostrarNotificacao(`Quantidade de ${pedido.nome} atualizada.`);
                        });
                    },
                    () => { // onRemove
                        store.dispatch({ type: 'REMOVE_ORDER_ITEM', payload: { contaId, pedidoId } });
                        Toast.mostrarNotificacao(`${pedido.nome} removido da conta.`);
                    }
                );
            }
            return;
        }

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

        if (e.target.closest('#btn-pagar')) {
            if(conta.pedidos.length > 0) abrirModalPagamento(conta);
            else Toast.mostrarNotificacao("Adicione pedidos à conta antes de pagar.", "erro");
            return;
        }
        
        if (e.target.closest('#btn-pagar-actions')) {
            const totalAPagar = conta.pedidos.reduce((total, p) => total + (p.preco * p.qtd), 0);
            if (totalAPagar <= 0) {
                return Toast.mostrarNotificacao("Adicione pedidos à conta antes de escolher uma ação de pagamento.", "erro");
            }
            const botoesPagamento = [
                { acao: 'add_divida', texto: 'Adicionar Total à Dívida', icone: 'lni-book', cor: '#EF4444', callback: () => {
                    abrirModalAddDivida(cliente, { valor: totalAPagar, descricao: 'Consumo na conta' });
                    // Futuro: poderia fechar a conta automaticamente após adicionar à dívida.
                }},
                { acao: 'pagar_tpa', texto: 'Pagar com TPA', icone: 'lni-credit-cards', cor: '#3B82F6', callback: () => abrirModalPagamento(conta, 'TPA') },
                { acao: 'pagar_numerario', texto: 'Pagar com Numerário', icone: 'lni-money-location', cor: '#10B981', callback: () => abrirModalPagamento(conta, 'Numerário') }
            ];
            abrirModalAcoesFlutuantes('Opções de Pagamento', botoesPagamento);
            return;
        }
    };
    
    viewNode.addEventListener('click', handleViewClick);
    
    updateView();
    unsubscribe = store.subscribe(() => {
        // Uma subscrição mais simples que apenas atualiza a view sem resetar os filtros
        const conta = store.getState().contasAtivas.find(c => c.id === contaAtivaId);
        if(!conta) {
            if(unsubscribe) unsubscribe(); // Evita loop se a conta for fechada
            Router.navigateTo('#atendimento');
            return;
        }
        viewNode.querySelector('#order-list-container').innerHTML = renderOrderList(conta);
        const totalEl = viewNode.querySelector('.font-extrabold.text-2xl');
        if (totalEl) {
            totalEl.textContent = conta.pedidos.reduce((total, p) => total + (p.preco * p.qtd), 0).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
        }
    });

    const originalUnmount = unmount;
    unmount = () => {
        if(viewNode) viewNode.removeEventListener('click', handleViewClick);
        originalUnmount();
    };
}

function unmount() {
    if (unsubscribe) unsubscribe();
    if (prateleiraSwiper) prateleiraSwiper.destroy(true, true);
    unsubscribe = null;
    viewNode = null;
    contaAtivaId = null;
    prateleiraSwiper = null;
}

export default { render, mount, unmount };