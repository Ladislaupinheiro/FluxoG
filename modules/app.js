// /modules/app.js - O Orquestrador da Aplicação (v7.0 - Arquitetura Final)
'use strict';

// Import do Store e da função de inicialização
import store, { carregarEstadoInicial } from './services/Store.js';

// Import de todos os módulos de UI
import * as Modals from './components/Modals.js';
import * as Nav from './components/Nav.js'; // Assumindo que a lógica da nav será movida para aqui
import * as Toast from './components/Toast.js';

// Import de todas as nossas Views Reativas
import AtendimentoView from './views/AtendimentoView.js';
import ClientesView from './views/ClientesView.js';
import DashboardView from './views/DashboardView.js';
import FluxoCaixaView from './views/FluxoCaixaView.js';
import InventarioView from './views/InventarioView.js';


/**
 * Função de arranque principal da aplicação.
 */
async function inicializarApp() {
    try {
        await carregarEstadoInicial();
        
        const appContainer = document.getElementById('app-container');
        const bottomNav = document.getElementById('bottom-nav');
        
        appContainer.classList.remove('hidden');
        bottomNav.classList.remove('hidden');
        
        // Decide qual a melhor aba para mostrar no arranque com base no estado
        const state = store.getState();
        if (state.inventario.length === 0) {
            Nav.navigateToTab('tab-inventario');
        } else if (state.contasAtivas.filter(c => c.status === 'ativa').length > 0) {
            Nav.navigateToTab('tab-atendimento');
        } else {
            Nav.navigateToTab('tab-dashboard');
        }

    } catch (error) {
        console.error("Erro crítico durante a inicialização:", error);
        document.body.innerHTML = `<div class="fixed inset-0 bg-red-800 text-white flex flex-col justify-center items-center p-4 text-center"><h1 class="text-2xl font-bold mb-4">Erro Crítico</h1><p>A aplicação não conseguiu arrancar. Por favor, limpe os dados de navegação e tente novamente.</p></div>`;
    }
}

/**
 * Regista os event listeners globais da aplicação.
 * A maioria dos listeners agora vive dentro das suas respetivas Views.
 */
function configurarEventListenersGlobais() {
    const bottomNav = document.getElementById('bottom-nav');
    bottomNav.addEventListener('click', (event) => {
        const target = event.target.closest('.nav-btn');
        if (target) {
            Nav.navigateToTab(target.dataset.tab);
        }
    });

    // Gestão genérica de fecho de modais
    document.addEventListener('click', (event) => {
        if (event.target.matches('.modal-container-wrapper') || event.target.matches('.btn-cancelar-modal')) {
            const modal = event.target.closest('.modal-container-wrapper');
            if (modal) {
                modal.classList.add('hidden');
            }
        }
    });
    
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            document.querySelectorAll('.modal-container-wrapper:not(.hidden)').forEach(modal => {
                modal.classList.add('hidden');
            });
        }
    });
}


// Ponto de entrada da aplicação
document.addEventListener('DOMContentLoaded', () => {
    
    // Inicializa componentes de UI globais
    Nav.init();
    Modals.init();
    Toast.init();
    
    // Inicializa todas as Views
    DashboardView.init();
    InventarioView.init();
    AtendimentoView.init();
    ClientesView.init();
    FluxoCaixaView.init();
    
    // Configura os listeners que não pertencem a nenhuma view específica
    configurarEventListenersGlobais();
    
    // Arranca a aplicação
    inicializarApp();
});