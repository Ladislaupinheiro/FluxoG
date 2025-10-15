// /modules/features/analises/AnálisesView.js
'use strict';

import store from '../../shared/services/Store.js';
import { getFinancialMetricsForPeriod, getSalesTrendForPeriod } from '../financas/services/FinancialAnalyticsService.js';
import { getProductPerformanceForPeriod } from '../inventario/services/ProductAnalyticsService.js';
import { getCustomerInsightsForPeriod } from '../clientes/services/ClientAnalyticsService.js';
import { abrirModalProductPerformance, abrirModalCustomerPerformance } from '../../shared/components/Modals.js';
import * as Toast from '../../shared/components/Toast.js';

let viewNode = null;
let performanceProdutosCache = null;
let insightsClientesCache = null;
let salesChart = null;


function renderChart(labels, data) {
    if (salesChart) {
        salesChart.destroy();
    }

    const ctx = viewNode.querySelector('#sales-trend-chart')?.getContext('2d');
    if (!ctx) return;

    const theme = document.documentElement.getAttribute('data-theme') || 'light';
    const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const fontColor = theme === 'dark' ? '#9ca3af' : '#6c757d';

    salesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Receita',
                data: data,
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Receita: ${(context.raw || 0).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: fontColor, callback: value => (value / 1000) + 'k' },
                    grid: { color: gridColor }
                },
                x: {
                    ticks: { color: fontColor },
                    grid: { display: false }
                }
            }
        }
    });
}


function updateView() {
    try {
        if (!viewNode) return;

        const state = store.getState();
        const periodoSelect = viewNode.querySelector('#periodo-analise-select');
        const categoriaSelect = viewNode.querySelector('#categoria-analise-select');
        if (!periodoSelect || !categoriaSelect) return;

        const periodoSelecionado = periodoSelect.value;
        const categoriaSelecionada = categoriaSelect.value;
        
        const endDate = new Date();
        let startDate = new Date();

        switch (periodoSelecionado) {
            case '7d': startDate.setDate(endDate.getDate() - 6); break;
            case '30d': startDate.setDate(endDate.getDate() - 29); break;
            case 'esteMes': startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1); break;
            case 'mesPassado':
                startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 1, 1);
                endDate = new Date(endDate.getFullYear(), endDate.getMonth(), 0);
                break;
        }

        const resumo = getFinancialMetricsForPeriod(state, new Date(startDate), new Date(endDate), categoriaSelecionada);
        performanceProdutosCache = getProductPerformanceForPeriod(state, new Date(startDate), new Date(endDate), categoriaSelecionada);
        insightsClientesCache = getCustomerInsightsForPeriod(state, new Date(startDate), new Date(endDate), categoriaSelecionada);
        const salesTrendData = getSalesTrendForPeriod(state, new Date(startDate), new Date(endDate), categoriaSelecionada);

        const formatCurrency = (value) => (value || 0).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
        
        const updateText = (id, text) => {
            const el = viewNode.querySelector(id);
            if (el) el.textContent = text;
        };

        updateText('#resumo-receita-total', formatCurrency(resumo.receitaTotal));
        updateText('#resumo-lucro-bruto', formatCurrency(resumo.lucroBrutoTotal));
        updateText('#resumo-despesas', `- ${formatCurrency(resumo.despesasTotais)}`);
        updateText('#resumo-saldo-final', formatCurrency(resumo.saldoFinal));
        updateText('#resumo-media-diaria', formatCurrency(resumo.mediaDiaria));
        updateText('#resumo-dias-operacionais', resumo.diasOperacionais);

        const topSeller = performanceProdutosCache.topSellers[0];
        const topProfit = performanceProdutosCache.topProfit[0];
        const zombieProduct = performanceProdutosCache.zombieProducts[0];
        updateText('#prod-top-vendas-nome', topSeller ? topSeller.nome : 'N/A');
        updateText('#prod-top-vendas-valor', topSeller ? `${topSeller.qtd} un.` : '');
        updateText('#prod-mais-rentavel-nome', topProfit ? topProfit.nome : 'N/A');
        updateText('#prod-mais-rentavel-valor', topProfit ? formatCurrency(topProfit.lucro) : '');
        updateText('#prod-zombie-nome', zombieProduct ? zombieProduct.nome : 'N/A');
        updateText('#prod-zombie-valor', zombieProduct && zombieProduct.ultimaVenda ? `Últ. venda: ${new Date(zombieProduct.ultimaVenda).toLocaleDateString('pt-PT')}` : (zombieProduct ? 'Nunca vendido' : ''));
        
        const topSpender = insightsClientesCache.topSpenders[0];
        updateText('#cliente-vip-nome', topSpender ? topSpender.nome : 'N/A');
        updateText('#cliente-vip-valor', topSpender ? formatCurrency(topSpender.gastoTotal) : '');
        updateText('#cliente-novos-valor', insightsClientesCache.newCustomersCount);

        renderChart(salesTrendData.labels, salesTrendData.data);
    } catch (error) {
        console.error("Erro ao atualizar a AnálisesView:", error);
        Toast.mostrarNotificacao("Ocorreu um erro ao carregar as análises.", "erro");
    }
}


