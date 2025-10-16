// /modules/features/inventario/components/FormAddProdutoModal.js (REATORADO)
'use strict';

import store from '../../../shared/services/Store.js';
import * as Toast from '../../../shared/components/Toast.js';

export const render = () => {
    const state = store.getState();
    const fornecedoresOptions = state.fornecedores.map(f => `<option value="${f.id}">${f.nome}</option>`).join('');

    return `
<div id="modal-add-produto-overlay" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4">
    <form id="form-add-produto" class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-sm">
        <header class="flex justify-between items-center p-4 border-b border-borda">
            <h3 class="text-xl font-bold">Adicionar Novo Produto</h3>
            <button type="button" class="btn-fechar-modal text-2xl">&times;</button>
        </header>
        <div class="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
                <label for="input-produto-nome" class="block text-sm font-medium mb-1">Nome do Produto</label>
                <input type="text" id="input-produto-nome" required class="w-full p-2 border border-borda rounded-md bg-fundo-input" placeholder="Ex: Cerveja Cuca">
            </div>
            
            <div>
                <label for="select-produto-fornecedor" class="block text-sm font-medium mb-1">Fornecedor</label>
                <select id="select-produto-fornecedor" required class="w-full p-2 border border-borda rounded-md bg-fundo-input">
                    <option value="" disabled selected>Selecione um fornecedor</option>
                    ${fornecedoresOptions}
                </select>
            </div>

            <div>
                <label for="input-produto-tags" class="block text-sm font-medium mb-1">Rótulos (separados por vírgula)</label>
                <input type="text" id="input-produto-tags" class="w-full p-2 border border-borda rounded-md bg-fundo-input" placeholder="Ex: cerveja, álcool, nacional">
            </div>

            <div>
                <label for="input-produto-preco-venda" class="block text-sm font-medium mb-1">Preço de Venda (Kz)</label>
                <input type="number" id="input-produto-preco-venda" required min="0" step="any" class="w-full p-2 border border-borda rounded-md bg-fundo-input" placeholder="1000">
            </div>

            <div class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3">
                <h4 class="text-sm font-bold text-center text-texto-secundario">Registo de Compra Inicial (Opcional)</h4>
                <div>
                    <label for="input-produto-compra-qtd" class="block text-sm font-medium mb-1">Quantidade Comprada</glabel>
                    <input type="number" id="input-produto-compra-qtd" min="0" class="w-full p-2 border border-borda rounded-md bg-fundo-input" placeholder="Ex: 24 (uma grade)">
                </div>
                <div>
                    <label for="input-produto-compra-custo-total" class="block text-sm font-medium mb-1">Custo Total da Compra (Kz)</label>
                    <input type="number" id="input-produto-compra-custo-total" min="0" class="w-full p-2 border border-borda rounded-md bg-fundo-input" placeholder="Ex: 5000">
                </div>
                 <div>
                    <label class="block text-sm font-medium mb-1">Custo por Unidade (calculado)</label>
                    <input type="number" id="input-produto-custo-unitario" readonly class="w-full p-2 border-green-500 rounded-md bg-fundo-principal font-bold" placeholder="0.00">
                </div>
            </div>
            
            <div>
                <label for="input-produto-stock-minimo" class="block text-sm font-medium mb-1">Stock Mínimo de Alerta</label>
                <input type="number" id="input-produto-stock-minimo" required min="0" class="w-full p-2 border border-borda rounded-md bg-fundo-input" value="0">
            </div>
        </div>
        <footer class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Adicionar ao Inventário</button>
        </footer>
    </form>
</div>`;
};

export const mount = (closeModal) => {
    const form = document.getElementById('form-add-produto');
    const nomeInput = form.querySelector('#input-produto-nome');
    const qtdCompraInput = form.querySelector('#input-produto-compra-qtd');
    const custoTotalInput = form.querySelector('#input-produto-compra-custo-total');
    const custoUnitarioInput = form.querySelector('#input-produto-custo-unitario');
    
    nomeInput.focus();

    // Lógica para calcular o custo unitário em tempo real
    const calcularCustoUnitario = () => {
        const qtd = parseFloat(qtdCompraInput.value) || 0;
        const custoTotal = parseFloat(custoTotalInput.value) || 0;
        if (qtd > 0 && custoTotal > 0) {
            custoUnitarioInput.value = (custoTotal / qtd).toFixed(2);
        } else {
            custoUnitarioInput.value = "0.00";
        }
    };

    qtdCompraInput.addEventListener('input', calcularCustoUnitario);
    custoTotalInput.addEventListener('input', calcularCustoUnitario);
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const nome = nomeInput.value.trim();
        const fornecedorId = form.querySelector('#select-produto-fornecedor').value;
        const precoVenda = parseFloat(form.querySelector('#input-produto-preco-venda').value);
        const stockMinimo = parseInt(form.querySelector('#input-produto-stock-minimo').value);
        const tags = form.querySelector('#input-produto-tags').value.split(',')
            .map(tag => tag.trim()).filter(Boolean);

        if (!nome || !fornecedorId || isNaN(precoVenda) || precoVenda < 0) {
            return Toast.mostrarNotificacao("Nome, Fornecedor e Preço de Venda são obrigatórios.", "erro");
        }

        const quantidadeInicial = parseFloat(qtdCompraInput.value) || 0;
        const custoUnitario = parseFloat(custoUnitarioInput.value) || 0;

        let primeiroLote = null;
        if (quantidadeInicial > 0 && custoUnitario > 0) {
            primeiroLote = {
                quantidade: quantidadeInicial,
                dataCompra: new Date().toISOString(),
                custoUnitario: custoUnitario
            };
        }
        
        const novoProduto = {
            id: crypto.randomUUID(),
            nome,
            fornecedorId,
            tags,
            precoVenda,
            stockLoja: 0,
            stockMinimo,
            stockArmazemLotes: primeiroLote ? [primeiroLote] : [],
            ultimaVenda: null
        };
        
        // Esta ação agora precisa ser criada ou adaptada no reducer
        store.dispatch({ type: 'ADD_PRODUCT', payload: novoProduto });

        // Se houve uma compra inicial, também a registamos no histórico
        if(primeiroLote) {
             store.dispatch({ type: 'ADD_COMPRA', payload: {
                produtoId: novoProduto.id,
                fornecedorId: novoProduto.fornecedorId,
                quantidade: primeiroLote.quantidade,
                valorTotal: custoTotalInput.value,
                metodoPagamento: 'N/A' // Ou um valor padrão
             }});
        }

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