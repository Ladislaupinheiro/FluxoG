// /modules/components/Nav.js - Componente de Navegação Principal (v7.1 - Header Dinâmica)
'use strict';

const sel = {};

/**
 * Guarda as referências aos elementos do DOM necessários para a navegação.
 */
function querySelectors() {
    sel.bottomNav = document.getElementById('bottom-nav');
    sel.tabContents = document.querySelectorAll('.tab-content');
    sel.fabs = document.querySelectorAll('.fab');
}

/**
 * Navega para uma aba específica, atualizando a UI.
 * @param {string} tabId - O ID da aba de destino (ex: 'tab-inventario').
 */
export function navigateToTab(tabId) {
    // Esconde todos os conteúdos e FABs
    sel.tabContents.forEach(tab => tab.classList.add('hidden'));
    sel.fabs.forEach(fab => fab.classList.add('hidden'));

    // Desativa todos os botões da nav
    sel.bottomNav.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Mostra o conteúdo da aba selecionada
    const activeTab = document.getElementById(tabId);
    if (activeTab) {
        activeTab.classList.remove('hidden');
    }

    // Mapeamento de IDs de abas para títulos de header
    const titleMappings = {
        'tab-dashboard': 'Dashboard',
        'tab-inventario': 'Inventário',
        'tab-atendimento': 'Atendimento',
        'tab-clientes': 'Clientes',
        'tab-fluxo-caixa': 'Caixa'
    };
    
    // Define o nome do FAB com base no ID da aba
    const fabMappings = {
        'tab-inventario': 'btn-fab-add-produto',
        'tab-atendimento': 'btn-fab-add-conta',
        'tab-clientes': 'btn-fab-add-cliente'
    };

    const fabId = fabMappings[tabId];
    if (fabId) {
        const fab = document.getElementById(fabId);
        if (fab) {
            fab.classList.remove('hidden');
        }
    }
    
    // Ativa o botão da nav e atualiza o título da header
    const activeButton = sel.bottomNav.querySelector(`.nav-btn[data-tab="${tabId}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

/**
 * Função de inicialização do componente de navegação.
 */
export function init() {
    querySelectors();
    // A aba inicial é definida no app.js, não mais aqui
}