// /modules/shared/services/Storage.js (ATUALIZADO)
'use strict';

const DB_NAME = 'GestorBarDB';
const DB_VERSION = 6; // Versão incrementada para refletir a nova lógica de categorias

let db = null;

/**
 * Abre a conexão com o IndexedDB e atualiza o esquema se necessário.
 * Esta função deve ser chamada no arranque da aplicação.
 * @returns {Promise<IDBDatabase>} Uma promessa que resolve com a instância da base de dados.
 */
export function initDB() {
    return new Promise((resolve, reject) => {
        if (db) {
            return resolve(db);
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('Erro ao abrir a base de dados:', event.target.error);
            reject('Erro ao abrir a base de dados.');
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('Base de dados aberta com sucesso.');
            resolve(db);
        };

        // Chamado apenas na primeira vez ou quando a DB_VERSION é incrementada
        request.onupgradeneeded = (event) => {
            const database = event.target.result;
            console.log(`A atualizar a base de dados para a versão ${DB_VERSION}...`);

            // --- Estruturas Existentes ---
            if (!database.objectStoreNames.contains('inventario')) database.createObjectStore('inventario', { keyPath: 'id' });
            if (!database.objectStoreNames.contains('contas')) database.createObjectStore('contas', { keyPath: 'id' });
            if (!database.objectStoreNames.contains('historico')) database.createObjectStore('historico', { keyPath: 'id' });
            if (!database.objectStoreNames.contains('config')) database.createObjectStore('config', { keyPath: 'key' });
            if (!database.objectStoreNames.contains('clientes')) database.createObjectStore('clientes', { keyPath: 'id' });
            if (!database.objectStoreNames.contains('despesas')) database.createObjectStore('despesas', { keyPath: 'id' });
            if (!database.objectStoreNames.contains('fornecedores')) database.createObjectStore('fornecedores', { keyPath: 'id' });
            if (!database.objectStoreNames.contains('historicoCompras')) database.createObjectStore('historicoCompras', { keyPath: 'id' });
            if (!database.objectStoreNames.contains('tagsDeCliente')) database.createObjectStore('tagsDeCliente', { keyPath: 'id' });
            
            // A estrutura de categoriasDeProduto não precisa de um novo índice,
            // mas versionar a DB garante que as mudanças sejam reconhecidas.
            if (!database.objectStoreNames.contains('categoriasDeProduto')) {
                const categoriasStore = database.createObjectStore('categoriasDeProduto', { keyPath: 'id' });
                categoriasStore.createIndex('nome', 'nome', { unique: false });
                console.log('Object store "categoriasDeProduto" criado.');
            }
        };
    });
}

// O resto do ficheiro (carregarTodos, salvarItem, etc.) permanece inalterado.
export async function carregarTodos(storeName) {
    if (!db) await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => {
            resolve(request.result);
        };
        request.onerror = (event) => {
            console.error(`Erro ao carregar itens de '${storeName}':`, event.target.error);
            reject(`Erro ao carregar itens de '${storeName}'.`);
        };
    });
}

export async function salvarItem(storeName, item) {
    if (!db) await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(item);

        request.onsuccess = () => {
            resolve(request.result);
        };
        request.onerror = (event) => {
            console.error(`Erro ao salvar item em '${storeName}':`, event.target.error);
            reject(`Erro ao salvar item em '${storeName}'.`);
        };
    });
}

export async function apagarItem(storeName, key) {
    if (!db) await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);

        request.onsuccess = () => {
            resolve();
        };
        request.onerror = (event) => {
            console.error(`Erro ao apagar item de '${storeName}':`, event.target.error);
            reject(`Erro ao apagar item de '${storeName}'.`);
        };
    });
}

export async function limparStore(storeName) {
    if (!db) await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => {
            resolve();
        };
        request.onerror = (event) => {
            console.error(`Erro ao limpar o store '${storeName}':`, event.target.error);
            reject(`Erro ao limpar o store '${storeName}'.`);
        };
    });
}