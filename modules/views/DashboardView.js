// /modules/views/DashboardView.js - A View Reativa do Dashboard (v7.0 - Final)
'use strict';

import store from '../services/Store.js';

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
}

/**
 * Função principal de renderização para a View do Dashboard.
 * Lê o estado atual do store, calcula as métricas e atualiza o DOM.
 */
function render() {
    const state = store.getState();
    const { contasAtivas, inventario } = state;

    // 1. Calcula as Vendas de Hoje a partir das contas fechadas
    const contasFechadasHoje = contasAtivas.filter(c => c.status === 'fechada');
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
 * Apenas se inscreve nas atualizações do store.
 */
function init() {
    querySelectors();
    store.subscribe(render);
    render(); // Renderiza o estado inicial
}

export default { init };