// /modules/services/utils.js - REATORADO E SIMPLIFICADO
'use strict';

/**
 * Agrupa uma sequência de chamadas de função numa única chamada após um atraso.
 * @param {Function} func A função a ser executada após o atraso.
 * @param {number} delay O tempo de espera em milissegundos.
 * @returns {Function} A nova função "debounced".
 */
export function debounce(func, delay = 300) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

/**
 * Calcula o estado da aplicação após a ação de arquivar o dia.
 * Usado internamente pelo Store.js.
 * @param {object} state O estado atual completo da aplicação.
 * @returns {object} Um objeto contendo os novos arrays de estado.
 */
export function gerarEstadoAposArquivo(state) {
    const contasAtivasAposArquivo = state.contasAtivas.filter(c => c.status === 'ativa');
    const contasFechadasParaApagar = state.contasAtivas.filter(c => c.status === 'fechada');

    const inventarioAtualizado = state.inventario.map(item => ({
        ...item,
        stockArmazem: item.stockArmazem + item.stockLoja,
        stockLoja: 0
    }));
    
    const contasFechadasComCliente = contasFechadasParaApagar.map(conta => {
        const cliente = state.clientes.find(c => c.nome.toLowerCase() === conta.nome.toLowerCase());
        return cliente ? { ...conta, clienteId: cliente.id } : conta;
    });

    return { contasAtivasAposArquivo, inventarioAtualizado, contasFechadasParaApagar, contasFechadasComCliente };
}