// /modules/services/Store.js - ATUALIZADO com Configs de Negócio
'use strict';
import * as Storage from './Storage.js';
import { gerarEstadoAposArquivo } from './utils.js';

const initialState = {
    schema_version: 3,
    contasAtivas: [],
    inventario: [],
    historicoFechos: [],
    clientes: [],
    despesas: [],
    // ALTERAÇÃO: Adicionados novos campos de configuração com valores padrão
    config: {
        businessName: '',
        nif: '',
        endereco: '',
        telefone: '',
        email: '',
        moeda: 'AOA' // Kwanza Angolano como padrão
    }
};

class Store {
    #state;
    #listeners = new Set();
    #reducer;
    constructor(reducer, initialState) { this.#reducer = reducer; this.#state = initialState; }
    getState() { return this.#state; }
    dispatch(action) { this.#state = this.#reducer(this.#state, action); this.#notify(); }
    subscribe(listener) { this.#listeners.add(listener); return () => { this.#listeners.delete(listener); }; }
    #notify() { this.#listeners.forEach(listener => listener(this.#state)); }
}


function reducer(state = initialState, action) {
    switch (action.type) {
        case 'SET_INITIAL_STATE':
            // Garante que o estado carregado tenha todos os campos de config, mesmo os novos
            const mergedConfig = { ...initialState.config, ...(action.payload.config || {}) };
            return { ...state, ...action.payload, config: mergedConfig };

        // --- AÇÕES DO INVENTÁRIO ---
        case 'ADD_PRODUCT':
            {
                const { nome, precoVenda, custoUnitario, stockArmazem, stockMinimo } = action.payload;
                const novoProduto = { id: crypto.randomUUID(), nome, precoVenda, custoUnitario, stockArmazem, stockLoja: 0, stockMinimo };
                const novoInventario = [...state.inventario, novoProduto];
                Storage.salvarItem('inventario', novoProduto);
                return { ...state, inventario: novoInventario };
            }

        case 'UPDATE_PRODUCT':
            {
                const produtoAtualizado = action.payload;
                const inventarioAtualizado = state.inventario.map(p =>
                    p.id === produtoAtualizado.id ? produtoAtualizado : p
                );
                Storage.salvarItem('inventario', produtoAtualizado);
                return { ...state, inventario: inventarioAtualizado };
            }
        
        case 'DELETE_PRODUCT': {
            const produtoId = action.payload;
            const inventarioAtualizado = state.inventario.filter(p => p.id !== produtoId);
            Storage.apagarItem('inventario', produtoId);
            return { ...state, inventario: inventarioAtualizado };
        }
        case 'ADD_STOCK': {
            const { produtoId, quantidade } = action.payload;
            const inventarioAtualizado = state.inventario.map(p => {
                if (p.id === produtoId) {
                    const pAtualizado = { ...p, stockArmazem: p.stockArmazem + quantidade };
                    Storage.salvarItem('inventario', pAtualizado); return pAtualizado;
                } return p;
            });
            return { ...state, inventario: inventarioAtualizado };
        }
        case 'MOVE_STOCK': {
            const { produtoId, quantidade } = action.payload;
            const inventarioAtualizado = state.inventario.map(p => {
                if (p.id === produtoId) {
                    const pAtualizado = { ...p, stockArmazem: p.stockArmazem - quantidade, stockLoja: p.stockLoja + quantidade };
                    Storage.salvarItem('inventario', pAtualizado); return pAtualizado;
                } return p;
            });
            return { ...state, inventario: inventarioAtualizado };
        }

        // --- AÇÕES DE ATENDIMENTO (CONTAS) ---
        case 'ADD_ORDER_ITEM':
            {
                const { contaId, produto, quantidade } = action.payload;
                
                const inventarioAtualizado = state.inventario.map(p => {
                    if (p.id === produto.id) {
                        const pAtualizado = { ...p, stockLoja: p.stockLoja - quantidade };
                        Storage.salvarItem('inventario', pAtualizado);
                        return pAtualizado;
                    }
                    return p;
                });

                const contasAtualizadas = state.contasAtivas.map(c => {
                    if (c.id === contaId) {
                        const cAtualizada = { ...c };
                        const pedidoExistente = cAtualizada.pedidos.find(p => p.produtoId === produto.id);
                        
                        if (pedidoExistente) {
                            pedidoExistente.qtd += quantidade;
                        } else {
                            cAtualizada.pedidos.push({ 
                                produtoId: produto.id, 
                                nome: produto.nome, 
                                preco: produto.precoVenda, 
                                custo: produto.custoUnitario,
                                qtd: quantidade 
                            });
                        }
                        Storage.salvarItem('contas', cAtualizada);
                        return cAtualizada;
                    }
                    return c;
                });

                return { ...state, inventario: inventarioAtualizado, contasAtivas: contasAtualizadas };
            }

        case 'ADD_ACCOUNT': {
            const novaConta = action.payload;
            const novasContasAtivas = [...state.contasAtivas, novaConta];
            Storage.salvarItem('contas', novaConta);
            return { ...state, contasAtivas: novasContasAtivas };
        }
        case 'REMOVE_ORDER_ITEM': {
            const { contaId, itemIndex } = action.payload;
            let inventarioAtualizado = state.inventario;
            const contasAtualizadas = state.contasAtivas.map(c => {
                if (c.id === contaId) {
                    const itemRemovido = c.pedidos[itemIndex];
                    if (!itemRemovido) return c;
                    inventarioAtualizado = state.inventario.map(p => {
                        if (p.id === itemRemovido.produtoId) {
                            const pAtualizado = { ...p, stockLoja: p.stockLoja + itemRemovido.qtd };
                            Storage.salvarItem('inventario', pAtualizado);
                            return pAtualizado;
                        } return p;
                    });
                    const pedidosAtualizados = c.pedidos.filter((_, index) => index !== itemIndex);
                    const cAtualizada = { ...c, pedidos: pedidosAtualizados };
                    Storage.salvarItem('contas', cAtualizada);
                    return cAtualizada;
                } return c;
            });
            return { ...state, inventario: inventarioAtualizado, contasAtivas: contasAtualizadas };
        }
        case 'FINALIZE_PAYMENT': {
            const { contaId, metodoPagamento } = action.payload;
            const contasAtualizadas = state.contasAtivas.map(conta => {
                if (conta.id === contaId) {
                    const contaAtualizada = { ...conta, status: 'fechada', dataFecho: new Date().toISOString(), metodoPagamento, valorFinal: conta.pedidos.reduce((total, p) => total + (p.preco * p.qtd), 0) };
                    Storage.salvarItem('contas', contaAtualizada);
                    return contaAtualizada;
                } return conta;
            });
            return { ...state, contasAtivas: contasAtualizadas };
        }
        case 'ADD_CLIENT': {
            const novoCliente = action.payload;
            const novosClientes = [...state.clientes, novoCliente];
            Storage.salvarItem('clientes', novoCliente);
            return { ...state, clientes: novosClientes };
        }
        case 'ADD_DEBT': case 'SETTLE_DEBT': {
            const { clienteId, ...rest } = action.payload;
            const clientesAtualizados = state.clientes.map(cliente => {
                if (cliente.id === clienteId) {
                    const transacao = action.type === 'ADD_DEBT'
                        ? { id: crypto.randomUUID(), data: new Date().toISOString(), valor: rest.valor, descricao: rest.descricao, tipo: 'debito' }
                        : { id: crypto.randomUUID(), data: new Date().toISOString(), valor: -Math.abs(rest.valor), descricao: 'Pagamento', tipo: 'credito' };
                    const clienteAtualizado = { ...cliente, dividas: [...cliente.dividas, transacao] };
                    Storage.salvarItem('clientes', clienteAtualizado);
                    return clienteAtualizado;
                } return cliente;
            });
            return { ...state, clientes: clientesAtualizados };
        }
        case 'ADD_EXPENSE': {
            const novaDespesa = action.payload;
            const novasDespesas = [...state.despesas, novaDespesa];
            Storage.salvarItem('despesas', novaDespesa);
            return { ...state, despesas: novasDespesas };
        }
        case 'ARCHIVE_DAY': {
            const { relatorio } = action.payload;
            const { contasAtivasAposArquivo, inventarioAtualizado, contasFechadasParaApagar } = gerarEstadoAposArquivo(state);
            Storage.salvarItem('historico', relatorio);
            contasFechadasParaApagar.forEach(c => Storage.apagarItem('contas', c.id));
            inventarioAtualizado.forEach(item => Storage.salvarItem('inventario', item));
            return { ...state, historicoFechos: [...state.historicoFechos, relatorio], contasAtivas: contasAtivasAposArquivo, inventario: inventarioAtualizado, };
        }
        case 'UPDATE_CONFIG': {
            const configAtualizada = { ...state.config, ...action.payload };
            Storage.salvarItem('config', { key: 'appConfig', ...configAtualizada });
            return { ...state, config: configAtualizada };
        }

        default:
            return state;
    }
}

const store = new Store(reducer, initialState);

export async function carregarEstadoInicial() {
    try {
        await Storage.initDB();
        const [inventario, contas, historico, clientes, despesas, configArray] = await Promise.all([
            Storage.carregarTodos('inventario'), Storage.carregarTodos('contas'),
            Storage.carregarTodos('historico'), Storage.carregarTodos('clientes'),
            Storage.carregarTodos('despesas'), Storage.carregarTodos('config')
        ]);
        const dbConfig = configArray.find(item => item.key === 'appConfig') || {};
        const payload = { inventario, contasAtivas: contas, historicoFechos: historico, clientes, despesas, config: dbConfig };
        store.dispatch({ type: 'SET_INITIAL_STATE', payload });

    } catch (error) {
        console.error('Erro crítico ao carregar estado para o Store:', error);
        throw new Error('Não foi possível carregar os dados da aplicação.');
    }
}

export default store;