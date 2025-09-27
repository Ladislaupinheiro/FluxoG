// /modules/state.js - (v7.0 - Integração com IndexedDB)
'use strict';

import * as db from './database.js';

// Define a versão do esquema de dados.
const SCHEMA_VERSION = 3; // Versão incrementada devido à mudança de persistência

// O estado principal da aplicação agora funciona como um cache em memória.
// Ele será populado no arranque com os dados vindos do IndexedDB.
export const estado = {
    schema_version: SCHEMA_VERSION,
    contasAtivas: [],
    inventario: [],
    historicoFechos: [],
    config: {}
};

// Variáveis de estado globais (não persistentes)
export let relatorioAtualParaExportar = null;
export let dataAtualCalendario = new Date();
export let produtoSelecionadoParaPedido = null;

// Funções para modificar variáveis de estado globais (setters)
export function setProdutoSelecionado(produto) {
    produtoSelecionadoParaPedido = produto;
}
export function setDataAtual(novaData) {
    dataAtualCalendario = novaData;
}
export function setRelatorioAtual(relatorio) {
    relatorioAtualParaExportar = relatorio;
}

// ===================================
// SINCRONIZAÇÃO COM A BASE DE DADOS
// ===================================

/**
 * Carrega o estado inicial da aplicação a partir do IndexedDB.
 * Esta função é o novo ponto de entrada para o carregamento de dados.
 */
export async function carregarEstadoInicial() {
    try {
        await db.initDB(); // Garante que a base de dados está pronta

        // Carrega todos os dados das stores em paralelo para maior eficiência
        const [inventarioDB, contasDB, historicoDB] = await Promise.all([
            db.carregarTodos('inventario'),
            db.carregarTodos('contas'),
            db.carregarTodos('historico')
        ]);
        
        // Popula o objeto de estado em memória com os dados da DB
        estado.inventario = inventarioDB;
        estado.contasAtivas = contasDB; // Assumimos que as contas guardadas são as ativas do dia
        estado.historicoFechos = historicoDB;

        console.log('Estado carregado a partir do IndexedDB com sucesso.', estado);

    } catch (error) {
        console.error('Erro crítico ao carregar o estado do IndexedDB:', error);
        // Lançamos o erro para que a função inicializarApp possa apanhá-lo e mostrar uma mensagem de erro ao utilizador.
        throw new Error('Não foi possível carregar os dados da aplicação.');
    }
}

// As funções salvarEstado() e carregarEstado() baseadas no localStorage foram REMOVIDAS.
// A persistência agora será gerida diretamente no handlers.js através de chamadas ao database.js.