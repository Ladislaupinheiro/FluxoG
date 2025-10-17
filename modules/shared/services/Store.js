// /modules/shared/services/Store.js (CORRIGIDO E COMPLETO)
'use strict';
import * as Storage from './Storage.js';
import { gerarEstadoAposArquivo } from '../lib/utils.js';

const initialState = {
    schema_version: 13,
    
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
        case 'SET_INITIAL_STATE': {
            const mergedConfig = { ...initialState.config, ...(action.payload.config || {}) };
            return { ...state, ...action.payload, config: mergedConfig };
        }

        // --- LÓGICA DE COMPRA E STOCK (CORRIGIDA E EXPANDIDA) ---
        case 'ADD_COMPRA': {
            const novaCompra = { id: crypto.randomUUID(), data: new Date().toISOString(), ...action.payload };
            const historicoCompras = [...state.historicoCompras, novaCompra];
            Storage.salvarItem('historicoCompras', novaCompra);
            
            const custoUnitario = novaCompra.valorTotal / novaCompra.quantidade;
            let inventarioAtualizado = [...state.inventario];

            const produtoExistenteIndex = inventarioAtualizado.findIndex(p => p.catalogoId === novaCompra.produtoCatalogoId);

            if (produtoExistenteIndex > -1) {
                // Cenário 1: O produto JÁ EXISTE no inventário. Apenas atualizamos o stock e o custo.
                const produtoParaAtualizar = { ...inventarioAtualizado[produtoExistenteIndex] };
                produtoParaAtualizar.stockArmazem += novaCompra.quantidade;
                produtoParaAtualizar.custoUnitario = custoUnitario; // Atualiza o custo para o da última compra
                
                inventarioAtualizado[produtoExistenteIndex] = produtoParaAtualizar;
                Storage.salvarItem('inventario', produtoParaAtualizar);

            } else {
                // Cenário 2: O produto NÃO EXISTE. Criamos a entrada no inventário.
                const fornecedor = state.fornecedores.find(f => f.id === novaCompra.fornecedorId);
                const produtoCatalogo = fornecedor ? fornecedor.catalogo.find(p => p.id === novaCompra.produtoCatalogoId) : null;

                if (produtoCatalogo) {
                    const novoProdutoInventario = {
                        id: crypto.randomUUID(),
                        catalogoId: produtoCatalogo.id,
                        nome: produtoCatalogo.nome,
                        tags: produtoCatalogo.tags,
                        precoVenda: produtoCatalogo.precoVenda || 0,
                        fornecedorId: novaCompra.fornecedorId,
                        stockLoja: 0,
                        stockArmazem: novaCompra.quantidade, // O stock inicial do armazém é a quantidade comprada
                        custoUnitario: custoUnitario,
                        stockMinimo: 0,
                        ultimaVenda: null
                    };
                    inventarioAtualizado.push(novoProdutoInventario);
                    Storage.salvarItem('inventario', novoProdutoInventario);
                }
            }
            return { ...state, historicoCompras, inventario: inventarioAtualizado };
        }

        // --- OUTRAS AÇÕES (inalteradas nesta refatoração) ---
        case 'ADD_CLIENT': {
            const novoClientePayload = action.payload;
            const novoCliente = { id: crypto.randomUUID(), dataRegisto: new Date().toISOString(), dividas: [], fotoDataUrl: null, ...novoClientePayload };
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
        case 'DELETE_CLIENT': {
            const clienteId = action.payload;
            const clientes = state.clientes.filter(c => c.id !== clienteId);
            Storage.apagarItem('clientes', clienteId);
            return { ...state, clientes };
        }
        case 'ADD_CLIENT_TAG': {
            const novaTag = { id: crypto.randomUUID(), ...action.payload };
            const tagsDeCliente = [...state.tagsDeCliente, novaTag];
            Storage.salvarItem('tagsDeCliente', novaTag);
            return { ...state, tagsDeCliente };
        }
        case 'ADD_PRODUCT_CATEGORY': {
            const { nome, cor, parentId } = action.payload;
            const novaCategoria = { id: crypto.randomUUID(), nome, cor, parentId: parentId || null, isSystemDefault: false };
            const categoriasDeProduto = [...state.categoriasDeProduto, novaCategoria];
            Storage.salvarItem('categoriasDeProduto', novaCategoria);
            return { ...state, categoriasDeProduto };
        }
        case 'DELETE_PRODUCT_CATEGORY': {
            const categoriaId = action.payload;
            const categoriaParaApagar = state.categoriasDeProduto.find(cat => cat.id === categoriaId);
            if (categoriaParaApagar && categoriaParaApagar.isSystemDefault) { return state; }
            const categoriasADeletar = new Set([categoriaId]);
            state.categoriasDeProduto.forEach(cat => { if (cat.parentId === categoriaId) { categoriasADeletar.add(cat.id); } });
            const categoriasDeProduto = state.categoriasDeProduto.filter(cat => !categoriasADeletar.has(cat.id));
            categoriasADeletar.forEach(id => Storage.apagarItem('categoriasDeProduto', id));
            return { ...state, categoriasDeProduto };
        }
        case 'MOVE_STOCK': {
            const { produtoId, quantidade } = action.payload;
            const inventario = state.inventario.map(p => {
                if (p.id === produtoId) {
                    const produtoAtualizado = { ...p, stockArmazem: p.stockArmazem - quantidade, stockLoja: p.stockLoja + quantidade };
                    Storage.salvarItem('inventario', produtoAtualizado);
                    return produtoAtualizado;
                }
                return p;
            });
            return { ...state, inventario };
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
                    const fAtualizado = { ...f, catalogo: [...f.catalogo] };
                    const novoProdutoCatalogo = { id: crypto.randomUUID(), ...produto };
                    fAtualizado.catalogo.push(novoProdutoCatalogo);
                    Storage.salvarItem('fornecedores', fAtualizado);
                    return fAtualizado;
                }
                return f;
            });
            return { ...state, fornecedores: fornecedoresAtualizados };
        }
        case 'ADD_ACCOUNT': {
            const novaContaPayload = action.payload;
            const novaConta = { id: crypto.randomUUID(), pedidos: [], dataAbertura: new Date().toISOString(), status: 'ativa', ...novaContaPayload };
            const novasContasAtivas = [...state.contasAtivas, novaConta];
            Storage.salvarItem('contas', novaConta);
            return { ...state, contasAtivas: novasContasAtivas };
        }
        case 'CHANGE_ACCOUNT_CLIENT': {
            const { contaId, novoClienteId, novoClienteNome } = action.payload;
            const contasAtivas = state.contasAtivas.map(conta => {
                if (conta.id === contaId) {
                    const contaAtualizada = { ...conta, clienteId: novoClienteId, nome: novoClienteNome };
                    Storage.salvarItem('contas', contaAtualizada);
                    return contaAtualizada;
                }
                return conta;
            });
            return { ...state, contasAtivas };
        }
        case 'ADD_ORDER_ITEM': {
            const { contaId, produto, quantidade } = action.payload;
            const contasAtivas = state.contasAtivas.map(conta => {
                if (conta.id === contaId) {
                    const novoPedido = { id: crypto.randomUUID(), produtoId: produto.id, nome: produto.nome, preco: produto.precoVenda, custo: produto.custoUnitario || 0, qtd: quantidade };
                    const contaAtualizada = { ...conta, pedidos: [...conta.pedidos, novoPedido] };
                    Storage.salvarItem('contas', contaAtualizada);
                    return contaAtualizada;
                }
                return conta;
            });
            return { ...state, contasAtivas };
        }
        case 'REMOVE_ORDER_ITEM': {
            const { contaId, pedidoId } = action.payload;
            const contasAtivas = state.contasAtivas.map(conta => {
                if (conta.id === contaId) {
                    const pedidosAtualizados = conta.pedidos.filter(p => p.id !== pedidoId);
                    const contaAtualizada = { ...conta, pedidos: pedidosAtualizados };
                    Storage.salvarItem('contas', contaAtualizada);
                    return contaAtualizada;
                }
                return conta;
            });
            return { ...state, contasAtivas };
        }
        case 'UPDATE_ORDER_ITEM_QTD': {
            const { contaId, pedidoId, novaQuantidade } = action.payload;
            const contasAtivas = state.contasAtivas.map(conta => {
                if (conta.id === contaId) {
                    const pedidosAtualizados = conta.pedidos.map(p => p.id === pedidoId ? { ...p, qtd: novaQuantidade } : p);
                    const contaAtualizada = { ...conta, pedidos: pedidosAtualizados };
                    Storage.salvarItem('contas', contaAtualizada);
                    return contaAtualizada;
                }
                return conta;
            });
            return { ...state, contasAtivas };
        }
        
        default:
            return state;
    }
}

