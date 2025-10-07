// /modules/components/modals/ConfirmacaoModal.js
'use strict';

// A importação circular foi removida daqui.

export const render = (titulo, mensagem) => `
<div id="modal-confirmacao-overlay" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4">
    <div class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-sm">
        <div class="p-6 text-center">
            <h3 class="text-xl font-bold mb-2">${titulo}</h3>
            <p class="text-texto-secundario mb-6">${mensagem}</p>
            <div class="flex justify-center gap-4">
                <button id="btn-cancelar-confirmacao" class="px-6 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 font-semibold">Cancelar</button>
                <button id="btn-confirmar-acao" class="px-6 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold">Confirmar</button>
            </div>
        </div>
    </div>
</div>`;

export const mount = (closeModal, titulo, mensagem, onConfirmCallback) => {
    document.getElementById('btn-confirmar-acao')?.addEventListener('click', () => {
        if (typeof onConfirmCallback === 'function') onConfirmCallback();
        closeModal();
    });
    
    document.getElementById('btn-cancelar-confirmacao')?.addEventListener('click', closeModal);

    document.getElementById('modal-confirmacao-overlay')?.addEventListener('click', (e) => {
        // Fecha o modal apenas se o clique for no overlay exterior
        if (e.target.id === 'modal-confirmacao-overlay') {
            closeModal();
        }
    });
};

export const unmount = () => {
    // Não há listeners persistentes para remover, pois o DOM do modal é destruído.
};