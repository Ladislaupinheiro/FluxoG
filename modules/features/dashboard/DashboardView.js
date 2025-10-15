// /modules/features/dashboard/DashboardView.js
'use strict';

import store from '../../shared/services/Store.js';
import * as TipsService from '../../shared/services/TipsService.js';
import { abrirModalDicaDoDia, abrirModalEditBusinessName } from '../../shared/components/Modals.js';
import { mostrarNotificacao } from '../../shared/components/Toast.js';
import Router from '../../app/Router.js';
import { getTopSellingProductsToday } from '../inventario/services/ProductAnalyticsService.js';

let unsubscribe = null;
let swiperAlertas = null;
let swiperTopProdutos = null;

function updateDOM() {
    const state = store.getState();
    const { contasAtivas, inventario, config } = state;

    document.getElementById('header-profile-pic').src = config.profilePicDataUrl || 'icons/logo-small-192.png';
    document.getElementById('header-business-name-display').textContent = config.businessName || 'O Meu Bar';

    const hojeString = new Date().toDateString();
    const contasFechadasHoje = contasAtivas.filter(c => c.status === 'fechada' && new Date(c.dataFecho).toDateString() === hojeString);
    const totaisVendas = contasFechadasHoje.reduce((acc, conta) => {
        acc.total += conta.valorFinal;
        if (conta.metodoPagamento === 'Numerário') acc.numerario += conta.valorFinal;
        else if (conta.metodoPagamento === 'TPA') acc.tpa += conta.valorFinal;
        return acc;
    }, { total: 0, numerario: 0, tpa: 0 });
    document.getElementById('db-vendas-total').textContent = totaisVendas.total.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    document.getElementById('db-vendas-numerario').textContent = totaisVendas.numerario.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    document.getElementById('db-vendas-tpa').textContent = totaisVendas.tpa.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });

    const contasRealmenteAtivas = contasAtivas.filter(c => c.status === 'ativa');
    const valorTotalEmAberto = contasRealmenteAtivas.reduce((sum, c) => sum + c.pedidos.reduce((sub, p) => sub + (p.preco * p.qtd), 0), 0);
    const contaMaisValiosa = contasRealmenteAtivas.reduce((max, c) => {
        const subtotal = c.pedidos.reduce((sub, p) => sub + (p.preco * p.qtd), 0);
        return subtotal > max.valor ? { nome: c.nome, valor: subtotal } : max;
    }, { nome: '—', valor: 0 });
    
    document.getElementById('pulso-valor-aberto').textContent = valorTotalEmAberto.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    document.getElementById('pulso-contas-ativas').textContent = `${contasRealmenteAtivas.length} Contas Ativas`;
    document.getElementById('pulso-maior-valor').textContent = `${contaMaisValiosa.nome} (${contaMaisValiosa.valor.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })})`;

    const produtosPopulares = getTopSellingProductsToday(state);
    const alertasStock = inventario.filter(item => item.stockLoja > 0 && item.stockLoja <= item.stockMinimo);
    const alertasPrioritarios = alertasStock
        .map(alerta => {
            const popularidade = produtosPopulares.findIndex(([nome]) => nome === alerta.nome);
            return { ...alerta, prioridade: popularidade === -1 ? Infinity : popularidade };
        })
        .sort((a, b) => a.prioridade - b.prioridade);

    const swiperWrapperAlertas = document.querySelector('#swiper-alertas .swiper-wrapper');
    swiperWrapperAlertas.innerHTML = '';
    if (alertasPrioritarios.length === 0) {
        swiperWrapperAlertas.innerHTML = `<div class="swiper-slide text-center p-4">Nenhum alerta de stock na loja.</div>`;
    } else {
        alertasPrioritarios.forEach(item => {
            const slide = `
                <div class="swiper-slide cursor-pointer text-center" data-product-id="${item.id}">
                    <p class="font-bold text-lg">${item.nome}</p>
                    <p class="text-red-500 font-semibold">Restam apenas: ${item.stockLoja}</p>
                    <p class="text-xs text-texto-secundario mt-2">Toque para ver no inventário</p>
                </div>`;
            swiperWrapperAlertas.insertAdjacentHTML('beforeend', slide);
        });
    }
    if (swiperAlertas) swiperAlertas.update();

    const swiperWrapperTopProdutos = document.querySelector('#swiper-top-produtos .swiper-wrapper');
    swiperWrapperTopProdutos.innerHTML = '';
    if (produtosPopulares.length === 0) {
        swiperWrapperTopProdutos.innerHTML = `<div class="swiper-slide text-center p-4">Nenhuma venda registada hoje.</div>`;
    } else {
        const topProdutosSlide = produtosPopulares.slice(0, 3).map(([nome, qtd], index) => `
            <div class="flex justify-between items-center">
                <p class="font-bold"><span class="text-blue-500">${index + 1}.</span> ${nome}</p>
                <p class="font-semibold text-sm">${qtd} un.</p>
            </div>
        `).join('');
        swiperWrapperTopProdutos.innerHTML = `<div class="swiper-slide space-y-2">${topProdutosSlide}</div>`;
        
        if (produtosPopulares.length > 3) {
            const outrosProdutosSlide = produtosPopulares.slice(3).map(([nome, qtd], index) => `
                <div class="flex justify-between items-center text-sm">
                    <p class="font-semibold"><span class="text-texto-secundario">${index + 4}.</span> ${nome}</p>
                    <p class="font-medium text-texto-secundario">${qtd} un.</p>
                </div>
            `).join('');
            swiperWrapperTopProdutos.insertAdjacentHTML('beforeend', `<div class="swiper-slide space-y-2">${outrosProdutosSlide}</div>`);
        }
    }
    if (swiperTopProdutos) swiperTopProdutos.update();
}

