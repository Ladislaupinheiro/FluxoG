// /modules/views/SettingsView.js - ATUALIZADO com Expansão de Configs
'use strict';

import store from '../services/Store.js';
import ThemeService from '../services/ThemeService.js';
import { abrirModalBackupRestore } from '../components/Modals.js';
import { mostrarNotificacao } from '../components/Toast.js';
import Router from '../Router.js';

let viewNode = null;

function render() {
    const state = store.getState();
    const { config } = state;
    const isChecked = ThemeService.getCurrentTheme() === 'dark';

    return `
        <form id="form-settings">
            <header class="flex items-center p-4 mb-4 relative">
                <h2 class="text-2xl font-bold text-center flex-grow">Configurações</h2>
                <button type="button" id="btn-close-settings" class="absolute top-2 right-2 p-2 text-3xl text-texto-secundario hover:text-texto-principal">
                    &times;
                </button>
            </header>

            <section class="p-4 space-y-8">
                <div>
                    <h3 class="text-lg font-semibold mb-3 border-b border-borda pb-2">Informações do Negócio</h3>
                    <div class="bg-fundo-secundario p-4 rounded-lg shadow-md space-y-4">
                        <div>
                            <label for="config-business-name" class="block text-sm font-medium mb-1">Nome do Estabelecimento</label>
                            <input type="text" id="config-business-name" class="w-full p-2 border border-borda rounded-md bg-fundo-principal" value="${config.businessName || ''}">
                        </div>
                        <div>
                            <label for="config-nif" class="block text-sm font-medium mb-1">NIF</label>
                            <input type="text" id="config-nif" class="w-full p-2 border border-borda rounded-md bg-fundo-principal" value="${config.nif || ''}">
                        </div>
                        <div>
                            <label for="config-endereco" class="block text-sm font-medium mb-1">Endereço</label>
                            <input type="text" id="config-endereco" class="w-full p-2 border border-borda rounded-md bg-fundo-principal" value="${config.endereco || ''}">
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label for="config-telefone" class="block text-sm font-medium mb-1">Telefone</label>
                                <input type="tel" id="config-telefone" class="w-full p-2 border border-borda rounded-md bg-fundo-principal" value="${config.telefone || ''}">
                            </div>
                            <div>
                                <label for="config-email" class="block text-sm font-medium mb-1">Email</label>
                                <input type="email" id="config-email" class="w-full p-2 border border-borda rounded-md bg-fundo-principal" value="${config.email || ''}">
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 class="text-lg font-semibold mb-3 border-b border-borda pb-2">Regionais</h3>
                    <div class="bg-fundo-secundario p-4 rounded-lg shadow-md">
                        <div>
                            <label for="config-moeda" class="block text-sm font-medium mb-1">Moeda</label>
                            <select id="config-moeda" class="w-full p-2 border border-borda rounded-md bg-fundo-principal">
                                <option value="AOA" ${config.moeda === 'AOA' ? 'selected' : ''}>Kwanza (AOA)</option>
                                </select>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 class="text-lg font-semibold mb-3 border-b border-borda pb-2">Aparência</h3>
                    <div class="bg-fundo-secundario p-4 rounded-lg shadow-md">
                        <div class="theme-switch-wrapper flex justify-between items-center">
                            <label for="theme-switch-input" class="text-base font-medium">Tema Escuro</label>
                            <label class="theme-switch relative inline-block w-[50px] h-[26px]">
                                <input type="checkbox" id="theme-switch-input" ${isChecked ? 'checked' : ''}>
                                <span class="slider round"></span>
                            </label>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 class="text-lg font-semibold mb-3 border-b border-borda pb-2">Gestão de Dados</h3>
                    <div class="bg-fundo-secundario p-4 rounded-lg shadow-md">
                        <button type="button" id="btn-backup" class="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg shadow">
                            <i class="lni lni-download"></i> Backup e Restauro
                        </button>
                    </div>
                </div>
            </section>
            
            <footer class="p-4 sticky bottom-0 bg-fundo-principal border-t border-borda">
                <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow">Salvar Alterações</button>
            </footer>
        </form>
    `;
}

function mount() {
    viewNode = document.getElementById('app-root');
    const form = viewNode.querySelector('#form-settings');

    // Listener para fechar a página
    viewNode.querySelector('#btn-close-settings')?.addEventListener('click', () => {
        Router.navigateTo('#dashboard');
    });

    // Listener para o tema
    viewNode.querySelector('#theme-switch-input')?.addEventListener('change', () => {
        ThemeService.toggleTheme();
    });

    // Listener para o backup
    viewNode.querySelector('#btn-backup')?.addEventListener('click', abrirModalBackupRestore);

    // --- NOVA LÓGICA PARA SALVAR ---
    form?.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newConfig = {
            businessName: viewNode.querySelector('#config-business-name').value,
            nif: viewNode.querySelector('#config-nif').value,
            endereco: viewNode.querySelector('#config-endereco').value,
            telefone: viewNode.querySelector('#config-telefone').value,
            email: viewNode.querySelector('#config-email').value,
            moeda: viewNode.querySelector('#config-moeda').value,
        };

        store.dispatch({ type: 'UPDATE_CONFIG', payload: newConfig });
        mostrarNotificacao("Configurações salvas com sucesso!");
        Router.navigateTo('#dashboard');
    });
}

function unmount() {
    viewNode = null;
}

export default {
    render,
    mount,
    unmount
};