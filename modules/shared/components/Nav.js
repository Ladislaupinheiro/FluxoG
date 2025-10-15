// /modules/shared/components/Nav.js
'use strict';

import Router from '../../app/Router.js';

const sel = {};

function render() {
    return `
        <nav id="bottom-nav" class="fixed bottom-0 left-0 w-full bg-fundo-secundario shadow-[0_-2px_5px_rgba(0,0,0,0.1)] dark:shadow-[0_-2px_5px_rgba(0,0,0,0.4)] grid grid-cols-6 z-[90]">
            <button class="nav-btn flex flex-col justify-center items-center gap-1 bg-none border-0 cursor-pointer transition-colors duration-200 border-t-2 border-transparent py-1 text-texto-secundario" data-hash="#dashboard" title="Dashboard">
                <i class="lni lni-grid-alt text-xl"></i>
                <span class="text-xs font-medium">Dashboard</span>
            </button>
            <button class="nav-btn flex flex-col justify-center items-center gap-1 bg-none border-0 cursor-pointer transition-colors duration-200 border-t-2 border-transparent py-1 text-texto-secundario" data-hash="#inventario" title="Inventário">
                <i class="lni lni-dropbox text-xl"></i>
                <span class="text-xs font-medium">Inventário</span>
            </button>
            <button class="nav-btn flex flex-col justify-center items-center gap-1 bg-none border-0 cursor-pointer transition-colors duration-200 border-t-2 border-transparent py-1 text-texto-secundario" data-hash="#atendimento" title="Atendimento">
                <i class="lni lni-clipboard text-xl"></i>
                <span class="text-xs font-medium">Atendimento</span>
            </button>
            <button class="nav-btn flex flex-col justify-center items-center gap-1 bg-none border-0 cursor-pointer transition-colors duration-200 border-t-2 border-transparent py-1 text-texto-secundario" data-hash="#clientes" title="Clientes">
                <i class="lni lni-users text-xl"></i>
                <span class="text-xs font-medium">Clientes</span>
            </button>
            <button class="nav-btn flex flex-col justify-center items-center gap-1 bg-none border-0 cursor-pointer transition-colors duration-200 border-t-2 border-transparent py-1 text-texto-secundario" data-hash="#fluxo-caixa" title="Caixa">
                <i class="lni lni-stats-up text-xl"></i>
                <span class="text-xs font-medium">Caixa</span>
            </button>
            <button class="nav-btn flex flex-col justify-center items-center gap-1 bg-none border-0 cursor-pointer transition-colors duration-200 border-t-2 border-transparent py-1 text-texto-secundario" data-hash="#analises" title="Análises">
                <i class="lni lni-bar-chart text-xl"></i>
                <span class="text-xs font-medium">Análises</span>
            </button>
        </nav>
    `;
}

function mount() {
    sel.navContainer = document.getElementById('bottom-nav');
    if (!sel.navContainer) return;

    sel.navContainer.addEventListener('click', (event) => {
        const navBtn = event.target.closest('.nav-btn');
        if (navBtn && navBtn.dataset.hash) {
            // A navegação é gerida pelo Router que ouve a mudança de hash
            window.location.hash = navBtn.dataset.hash;
        }
    });
}


function updateActiveState(currentHash) {
    if (!sel.navContainer) {
        sel.navContainer = document.getElementById('bottom-nav');
        if (!sel.navContainer) return;
    }
    
    const baseHash = currentHash.split('/')[0] || '#dashboard';

    sel.navContainer.querySelectorAll('.nav-btn').forEach(btn => {
        if (btn.dataset.hash === baseHash) {
            btn.classList.add('active', 'text-primaria');
            btn.classList.remove('text-texto-secundario');
        } else {
            btn.classList.remove('active', 'text-primaria');
            btn.classList.add('text-texto-secundario');
        }
    });
}

export default {
    render,
    mount,
    updateActiveState
};