function render() {
    const categorias = [...new Set(store.getState().inventario.map(p => p.categoria).filter(Boolean))];
    const categoriaOptionsHTML = categorias.map(c => `<option value="${c}">${c}</option>`).join('');

    return `
        <header class="p-4"><h2 class="text-2xl font-bold">Análises</h2></header>
        <section class="p-4 space-y-6 pb-20">
            <div class="bg-fundo-secundario p-4 rounded-lg shadow-md grid grid-cols-2 gap-4">
                <div>
                    <label for="periodo-analise-select" class="block text-sm font-medium mb-2">Período:</label>
                    <select id="periodo-analise-select" class="w-full p-2 border border-borda rounded-md bg-fundo-input">
                        <option value="7d">Últimos 7 dias</option>
                        <option value="30d" selected>Últimos 30 dias</option>
                        <option value="esteMes">Este Mês</option>
                        <option value="mesPassado">Mês Passado</option>
                    </select>
                </div>
                <div>
                    <label for="categoria-analise-select" class="block text-sm font-medium mb-2">Categoria:</label>
                    <select id="categoria-analise-select" class="w-full p-2 border border-borda rounded-md bg-fundo-input">
                        <option value="all">Todas as Categorias</option>
                        ${categoriaOptionsHTML}
                    </select>
                </div>
            </div>

            <div class="bg-fundo-secundario p-4 rounded-lg shadow-md">
                <h3 class="text-lg font-semibold mb-3">Tendências de Vendas</h3>
                <div class="h-48"><canvas id="sales-trend-chart"></canvas></div>
            </div>

            <div id="card-resumo-periodo" class="bg-fundo-secundario p-4 rounded-lg shadow-md space-y-4">
                <h3 class="text-lg font-semibold border-b border-borda pb-2">Resumo do Período</h3>
                <div class="grid grid-cols-2 gap-4 text-center">
                    <div><span id="resumo-receita-total" class="text-3xl font-bold block text-blue-500"></span><span class="text-xs text-texto-secundario">Receita (na categoria)</span></div>
                    <div><span id="resumo-lucro-bruto" class="text-3xl font-bold block text-green-500"></span><span class="text-xs text-texto-secundario">Lucro (na categoria)</span></div>
                </div>
                <div class="text-center"><span id="resumo-despesas" class="text-lg font-semibold block text-red-500"></span><span class="text-xs text-texto-secundario">Total Despesas (Geral)</span></div>
                <div class="bg-fundo-principal p-3 rounded-lg text-center mt-2"><span id="resumo-saldo-final" class="text-4xl font-extrabold block"></span><span class="text-sm font-bold text-texto-secundario">SALDO FINAL</span></div>
                <div class="grid grid-cols-2 gap-4 text-center pt-2 border-t border-borda text-sm">
                    <div><span id="resumo-media-diaria" class="font-bold block"></span><span class="text-texto-secundario">Média Diária</span></div>
                    <div><span id="resumo-dias-operacionais" class="font-bold block"></span><span class="text-texto-secundario">Dias Operacionais</span></div>
                </div>
            </div>

            <div class="bg-fundo-secundario p-4 rounded-lg shadow-md">
                <h3 class="text-lg font-semibold mb-3">Performance de Produtos</h3>
                <div class="space-y-3">
                    <div class="flex items-center gap-3"><i class="lni lni-arrow-up-circle text-2xl text-blue-500"></i><div><p id="prod-top-vendas-nome" class="font-bold"></p><p class="text-xs text-texto-secundario">Top Vendas (Qtd): <strong id="prod-top-vendas-valor"></strong></p></div></div>
                    <div class="flex items-center gap-3"><i class="lni lni-revenue text-2xl text-green-500"></i><div><p id="prod-mais-rentavel-nome" class="font-bold"></p><p class="text-xs text-texto-secundario">Mais Rentável (Lucro): <strong id="prod-mais-rentavel-valor"></strong></p></div></div>
                    <div class="flex items-center gap-3"><i class="lni lni-ghost text-2xl text-gray-400"></i><div><p id="prod-zombie-nome" class="font-bold"></p><p id="prod-zombie-valor" class="text-xs text-texto-secundario"></p></div></div>
                </div>
                 <div class="text-center mt-4 pt-2 border-t border-borda"><button id="btn-ver-detalhe-produtos" class="text-sm text-blue-600 dark:text-blue-400 font-semibold hover:underline">Ver relatório detalhado</button></div>
            </div>
            
            <div class="bg-fundo-secundario p-4 rounded-lg shadow-md">
                <h3 class="text-lg font-semibold mb-3">Performance de Clientes</h3>
                <div class="space-y-3">
                    <div class="flex items-center gap-3"><i class="lni lni-crown text-2xl text-yellow-500"></i><div><p id="cliente-vip-nome" class="font-bold"></p><p class="text-xs text-texto-secundario">Cliente VIP (Gasto): <strong id="cliente-vip-valor"></strong></p></div></div>
                    <div class="flex items-center gap-3"><i class="lni lni-users text-2xl text-blue-500"></i><div><p class="font-bold"><span id="cliente-novos-valor"></span> Novos Clientes</p><p class="text-xs text-texto-secundario">Registados no período</p></div></div>
                </div>
                <div class="text-center mt-4 pt-2 border-t border-borda"><button id="btn-ver-detalhe-clientes" class="text-sm text-blue-600 dark:text-blue-400 font-semibold hover:underline">Ver relatório detalhado</button></div>
            </div>
        </section>
    `;
}

async function mount() {
    viewNode = document.getElementById('app-root');
    
    await Promise.resolve();

    viewNode.querySelector('#periodo-analise-select')?.addEventListener('change', updateView);
    viewNode.querySelector('#categoria-analise-select')?.addEventListener('change', updateView);

    viewNode.querySelector('#btn-ver-detalhe-produtos')?.addEventListener('click', () => {
        if (performanceProdutosCache) {
            const select = viewNode.querySelector('#periodo-analise-select');
            const periodoTexto = select.options[select.selectedIndex].text;
            abrirModalProductPerformance(performanceProdutosCache, periodoTexto);
        }
    });

    viewNode.querySelector('#btn-ver-detalhe-clientes')?.addEventListener('click', () => {
        if (insightsClientesCache) {
            const select = viewNode.querySelector('#periodo-analise-select');
            const periodoTexto = select.options[select.selectedIndex].text;
            abrirModalCustomerPerformance(insightsClientesCache, periodoTexto);
        }
    });

    updateView();
}

function unmount() {
    if (salesChart) {
        salesChart.destroy();
        salesChart = null;
    }
    viewNode = null;
    performanceProdutosCache = null;
    insightsClientesCache = null;
}

export default { render, mount, unmount };