function render() {
    const businessName = store.getState().config.businessName || 'O Meu Bar';
    const profilePicSrc = store.getState().config.profilePicDataUrl || 'icons/logo-small-192.png';

    return `
        <header id="main-header" class="flex items-center gap-3 p-4">
            <div class="relative">
                <img id="header-profile-pic" src="${profilePicSrc}" alt="Logo" class="w-12 h-12 rounded-full object-cover bg-fundo-secundario cursor-pointer">
                <input type="file" id="header-input-change-pic" class="hidden" accept="image/*">
            </div>
            <div>
                 <span id="header-business-name-display" class="font-bold block text-lg cursor-pointer">${businessName}</span>
            </div>
            <div class="flex-grow"></div>
            <button id="btn-settings" aria-label="Configurações" class="text-texto-secundario hover:text-primaria text-2xl"><i class="lni lni-cog"></i></button>
        </header>

        <section id="tab-dashboard" class="p-4 space-y-4">
            <div class="bg-fundo-secundario p-4 rounded-lg shadow-md text-center">
                <p class="text-sm font-semibold text-texto-secundario">Vendas de Hoje</p>
                <span id="db-vendas-total" class="block text-5xl font-bold text-blue-600 dark:text-blue-500 my-2"></span>
                <div class="flex justify-center gap-6 text-sm text-texto-secundario pt-2 border-t border-borda mt-2">
                    <span class="flex items-center gap-2"><i class="lni lni-money-location text-green-500 text-xl"></i><b id="db-vendas-numerario" class="font-semibold"></b></span>
                    <span class="flex items-center gap-2"><i class="lni lni-credit-cards text-blue-500 text-xl"></i><b id="db-vendas-tpa" class="font-semibold"></b></span>
                </div>
            </div>

            <div class="bg-fundo-secundario p-4 rounded-lg shadow-md">
                <h3 class="text-sm font-semibold text-texto-secundario mb-2">Pulso do Atendimento</h3>
                <div class="text-center border-b border-borda pb-2 mb-2">
                    <span id="pulso-valor-aberto" class="text-3xl font-bold text-green-600"></span>
                    <p class="text-xs text-texto-secundario">Valor em Aberto</p>
                </div>
                <div class="text-xs text-texto-secundario space-y-1">
                    <p><i class="lni lni-restaurant"></i> <strong id="pulso-contas-ativas"></strong></p>
                    <p><i class="lni lni-crown"></i> Maior Valor: <strong id="pulso-maior-valor"></strong></p>
                </div>
            </div>
            
            <div class="bg-fundo-secundario p-4 rounded-lg shadow-md">
                <h3 class="text-sm font-semibold text-texto-secundario mb-2"><i class="lni lni-warning text-red-500"></i> Alerta Prioritário de Stock</h3>
                <div id="swiper-alertas" class="swiper relative pb-6" style="--swiper-pagination-color: var(--cor-primaria); --swiper-pagination-bullet-size: 6px;">
                    <div class="swiper-wrapper"></div>
                    <div class="swiper-pagination"></div>
                </div>
            </div>

            <div class="bg-fundo-secundario p-4 rounded-lg shadow-md">
                <h3 class="text-sm font-semibold text-texto-secundario mb-2"><i class="lni lni-trophy text-yellow-500"></i> Top Produtos do Dia</h3>
                <div id="swiper-top-produtos" class="swiper relative pb-6" style="--swiper-pagination-color: var(--cor-primaria); --swiper-pagination-bullet-size: 6px;">
                    <div class="swiper-wrapper"></div>
                    <div class="swiper-pagination"></div>
                </div>
            </div>

            <div class="bg-fundo-secundario p-4 rounded-lg shadow-md flex items-center gap-4">
                <div class="text-blue-500 text-3xl"><i class="lni lni-bulb"></i></div>
                <div>
                    <h3 class="font-bold">Dica de Gestão</h3>
                    <p id="btn-ver-dica" class="text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">Ver a dica do dia</p>
                </div>
            </div>
        </section>
    `;
}

