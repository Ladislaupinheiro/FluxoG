// /modules/features/financas/services/FinancialAnalyticsService.js
'use strict';

/**
 * Calcula as métricas financeiras (receita, lucro, despesas, etc.) para um determinado período.
 * Usado na AnálisesView.
 * @param {object} state 
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @param {string} categoria 
 * @returns {object} com o resumo financeiro.
 */
export function getFinancialMetricsForPeriod(state, startDate, endDate, categoria = 'all') {
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    let productIdsInCategory = null;
    if (categoria !== 'all') {
        productIdsInCategory = new Set(state.inventario.filter(p => p.categoria === categoria).map(p => p.id));
    }

    const fechosNoPeriodo = state.historicoFechos.filter(fecho => new Date(fecho.data) >= startDate && new Date(fecho.data) <= endDate);
    const despesasNoPeriodo = state.despesas.filter(despesa => new Date(despesa.data) >= startDate && new Date(despesa.data) <= endDate);

    const resumo = { 
        receitaTotal: 0, 
        lucroBrutoTotal: 0, 
        despesasTotais: 0,
        saldoFinal: 0,
        mediaDiaria: 0,
        diasOperacionais: new Set(fechosNoPeriodo.map(f => new Date(f.data).toDateString())).size
    };

    fechosNoPeriodo.forEach(fecho => {
        (fecho.contasFechadas || []).forEach(conta => {
            conta.pedidos.forEach(pedido => {
                if (!productIdsInCategory || productIdsInCategory.has(pedido.produtoId)) {
                    resumo.receitaTotal += pedido.preco * pedido.qtd;
                    resumo.lucroBrutoTotal += (pedido.preco - (pedido.custo || 0)) * pedido.qtd;
                }
            });
        });
    });

    // Adiciona pagamentos de dívidas à receita e ao lucro no período
    state.clientes.forEach(cliente => {
        (cliente.dividas || []).forEach(transacao => {
            if (transacao.tipo === 'credito') {
                const dataPagamento = new Date(transacao.data);
                if (dataPagamento >= startDate && dataPagamento <= endDate) {
                    const valorPago = Math.abs(transacao.valor);
                    resumo.receitaTotal += valorPago;
                    resumo.lucroBrutoTotal += valorPago; // Pagamento de dívida é considerado 100% lucro bruto no contexto do fluxo de caixa
                }
            }
        });
    });


    despesasNoPeriodo.forEach(despesa => { resumo.despesasTotais += despesa.valor || 0; });
    
    resumo.saldoFinal = resumo.lucroBrutoTotal - resumo.despesasTotais;
    if (resumo.diasOperacionais > 0) {
        resumo.mediaDiaria = resumo.receitaTotal / resumo.diasOperacionais;
    }

    return resumo;
}

/**
 * Gera os dados de tendência de vendas para o gráfico da AnálisesView.
 * @param {object} state 
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @param {string} categoria 
 * @returns {object} com 'labels' e 'data' para o gráfico.
 */
export function getSalesTrendForPeriod(state, startDate, endDate, categoria = 'all') {
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    let productIdsInCategory = null;
    if (categoria !== 'all') {
        productIdsInCategory = new Set(state.inventario.filter(p => p.categoria === categoria).map(p => p.id));
    }

    const salesByDay = {};
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        salesByDay[d.toISOString().split('T')[0]] = 0;
    }

    const processarVendasParaTrend = (contas) => {
        contas.forEach(conta => {
            const dayString = new Date(conta.dataFecho).toISOString().split('T')[0];
            if (salesByDay[dayString] !== undefined) {
                let dailyTotal = 0;
                conta.pedidos.forEach(pedido => {
                    if (!productIdsInCategory || productIdsInCategory.has(pedido.produtoId)) {
                        dailyTotal += pedido.preco * pedido.qtd;
                    }
                });
                salesByDay[dayString] += dailyTotal;
            }
        });
    };
    
    const fechosNoPeriodo = state.historicoFechos.flatMap(f => f.contasFechadas || []).filter(c => new Date(c.dataFecho) >= startDate && new Date(c.dataFecho) <= endDate);
    processarVendasParaTrend(fechosNoPeriodo);

    const contasDeHojeNoPeriodo = state.contasAtivas.filter(c => c.status === 'fechada' && new Date(c.dataFecho) >= startDate && new Date(c.dataFecho) <= endDate);
    processarVendasParaTrend(contasDeHojeNoPeriodo);

    const sortedDays = Object.keys(salesByDay).sort();
    const labels = sortedDays.map(day => new Date(day + 'T00:00:00').toLocaleDateString('pt-PT', { day: 'd', month: 'short' }));
    const data = sortedDays.map(day => salesByDay[day]);

    return { labels, data };
}