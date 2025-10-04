// /modules/views/SettingsView.js - A View para o Ecrã de Configurações (v8.0 - Estrutura Inicial)
'use strict';

import store from '../services/Store.js';
import * as Nav from '../components/Nav.js';
import * as Toast from '../components/Toast.js';
import * as Storage from '../services/Storage.js';
import * as Modals from '../components/Modals.js';

const sel = {};

/**
 * Guarda as referências aos elementos do DOM para a View de Configurações.
 */
function querySelectors() {
    // Botão de acesso e contentor principal
    sel.btnSettings = document.getElementById('btn-settings');
    sel.viewSettings = document.getElementById('view-settings');
    sel.btnCloseSettings = document.getElementById('btn-close-settings');
    
    // Elementos da UI de Configurações
    sel.settingsProfilePic = document.getElementById('settings-profile-pic');
    sel.inputChangePic = document.getElementById('input-change-pic');
    sel.settingsBusinessNameDisplay = document.getElementById('settings-business-name-display');
    sel.settingsBusinessNameInput = document.getElementById('settings-business-name-input');
    sel.themeSelector = document.getElementById('theme-selector');
    sel.btnBackup = document.getElementById('btn-backup');
    sel.btnClearData = document.getElementById('btn-clear-data');

    // Seletores para o Modal de Backup
    sel.btnCreateBackup = document.getElementById('btn-create-backup');
    sel.btnTriggerRestore = document.getElementById('btn-trigger-restore');
    sel.inputRestoreFile = document.getElementById('input-restore-file');

    // Elementos globais que precisam de ser manipulados
    sel.allTabs = document.querySelectorAll('main .tab-content');
    sel.allFabs = document.querySelectorAll('.fab');
    sel.bottomNavButtons = document.querySelectorAll('#bottom-nav .nav-btn');
}

/**
 * Mostra o ecrã de configurações e esconde as outras views principais.
 */
function show() {
    // 1. Esconde todas as outras tabs e FABs
    sel.allTabs.forEach(tab => tab.classList.add('hidden'));
    sel.allFabs.forEach(fab => fab.classList.add('hidden'));

    // 2. Desativa visualmente todos os botões da navegação principal
    sel.bottomNavButtons.forEach(btn => btn.classList.remove('active'));
    
    // 3. Mostra a view de configurações
    sel.viewSettings.classList.remove('hidden');
}

/**
 * Função de renderização. Lê do state.config para preencher os campos.
 */
function render() {
    const state = store.getState();
    const config = state.config || {};
    
    // Renderiza o nome do estabelecimento
    const businessName = config.businessName || 'O Meu Bar';
    sel.settingsBusinessNameDisplay.textContent = businessName;
    sel.settingsBusinessNameInput.value = businessName;

    // Renderiza a foto de perfil
    const profilePicSrc = config.profilePicDataUrl || 'icons/logo-small-192.png';
    sel.settingsProfilePic.src = profilePicSrc;

    // Renderiza o tema selecionado
    sel.themeSelector.value = config.theme || 'light';
}


/**
 * Alterna entre o modo de exibição e edição para o nome do estabelecimento.
 * @param {boolean} isEditing - True para entrar no modo de edição, false para sair.
 */
function toggleNameEditMode(isEditing) {
    sel.settingsBusinessNameDisplay.classList.toggle('hidden', isEditing);
    sel.settingsBusinessNameInput.classList.toggle('hidden', !isEditing);
    if (isEditing) {
        sel.settingsBusinessNameInput.focus();
        sel.settingsBusinessNameInput.select();
    }
}

/**
 * Reúne todos os dados da aplicação e inicia o download de um ficheiro JSON.
 */