const store = new Store(reducer, initialState);

export async function carregarEstadoInicial() {
    try {
        await Storage.initDB();
        let [
            inventario, contas, historico, clientes, despesas, configArray,
            fornecedores, historicoCompras, categoriasDeProduto, tagsDeCliente
        ] = await Promise.all([
            Storage.carregarTodos('inventario'), Storage.carregarTodos('contas'),
            Storage.carregarTodos('historico'), Storage.carregarTodos('clientes'),
            Storage.carregarTodos('despesas'), Storage.carregarTodos('config'),
            Storage.carregarTodos('fornecedores'), Storage.carregarTodos('historicoCompras'),
            Storage.carregarTodos('categoriasDeProduto'), Storage.carregarTodos('tagsDeCliente')
        ]);
        
        if (categoriasDeProduto.length === 0) {
            console.log("Nenhuma categoria encontrada. A criar categorias padrão...");
            const categoriaAlcool = { id: 'sys_alcool', nome: "Alcool", cor: "#FBBF24", parentId: null, isSystemDefault: true };
            const categoriaSemAlcool = { id: 'sys_sem_alcool', nome: "Sem Alcool", cor: "#34D399", parentId: null, isSystemDefault: true };
            const subCategoriasPadrao = [
                { id: crypto.randomUUID(), nome: 'Cerveja', cor: '#F59E0B', parentId: categoriaAlcool.id, isSystemDefault: false },
                { id: crypto.randomUUID(), nome: 'Vinho', cor: '#991B1B', parentId: categoriaAlcool.id, isSystemDefault: false },
                { id: crypto.randomUUID(), nome: 'Whisky', cor: '#D97706', parentId: categoriaAlcool.id, isSystemDefault: false },
                { id: crypto.randomUUID(), nome: 'Refrigerante', cor: '#EF4444', parentId: categoriaSemAlcool.id, isSystemDefault: false },
                { id: crypto.randomUUID(), nome: 'Sumo', cor: '#F97316', parentId: categoriaSemAlcool.id, isSystemDefault: false },
                { id: crypto.randomUUID(), nome: 'Água', cor: '#3B82F6', parentId: categoriaSemAlcool.id, isSystemDefault: false },
                { id: crypto.randomUUID(), nome: 'Energético', cor: '#6366F1', parentId: categoriaSemAlcool.id, isSystemDefault: false },
            ];
            const todasCategoriasDefault = [categoriaAlcool, categoriaSemAlcool, ...subCategoriasPadrao];
            await Promise.all(todasCategoriasDefault.map(cat => Storage.salvarItem('categoriasDeProduto', cat)));
            categoriasDeProduto = todasCategoriasDefault;
        }

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