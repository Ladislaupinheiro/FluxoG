// /modules/services/AnalyticsService.js
'use strict';

// As funções getRankedProductsBySales, getRankedClients, e calcularEstatisticasCliente permanecem inalteradas.
export function getRankedProductsBySales(state) {
    const hojeString = new Date().toDateString();
    const contasFechadasHoje = state.contasAtivas.filter(c => 
        c.status === 'fechada' && new Date(c.dataFecho).toDateString() === hojeString
    );
    const produtosVendidos = contasFechadasHoje.flatMap(c => c.pedidos).reduce((acc, pedido) => {
        acc[pedido.nome] = (acc[pedido.nome] || 0) + pedido.qtd;
        return acc;
    }, {});
    return Object.entries(produtosVendidos).sort(([, a], [, b]) => b - a);
}
export function getRankedClients(state) {
    const { clientes, historicoFechos } = state;
    const gastosPorCliente = {};
    historicoFechos.forEach(fecho => {
        (fecho.contasFechadas || []).forEach(conta => {
            if (conta.clienteId) {
                gastosPorCliente[conta.clienteId] = (gastosPorCliente[conta.clienteId] || 0) + conta.valorFinal;
            }
        });
    });
    return clientes
        .map(cliente => ({
            ...cliente,
            gastoTotal: gastosPorCliente[cliente.id] || 0
        }))
        .sort((a, b) => b.gastoTotal - a.gastoTotal);
}
export function calcularEstatisticasCliente(clienteId, state) {
    const { historicoFechos } = state;
    const estatisticas = {
        gastoTotal: 0,
        visitas: 0,
        ticketMedio: 0,
        produtosPreferidos: {}
    };
    const contasDoCliente = historicoFechos
        .flatMap(fecho => fecho.contasFechadas || [])
        .filter(conta => conta.clienteId === clienteId);
    estatisticas.visitas = contasDoCliente.length;
    contasDoCliente.forEach(conta => {
        estatisticas.gastoTotal += conta.valorFinal || 0;
        conta.pedidos.forEach(pedido => {
            estatisticas.produtosPreferidos[pedido.nome] = (estatisticas.produtosPreferidos[pedido.nome] || 0) + pedido.qtd;
        });
    });
    if (estatisticas.visitas > 0) {
        estatisticas.ticketMedio = estatisticas.gastoTotal / estatisticas.visitas;
    }
    estatisticas.produtosPreferidos = Object.entries(estatisticas.produtosPreferidos)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([nome, qtd]) => ({ nome, qtd }));
    return estatisticas;
}

export function getMetricsForPeriod(state, startDate, endDate, categoria = 'all') {
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    let productIdsInCategory = null;
    if (categoria !== 'all') {
        productIdsInCategory = new Set(state.inventario.filter(p => p.categoria === categoria).map(p => p.id));
    }

    const fechosNoPeriodo = state.historicoFechos.filter(fecho => new Date(fecho.data) >= startDate && new Date(fecho.data) <= endDate);
    const despesasNoPeriodo = state.despesas.filter(despesa => new Date(despesa.data) >= startDate && new Date(despesa.data) <= endDate);

    const resumo = { receitaTotal: 0, lucroBrutoTotal: 0, despesasTotais: 0, diasOperacionais: fechosNoPeriodo.length };

    fechosNoPeriodo.forEach(fecho => {
        (fecho.contasFechadas || []).forEach(conta => {
            conta.pedidos.forEach(pedido => {
                if (!productIdsInCategory || productIdsInCategory.has(pedido.produtoId)) {
                    resumo.receitaTotal += pedido.preco * pedido.qtd;
                    resumo.lucroBrutoTotal += (pedido.preco - pedido.custo) * pedido.qtd;
                }
            });
        });
    });

    despesasNoPeriodo.forEach(despesa => { resumo.despesasTotais += despesa.valor || 0; });
    
    resumo.saldoFinal = resumo.lucroBrutoTotal - resumo.despesasTotais;
    if (resumo.diasOperacionais > 0) {
        resumo.mediaDiaria = resumo.receitaTotal / resumo.diasOperacionais;
    }

    return resumo;
}

export function getProductPerformance(state, startDate, endDate, categoria = 'all') {
    const { historicoFechos, inventario } = state;
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    
    let productIdsInCategory = null;
    if (categoria !== 'all') {
        productIdsInCategory = new Set(inventario.filter(p => p.categoria === categoria).map(p => p.id));
    }

    const fechosNoPeriodo = historicoFechos.filter(fecho => new Date(fecho.data) >= startDate && new Date(fecho.data) <= endDate);

    const vendasAgregadas = {};

    fechosNoPeriodo.forEach(fecho => {
        (fecho.contasFechadas || []).forEach(conta => {
            conta.pedidos.forEach(pedido => {
                if (!productIdsInCategory || productIdsInCategory.has(pedido.produtoId)) {
                    if (!vendasAgregadas[pedido.produtoId]) {
                        const produtoInfo = inventario.find(p => p.id === pedido.produtoId) || {};
                        vendasAgregadas[pedido.produtoId] = { id: pedido.produtoId, nome: pedido.nome, qtd: 0, receita: 0, lucro: 0, custoUnitario: produtoInfo.custoUnitario || 0 };
                    }
                    const custoPedido = (vendasAgregadas[pedido.produtoId].custoUnitario || 0);
                    vendasAgregadas[pedido.produtoId].qtd += pedido.qtd;
                    vendasAgregadas[pedido.produtoId].receita += pedido.preco * pedido.qtd;
                    vendasAgregadas[pedido.produtoId].lucro += (pedido.preco - custoPedido) * pedido.qtd;
                }
            });
        });
    });

    const produtosVendidosArr = Object.values(vendasAgregadas);
    const idsProdutosVendidos = new Set(produtosVendidosArr.map(p => p.id));
    
    const topSellers = [...produtosVendidosArr].sort((a, b) => b.qtd - a.qtd);
    const topProfit = [...produtosVendidosArr].sort((a, b) => b.lucro - a.lucro);
    
    const inventarioDaCategoria = categoria !== 'all' ? inventario.filter(p => p.categoria === categoria) : inventario;
    const zombieProducts = inventarioDaCategoria
        .filter(produto => !idsProdutosVendidos.has(produto.id))
        .sort((a, b) => (new Date(a.ultimaVenda) || 0) - (new Date(b.ultimaVenda) || 0));

    return { topSellers, topProfit, zombieProducts };
}

