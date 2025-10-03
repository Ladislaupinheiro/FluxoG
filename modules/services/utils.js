// /modules/services/utils.js - Funções de utilidade e de negócio
'use strict';

/**
 * Calcula as métricas do relatório de fecho de dia com base no estado atual.
 * @param {object} state - O objeto de estado completo do store.
 * @returns {object} O objeto do relatório calculado.
 */
export function calcularRelatorioDia(state) {
    const contasFechadasHoje = state.contasAtivas.filter(c => c.status === 'fechada' && new Date(c.dataFecho).toDateString() === new Date().toDateString());
    
    const totalVendido = contasFechadasHoje.reduce((sum, conta) => sum + conta.valorFinal, 0);
    const totalNumerario = contasFechadasHoje.filter(c => c.metodoPagamento === 'Numerário').reduce((sum, c) => sum + c.valorFinal, 0);
    const totalTpa = contasFechadasHoje.filter(c => c.metodoPagamento === 'TPA').reduce((sum, c) => sum + c.valorFinal, 0);
    const numContasFechadas = contasFechadasHoje.length;
    const mediaPorConta = numContasFechadas > 0 ? totalVendido / numContasFechadas : 0;
    
    const produtosVendidos = {};
    contasFechadasHoje.forEach(conta => {
        conta.pedidos.forEach(pedido => {
            produtosVendidos[pedido.nome] = (produtosVendidos[pedido.nome] || 0) + pedido.qtd;
        });
    });

    return { 
        id: `fecho-${new Date().toISOString().split('T')[0]}`,
        data: new Date().toISOString(), 
        totalVendido, 
        totalNumerario, 
        totalTpa, 
        numContasFechadas, 
        mediaPorConta, 
        produtosVendidos 
    };
}