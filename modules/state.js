// /modules/state.js - Responsável por toda a gestão de estado da aplicação.

// Estado principal da aplicação
export const estado = {
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

// Persistência do estado
export function salvarEstado() {
    localStorage.setItem('gestorBarEstado', JSON.stringify(estado));
}

export function carregarEstado() {
    try {
        const estadoSalvo = localStorage.getItem('gestorBarEstado');
        if (estadoSalvo) {
            const estadoCarregado = JSON.parse(estadoSalvo);

            // Validação de estrutura obrigatória
            if (!estadoCarregado.inventario) estadoCarregado.inventario = [];
            if (!estadoCarregado.contasAtivas) estadoCarregado.contasAtivas = [];
            if (!estadoCarregado.historicoFechos) estadoCarregado.historicoFechos = [];

            // Migração e validação de cada item do inventário
            estadoCarregado.inventario.forEach(produto => {
                if (!produto.id) produto.id = crypto.randomUUID();
                if (typeof produto.stockArmazem === 'undefined') {
                    produto.stockArmazem = produto.stockAtual || 0;
                }
                if (typeof produto.stockGeleira === 'undefined') {
                    produto.stockGeleira = 0;
                }
                if (typeof produto.stockMinimo === 'undefined') {
                    produto.stockMinimo = 1;
                }
                // Limpar propriedades obsoletas
                delete produto.stockAtual;
                delete produto.stockInicial;
                delete produto.entradas;
            });

            Object.assign(estado, estadoCarregado);
        }
    } catch (error) {
        console.error('Erro ao carregar estado do localStorage:', error);
        // Garante um estado limpo em caso de erro de parsing
    }
}