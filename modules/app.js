// /modules/app.js - O Orquestrador Principal da Aplicação (v10.1 - CORRIGIDO)
'use strict';

import store, { carregarEstadoInicial } from './services/Store.js';
import Router from './Router.js';
import * as Modals from './components/Modals.js';
import * as Toast from './components/Toast.js';
import ThemeService from './services/ThemeService.js';

/**
 * Função principal que inicializa a aplicação.
 */
async function main() {
    try {
        // 1. Inicializa os serviços essenciais
        await carregarEstadoInicial();
        ThemeService.init();
        Modals.init(); // <-- CORRIGIDO
        Toast.init();   // <-- CORRIGIDO
        
        // 2. Inicializa o Router (que vai gerir a renderização das Views)
        Router.init();

        console.log("Aplicação 'Gestor de Bar Pro' inicializada com sucesso no modo SPA.");

    } catch (error) {
        console.error('Falha crítica na inicialização da aplicação:', error);
        // Renderiza uma mensagem de erro na tela para o utilizador
        const appRoot = document.getElementById('app-root');
        if (appRoot) {
            appRoot.innerHTML = `
                <div class="p-4 text-center text-red-500">
                    <h1 class="text-2xl font-bold">Erro Crítico</h1>
                    <p>Não foi possível carregar a aplicação. Por favor, tente recarregar a página.</p>
                    <p class="text-sm mt-2">${error.message}</p>
                </div>
            `;
        }
    }
}

// O PONTO DE ENTRADA CORRETO: Espera que o HTML esteja pronto antes de chamar main()
document.addEventListener('DOMContentLoaded', main);