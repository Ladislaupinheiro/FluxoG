// /modules/features/atendimento/components/ModalSeletorQuantidade.js (NOVO)
'use strict';

export const render = (produtoNome, quantidadeAtual = 0) => {
    const BOTOES_QUANTIDADE = 24;
    let buttonsHTML = '';
    for (let i = 1; i <= BOTOES_QUANTIDADE; i++) {
        const isActive = i === quantidadeAtual;
        buttonsHTML += `<button type="button" class="quantity-btn ${isActive ? 'active' : ''}" data-qtd="${i}">${i}</button>`;
    }

    return `
    <div id="modal-seletor-quantidade-overlay" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4">
        <div class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-sm">
            <header class="p-4 border-b border-borda">
                <h3 class="text-xl font-bold text-center">Quantidade para ${produtoNome}</h3>
            </header>
            <div class="p-4">
                <div id="quantity-grid" class="grid grid-cols-4 gap-3">
                    ${buttonsHTML}
                </div>
            </div>
            <footer class="p-2 text-center">
                <button id="btn-cancelar-seletor" class="text-sm text-texto-secundario font-semibold hover:underline">Cancelar</button>
            </footer>
        </div>
        <style>
            .quantity-btn { aspect-ratio: 1/1; border-radius: 8px; background-color: var(--cor-fundo-principal); border: 1px solid var(--cor-borda); font-weight: 600; }
            .quantity-btn:hover { background-color: var(--cor-primaria); color: white; }
            .quantity-btn.active { background-color: var(--cor-primaria); color: white; border-color: var(--cor-primaria); transform: scale(1.05); }
        </style>
    </div>
    `;
};

export const mount = (closeModal, onConfirm) => {
    const grid = document.getElementById('quantity-grid');
    grid.addEventListener('click', e => {
        const btn = e.target.closest('.quantity-btn');
        if (btn) {
            const qtd = parseInt(btn.dataset.qtd, 10);
            onConfirm(qtd);
            closeModal();
        }
    });

    document.getElementById('btn-cancelar-seletor')?.addEventListener('click', closeModal);
    document.getElementById('modal-seletor-quantidade-overlay')?.addEventListener('click', e => {
        if (e.target.id === 'modal-seletor-quantidade-overlay') closeModal();
    });
};

export const unmount = () => {};