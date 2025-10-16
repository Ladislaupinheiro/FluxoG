// /modules/shared/services/Store.js (ATUALIZADO)
'use strict';
import * as Storage from './Storage.js';
import { gerarEstadoAposArquivo } from '../lib/utils.js';

const initialState = {
    schema_version: 7, // Versão incrementada para refletir a lógica de catálogos
    
    // --- Estruturas de Dados ---
    inventario: [],
    clientes: [],
    contasAtivas: [],
    historicoFechos: [],
    despesas: [],
    fornecedores: [], // Cada fornecedor terá agora um array `catalogo`
    historicoCompras: [],
    categoriasDeProduto: [],
    tagsDeCliente: [],
    
    config: {
        businessName: '',
        nif: '',
        endereco: '',
        telefone: '',
        email: '',
        moeda: 'AOA',
        profilePicDataUrl: null,
        priorityProducts: [],
        mostrarDicaDoDia: true
    }
};

class Store {
    // ... (código da classe Store sem alterações)
    #state;
    #listeners;
    #reducer;

    constructor(reducer, initialState) {
        this.#reducer = reducer;
        this.#state = initialState;
        this.#listeners = []; 
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
        for (const listener of this.#listeners) {
            listener(this.#state);
        }
    }
}


function reducer(state = initialState, action) {
    switch (action.type) {
        case 'SET_INITIAL_STATE':
            const mergedConfig = { ...initialState.config, ...(action.payload.config || {}) };
            return { ...state, ...action.payload, config: mergedConfig };

        case 'ADD_PRODUCT': {
            const novoProduto = action.payload;
            const novoInventario = [...state.inventario, novoProduto];
            Storage.salvarItem('inventario', novoProduto);
            return { ...state, inventario: novoInventario };
        }
        
        // --- AÇÕES DE GESTÃO DE CATEGORIAS DE PRODUTO ---
        case 'ADD_PRODUCT_CATEGORY': {
            const novaCategoria = { id: crypto.randomUUID(), ...action.payload };
            const categorias = [...state.categoriasDeProduto, novaCategoria];
            Storage.salvarItem('categoriasDeProduto', novaCategoria);
            return { ...state, categoriasDeProduto: categorias };
        }

        // ... (UPDATE/DELETE CATEGORY sem alterações)

        case 'ADD_FORNECEDOR': { // ATUALIZADO
            const novoFornecedor = { 
                id: crypto.randomUUID(), 
                catalogo: [], // <-- Fornecedor agora nasce com um catálogo vazio
                ...action.payload 
            };
            const fornecedores = [...state.fornecedores, novoFornecedor];
            Storage.salvarItem('fornecedores', novoFornecedor);
            return { ...state, fornecedores };
        }
        
        case 'ADD_PRODUCT_TO_CATALOG': { // NOVO
            const { fornecedorId, produto } = action.payload;
            const fornecedoresAtualizados = state.fornecedores.map(f => {
                if (f.id === fornecedorId) {
                    const fAtualizado = { ...f };
                    const novoProdutoCatalogo = { id: crypto.randomUUID(), ...produto };
                    fAtualizado.catalogo.push(novoProdutoCatalogo);
                    Storage.salvarItem('fornecedores', fAtualizado);
                    return fAtualizado;
                }
                return f;
            });
            return { ...state, fornecedores: fornecedoresAtualizados };
        }

        case 'ADD_COMPRA': {
            const novaCompra = { id: crypto.randomUUID(), data: new Date().toISOString(), ...action.payload };
            const historicoCompras = [...state.historicoCompras, novaCompra];
            Storage.salvarItem('historicoCompras', novaCompra);
            
            const inventarioAtualizado = state.inventario.map(p => {
                if (p.id === novaCompra.produtoId) {
                    const pAtualizado = { ...p };
                    const novoLote = {
                        quantidade: novaCompra.quantidade,
                        dataCompra: novaCompra.data,
                        custoUnitario: novaCompra.valorTotal / novaCompra.quantidade
                    };
                    pAtualizado.stockArmazemLotes.push(novoLote);
                    Storage.salvarItem('inventario', pAtualizado);
                    return pAtualizado;
                }
                return p;
            });

            return { ...state, historicoCompras, inventario: inventarioAtualizado };
        }

        // ... (restante do reducer sem alterações) ...

        default:
            return state;
    }
}

const store = new Store(reducer, initialState);

export async function carregarEstadoInicial() {
    try {
        await Storage.initDB();
        const [
            inventario, contas, historico, clientes, despesas, configArray,
            fornecedores, historicoCompras, categoriasDeProduto, tagsDeCliente
        ] = await Promise.all([
            Storage.carregarTodos('inventario'), Storage.carregarTodos('contas'),
            Storage.carregarTodos('historico'), Storage.carregarTodos('clientes'),
            Storage.carregarTodos('despesas'), Storage.carregarTodos('config'),
            Storage.carregarTodos('fornecedores'), Storage.carregarTodos('historicoCompras'),
            Storage.carregarTodos('categoriasDeProduto'), Storage.carregarTodos('tagsDeCliente')
        ]);
        
        const dbConfig = configArray.find(item => item.key === 'appConfig') || {};
        
        const payload = { 
            inventario, contasAtivas: contas, historicoFechos: historico, clientes, despesas, config: dbConfig,
            fornecedores, historicoCompras, categoriasDeProduto, tagsDeCliente
        };
        store.dispatch({ type: 'SET_INITIAL_STATE', payload });

    } catch (error) {
        console.error('Erro crítico ao carregar estado para o Store:', error);
        throw new Error('Não foi possível carregar os dados da aplicação.');
    }
}

export default store;