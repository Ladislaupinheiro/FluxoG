// /modules/shared/services/Store.js (ATUALIZADO)
'use strict';
import * as Storage from './Storage.js';
import { gerarEstadoAposArquivo } from '../lib/utils.js';

const initialState = {
    schema_version: 11, // Versão incrementada
    
    inventario: [],
    clientes: [],
    contasAtivas: [],
    historicoFechos: [],
    despesas: [],
    fornecedores: [],
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
    #state;
    #listeners;
    #reducer;

    constructor(reducer, initialState) {
        this.#reducer = reducer;
        this.#state = initialState;
        this.#listeners = []; 
    }

    getState() { return this.#state; }
    dispatch(action) { this.#state = this.#reducer(this.#state, action); this.#notify(); }
    subscribe(listener) { this.#listeners.push(listener); return () => { this.#listeners = this.#listeners.filter(l => l !== listener); }; }
    #notify() { for (const listener of this.#listeners) { listener(this.#state); } }
}


function reducer(state = initialState, action) {
    switch (action.type) {
        case 'SET_INITIAL_STATE':
            const mergedConfig = { ...initialState.config, ...(action.payload.config || {}) };
            return { ...state, ...action.payload, config: mergedConfig };

        // --- AÇÕES DE GESTÃO DE CLIENTES ---
        case 'ADD_CLIENT': {
            const novoClientePayload = action.payload;
            const novoCliente = { id: crypto.randomUUID(), dataRegisto: new Date().toISOString(), dividas: [], tags: ['novo'], fotoDataUrl: null, ...novoClientePayload };
            const novosClientes = [...state.clientes, novoCliente];
            Storage.salvarItem('clientes', novoCliente);
            return { ...state, clientes: novosClientes };
        }
        case 'UPDATE_CLIENT': {
            const clienteAtualizado = action.payload;
            const clientes = state.clientes.map(c => c.id === clienteAtualizado.id ? clienteAtualizado : c);
            Storage.salvarItem('clientes', clienteAtualizado);
            return { ...state, clientes };
        }
        case 'DELETE_CLIENT': { // NOVO
            const clienteId = action.payload;
            const clientes = state.clientes.filter(c => c.id !== clienteId);
            Storage.apagarItem('clientes', clienteId);
            // Futuro: considerar o que fazer com contas/dívidas associadas
            return { ...state, clientes };
        }
        case 'ADD_CLIENT_TAG': {
            const novaTag = { id: crypto.randomUUID(), ...action.payload };
            const tagsDeCliente = [...state.tagsDeCliente, novaTag];
            Storage.salvarItem('tagsDeCliente', novaTag);
            return { ...state, tagsDeCliente };
        }

        // --- LÓGICA DE COMPRA ---
        case 'ADD_COMPRA': {
            const novaCompra = { id: crypto.randomUUID(), data: new Date().toISOString(), ...action.payload };
            const historicoCompras = [...state.historicoCompras, novaCompra];
            Storage.salvarItem('historicoCompras', novaCompra);
            
            let inventarioAtualizado = [...state.inventario];
            const fornecedor = state.fornecedores.find(f => f.id === novaCompra.fornecedorId);
            const produtoCatalogo = fornecedor.catalogo.find(p => p.id === novaCompra.produtoCatalogoId);

            const produtoExistenteIndex = inventarioAtualizado.findIndex(p => p.catalogoId === novaCompra.produtoCatalogoId);
            const novoLote = { quantidade: novaCompra.quantidade, dataCompra: novaCompra.data, custoUnitario: novaCompra.valorTotal / novaCompra.quantidade };

            if (produtoExistenteIndex > -1) {
                const produtoAtualizado = { ...inventarioAtualizado[produtoExistenteIndex] };
                produtoAtualizado.stockArmazemLotes.push(novoLote);
                inventarioAtualizado[produtoExistenteIndex] = produtoAtualizado;
                Storage.salvarItem('inventario', produtoAtualizado);
            } else {
                const novoProdutoInventario = { id: crypto.randomUUID(), catalogoId: produtoCatalogo.id, nome: produtoCatalogo.nome, tags: produtoCatalogo.tags, precoVenda: produtoCatalogo.precoVenda, fornecedorId: novaCompra.fornecedorId, stockLoja: 0, stockMinimo: 0, stockArmazemLotes: [novoLote], ultimaVenda: null };
                inventarioAtualizado.push(novoProdutoInventario);
                Storage.salvarItem('inventario', novoProdutoInventario);
            }
            return { ...state, historicoCompras, inventario: inventarioAtualizado };
        }

        // ... (restante do reducer, sem alterações) ...
        case 'ADD_ACCOUNT': {
            const novaContaPayload = action.payload;
            const novaConta = { pedidos: [], dataAbertura: new Date().toISOString(), status: 'ativa', ...novaContaPayload };
            const novasContasAtivas = [...state.contasAtivas, novaConta];
            Storage.salvarItem('contas', novaConta);
            return { ...state, contasAtivas: novasContasAtivas };
        }
        case 'ADD_FORNECEDOR': {
            const novoFornecedor = { id: crypto.randomUUID(), catalogo: [], ...action.payload };
            const fornecedores = [...state.fornecedores, novoFornecedor];
            Storage.salvarItem('fornecedores', novoFornecedor);
            return { ...state, fornecedores };
        }
        case 'ADD_PRODUCT_TO_CATALOG': {
            const { fornecedorId, produto } = action.payload;
            const fornecedoresAtualizados = state.fornecedores.map(f => {
                if (f.id === fornecedorId) {
                    const fAtualizado = { ...f, catalogo: [...f.catalogo] }; // Garante imutabilidade
                    const novoProdutoCatalogo = { id: crypto.randomUUID(), ...produto };
                    fAtualizado.catalogo.push(novoProdutoCatalogo);
                    Storage.salvarItem('fornecedores', fAtualizado);
                    return fAtualizado;
                }
                return f;
            });
            return { ...state, fornecedores: fornecedoresAtualizados };
        }
        
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