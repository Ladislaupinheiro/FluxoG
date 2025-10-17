// /modules/features/inventario/components/FormRegistarCompraModal.js (RECONSTRUÍDO)
'use strict';

import store from '../../../shared/services/Store.js';
import * as Toast from '../../../shared/components/Toast.js';

function updateProductOptions(fornecedorId, produtoCatalogoPreSelecionadoId = null) {
    const produtoSelect = document.getElementById('select-compra-produto');
    if (!produtoSelect) return;

    const fornecedor = store.getState().fornecedores.find(f => f.id === fornecedorId);
    const produtosDoCatalogo = fornecedor ? fornecedor.catalogo : [];
    
    produtoSelect.innerHTML = '<option value="" disabled>Selecione um produto</option>';
    produtoSelect.innerHTML += produtosDoCatalogo.map(p => 
        `<option value="${p.id}" ${p.id === produtoCatalogoPreSelecionadoId ? 'selected' : ''}>${p.nome}</option>`
    ).join('');
    produtoSelect.disabled = produtosDoCatalogo.length === 0;
}

export const render = (fornecedorPreSelecionado, produtoCatalogoPreSelecionado = null) => {
    const state = store.getState();
    const fornecedoresOptions = state.fornecedores.map(f => 
        `<option value="${f.id}" ${fornecedorPreSelecionado && f.id === fornecedorPreSelecionado.id ? 'selected' : ''}>${f.nome}</option>`
    ).join('');

    return `
<div id="modal-registar-compra-overlay" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4">
    <form id="form-registar-compra" class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-sm">
        <header class="flex justify-between items-center p-4 border-b border-borda">
            <h3 class="text-xl font-bold">Registar Nova Compra</h3>
            <button type="button" class="btn-fechar-modal text-2xl">&times;</button>
        </header>
        <div class="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
                <label for="select-compra-fornecedor" class="block text-sm font-medium mb-1">Fornecedor</label>
                <select id="select-compra-fornecedor" required class="w-full p-2 border border-borda rounded-md bg-fundo-input" ${fornecedorPreSelecionado ? 'disabled' : ''}>
                    <option value="" disabled ${!fornecedorPreSelecionado ? 'selected' : ''}>Selecione um fornecedor</option>
                    ${fornecedoresOptions}
                </select>
            </div>
            <div>
                <label for="select-compra-produto" class="block text-sm font-medium mb-1">Produto do Catálogo</label>
                <select id="select-compra-produto" required class="w-full p-2 border border-borda rounded-md bg-fundo-input" ${produtoCatalogoPreSelecionado ? 'disabled' : ''}>
                    <option value="" disabled selected>Selecione um fornecedor primeiro</option>
                </select>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label for="input-compra-grades" class="block text-sm font-medium mb-1">Nº de Grades</label>
                    <input type="number" id="input-compra-grades" required min="1" class="w-full p-2 border border-borda rounded-md bg-fundo-input" value="1">
                </div>
                <div>
                    <label for="input-compra-unidades" class="block text-sm font-medium mb-1">Un. p/ Grade</label>
                    <input type="number" id="input-compra-unidades" required min="1" class="w-full p-2 border border-borda rounded-md bg-fundo-input" placeholder="Ex: 12 ou 24">
                </div>
            </div>

            <div>
                 <label class="block text-sm font-medium mb-1">Quantidade Total (calculado)</label>
                 <input type="text" id="quantidade-total-display" readonly class="w-full p-2 border-gray-400 rounded-md bg-fundo-principal font-bold text-center">
            </div>

            <div>
                <label for="input-compra-custo-total" class="block text-sm font-medium mb-1">Custo Total da Compra (Kz)</label>
                <input type="number" id="input-compra-custo-total" required min="0" step="any" class="w-full p-2 border border-borda rounded-md bg-fundo-input">
            </div>

            <div>
                 <label class="block text-sm font-medium mb-1">Custo p/ Unidade (calculado)</label>
                 <input type="text" id="custo-unitario-display" readonly class="w-full p-2 border-green-500 rounded-md bg-fundo-principal font-bold text-center">
            </div>

            <div>
                <label for="select-compra-pagamento" class="block text-sm font-medium mb-1">Método de Pagamento</p>
                <select id="select-compra-pagamento" required class="w-full p-2 border border-borda rounded-md bg-fundo-input">
                    <option value="Numerário">Numerário</option>
                    <option value="TPA">TPA</option>
                    <option value="Transferência">Transferência</option>
                </select>
            </div>
        </div>
        <footer class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
            <button type="submit" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">Registar Compra</button>
        </footer>
    </form>
</div>`;
};

