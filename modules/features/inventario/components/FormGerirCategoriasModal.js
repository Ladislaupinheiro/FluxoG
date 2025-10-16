// /modules/features/inventario/components/FormGerirCategoriasModal.js (NOVO FICHEIRO)
'use strict';

import store from '../../../shared/services/Store.js';
import * as Toast from '../../../shared/components/Toast.js';
import { abrirModalConfirmacao } from '../../../shared/components/Modals.js';

function renderListaCategorias() {
    const state = store.getState();
    if (!state.categoriasDeProduto || state.categoriasDeProduto.length === 0) {
        return `<p class="text-center text-texto-secundario text-sm py-4">Nenhuma categoria criada.</p>`;
    }

    return state.categoriasDeProduto.map(cat => `
        <div class="flex items-center justify-between p-2 bg-fundo-principal rounded-md">
            <div class="flex items-center gap-3">
                <div class="w-6 h-6 rounded-full border border-borda" style="background-color: ${cat.cor};"></div>
                <span class="font-semibold">${cat.nome}</span>
            </div>
            <div class="flex items-center gap-2">
                <button class="btn-icon text-texto-secundario hover:text-primaria btn-editar-categoria" data-id="${cat.id}" title="Editar Categoria (em breve)">
                    <i class="lni lni-pencil"></i>
                </button>
                <button class="btn-icon text-red-500 hover:text-red-700 btn-apagar-categoria" data-id="${cat.id}" data-nome="${cat.nome}" title="Apagar Categoria">
                    <i class="lni lni-trash-can"></i>
                </button>
            </div>
        </div>
    `).join('');
}


export const render = () => `
<div id="modal-gerir-categorias-overlay" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4">
    <div class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
        <header class="flex justify-between items-center p-4 border-b border-borda">
            <h3 class="text-xl font-bold">Gerir Categorias de Produtos</h3>
            <button type="button" class="btn-fechar-modal text-2xl">&times;</button>
        </header>
        
        <div id="lista-categorias-container" class="p-4 space-y-2 overflow-y-auto">
            ${renderListaCategorias()}
        </div>

        <form id="form-add-categoria" class="p-4 border-t border-borda bg-fundo-principal space-y-3">
            <h4 class="text-md font-bold text-center">Adicionar Nova Categoria</h4>
            <div class="flex gap-4 items-end">
                <div class="flex-grow">
                    <label for="input-categoria-nome" class="block text-sm font-medium mb-1">Nome</label>
                    <input type="text" id="input-categoria-nome" required class="w-full p-2 border border-borda rounded-md bg-fundo-input" placeholder="Ex: Vinhos">
                </div>
                <div>
                    <label for="input-categoria-cor" class="block text-sm font-medium mb-1">Cor</label>
                    <input type="color" id="input-categoria-cor" value="#4CAF50" class="w-12 h-10 border border-borda rounded-md bg-fundo-input p-1">
                </div>
            </div>
            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Adicionar Categoria</button>
        </form>
    </div>
</div>`;

export const mount = (closeModal) => {
    const container = document.getElementById('modal-gerir-categorias-overlay');
    const form = document.getElementById('form-add-categoria');
    const listaContainer = document.getElementById('lista-categorias-container');

    // Subscrição para re-renderizar a lista quando uma categoria é adicionada/removida
    const unsubscribe = store.subscribe(() => {
        listaContainer.innerHTML = renderListaCategorias();
    });

    form.addEventListener('submit', e => {
        e.preventDefault();
        const nomeInput = form.querySelector('#input-categoria-nome');
        const corInput = form.querySelector('#input-categoria-cor');
        const nome = nomeInput.value.trim();
        const cor = corInput.value;

        if (!nome) {
            return Toast.mostrarNotificacao("O nome da categoria é obrigatório.", "erro");
        }

        store.dispatch({ type: 'ADD_PRODUCT_CATEGORY', payload: { nome, cor, pai: null } });
        Toast.mostrarNotificacao(`Categoria "${nome}" adicionada.`);
        nomeInput.value = ''; // Limpa o formulário
    });

    listaContainer.addEventListener('click', e => {
        const btnApagar = e.target.closest('.btn-apagar-categoria');
        if (btnApagar) {
            const { id, nome } = btnApagar.dataset;
            abrirModalConfirmacao(
                `Apagar Categoria?`,
                `Tem a certeza que deseja apagar a categoria "${nome}"? Esta ação não pode ser desfeita.`,
                () => {
                    store.dispatch({ type: 'DELETE_PRODUCT_CATEGORY', payload: id });
                    Toast.mostrarNotificacao(`Categoria "${nome}" apagada.`);
                }
            );
        }

        const btnEditar = e.target.closest('.btn-editar-categoria');
        if(btnEditar) {
            Toast.mostrarNotificacao("A funcionalidade de editar categorias será implementada em breve.", "info");
        }
    });

    container.querySelector('.btn-fechar-modal').addEventListener('click', closeModal);
    container.addEventListener('click', e => {
        if (e.target.id === 'modal-gerir-categorias-overlay') {
            closeModal();
        }
    }, { once: true });

    // A função closeModal agora também cancela a subscrição para evitar memory leaks
    const originalCloseModal = closeModal;
    closeModal = () => {
        unsubscribe();
        originalCloseModal();
    };
};

export const unmount = () => {
    // A lógica de unmount é tratada no closeModal para garantir que a subscrição é sempre removida
};