// /modules/services/Storage.js - Camada de Abstração para o IndexedDB (v7.0 - Final)
'use strict';

const DB_NAME = 'GestorBarDB';
const DB_VERSION = 2; // Versão incrementada para adicionar a tabela de clientes

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

            // 1. Object Store para o Inventário
            if (!database.objectStoreNames.contains('inventario')) {
                const inventarioStore = database.createObjectStore('inventario', { keyPath: 'id' });
                inventarioStore.createIndex('nome', 'nome', { unique: false });
            }

            // 2. Object Store para as Contas
            if (!database.objectStoreNames.contains('contas')) {
                database.createObjectStore('contas', { keyPath: 'id' });
            }

            // 3. Object Store para o Histórico de Fechos
            if (!database.objectStoreNames.contains('historico')) {
                database.createObjectStore('historico', { keyPath: 'id', autoIncrement: true });
            }
            
            // 4. Object Store para Configurações
             if (!database.objectStoreNames.contains('config')) {
                database.createObjectStore('config', { keyPath: 'key' });
            }

            // 5. Object Store para os Clientes (NOVO NA v2)
            if (!database.objectStoreNames.contains('clientes')) {
                const clientesStore = database.createObjectStore('clientes', { keyPath: 'id' });
                clientesStore.createIndex('nome', 'nome', { unique: false });
            }
        };
    });
}

/**
 * Carrega todos os itens de um Object Store.
 * @param {string} storeName - O nome do store (ex: 'inventario').
 * @returns {Promise<Array<any>>} Uma promessa que resolve com um array de itens.
 */
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

/**
 * Salva (adiciona ou atualiza) um item num Object Store.
 * @param {string} storeName - O nome do store.
 * @param {object} item - O objeto a ser guardado.
 * @returns {Promise<IDBValidKey>} Uma promessa que resolve com a chave do item salvo.
 */
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

/**
 * Apaga um item de um Object Store pela sua chave.
 * @param {string} storeName - O nome do store.
 * @param {IDBValidKey} key - A chave do item a ser apagado.
 * @returns {Promise<void>} Uma promessa que resolve quando o item é apagado.
 */
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