function mount() {
    updateDOM();
    unsubscribe = store.subscribe(updateDOM);

    swiperAlertas = new Swiper('#swiper-alertas', {
        pagination: { el: '#swiper-alertas .swiper-pagination', clickable: true },
        autoplay: { delay: 7000, disableOnInteraction: true },
    });
    swiperTopProdutos = new Swiper('#swiper-top-produtos', {
        pagination: { el: '#swiper-top-produtos .swiper-pagination', clickable: true },
    });

    const headerProfilePic = document.getElementById('header-profile-pic');
    const headerInputChangePic = document.getElementById('header-input-change-pic');
    headerProfilePic?.addEventListener('click', () => headerInputChangePic.click());
    headerInputChangePic?.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => store.dispatch({ type: 'UPDATE_CONFIG', payload: { profilePicDataUrl: e.target.result } });
        reader.readAsDataURL(file);
    });

    document.getElementById('header-business-name-display')?.addEventListener('click', () => {
        abrirModalEditBusinessName(store.getState().config.businessName || 'O Meu Bar');
    });

    document.getElementById('btn-settings')?.addEventListener('click', () => Router.navigateTo('#settings'));
    
    document.getElementById('btn-ver-dica')?.addEventListener('click', async () => {
        const dica = await TipsService.getDailyTip();
        if (dica) abrirModalDicaDoDia(dica);
    });

    document.getElementById('swiper-alertas')?.addEventListener('click', (event) => {
        const slide = event.target.closest('.swiper-slide');
        if (slide && slide.dataset.productId) {
            Router.navigateTo(`#inventario/${slide.dataset.productId}`);
        }
    });
}

function unmount() {
    if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
    }
    if (swiperAlertas) {
        swiperAlertas.destroy(true, true);
        swiperAlertas = null;
    }
    if (swiperTopProdutos) {
        swiperTopProdutos.destroy(true, true);
        swiperTopProdutos = null;
    }
}

export default {
    render,
    mount,
    unmount
};