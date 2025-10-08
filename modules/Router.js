// /modules/Router.js
'use strict';

import Nav from './components/Nav.js';
import DashboardView from './views/DashboardView.js';
import InventarioView from './views/InventarioView.js';
import AtendimentoView from './views/AtendimentoView.js';
import ClientesView from './views/ClientesView.js';
import ClienteDetalhesView from './views/ClienteDetalhesView.js';
import FluxoCaixaView from './views/FluxoCaixaView.js';
import AnálisesView from './views/AnálisesView.js';
import SettingsView from './views/SettingsView.js';

const sel = {}; 
let currentView = null;

const routes = {
    '#dashboard': DashboardView,
    '#inventario': InventarioView,
    '#atendimento': AtendimentoView,
    '#clientes': ClientesView,
    '#cliente-detalhes': ClienteDetalhesView,
    '#fluxo-caixa': FluxoCaixaView,
    '#analises': AnálisesView,
    '#settings': SettingsView
};

function loadRoute() {
    let hash = window.location.hash || '#dashboard';
    let viewModule;
    let params = null;

    if (hash.startsWith('#cliente-detalhes/')) {
        viewModule = routes['#cliente-detalhes'];
        params = hash.split('/')[1];
    } else if (hash.startsWith('#inventario/')) {
        viewModule = routes['#inventario'];
        params = hash.split('/')[1];
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