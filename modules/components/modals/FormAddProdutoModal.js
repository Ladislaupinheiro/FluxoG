// /modules/components/modals/FormAddProdutoModal.js
'use strict';

import store from '../../services/Store.js';
import * as Toast from '../Toast.js';

export const render = () => `
<div id="modal-add-produto-overlay" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4">
    <form id="form-add-produto" class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-sm">
        <header class="flex justify-between items-center p-4 border-b border-borda">
            <h3 class="text-xl font-bold">Adicionar Produto</h3>
            <button type="button" class="btn-fechar-modal text-2xl">&times;</button>
        </header>
        <div class="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
                <label for="input-produto-nome" class="block text-sm font-medium mb-1">Nome do Produto</label>
                <input type="text" id="input-produto-nome" required class="w-full p-2 border border-borda rounded-md bg-fundo-principal" placeholder="Ex: Cerveja Cuca">
            </div>
            <div>
                <label for="input-produto-preco-venda" class="block text-sm font-medium mb-1">Preço de Venda (Kz)</label>
                <input type="number" id="input-produto-preco-venda" required min="0" step="any" class="w-full p-2 border border-borda rounded-md bg-fundo-principal" placeholder="1000">
            </div>

            <div class="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg space-y-3">
                <h4 class="text-sm font-bold text-center text-texto-secundario">CÁLCULO DE CUSTO</h4>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label for="input-produto-custo-grade" class="block text-sm font-medium mb-1">Custo da Grade</label>
                        <input type="number" id="input-produto-custo-grade" min="0" class="w-full p-2 border border-borda rounded-md bg-fundo-principal" placeholder="3000">
                    </div>
                    <div>
                        <label for="input-produto-unidades-grade" class="block text-sm font-medium mb-1">Un. na Grade</label>
                        <input type="number" id="input-produto-unidades-grade" min="1" class="w-full p-2 border border-borda rounded-md bg-fundo-principal" placeholder="12">
                    </div>
                </div>
                <div>
                    <label for="input-produto-custo-unitario" class="block text-sm font-medium mb-1">Custo por Unidade (Kz)</label>
                    <input type="number" id="input-produto-custo-unitario" required min="0" step="any" class="w-full p-2 border-green-500 rounded-md bg-fundo-principal font-bold" placeholder="Custo por item">
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label for="input-produto-stock-armazem" class="block text-sm font-medium mb-1">Stock (Armazém)</label>
                    <input type="number" id="input-produto-stock-armazem" required min="0" class="w-full p-2 border border-borda rounded-md bg-fundo-principal" value="0">
                </div>
                <div>
                    <label for="input-produto-stock-minimo" class="block text-sm font-medium mb-1">Stock Mínimo</label>
                    <input type="number" id="input-produto-stock-minimo" required min="0" class="w-full p-2 border border-borda rounded-md bg-fundo-principal" value="0">
                </div>
            </div>
        </div>
        <footer class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Adicionar ao Inventário</button>
        </footer>
    </form>
</div>`;

export const mount = (closeModal) => {
    const form = document.getElementById('form-add-produto');
    const custoGradeInput = form.querySelector('#input-produto-custo-grade');
    const unidadesGradeInput = form.querySelector('#input-produto-unidades-grade');
    const custoUnitarioInput = form.querySelector('#input-produto-custo-unitario');
    const nomeInput = form.querySelector('#input-produto-nome');
    nomeInput.focus();

    const calcularCustoUnitario = () => {
        const custoGrade = parseFloat(custoGradeInput.value) || 0;
        const unidadesGrade = parseInt(unidadesGradeInput.value) || 0;
        if (custoGrade > 0 && unidadesGrade > 0) {
            const custoUnitario = custoGrade / unidadesGrade;
            custoUnitarioInput.value = custoUnitario.toFixed(2);
        }
    };

    custoGradeInput.addEventListener('input', calcularCustoUnitario);
    unidadesGradeInput.addEventListener('input', calcularCustoUnitario);
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const nome = nomeInput.value.trim();
        const precoVenda = parseFloat(form.querySelector('#input-produto-preco-venda').value);
        const custoUnitario = parseFloat(custoUnitarioInput.value);
        const stockArmazem = parseInt(form.querySelector('#input-produto-stock-armazem').value);
        const stockMinimo = parseInt(form.querySelector('#input-produto-stock-minimo').value);

        if (!nome || isNaN(precoVenda) || isNaN(custoUnitario) || precoVenda < 0 || custoUnitario < 0) {
            return Toast.mostrarNotificacao("Nome, Preço de Venda e Custo Unitário são obrigatórios.", "erro");
        }
        store.dispatch({ type: 'ADD_PRODUCT', payload: { nome, precoVenda, custoUnitario, stockArmazem, stockMinimo } });
        Toast.mostrarNotificacao(`Produto "${nome}" adicionado!`);
        closeModal();
    });

    form.querySelector('.btn-fechar-modal').addEventListener('click', closeModal);
    document.getElementById('modal-add-produto-overlay').addEventListener('click', e => {
        if (e.target.id === 'modal-add-produto-overlay') {
            closeModal();
        }
    });
};

export const unmount = () => {};