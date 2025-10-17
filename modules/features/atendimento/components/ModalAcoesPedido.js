// /modules/features/atendimento/components/ModalAcoesPedido.js (NOVO)
'use strict';

export const render = (pedido) => `
<div id="modal-acoes-pedido-overlay" class="fixed inset-0 bg-black bg-opacity-60 flex items-end justify-center z-[100] p-4">
    <div class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-md animate-slide-up">
        <header class="p-4 text-center border-b border-borda">
            <h3 class="font-bold">${pedido.qtd}x ${pedido.nome}</h3>
        </header>
        <div class="p-2 space-y-2">
            <button id="btn-editar-quantidade" class="w-full text-left p-3 hover:bg-fundo-principal rounded-md font-semibold text-blue-600">Editar Quantidade</button>
            <button id="btn-remover-pedido" class="w-full text-left p-3 hover:bg-fundo-principal rounded-md font-semibold text-red-500">Remover da Conta</button>
        </div>
        <footer class="p-4 text-center">
             <button id="btn-cancelar-acoes" class="w-full max-w-xs mx-auto bg-gray-200 dark:bg-gray-600 font-bold py-2 px-4 rounded">Cancelar</button>
        </footer>
    </div>
    <style>
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
    </style>
</div>`;

export const mount = (closeModal, onEdit, onRemove) => {
    document.getElementById('btn-editar-quantidade')?.addEventListener('click', () => {
        onEdit();
        closeModal();
    });
    document.getElementById('btn-remover-pedido')?.addEventListener('click', () => {
        onRemove();
        closeModal();
    });
    document.getElementById('btn-cancelar-acoes')?.addEventListener('click', closeModal);
    document.getElementById('modal-acoes-pedido-overlay')?.addEventListener('click', e => {
        if (e.target.id === 'modal-acoes-pedido-overlay') closeModal();
    });
};

export const unmount = () => {};