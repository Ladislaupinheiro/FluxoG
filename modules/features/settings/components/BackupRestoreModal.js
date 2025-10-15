// /modules/components/modals/BackupRestoreModal.js
'use strict';

import store from '../../../shared/services/Store.js';
import * as Toast from '../../../shared/components/Toast.js';
import * as Storage from '../../../shared/services/Storage.js';
import { abrirModalConfirmacao } from '../../../shared/components/Modals.js';

export const render = () => `
<div id="modal-backup-restore-overlay" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4">
    <div class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-sm">
        <header class="flex justify-between items-center p-4 border-b border-borda">
            <h3 class="text-xl font-bold">Backup e Restauro</h3>
            <button type="button" class="btn-fechar-modal text-2xl">&times;</button>
        </header>
        <div class="p-4 space-y-4">
            <div>
                <h4 class="font-semibold mb-2">Criar Backup</h4>
                <p class="text-sm text-texto-secundario mb-2">Guarde todos os dados da aplicação num ficheiro JSON seguro.</p>
                <button id="btn-criar-backup" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-2"><i class="lni lni-download"></i> Criar e Descarregar</button>
            </div>
            <div class="border-t border-borda pt-4">
                <h4 class="font-semibold mb-2 text-red-500">Restaurar de Ficheiro</h4>
                <p class="text-sm text-texto-secundario mb-2">Atenção: Restaurar um backup irá apagar TODOS os dados atuais.</p>
                <input type="file" id="input-restaurar-backup" class="hidden" accept=".json">
                <button id="btn-abrir-seletor-ficheiro" class="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-2"><i class="lni lni-upload"></i> Selecionar Ficheiro</button>
            </div>
        </div>
    </div>
</div>`;

const handleRestore = (e, closeModal) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const backupData = JSON.parse(ev.target.result);
            if (backupData.appName !== 'GestorBarPro' || !backupData.data) throw new Error("Ficheiro de backup inválido.");
            
            closeModal();
            abrirModalConfirmacao(
                'Confirmar Restauro?',
                'Todos os dados atuais serão PERMANENTEMENTE apagados. A aplicação será reiniciada.',
                async () => {
                    Toast.mostrarNotificacao("A restaurar... A aplicação irá recarregar.");
                    const storesToClear = ['inventario', 'contas', 'historico', 'clientes', 'despesas', 'config'];
                    await Promise.all(storesToClear.map(storeName => Storage.limparStore(storeName)));
                    
                    const { inventario, contasAtivas, historicoFechos, clientes, despesas, config } = backupData.data;
                    await Promise.all([
                        ...(inventario || []).map(item => Storage.salvarItem('inventario', item)),
                        ...(contasAtivas || []).map(item => Storage.salvarItem('contas', item)),
                        ...(historicoFechos || []).map(item => Storage.salvarItem('historico', item)),
                        ...(clientes || []).map(item => Storage.salvarItem('clientes', item)),
                        ...(despesas || []).map(item => Storage.salvarItem('despesas', item)),
                        Storage.salvarItem('config', { key: 'appConfig', ...(config || {}) })
                    ]);

                    setTimeout(() => window.location.reload(), 1500);
                }
            );
        } catch (error) { Toast.mostrarNotificacao(error.message, "erro"); }
    };
    reader.readAsText(file);
};

export const mount = (closeModal) => {
    const inputRestore = document.getElementById('input-restaurar-backup');

    document.getElementById('btn-criar-backup').addEventListener('click', () => {
        const state = store.getState();
        const backupData = { appName: 'GestorBarPro', version: 1, timestamp: new Date().toISOString(), data: state };
        const jsonString = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gestorbar-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    });

    document.getElementById('btn-abrir-seletor-ficheiro').addEventListener('click', () => inputRestore.click());
    inputRestore.addEventListener('change', (e) => handleRestore(e, closeModal));

    document.querySelector('.btn-fechar-modal').addEventListener('click', closeModal);
    document.getElementById('modal-backup-restore-overlay').addEventListener('click', e => {
        if (e.target.id === 'modal-backup-restore-overlay') closeModal();
    });
};

export const unmount = () => {};