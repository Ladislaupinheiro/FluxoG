// /modules/views/SettingsView.js - (v10.0 - View SPA Refatorada)
'use strict';

import ThemeService from '../services/ThemeService.js';
import { abrirModalBackupRestore, abrirModalLimparDados } from '../components/Modals.js';
import Router from '../Router.js';

let viewNode = null;

/**
 * Retorna o HTML do ecrã de Configurações.
 * @returns {string} O HTML completo do ecrã.
 */
function render() {
    const currentTheme = ThemeService.getCurrentTheme();
    const isChecked = currentTheme === 'dark';

    return `
        <section id="view-settings" class="p-4">
            <header class="flex items-center mb-6 relative">
                <h2 class="text-2xl font-bold text-center flex-grow">Configurações</h2>
                <button id="btn-close-settings" class="absolute top-0 right-0 text-3xl text-texto-secundario hover:text-texto-principal">
                    &times;
                </button>
            </header>

            <div class="space-y-6">
                <div>
                    <h3 class="text-lg font-semibold mb-3 border-b border-borda pb-2">Aparência</h3>
                    <div class="bg-fundo-secundario p-4 rounded-lg shadow-md">
                        <div class="theme-switch-wrapper flex justify-between items-center">
                            <label for="theme-switch-input" class="text-base font-medium">Tema Escuro</label>
                            <label class="theme-switch relative inline-block w-[50px] h-[26px]">
                                <input type="checkbox" id="theme-switch-input" ${isChecked ? 'checked' : ''}>
                                <span class="slider round absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-gray-300 transition duration-400"></span>
                            </label>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 class="text-lg font-semibold mb-3 border-b border-borda pb-2">Gestão de Dados</h3>
                    <div class="bg-fundo-secundario p-4 rounded-lg shadow-md space-y-3">
                        <button id="btn-backup" class="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg shadow">
                            <i class="lni lni-download"></i> Backup e Restauro
                        </button>
                        <button id="btn-clear-data" class="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg shadow">
                            <i class="lni lni-warning"></i> Limpar Todos os Dados
                        </button>
                    </div>
                </div>
            </div>
        </section>
    `;
}

/**
 * Adiciona os event listeners ao ecrã após ser renderizado.
 */
function mount() {
    viewNode = document.getElementById('app-root');

    // Listeners
    viewNode.querySelector('#btn-close-settings')?.addEventListener('click', () => {
        Router.navigateTo('#dashboard');
    });

    viewNode.querySelector('#theme-switch-input')?.addEventListener('change', () => {
        ThemeService.toggleTheme();
    });

    viewNode.querySelector('#btn-backup')?.addEventListener('click', abrirModalBackupRestore);
    viewNode.querySelector('#btn-clear-data')?.addEventListener('click', abrirModalLimparDados);
}

/**
 * Função de limpeza (neste caso, não é necessária nenhuma ação específica).
 */
function unmount() {
    viewNode = null;
}

export default {
    render,
    mount,
    unmount
};