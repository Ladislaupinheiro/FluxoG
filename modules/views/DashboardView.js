// /modules/views/DashboardView.js - A View Reativa do Dashboard (v7.0 - Final)
'use strict';

import store from '../services/Store.js';
import * as TipsService from '../services/TipsService.js';
import * as Modals from '../components/Modals.js';
import * as Toast from '../components/Toast.js';

const sel = {};

/**
 * Guarda as referências aos elementos do DOM necessários para o Dashboard.
 */
function querySelectors() {
    sel.dbVendasTotal = document.getElementById('db-vendas-total');
    sel.dbVendasNumerario = document.getElementById('db-vendas-numerario');
    sel.dbVendasTpa = document.getElementById('db-vendas-tpa');
    sel.dbContasAtivas = document.getElementById('db-contas-ativas');
    sel.dbAlertasStock = document.getElementById('db-alertas-stock');
    sel.dbTopProdutoNome = document.getElementById('db-top-produto-nome');
    sel.dbTopProdutoQtd = document.getElementById('db-top-produto-qtd');
    sel.btnVerDica = document.getElementById('btn-ver-dica');
    sel.dbProfilePic = document.getElementById('db-profile-pic');
    sel.dbBusinessName = document.getElementById('db-business-name');
}

/**
 * Função principal de renderização para a View do Dashboard.
 * Lê o estado atual do store, calcula as métricas e atualiza o DOM.
 */
function render() {
    const state = store.getState();
    const { contasAtivas, inventario, config } = state;

    // Renderiza a área de perfil
    if (config) {
        sel.dbBusinessName.textContent = config.businessName || 'O Meu Bar';
        sel.dbProfilePic.src = config.profilePicDataUrl || 'icons/logo-small-192.png';
    }

    // 1. Calcula as Vendas de Hoje a partir das contas fechadas (LÓGICA CORRIGIDA)
    const hojeString = new Date().toDateString();
    const contasFechadasHoje = contasAtivas.filter(c => 
        c.status === 'fechada' && new Date(c.dataFecho).toDateString() === hojeString
    );

    const totais = contasFechadasHoje.reduce((acc, conta) => {
        const valor = conta.valorFinal || 0;
        acc.totalVendas += valor;
        if (conta.metodoPagamento === 'Numerário') acc.totalNumerario += valor;
        else if (conta.metodoPagamento === 'TPA') acc.totalTpa += valor;
        return acc;
    }, { totalVendas: 0, totalNumerario: 0, totalTpa: 0 });

    // 2. Calcula o número de Contas Ativas
    const numContasAtivas = contasAtivas.filter(c => c.status === 'ativa').length;

    // 3. Calcula o número de Alertas de Stock na geleira
    const numAlertasStock = inventario.filter(item => item.stockGeleira > 0 && item.stockGeleira <= item.stockMinimo).length;

    // 4. Calcula o Produto Mais Vendido do dia
    const produtosVendidos = contasFechadasHoje.flatMap(c => c.pedidos).reduce((acc, pedido) => {
        acc[pedido.nome] = (acc[pedido.nome] || 0) + pedido.qtd;
        return acc;
    }, {});
    const [topProdutoNome = '—', topProdutoQtd = 0] = Object.entries(produtosVendidos).reduce((a, b) => b[1] > a[1] ? b : a, [null, 0]);


    // 5. Atualiza o DOM com os novos valores calculados
    sel.dbVendasTotal.textContent = totais.totalVendas.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    sel.dbVendasNumerario.textContent = totais.totalNumerario.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    sel.dbVendasTpa.textContent = totais.totalTpa.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    sel.dbContasAtivas.textContent = numContasAtivas;
    sel.dbAlertasStock.textContent = numAlertasStock;
    sel.dbTopProdutoNome.textContent = topProdutoNome;
    sel.dbTopProdutoQtd.textContent = `${topProdutoQtd} vendidos`;
}


/**
 * Função de inicialização da View.
 */
function init() {
    querySelectors();
    store.subscribe(render);
    
    sel.btnVerDica.addEventListener('click', async () => {
        const dica = await TipsService.getDailyTip();
        if (dica) {
            Modals.abrirModalDicaDoDia(dica);
        } else {
            Toast.mostrarNotificacao("Não foi possível carregar a dica de hoje.", "erro");
        }
    });

    render(); // Renderiza o estado inicial
}

export default { init };