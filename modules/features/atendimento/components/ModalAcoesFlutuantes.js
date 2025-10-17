// /modules/features/atendimento/components/ModalAcoesFlutuantes.js (NOVO)
'use strict';

export const render = (titulo, botoes = []) => {
    const botoesHTML = botoes.map(btn => `
        <button class="w-full text-left p-4 hover:bg-fundo-principal rounded-md font-semibold flex items-center gap-3 transition-colors duration-200"
                data-acao="${btn.acao}"
                style="color: ${btn.cor || 'var(--cor-texto-principal)'};">
            <i class="lni ${btn.icone || ''} text-2xl" style="color: ${btn.cor || 'var(--cor-texto-secundario)'};"></i>
            <span>${btn.texto}</span>
        </button>
    `).join('');

    return `
<div id="modal-acoes-flutuantes-overlay" class="fixed inset-0 bg-black bg-opacity-60 flex items-end justify-center z-[100] p-2 md:items-center">
    <div class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-md animate-slide-up">
        <header class="p-4 text-center border-b border-borda">
            <h3 class="font-bold text-lg">${titulo}</h3>
        </header>
        <div class="p-2 space-y-1">
            ${botoesHTML}
        </div>
        <footer class="p-3 text-center">
             <button id="btn-cancelar-acoes-flutuantes" class="w-full max-w-xs mx-auto bg-gray-200 dark:bg-gray-600 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">Cancelar</button>
        </footer>
    </div>
    <style>
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
        @media (min-width: 768px) {
            @keyframes fade-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
            .animate-slide-up { animation: fade-in 0.2s ease-out; }
        }
    </style>
</div>`;
};

export const mount = (closeModal, titulo, botoes = []) => {
    const container = document.getElementById('modal-acoes-flutuantes-overlay');

    container.addEventListener('click', e => {
        const targetButton = e.target.closest('button[data-acao]');
        if (targetButton) {
            const acao = targetButton.dataset.acao;
            const botaoConfig = botoes.find(b => b.acao === acao);
            if (botaoConfig && typeof botaoConfig.callback === 'function') {
                botaoConfig.callback();
            }
            closeModal();
            return;
        }

        if (e.target.closest('#btn-cancelar-acoes-flutuantes') || e.target.id === 'modal-acoes-flutuantes-overlay') {
            closeModal();
        }
    });
};

export const unmount = () => {};