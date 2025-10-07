// /modules/components/modals/DicaDoDiaModal.js
'use strict';

export const render = (dica) => `
<div id="modal-dica-overlay" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4">
    <div class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-sm">
        <header class="flex justify-between items-center p-4 border-b border-borda">
            <div>
                <h3 class="text-xl font-bold">Dica de Gestão</h3>
                <p class="text-sm text-blue-600 dark:text-blue-400 font-semibold">${dica.category}</p>
            </div>
            <button type="button" class="btn-fechar-modal text-2xl self-start">&times;</button>
        </header>
        <div class="p-4">
            <h4 class="text-lg font-bold mb-2">${dica.title}</h4>
            <p class="text-texto-secundario">${dica.content}</p>
        </div>
        <footer class="p-4 text-center">
             <button class="btn-fechar-modal-footer w-full max-w-xs mx-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Entendido</button>
        </footer>
    </div>
</div>`;

export const mount = (closeModal) => {
    document.querySelector('.btn-fechar-modal')?.addEventListener('click', closeModal);
    document.querySelector('.btn-fechar-modal-footer')?.addEventListener('click', closeModal);
    
    document.getElementById('modal-dica-overlay')?.addEventListener('click', e => {
        if (e.target.id === 'modal-dica-overlay') {
            closeModal();
        }
    });
};

export const unmount = () => {};