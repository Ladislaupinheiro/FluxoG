// /modules/features/inventario/components/FormGerirCategoriasModal.js (CORRIGIDO E ROBUSTO)
'use strict';

import store from '../../../shared/services/Store.js';
import * as Toast from '../../../shared/components/Toast.js';
import { abrirModalConfirmacao } from '../../../shared/components/Modals.js';

function renderListaCategorias() {
    const state = store.getState();
    const categoriasPrimarias = state.categoriasDeProduto.filter(cat => cat.isSystemDefault);

    if (categoriasPrimarias.length === 0) {
        return `<p class="text-center text-texto-secundario text-sm py-4">Categorias padrão não encontradas.</p>`;
    }

    return categoriasPrimarias.map(primaria => {
        const filhasHTML = state.categoriasDeProduto
            .filter(sec => sec.parentId === primaria.id) // Inclui as de sistema e as do user
            .map(sec => `
                <div class="flex items-center justify-between p-2 bg-fundo-secundario rounded-md ml-4">
                    <div class="flex items-center gap-3">
                        <div class="w-5 h-5 rounded-full border border-borda" style="background-color: ${sec.cor};"></div>
                        <span class="font-medium text-sm">${sec.nome}</span>
                    </div>
                    ${!sec.isSystemDefault ? `
                    <button class="btn-icon text-red-500 hover:text-red-700 btn-apagar-categoria" data-id="${sec.id}" data-nome="${sec.nome}" title="Apagar Subcategoria">
                        <i class="lni lni-trash-can"></i>
                    </button>` : ''}
                </div>
            `).join('');

        return `
            <div class="space-y-2">
                <div class="bg-fundo-principal rounded-md p-3">
                    <div class="flex items-center gap-3">
                        <div class="w-6 h-6 rounded-full" style="background-color: ${primaria.cor};"></div>
                        <span class="font-bold text-lg">${primaria.nome}</span>
                    </div>
                </div>
                <div class="space-y-1 pl-2">
                    ${filhasHTML || '<p class="text-xs text-center text-texto-secundario p-2 ml-4">Nenhuma subcategoria.</p>'}
                </div>
            </div>
        `;
    }).join('<div class="my-4"></div>');
}


export const render = () => {
    const state = store.getState();
    const categoriasPrimariasOptions = state.categoriasDeProduto
        .filter(cat => cat.isSystemDefault)
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
            <h4 class="text-md font-bold text-center">Adicionar Nova Subcategoria</h4>
            <div class="flex gap-4 items-end">
                <div class="flex-grow">
                    <label for="input-categoria-nome" class="block text-sm font-medium mb-1">Nome da Subcategoria</label>
                    <input type="text" id="input-categoria-nome" required class="w-full p-2 border border-borda rounded-md bg-fundo-input" placeholder="Ex: Cerveja, Sumo">
                </div>
                <div>
                    <label for="input-categoria-cor" class="block text-sm font-medium mb-1">Cor</label>
                    <input type="color" id="input-categoria-cor" value="#8B5CF6" class="w-12 h-10 border border-borda rounded-md bg-fundo-input p-1">
                </div>
            </div>
            <div>
                <label for="select-categoria-pai" class="block text-sm font-medium mb-1">Associar a</label>
                <select id="select-categoria-pai" required class="w-full p-2 border border-borda rounded-md bg-fundo-input">
                    <option value="" disabled selected>Selecione a categoria principal</option>
                    ${categoriasPrimariasOptions}
                </select>
            </div>
            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Adicionar Subcategoria</button>
        </form>
    </div>
</div>`;
};

export const mount = (closeModal) => {
    const container = document.getElementById('modal-gerir-categorias-overlay');
    const form = document.getElementById('form-add-categoria');
    
    // ARQUITETURA CORRIGIDA: A subscrição agora é "cirúrgica" e não-destrutiva.
    let unsubscribe = store.subscribe(() => {
        const listaContainer = document.getElementById('lista-categorias-container');
        // Apenas o conteúdo da lista é atualizado, preservando o resto do modal.
        if (listaContainer) {
            listaContainer.innerHTML = renderListaCategorias();
        }
    });

    form.addEventListener('submit', e => {
        e.preventDefault();
        const nomeInput = form.querySelector('#input-categoria-nome');
        const corInput = form.querySelector('#input-categoria-cor');
        const paiSelect = form.querySelector('#select-categoria-pai');
        const nome = nomeInput.value.trim();
        const cor = corInput.value;
        const parentId = paiSelect.value;

        if (!nome) { return Toast.mostrarNotificacao("O nome da subcategoria é obrigatório.", "erro"); }
        if (!parentId) { return Toast.mostrarNotificacao("É obrigatório associar a uma categoria principal.", "erro"); }

        store.dispatch({ type: 'ADD_PRODUCT_CATEGORY', payload: { nome, cor, parentId } });
        Toast.mostrarNotificacao(`Subcategoria "${nome}" adicionada.`);
        nomeInput.value = '';
        nomeInput.focus();
    });

    container.addEventListener('click', e => {
        const btnApagar = e.target.closest('.btn-apagar-categoria');
        if (btnApagar) {
            const { id, nome } = btnApagar.dataset;
            abrirModalConfirmacao(
                `Apagar Subcategoria?`,
                `Tem a certeza que deseja apagar a subcategoria "${nome}"?`,
                () => {
                    store.dispatch({ type: 'DELETE_PRODUCT_CATEGORY', payload: id });
                    Toast.mostrarNotificacao(`Subcategoria "${nome}" apagada.`);
                }
            );
        }
    });
    
    const enhancedCloseModal = () => {
        if (unsubscribe) unsubscribe();
        unsubscribe = null;
        closeModal();
    };

    container.querySelector('.btn-fechar-modal').addEventListener('click', enhancedCloseModal, { once: true });
    container.addEventListener('click', e => {
        if (e.target.id === 'modal-gerir-categorias-overlay') {
            enhancedCloseModal();
        }
    });
};

export const unmount = () => {};