export function getCustomerInsights(state, startDate, endDate, categoria = 'all') {
    const { historicoFechos, clientes } = state;
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    
    let productIdsInCategory = null;
    if (categoria !== 'all') {
        productIdsInCategory = new Set(state.inventario.filter(p => p.categoria === categoria).map(p => p.id));
    }
    
    const gastosPorCliente = {};

    historicoFechos.forEach(fecho => {
        const dataFecho = new Date(fecho.data);
        if (dataFecho >= startDate && dataFecho <= endDate) {
            (fecho.contasFechadas || []).forEach(conta => {
                if (conta.clienteId) {
                    let gastoNaCategoria = 0;
                    conta.pedidos.forEach(pedido => {
                        if (!productIdsInCategory || productIdsInCategory.has(pedido.produtoId)) {
                            gastoNaCategoria += pedido.preco * pedido.qtd;
                        }
                    });

                    if (gastoNaCategoria > 0) {
                        if (!gastosPorCliente[conta.clienteId]) {
                            gastosPorCliente[conta.clienteId] = { id: conta.clienteId, gastoTotal: 0, visitas: 0 };
                        }
                        gastosPorCliente[conta.clienteId].gastoTotal += gastoNaCategoria;
                    }
                }
            });
        }
    });
    
    Object.keys(gastosPorCliente).forEach(clienteId => {
        const visitasUnicas = new Set();
        historicoFechos.forEach(fecho => {
            const dataFecho = new Date(fecho.data).toDateString();
            if (new Date(fecho.data) >= startDate && new Date(fecho.data) <= endDate) {
                (fecho.contasFechadas || []).forEach(conta => {
                    if(conta.clienteId === clienteId) {
                        const gastouNaCategoria = conta.pedidos.some(p => !productIdsInCategory || productIdsInCategory.has(p.produtoId));
                        if(gastouNaCategoria) visitasUnicas.add(dataFecho);
                    }
                });
            }
        });
        gastosPorCliente[clienteId].visitas = visitasUnicas.size;
    });

    const topSpenders = Object.values(gastosPorCliente)
        .sort((a, b) => b.gastoTotal - a.gastoTotal)
        .map(gasto => ({ ...gasto, nome: (clientes.find(c => c.id === gasto.id) || {}).nome || 'Cliente Removido' }));

    const newCustomersCount = clientes.filter(c => new Date(c.dataRegisto) >= startDate && new Date(c.dataRegisto) <= endDate).length;

    return { topSpenders, newCustomersCount };
}

/**
 * NOVO: Agrega os dados de vendas por dia para alimentar um gráfico de tendências.
 * @param {object} state - O estado completo da aplicação.
 * @param {Date} startDate - A data de início do período.
 * @param {Date} endDate - A data de fim do período.
 * @param {string} categoria - A categoria de produto para filtrar.
 * @returns {object} Um objeto com { labels: [], data: [] } para o gráfico.
 */
export function getSalesTrend(state, startDate, endDate, categoria = 'all') {
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    let productIdsInCategory = null;
    if (categoria !== 'all') {
        productIdsInCategory = new Set(state.inventario.filter(p => p.categoria === categoria).map(p => p.id));
    }

    const fechosNoPeriodo = state.historicoFechos.filter(fecho => new Date(fecho.data) >= startDate && new Date(fecho.data) <= endDate);
    
    const salesByDay = {};

    // Inicializa todos os dias no período com 0 vendas
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dayString = d.toISOString().split('T')[0];
        salesByDay[dayString] = 0;
    }

    fechosNoPeriodo.forEach(fecho => {
        const dayString = new Date(fecho.data).toISOString().split('T')[0];
        let dailyTotal = 0;

        (fecho.contasFechadas || []).forEach(conta => {
            conta.pedidos.forEach(pedido => {
                if (!productIdsInCategory || productIdsInCategory.has(pedido.produtoId)) {
                    dailyTotal += pedido.preco * pedido.qtd;
                }
            });
        });
        
        if (salesByDay[dayString] !== undefined) {
            salesByDay[dayString] += dailyTotal;
        }
    });

    const sortedDays = Object.keys(salesByDay).sort();

    const labels = sortedDays.map(day => new Date(day).toLocaleDateString('pt-PT', { day: 'd', month: 'short' }));
    const data = sortedDays.map(day => salesByDay[day]);

    return { labels, data };
}