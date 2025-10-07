// /modules/services/AnalyticsService.js - NOVO
'use strict';

/**
 * Analisa as contas e retorna uma lista de produtos ordenados por quantidade vendida no dia.
 * @param {object} state - O estado completo da aplicação.
 * @returns {Array<[string, number]>} Um array de [nomeDoProduto, quantidadeVendida].
 */
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
 * Calcula o gasto total de cada cliente e retorna uma lista ordenada.
 * @param {object} state - O estado completo da aplicação.
 * @returns {Array<object>} Uma lista de objetos de cliente com a propriedade `gastoTotal`.
 */
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

/**
 * Calcula as estatísticas de um cliente a partir do estado da aplicação.
 * @param {string} clienteId - O ID do cliente.
 * @param {object} state - O estado completo da aplicação.
 * @returns {object} Um objeto com as estatísticas calculadas.
 */
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