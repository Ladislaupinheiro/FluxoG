// /modules/services/AnalyticsService.js
'use strict';

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

/**
 * ATUALIZADO E CORRIGIDO: Calcula o gasto total de cada cliente em tempo real.
 * A função agora lê tanto do histórico arquivado quanto das contas fechadas no dia corrente.
 * @param {object} state - O estado completo da aplicação.
 * @returns {Array<object>} Uma lista de objetos de cliente com a propriedade `gastoTotal`.
 */
export function getRankedClients(state) {
    const { clientes, historicoFechos, contasAtivas } = state;
    const gastosPorCliente = {};

    // 1. Função auxiliar para processar uma lista de contas
    const processarContas = (contas) => {
        contas.forEach(conta => {
            if (conta.clienteId) {
                if (!gastosPorCliente[conta.clienteId]) {
                    gastosPorCliente[conta.clienteId] = 0;
                }
                gastosPorCliente[conta.clienteId] += conta.valorFinal || 0;
            }
        });
    };

    // 2. Processa as contas do histórico arquivado
    const contasHistoricas = historicoFechos.flatMap(fecho => fecho.contasFechadas || []);
    processarContas(contasHistoricas);

    // 3. Processa as contas fechadas no dia corrente que ainda não foram arquivadas
    const contasDeHoje = contasAtivas.filter(conta => conta.status === 'fechada');
    processarContas(contasDeHoje);

    // 4. Mapeia os totais para a lista de clientes
    return clientes
        .map(cliente => ({
            ...cliente,
            gastoTotal: gastosPorCliente[cliente.id] || 0
        }))
        .sort((a, b) => b.gastoTotal - a.gastoTotal);
}

export function calcularEstatisticasCliente(clienteId, state) {
    const { historicoFechos, contasAtivas } = state;
    const estatisticas = {
        gastoTotal: 0,
        visitas: 0,
        ticketMedio: 0,
        produtosPreferidos: {}
    };

    const contasHistoricas = historicoFechos
        .flatMap(fecho => fecho.contasFechadas || [])
        .filter(conta => conta.clienteId === clienteId);

    const contasDeHoje = contasAtivas
        .filter(conta => conta.status === 'fechada' && conta.clienteId === clienteId);

    const todasAsContasDoCliente = [...contasHistoricas, ...contasDeHoje];

    if (todasAsContasDoCliente.length === 0) {
        return estatisticas;
    }

    const diasDeVisita = new Set();
    
    todasAsContasDoCliente.forEach(conta => {
        estatisticas.gastoTotal += conta.valorFinal || 0;
        
        if (conta.dataFecho) {
            diasDeVisita.add(new Date(conta.dataFecho).toDateString());
        }

        (conta.pedidos || []).forEach(pedido => {
            estatisticas.produtosPreferidos[pedido.nome] = (estatisticas.produtosPreferidos[pedido.nome] || 0) + pedido.qtd;
        });
    });

    estatisticas.visitas = diasDeVisita.size;

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

    state.clientes.forEach(cliente => {
        cliente.dividas.forEach(transacao => {
            if (transacao.tipo === 'credito') {
                const dataPagamento = new Date(transacao.data);
                if (dataPagamento >= startDate && dataPagamento <= endDate) {
                    const valorPago = Math.abs(transacao.valor);
                    resumo.receitaTotal += valorPago;
                    resumo.lucroBrutoTotal += valorPago;
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
    const { historicoFechos, clientes, contasAtivas } = state;
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    
    let productIdsInCategory = null;
    if (categoria !== 'all') {
        productIdsInCategory = new Set(state.inventario.filter(p => p.categoria === categoria).map(p => p.id));
    }
    
    const gastosPorCliente = {};

    const processarGastos = (contas) => {
        contas.forEach(conta => {
            if (conta.clienteId) {
                let gastoNaCategoria = 0;
                conta.pedidos.forEach(pedido => {
                    if (!productIdsInCategory || productIdsInCategory.has(pedido.produtoId)) {
                        gastoNaCategoria += pedido.preco * pedido.qtd;
                    }
                });

                if (gastoNaCategoria > 0) {
                    if (!gastosPorCliente[conta.clienteId]) {
                        gastosPorCliente[conta.clienteId] = { id: conta.clienteId, gastoTotal: 0 };
                    }
                    gastosPorCliente[conta.clienteId].gastoTotal += gastoNaCategoria;
                }
            }
        });
    };
    
    processarGastos(historicoFechos.flatMap(f => f.contasFechadas || []).filter(c => new Date(c.dataFecho) >= startDate && new Date(c.dataFecho) <= endDate));
    processarGastos(contasAtivas.filter(c => c.status === 'fechada' && new Date(c.dataFecho) >= startDate && new Date(c.dataFecho) <= endDate));

    const topSpenders = Object.values(gastosPorCliente)
        .sort((a, b) => b.gastoTotal - a.gastoTotal)
        .map(gasto => ({ ...gasto, nome: (clientes.find(c => c.id === gasto.id) || {}).nome || 'Cliente Removido' }));

    const newCustomersCount = clientes.filter(c => new Date(c.dataRegisto) >= startDate && new Date(c.dataRegisto) <= endDate).length;

    return { topSpenders, newCustomersCount };
}

export function getSalesTrend(state, startDate, endDate, categoria = 'all') {
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
            let dailyTotal = 0;
            conta.pedidos.forEach(pedido => {
                if (!productIdsInCategory || productIdsInCategory.has(pedido.produtoId)) {
                    dailyTotal += pedido.preco * pedido.qtd;
                }
            });
            if (salesByDay[dayString] !== undefined) {
                salesByDay[dayString] += dailyTotal;
            }
        });
    };

    processarVendasParaTrend(state.historicoFechos.flatMap(f => f.contasFechadas || []).filter(c => new Date(c.dataFecho) >= startDate && new Date(c.dataFecho) <= endDate));
    processarVendasParaTrend(state.contasAtivas.filter(c => c.status === 'fechada' && new Date(c.dataFecho) >= startDate && new Date(c.dataFecho) <= endDate));

    const sortedDays = Object.keys(salesByDay).sort();
    const labels = sortedDays.map(day => new Date(day).toLocaleDateString('pt-PT', { day: 'd', month: 'short' }));
    const data = sortedDays.map(day => salesByDay[day]);

    return { labels, data };
}