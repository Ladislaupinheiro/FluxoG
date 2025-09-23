// /modules/state.js - Responsável por toda a gestão de estado da aplicação (v3.4)
'use strict';

// Define a versão atual do esquema de dados. Incrementar ao fazer alterações incompatíveis.
const SCHEMA_VERSION = 2;

// Estado principal da aplicação
export const estado = {
    schema_version: SCHEMA_VERSION,
    contasAtivas: [],
    inventario: [],
    historicoFechos: [],
    config: {}
};

// Variáveis de estado globais
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
// PERSISTÊNCIA E INTEGRIDADE DO ESTADO
// ===================================

/**
 * Salva o estado atual da aplicação no localStorage.
 */
export function salvarEstado() {
    try {
        // Garante que a versão está sempre atualizada ao salvar
        estado.schema_version = SCHEMA_VERSION;
        localStorage.setItem('gestorBarEstado', JSON.stringify(estado));
    } catch (error) {
        console.error('Erro crítico ao salvar o estado no localStorage:', error);
        // Em futuras implementações, poderíamos notificar o utilizador sobre a falha.
    }
}

/**
 * Carrega o estado da aplicação do localStorage, aplicando migrações e validações.
 */
export function carregarEstado() {
    try {
        const estadoSalvoJSON = localStorage.getItem('gestorBarEstado');
        if (!estadoSalvoJSON) {
            return; // Nenhum estado salvo, usa o estado inicial.
        }

        let estadoCarregado = JSON.parse(estadoSalvoJSON);

        // Migra o estado se for de uma versão antiga
        estadoCarregado = migrarEstado(estadoCarregado);

        // Valida a integridade dos dados após a migração
        if (!validarIntegridadeEstado(estadoCarregado)) {
            console.error("Validação de integridade do estado falhou. A carregar estado inicial para evitar corrupção.");
            // Futuramente, podemos tentar uma recuperação mais granular.
            return;
        }
        
        Object.assign(estado, estadoCarregado);

    } catch (error) {
        console.error('Erro ao carregar ou processar o estado do localStorage:', error);
        // Em caso de erro de parsing ou outro, carrega o estado limpo para evitar crashes.
    }
}

/**
 * Executa migrações sequenciais no objeto de estado para atualizá-lo para a versão mais recente.
 * @param {object} estadoCarregado - O objeto de estado carregado do localStorage.
 * @returns {object} - O objeto de estado migrado para a versão atual.
 */
function migrarEstado(estadoCarregado) {
    const versaoAtual = estadoCarregado.schema_version || 1;

    if (versaoAtual < 2) {
        // Migração da v1 para a v2: Garante que todos os itens têm IDs e a estrutura correta.
        console.log("A migrar estado da v1 para a v2...");
        
        if (estadoCarregado.inventario && Array.isArray(estadoCarregado.inventario)) {
            estadoCarregado.inventario.forEach(produto => {
                if (!produto.id) produto.id = crypto.randomUUID();
                if (typeof produto.stockArmazem === 'undefined') produto.stockArmazem = produto.stockAtual || 0;
                if (typeof produto.stockGeleira === 'undefined') produto.stockGeleira = 0;
                if (typeof produto.stockMinimo === 'undefined') produto.stockMinimo = 1;
                // Limpar propriedades obsoletas
                delete produto.stockAtual;
                delete produto.stockInicial;
                delete produto.entradas;
            });
        }
    }

    // Adicionar futuros blocos 'if (versaoAtual < 3)' aqui para migrações futuras.

    estadoCarregado.schema_version = SCHEMA_VERSION;
    return estadoCarregado;
}

/**
 * Valida a integridade do objeto de estado, verificando IDs duplicados.
 * @param {object} estadoParaValidar - O objeto de estado a ser validado.
 * @returns {boolean} - Verdadeiro se o estado for válido, falso caso contrário.
 */
function validarIntegridadeEstado(estadoParaValidar) {
    // 1. Validar IDs únicos no inventário
    if (estadoParaValidar.inventario && Array.isArray(estadoParaValidar.inventario)) {
        const idsInventario = estadoParaValidar.inventario.map(p => p.id).filter(id => id); // Filtra IDs nulos/undefined
        if (new Set(idsInventario).size !== idsInventario.length) {
            console.error("Erro de integridade: IDs de produto duplicados encontrados no inventário.");
            return false;
        }
    }

    // 2. Validar IDs únicos nas contas ativas
    if (estadoParaValidar.contasAtivas && Array.isArray(estadoParaValidar.contasAtivas)) {
        const idsContas = estadoParaValidar.contasAtivas.map(c => c.id).filter(id => id);
        if (new Set(idsContas).size !== idsContas.length) {
            console.error("Erro de integridade: IDs de conta duplicados encontrados.");
            return false;
        }
    }

    // Adicionar mais validações conforme necessário (ex: verificar se stock não é negativo, etc.)

    return true; // Se todas as verificações passarem
}
