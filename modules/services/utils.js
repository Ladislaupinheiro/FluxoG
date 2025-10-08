// /modules/services/utils.js
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
    
    return { 
        contasAtivasAposArquivo, 
        inventarioAtualizado, 
        contasFechadasParaApagar 
    };
}

/**
 * NOVO: Formata um número como moeda no padrão da aplicação.
 * @param {number} valor O número a ser formatado.
 * @returns {string} A string formatada (ex: "1.500,00 Kz").
 */
export function formatarMoeda(valor) {
    const valorNumerico = Number(valor) || 0;
    return valorNumerico.toLocaleString('pt-AO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + ' Kz';
}