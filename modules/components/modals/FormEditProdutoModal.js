// /modules/components/modals/FormEditProdutoModal.js
'use strict';

import store from '../../services/Store.js';
import * as Toast from '../Toast.js';

export const render = (produto) => `
<div id="modal-edit-produto-overlay" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4">
    <form id="form-edit-produto" class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-sm">
        <header class="flex justify-between items-center p-4 border-b border-borda">
            <h3 class="text-xl font-bold">Editar Produto</h3>
            <button type="button" class="btn-fechar-modal text-2xl">&times;</button>
        </header>
        <div class="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
                <label for="input-edit-produto-nome" class="block text-sm font-medium mb-1">Nome do Produto</label>
                <input type="text" id="input-edit-produto-nome" required class="w-full p-2 border border-borda rounded-md bg-fundo-principal" value="${produto.nome}">
            </div>
            <div>
                <label for="input-edit-produto-preco-venda" class="block text-sm font-medium mb-1">Preço de Venda (Kz)</label>
                <input type="number" id="input-edit-produto-preco-venda" required min="0" step="any" class="w-full p-2 border border-borda rounded-md bg-fundo-principal" value="${produto.precoVenda}">
            </div>

            <div class="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg space-y-3">
                <h4 class="text-sm font-bold text-center text-texto-secundario">CÁLCULO DE CUSTO</h4>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label for="input-edit-produto-custo-grade" class="block text-sm font-medium mb-1">Custo da Grade</label>
                        <input type="number" id="input-edit-produto-custo-grade" min="0" class="w-full p-2 border border-borda rounded-md bg-fundo-principal" placeholder="3000">
                    </div>
                    <div>
                        <label for="input-edit-produto-unidades-grade" class="block text-sm font-medium mb-1">Un. na Grade</label>
                        <input type="number" id="input-edit-produto-unidades-grade" min="1" class="w-full p-2 border border-borda rounded-md bg-fundo-principal" placeholder="12">
                    </div>
                </div>
                <div>
                    <label for="input-edit-produto-custo-unitario" class="block text-sm font-medium mb-1">Custo por Unidade (Kz)</label>
                    <input type="number" id="input-edit-produto-custo-unitario" required min="0" step="any" class="w-full p-2 border-green-500 rounded-md bg-fundo-principal font-bold" value="${produto.custoUnitario || 0}">
                </div>
            </div>
            
            <div>
                <label for="input-edit-produto-stock-minimo" class="block text-sm font-medium mb-1">Stock Mínimo</label>
                <input type="number" id="input-edit-produto-stock-minimo" required min="0" class="w-full p-2 border border-borda rounded-md bg-fundo-principal" value="${produto.stockMinimo}">
            </div>
        </div>
        <footer class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Salvar Alterações</button>
        </footer>
    </form>
</div>`;

export const mount = (closeModal, produto) => {
    const form = document.getElementById('form-edit-produto');
    const custoGradeInput = form.querySelector('#input-edit-produto-custo-grade');
    const unidadesGradeInput = form.querySelector('#input-edit-produto-unidades-grade');
    const custoUnitarioInput = form.querySelector('#input-edit-produto-custo-unitario');

    const calcularCustoUnitario = () => {
        const custoGrade = parseFloat(custoGradeInput.value) || 0;
        const unidadesGrade = parseInt(unidadesGradeInput.value) || 0;
        if (custoGrade > 0 && unidadesGrade > 0) {
            custoUnitarioInput.value = (custoGrade / unidadesGrade).toFixed(2);
        }
    };

    custoGradeInput.addEventListener('input', calcularCustoUnitario);
    unidadesGradeInput.addEventListener('input', calcularCustoUnitario);

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const produtoAtualizado = {
            ...produto,
            nome: form.querySelector('#input-edit-produto-nome').value.trim(),
            precoVenda: parseFloat(form.querySelector('#input-edit-produto-preco-venda').value),
            custoUnitario: parseFloat(custoUnitarioInput.value),
            stockMinimo: parseInt(form.querySelector('#input-edit-produto-stock-minimo').value)
        };
        store.dispatch({ type: 'UPDATE_PRODUCT', payload: produtoAtualizado });
        Toast.mostrarNotificacao(`Produto "${produtoAtualizado.nome}" atualizado!`);
        closeModal();
    });

    form.querySelector('.btn-fechar-modal').addEventListener('click', closeModal);
    
    document.getElementById('modal-edit-produto-overlay').addEventListener('click', e => {
        if (e.target.id === 'modal-edit-produto-overlay') {
            closeModal();
        }
    });
};

export const unmount = () => {};