async function handleCreateBackup() {
    Toast.mostrarNotificacao("A preparar o backup...");
    try {
        const backupData = {
            appName: 'GestorBarPro',
            version: 1,
            timestamp: new Date().toISOString(),
            data: {
                inventario: await Storage.carregarTodos('inventario'),
                contas: await Storage.carregarTodos('contas'),
                historico: await Storage.carregarTodos('historico'),
                clientes: await Storage.carregarTodos('clientes'),
                config: await Storage.carregarTodos('config'),
            }
        };

        const jsonString = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const dataFormatada = new Date().toISOString().split('T')[0];
        a.href = url;
        a.download = `gestorbar-backup-${dataFormatada}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        Modals.fecharModalBackupRestore();
        Toast.mostrarNotificacao("Backup criado com sucesso!");

    } catch (error) {
        console.error("Erro ao criar backup:", error);
        Toast.mostrarNotificacao("Falha ao criar o backup.", "erro");
    }
}

/**
 * Apaga os dados antigos e insere os novos a partir de um objeto de backup.
 * @param {object} backupData - O objeto de dados validado do ficheiro de backup.
 */
async function executeRestore(backupData) {
    try {
        const stores = ['inventario', 'contas', 'historico', 'clientes', 'config'];
        
        // 1. Limpar todas as stores
        await Promise.all(stores.map(storeName => Storage.limparStore(storeName)));

        // 2. Inserir os novos dados
        for (const storeName of stores) {
            if (backupData.data[storeName]) {
                await Promise.all(
                    backupData.data[storeName].map(item => Storage.salvarItem(storeName, item))
                );
            }
        }
        
        Toast.mostrarNotificacao("Restauro concluído. A aplicação será reiniciada.");

        // 3. Recarregar a aplicação para refletir o novo estado
        setTimeout(() => {
            window.location.reload();
        }, 2000);

    } catch (error) {
        console.error("Erro durante a execução do restauro:", error);
        Toast.mostrarNotificacao("Ocorreu um erro crítico durante o restauro.", "erro");
    }
}

/**
 * Lê e valida um ficheiro JSON selecionado pelo utilizador.
 * @param {Event} event - O evento 'change' do input de ficheiro.
 */
function handleRestoreFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const backupData = JSON.parse(e.target.result);
            // Validação simples para garantir que é o nosso ficheiro
            if (backupData.appName !== 'GestorBarPro') {
                throw new Error("Ficheiro de backup inválido ou corrompido.");
            }

            Modals.fecharModalBackupRestore();
            Modals.abrirModalConfirmacao(
                'Confirmar Restauro?',
                'Todos os dados atuais serão PERMANENTEMENTE apagados e substituídos pelos dados do ficheiro. Esta ação não pode ser desfeita.',
                () => executeRestore(backupData)
            );

        } catch (error) {
            Toast.mostrarNotificacao(error.message, "erro");
        } finally {
            // Limpa o valor do input para permitir selecionar o mesmo ficheiro novamente
            event.target.value = '';
        }
    };
    reader.onerror = () => Toast.mostrarNotificacao("Erro ao ler o ficheiro.", "erro");
    reader.readAsText(file);
}

/**
 * Configura os event listeners para os botões dentro da view de configurações.
 */
function configurarEventListenersInternos() {
    // Lógica "Tap-to-change" para a foto de perfil
    sel.settingsProfilePic.addEventListener('click', () => {
        sel.inputChangePic.click(); // Aciona o input de ficheiro escondido
    });

    sel.inputChangePic.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            store.dispatch({ type: 'UPDATE_CONFIG', payload: { profilePicDataUrl: dataUrl } });
            Toast.mostrarNotificacao("Foto de perfil atualizada com sucesso.");
        };
        reader.onerror = () => {
            Toast.mostrarNotificacao("Ocorreu um erro ao ler a imagem.", "erro");
        };
        reader.readAsDataURL(file);
    });

    // Lógica "Tap-to-edit" para o nome do estabelecimento
    sel.settingsBusinessNameDisplay.addEventListener('click', () => {
        toggleNameEditMode(true);
    });

    const handleSaveName = () => {
        const novoNome = sel.settingsBusinessNameInput.value.trim();
        const nomeAntigo = store.getState().config.businessName || 'O Meu Bar';

        // Apenas despachar a ação se o nome for válido e tiver sido alterado.
        if (novoNome && novoNome !== nomeAntigo) {
            store.dispatch({ type: 'UPDATE_CONFIG', payload: { businessName: novoNome } });
            Toast.mostrarNotificacao("Nome do estabelecimento atualizado.");
        }
        // A atualização da UI (display.textContent) é tratada pela função render()
        // que é chamada automaticamente após a atualização do store.
        toggleNameEditMode(false);
    };

    sel.settingsBusinessNameInput.addEventListener('blur', handleSaveName);
    sel.settingsBusinessNameInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            handleSaveName();
        }
    });
    
    sel.themeSelector.addEventListener('change', (event) => {
        const selectedTheme = event.target.value;
        document.body.dataset.theme = selectedTheme; // Aplica o tema visualmente
        store.dispatch({ type: 'UPDATE_CONFIG', payload: { theme: selectedTheme } });
        Toast.mostrarNotificacao(`Tema alterado para ${selectedTheme === 'dark' ? 'Escuro' : 'Claro'}.`);
    });
    
    sel.btnBackup.addEventListener('click', () => {
        Modals.abrirModalBackupRestore();
    });

    sel.btnClearData.addEventListener('click', () => {
        Toast.mostrarNotificacao("Lógica de limpar dados a ser implementada.");
    });

    // NOVOS LISTENERS PARA O MODAL DE BACKUP
    sel.btnCreateBackup.addEventListener('click', handleCreateBackup);
    sel.btnTriggerRestore.addEventListener('click', () => sel.inputRestoreFile.click());
    sel.inputRestoreFile.addEventListener('change', handleRestoreFromFile);
}


/**
 * Função de inicialização da View.
 */
function init() {
    querySelectors();
    store.subscribe(render);
    
    // Listener principal para abrir o ecrã de configurações
    if (sel.btnSettings) {
        sel.btnSettings.addEventListener('click', show);
    }

    // Listener para fechar o ecrã de configurações
    if (sel.btnCloseSettings) {
        sel.btnCloseSettings.addEventListener('click', () => {
            Nav.navigateToTab('tab-dashboard'); // Volta para o dashboard
        });
    }
    
    configurarEventListenersInternos();
    render();
}

export default { init };