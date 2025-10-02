// /modules/services/Store.js - O Coração da Arquitetura State-Driven (v7.0 - Final)
'use strict';
import * as Storage from './Storage.js';

// O estado inicial da nossa aplicação.
const initialState = {
    schema_version: 3,
    contasAtivas: [],
    inventario: [],
    historicoFechos: [],
    clientes: [],
    config: {}
};

/**
 * O Reducer é uma função pura que recebe o estado atual e uma ação,
 * e retorna o NOVO estado da aplicação. Toda a lógica de negócio que
 * modifica o estado está centralizada aqui.
 */
function reducer(state = initialState, action) {
    switch (action.type) {
        case 'SET_INITIAL_STATE':
            return {
                ...state,
                ...action.payload
            };

        // --- AÇÕES DO INVENTÁRIO ---
        case 'ADD_PRODUCT':
            {
                const novoProduto = action.payload;
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

        case 'ADD_STOCK':
            {
                const { produtoId, quantidade } = action.payload;
                const inventarioAtualizado = state.inventario.map(p => {
                    if (p.id === produtoId) {
                        const pAtualizado = { ...p, stockArmazem: p.stockArmazem + quantidade };
                        Storage.salvarItem('inventario', pAtualizado);
                        return pAtualizado;
                    }
                    return p;
                });
                return { ...state, inventario: inventarioAtualizado };
            }

        case 'MOVE_STOCK':
            {
                const { produtoId, quantidade } = action.payload;
                const inventarioAtualizado = state.inventario.map(p => {
                    if (p.id === produtoId) {
                        const pAtualizado = {
                            ...p,
                            stockArmazem: p.stockArmazem - quantidade,
                            stockGeleira: p.stockGeleira + quantidade
                        };
                        Storage.salvarItem('inventario', pAtualizado);
                        return pAtualizado;
                    }
                    return p;
                });
                return { ...state, inventario: inventarioAtualizado };
            }

        // --- AÇÕES DE ATENDIMENTO (CONTAS) ---
        case 'ADD_ACCOUNT':
            {
                const novaConta = action.payload;
                const novasContasAtivas = [...state.contasAtivas, novaConta];
                Storage.salvarItem('contas', novaConta);
                return { ...state, contasAtivas: novasContasAtivas };
            }
        
        case 'ADD_ORDER_ITEM':
            {
                const { contaId, produto, quantidade } = action.payload;
                // Atualiza o stock do produto no inventário
                const inventarioAtualizado = state.inventario.map(p => {
                    if (p.id === produto.id) {
                        const pAtualizado = { ...p, stockGeleira: p.stockGeleira - quantidade };
                        Storage.salvarItem('inventario', pAtualizado);
                        return pAtualizado;
                    }
                    return p;
                });
                // Adiciona o item à conta
                const contasAtualizadas = state.contasAtivas.map(c => {
                    if (c.id === contaId) {
                        const cAtualizada = { ...c };
                        const pedidoExistente = cAtualizada.pedidos.find(p => p.produtoId === produto.id);
                        if (pedidoExistente) {
                            pedidoExistente.qtd += quantidade;
                        } else {
                            cAtualizada.pedidos.push({ produtoId: produto.id, nome: produto.nome, preco: produto.preco, qtd: quantidade });
                        }
                        Storage.salvarItem('contas', cAtualizada);
                        return cAtualizada;
                    }
                    return c;
                });

                return { ...state, inventario: inventarioAtualizado, contasAtivas: contasAtualizadas };
            }
        
        case 'FINALIZE_PAYMENT':
            {
                const { contaId, metodoPagamento } = action.payload;
                const contasAtualizadas = state.contasAtivas.map(c => {
                    if (c.id === contaId) {
                        const cAtualizada = {
                            ...c,
                            status: 'fechada',
                            dataFecho: new Date().toISOString(),
                            metodoPagamento,
                            valorFinal: c.pedidos.reduce((total, p) => total + (p.preco * p.qtd), 0)
                        };
                        Storage.salvarItem('contas', cAtualizada);
                        return cAtualizada;
                    }
                    return c;
                });
                return { ...state, contasAtivas: contasAtualizadas };
            }

        // --- AÇÕES DE CLIENTES ---
        case 'ADD_CLIENT':
            {
                const novoCliente = action.payload;
                const novosClientes = [...state.clientes, novoCliente];
                Storage.salvarItem('clientes', novoCliente);
                return { ...state, clientes: novosClientes };
            }

        // --- AÇÕES DE FLUXO DE CAIXA ---
        case 'ARCHIVE_DAY':
            {
                const { relatorio } = action.payload;
                const novoHistorico = [...state.historicoFechos, relatorio];
                Storage.salvarItem('historico', relatorio);

                state.contasAtivas.forEach(c => Storage.apagarItem('contas', c.id));

                const inventarioAtualizado = state.inventario.map(item => {
                    if (item.stockGeleira > 0) {
                        const itemAtualizado = { ...item, stockArmazem: item.stockArmazem + item.stockGeleira, stockGeleira: 0 };
                        Storage.salvarItem('inventario', itemAtualizado);
                        return itemAtualizado;
                    }
                    return item;
                });

                return {
                    ...state,
                    historicoFechos: novoHistorico,
                    contasAtivas: [],
                    inventario: inventarioAtualizado,
                };
            }

        default:
            return state;
    }
}


class Store {
    #state;
    #listeners = [];
    #reducer;

    constructor(reducer, initialState) {
        this.#reducer = reducer;
        this.#state = initialState;
    }

    getState() {
        return this.#state;
    }

    dispatch(action) {
        this.#state = this.#reducer(this.#state, action);
        this.#notify();
    }

    subscribe(listener) {
        this.#listeners.push(listener);
        return () => {
            this.#listeners = this.#listeners.filter(l => l !== listener);
        };
    }

    #notify() {
        this.#listeners.forEach(listener => listener(this.#state));
    }
}

const store = new Store(reducer, initialState);

export async function carregarEstadoInicial() {
    try {
        await Storage.initDB();
        const [inventario, contas, historico, clientes] = await Promise.all([
            Storage.carregarTodos('inventario'),
            Storage.carregarTodos('contas'),
            Storage.carregarTodos('historico'),
            Storage.carregarTodos('clientes')
        ]);
        
        store.dispatch({
            type: 'SET_INITIAL_STATE',
            payload: {
                inventario,
                contasAtivas: contas,
                historicoFechos: historico,
                clientes
            }
        });

        console.log('Store inicializado a partir do Storage com sucesso.');

    } catch (error) {
        console.error('Erro crítico ao carregar estado para o Store:', error);
        throw new Error('Não foi possível carregar os dados da aplicação.');
    }
}

export default store;