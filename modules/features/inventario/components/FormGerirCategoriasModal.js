// /modules/features/inventario/components/FormGerirCategoriasModal.js (RECONSTRUÍDO)
'use strict';

import store from '../../../shared/services/Store.js';
import * as Toast from '../../../shared/components/Toast.js';
import { abrirModalConfirmacao } from '../../../shared/components/Modals.js';

function renderListaCategorias() {
    const state = store.getState();
    const categoriasPrimarias = state.categoriasDeProduto.filter(cat => !cat.parentId);
    const categoriasSecundarias = state.categoriasDeProduto.filter(cat => cat.parentId);

    if (categoriasPrimarias.length === 0) {
        return `<p class="text-center text-texto-secundario text-sm py-4">Nenhuma categoria criada.</p>`;
    }

    return categoriasPrimarias.map(primaria => {
        const filhasHTML = categoriasSecundarias
            .filter(sec => sec.parentId === primaria.id)
            .map(sec => `
                <div class="flex items-center justify-between p-2 bg-fundo-secundario rounded-md ml-6">
                    <div class="flex items-center gap-3">
                        <div class="w-5 h-5 rounded-full border border-borda" style="background-color: ${sec.cor};"></div>
                        <span class="font-medium text-sm">${sec.nome}</span>
                    </div>
                    <button class="btn-icon text-red-500 hover:text-red-700 btn-apagar-categoria" data-id="${sec.id}" data-nome="${sec.nome}" title="Apagar Categoria">
                        <i class="lni lni-trash-can"></i>
                    </button>
                </div>
            `).join('');

        return `
            <div class="bg-fundo-principal rounded-md p-2">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-6 h-6 rounded-full border border-borda" style="background-color: ${primaria.cor};"></div>
                        <span class="font-bold">${primaria.nome}</span>
                    </div>
                    <button class="btn-icon text-red-500 hover:text-red-700 btn-apagar-categoria" data-id="${primaria.id}" data-nome="${primaria.nome}" title="Apagar Categoria e Subcategorias">
                        <i class="lni lni-trash-can"></i>
                    </button>
                </div>
            </div>
            ${filhasHTML}
        `;
    }).join('<div class="my-2"></div>');
}


export const render = () => {
    const state = store.getState();
    const categoriasPrimariasOptions = state.categoriasDeProduto
        .filter(cat => !cat.parentId)
        .map(cat => `<option value="${cat.id}">${cat.nome}</option>`)
        .join('');

    return `
<div id="modal-gerir-categorias-overlay" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4">
    <div class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
        <header class="flex justify-between items-center p-4 border-b border-borda">
            <h3 class="text-xl font-bold">Gerir Categorias</h3>
            <button type="button" class="btn-fechar-modal text-2xl">&times;</button>
        </header>
        
        <div id="lista-categorias-container" class="p-4 space-y-2 overflow-y-auto flex-grow">
            ${renderListaCategorias()}
        </div>

        <form id="form-add-categoria" class="p-4 border-t border-borda bg-fundo-principal space-y-3">
            <h4 class="text-md font-bold text-center">Adicionar Nova Categoria</h4>
            <div class="flex gap-4 items-end">
                <div class="flex-grow">
                    <label for="input-categoria-nome" class="block text-sm font-medium mb-1">Nome</label>
                    <input type="text" id="input-categoria-nome" required class="w-full p-2 border border-borda rounded-md bg-fundo-input" placeholder="Ex: Bebidas">
                </div>
                <div>
                    <label for="input-categoria-cor" class="block text-sm font-medium mb-1">Cor</label>
                    <input type="color" id="input-categoria-cor" value="#4CAF50" class="w-12 h-10 border border-borda rounded-md bg-fundo-input p-1">
                </div>
            </div>
            <div>
                <label for="select-categoria-pai" class="block text-sm font-medium mb-1">Tipo de Categoria</label>
                <select id="select-categoria-pai" class="w-full p-2 border border-borda rounded-md bg-fundo-input">
                    <option value="">-- Categoria Primária --</option>
                    ${categoriasPrimariasOptions}
                </select>
            </div>
            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Adicionar Categoria</button>
        </form>
    </div>
</div>`;
}

export const mount = (closeModal) => {
    const container = document.getElementById('modal-gerir-categorias-overlay');
    const form = document.getElementById('form-add-categoria');
    const listaContainer = document.getElementById('lista-categorias-container');

    const unsubscribe = store.subscribe(() => {
        // Guarda os valores atuais do formulário para não os perder
        const nomeAtual = form.querySelector('#input-categoria-nome').value;
        const corAtual = form.querySelector('#input-categoria-cor').value;
        const paiAtual = form.querySelector('#select-categoria-pai').value;
        
        // Re-renderiza tudo para manter a UI sincronizada
        container.innerHTML = render(); 
        
        // Re-atribui os elementos do DOM e os listeners
        const newForm = document.getElementById('form-add-categoria');
        newForm.querySelector('#input-categoria-nome').value = nomeAtual;
        newForm.querySelector('#input-categoria-cor').value = corAtual;
        newForm.querySelector('#select-categoria-pai').value = paiAtual;
        
        addFormSubmitListener(newForm);
        addListaClickListener();
        container.querySelector('.btn-fechar-modal').addEventListener('click', closeModal, { once: true });
    });

    function addFormSubmitListener(formElement) {
        formElement.addEventListener('submit', e => {
            e.preventDefault();
            const nomeInput = formElement.querySelector('#input-categoria-nome');
            const corInput = formElement.querySelector('#input-categoria-cor');
            const paiSelect = formElement.querySelector('#select-categoria-pai');
            const nome = nomeInput.value.trim();
            const cor = corInput.value;
            const parentId = paiSelect.value || null;

            if (!nome) {
                return Toast.mostrarNotificacao("O nome da categoria é obrigatório.", "erro");
            }

            store.dispatch({ type: 'ADD_PRODUCT_CATEGORY', payload: { nome, cor, parentId } });
            Toast.mostrarNotificacao(`Categoria "${nome}" adicionada.`);
            nomeInput.value = ''; // Limpa o nome para a próxima adição
        });
    }

    function addListaClickListener() {
        const currentListaContainer = document.getElementById('lista-categorias-container');
        currentListaContainer.addEventListener('click', e => {
            const btnApagar = e.target.closest('.btn-apagar-categoria');
            if (btnApagar) {
                const { id, nome } = btnApagar.dataset;
                abrirModalConfirmacao(
                    `Apagar Categoria?`,
                    `Tem a certeza que deseja apagar a categoria "${nome}"? Todas as suas subcategorias também serão apagadas. Esta ação não pode ser desfeita.`,
                    () => {
                        store.dispatch({ type: 'DELETE_PRODUCT_CATEGORY', payload: id });
                        Toast.mostrarNotificacao(`Categoria "${nome}" apagada.`);
                    }
                );
            }
        });
    }
    
    addFormSubmitListener(form);
    addListaClickListener();

    container.querySelector('.btn-fechar-modal').addEventListener('click', closeModal, { once: true });
    container.addEventListener('click', e => {
        if (e.target.id === 'modal-gerir-categorias-overlay') {
            closeModal();
        }
    });

    const originalCloseModal = closeModal;
    closeModal = () => {
        unsubscribe();
        originalCloseModal();
    };
};

export const unmount = () => {};