export const mount = (closeModal, fornecedorPreSelecionado, produtoCatalogoPreSelecionado = null) => {
    const form = document.getElementById('form-registar-compra');
    const fornecedorSelect = form.querySelector('#select-compra-fornecedor');
    const produtoSelect = form.querySelector('#select-compra-produto');
    const numGradesInput = form.querySelector('#input-compra-grades');
    const unidadesInput = form.querySelector('#input-compra-unidades');
    const qtdTotalDisplay = form.querySelector('#quantidade-total-display');
    const custoTotalInput = form.querySelector('#input-compra-custo-total');
    const custoUnitarioDisplay = form.querySelector('#custo-unitario-display');

    const calcularTotais = () => {
        const numGrades = parseFloat(numGradesInput.value) || 0;
        const unidades = parseFloat(unidadesInput.value) || 0;
        const qtdTotal = numGrades * unidades;
        qtdTotalDisplay.value = `${qtdTotal} un.`;

        const custoTotal = parseFloat(custoTotalInput.value) || 0;
        if (qtdTotal > 0 && custoTotal > 0) {
            const custoUnitario = (custoTotal / qtdTotal);
            custoUnitarioDisplay.value = custoUnitario.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA', minimumFractionDigits: 2 });
        } else {
            custoUnitarioDisplay.value = (0).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA', minimumFractionDigits: 2 });
        }
    };

    numGradesInput.addEventListener('input', calcularTotais);
    unidadesInput.addEventListener('input', calcularTotais);
    custoTotalInput.addEventListener('input', calcularTotais);
    
    fornecedorSelect.addEventListener('change', () => {
        updateProductOptions(fornecedorSelect.value);
    });
    
    if(fornecedorPreSelecionado) {
        updateProductOptions(fornecedorPreSelecionado.id, produtoCatalogoPreSelecionado ? produtoCatalogoPreSelecionado.id : null);
    }

    form.addEventListener('submit', e => {
        e.preventDefault();
        
        const numGrades = parseFloat(numGradesInput.value) || 0;
        const unidades = parseFloat(unidadesInput.value) || 0;
        const quantidadeTotal = numGrades * unidades;

        const payload = {
            fornecedorId: fornecedorSelect.value,
            produtoCatalogoId: produtoSelect.value,
            quantidade: quantidadeTotal,
            valorTotal: parseFloat(custoTotalInput.value),
            metodoPagamento: form.querySelector('#select-compra-pagamento').value,
        };

        if (!payload.fornecedorId || !payload.produtoCatalogoId || !payload.quantidade || payload.quantidade <= 0 || !payload.valorTotal || payload.valorTotal <= 0) {
            return Toast.mostrarNotificacao("Todos os campos de compra são obrigatórios e devem ser positivos.", "erro");
        }

        store.dispatch({ type: 'ADD_COMPRA', payload });
        Toast.mostrarNotificacao(`Compra registada com sucesso.`);
        closeModal();
    });

    form.querySelector('.btn-fechar-modal').addEventListener('click', closeModal);
    document.getElementById('modal-registar-compra-overlay').addEventListener('click', e => {
        if (e.target.id === 'modal-registar-compra-overlay') closeModal();
    });

    calcularTotais(); // Chama uma vez para inicializar os valores
};

export const unmount = () => {};