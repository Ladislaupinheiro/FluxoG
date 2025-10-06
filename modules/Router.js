// /modules/Router.js - (v10.0 - NOVO) O Roteador da nossa SPA
'use strict';

import Nav from './components/Nav.js';
import DashboardView from './views/DashboardView.js';
import InventarioView from './views/InventarioView.js';
import AtendimentoView from './views/AtendimentoView.js';
import ClientesView from './views/ClientesView.js';
import ClienteDetalhesView from './views/ClienteDetalhesView.js';
import FluxoCaixaView from './views/FluxoCaixaView.js';
import SettingsView from './views/SettingsView.js';

const sel = {}; 
let currentView = null;

const routes = {
    '#dashboard': DashboardView,
    '#inventario': InventarioView, // Rota base para o inventário
    '#atendimento': AtendimentoView,
    '#clientes': ClientesView,
    '#cliente-detalhes': ClienteDetalhesView,
    '#fluxo-caixa': FluxoCaixaView,
    '#settings': SettingsView
};

/**
 * Função principal que carrega uma rota. Gere o ciclo de vida da View (unmount/mount).
 */
function loadRoute() {
    let hash = window.location.hash || '#dashboard';
    let viewModule;
    let params = null;

    // Lógica para rotas dinâmicas
    if (hash.startsWith('#cliente-detalhes/')) {
        viewModule = routes['#cliente-detalhes'];
        params = hash.split('/')[1];
    
    // --- INÍCIO DA ALTERAÇÃO ---
    // ADICIONE ESTE BLOCO `ELSE IF`
    } else if (hash.startsWith('#inventario/')) {
        viewModule = routes['#inventario']; // Continua a usar a InventarioView
        params = hash.split('/')[1]; // Extrai o ID do produto
    // --- FIM DA ALTERAÇÃO ---

    } else {
        viewModule = routes[hash];
    }

    if (!viewModule) {
        window.location.hash = '#dashboard';
        return;
    }

    if (currentView && typeof currentView.unmount === 'function') {
        currentView.unmount();
    }

    sel.appRoot.innerHTML = viewModule.render(params);

    if (typeof viewModule.mount === 'function') {
        viewModule.mount(params);
    }
    
    currentView = viewModule;

    Nav.updateActiveState(hash);
}

/**
 * Inicializa o roteador.
 */
function init() {
    sel.appRoot = document.getElementById('app-root');
    if (!sel.appRoot) {
        console.error("Elemento 'app-root' não encontrado. A aplicação não pode ser renderizada.");
        return;
    }

    sel.appRoot.insertAdjacentHTML('afterend', Nav.render());
    Nav.mount();

    window.addEventListener('hashchange', loadRoute);
    loadRoute();
}

export default {
    init,
    navigateTo: (hash) => {
        window.location.hash = hash;
    }
};