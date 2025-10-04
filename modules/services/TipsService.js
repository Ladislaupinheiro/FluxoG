// /modules/services/TipsService.js - Serviço para gerir as Dicas de Gestão
'use strict';

let allTips = []; // Cache em memória para as dicas, para evitar múltiplas leituras do ficheiro

/**
 * Carrega as dicas do ficheiro tips.json para a cache em memória.
 * Se as dicas já estiverem carregadas, retorna imediatamente.
 * @returns {Promise<void>}
 */
async function loadTips() {
    if (allTips.length > 0) {
        return; // Já carregado, não faz nada
    }

    try {
        const response = await fetch('./tips.json');
        if (!response.ok) {
            throw new Error(`Erro de rede ao carregar as dicas: ${response.statusText}`);
        }
        const tips = await response.json();
        allTips = tips;
        console.log('[TipsService] 60 dicas carregadas com sucesso.');
    } catch (error) {
        console.error('[TipsService] Falha ao carregar ou processar o ficheiro de dicas:', error);
        allTips = []; // Garante que não fiquem dados corruptos na cache
    }
}

/**
 * Obtém a "Dica do Dia" de forma determinística.
 * A dica é a mesma para todos os utilizadores no mesmo dia.
 * @returns {Promise<object|null>} O objeto da dica do dia ou null se ocorrer um erro.
 */
export async function getDailyTip() {
    await loadTips(); // Garante que as dicas estão carregadas antes de continuar

    if (allTips.length === 0) {
        return null; // Retorna nulo se não houver dicas ou se o carregamento falhou
    }

    // Calcula o dia do ano (de 1 a 366)
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    // Usa o operador de módulo (%) para garantir que o índice esteja sempre dentro dos limites do array
    const tipIndex = (dayOfYear - 1) % allTips.length;

    return allTips[tipIndex];
}