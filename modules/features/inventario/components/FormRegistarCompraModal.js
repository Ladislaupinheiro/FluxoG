// /modules/features/inventario/components/FormRegistarCompraModal.js (CORRIGIDO)
'use strict';

import store from '../../../shared/services/Store.js';
import * as Toast from '../../../shared/components/Toast.js';

// Função para atualizar as opções de produto com base no fornecedor selecionado
function updateProductOptions(fornecedorId) {
    const produtoSelect = document.getElementById('select-compra-produto');
    if (!produtoSelect) return;

    // <-- ALTERAÇÃO PRINCIPAL: Busca o estado mais recente diretamente do store
    const state = store.getState(); 
    
    const fornecedor = state.fornecedores.find(f => f.id === fornecedorId);
    const produtosDoCatalogo = fornecedor ? fornecedor.catalogo : [];
    
    produtoSelect.innerHTML = '<option value="" disabled selected>Selecione um produto</option>'; // Reset
    produtoSelect.innerHTML += produtosDoCatalogo.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');
    produtoSelect.disabled = produtosDoCatalogo.length === 0;
}

export const render = (fornecedorPreSelecionado) => {
    const state = store.getState(); // Busca o estado para renderização inicial
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
                <select id="select-compra-fornecedor" required class="w-full p-2 border border-borda rounded-md bg-fundo-input">
                    <option value="" disabled ${!fornecedorPreSelecionado ? 'selected' : ''}>Selecione um fornecedor</option>
                    ${fornecedoresOptions}
                </select>
            </div>
            <div>
                <label for="select-compra-produto" class="block text-sm font-medium mb-1">Produto</label>
                <select id="select-compra-produto" required disabled class="w-full p-2 border border-borda rounded-md bg-fundo-input opacity-50">
                    <option value="" disabled selected>Selecione um fornecedor primeiro</option>
                </select>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label for="input-compra-qtd" class="block text-sm font-medium mb-1">Quantidade</label>
                    <input type="number" id="input-compra-qtd" required min="1" class="w-full p-2 border border-borda rounded-md bg-fundo-input">
                </div>
                <div>
                    <label for="input-compra-custo-total" class="block text-sm font-medium mb-1">Custo Total</label>
                    <input type="number" id="input-compra-custo-total" required min="0" class="w-full p-2 border border-borda rounded-md bg-fundo-input">
                </div>
            </div>
            <div>
                 <label class="block text-sm font-medium mb-1">Custo p/ Unidade (calculado)</label>
                 <input type="text" id="custo-unitario-display" readonly class="w-full p-2 border-green-500 rounded-md bg-fundo-principal font-bold" value="0.00 Kz">
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

export const mount = (closeModal, fornecedorPreSelecionado) => {
    const form = document.getElementById('form-registar-compra');
    const fornecedorSelect = form.querySelector('#select-compra-fornecedor');
    const produtoSelect = form.querySelector('#select-compra-produto');
    const qtdInput = form.querySelector('#input-compra-qtd');
    const custoTotalInput = form.querySelector('#input-compra-custo-total');
    const custoUnitarioDisplay = form.querySelector('#custo-unitario-display');

    fornecedorSelect.addEventListener('change', () => {
        produtoSelect.disabled = true;
        produtoSelect.classList.add('opacity-50');
        updateProductOptions(fornecedorSelect.value);
        produtoSelect.classList.remove('opacity-50');
    });
    
    // Se um fornecedor já veio pré-selecionado, atualiza a lista de produtos
    if(fornecedorPreSelecionado) {
        updateProductOptions(fornecedorPreSelecionado.id);
    }

    const calcularCustoUnitario = () => {
        const qtd = parseFloat(qtdInput.value) || 0;
        const custoTotal = parseFloat(custoTotalInput.value) || 0;
        if (qtd > 0 && custoTotal > 0) {
            const custoUnitario = (custoTotal / qtd);
            custoUnitarioDisplay.value = custoUnitario.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA', minimumFractionDigits: 2 });
        } else {
            custoUnitarioDisplay.value = (0).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
        }
    };
    qtdInput.addEventListener('input', calcularCustoUnitario);
    custoTotalInput.addEventListener('input', calcularCustoUnitario);
    
    form.addEventListener('submit', e => {
        e.preventDefault();
        
        const payload = {
            fornecedorId: fornecedorSelect.value,
            produtoCatalogoId: produtoSelect.value, // ID do produto no catálogo
            quantidade: parseFloat(qtdInput.value),
            valorTotal: parseFloat(custoTotalInput.value),
            metodoPagamento: form.querySelector('#select-compra-pagamento').value,
        };

        if (!payload.fornecedorId || !payload.produtoCatalogoId || !payload.quantidade || !payload.valorTotal) {
            return Toast.mostrarNotificacao("Todos os campos são obrigatórios.", "erro");
        }

        store.dispatch({ type: 'ADD_COMPRA', payload });
        Toast.mostrarNotificacao(`Compra registada com sucesso.`);
        closeModal();
    });

    form.querySelector('.btn-fechar-modal').addEventListener('click', closeModal);
    document.getElementById('modal-registar-compra-overlay').addEventListener('click', e => {
        if (e.target.id === 'modal-registar-compra-overlay') closeModal();
    });
};

export const unmount = () => {};