// /modules/components/modals/FormLiquidarDividaModal.js
'use strict';

import store from '../../services/Store.js';
import * as Toast from '../Toast.js';

export const render = (cliente) => {
    const dividaTotal = cliente.dividas.reduce((total, divida) => {
        if (divida.tipo === 'debito') return total + divida.valor;
        if (divida.tipo === 'credito') return total - Math.abs(divida.valor);
        return total;
    }, 0);

    return `
    <div id="modal-liquidar-divida-overlay" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4">
        <form id="form-liquidar-divida" class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-sm">
            <header class="flex justify-between items-center p-4 border-b border-borda">
                <h3 class="text-xl font-bold">Liquidar Dívida</h3>
                <button type="button" class="btn-fechar-modal text-2xl">&times;</button>
            </header>
            <div class="p-4 space-y-4">
                <p>Cliente: <strong>${cliente.nome}</strong></p>
                <p class="text-sm">Dívida Atual: <strong class="text-red-500">${dividaTotal.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</strong></p>
                <div>
                    <label for="input-liquidar-valor" class="block text-sm font-medium mb-1">Valor a Pagar (Kz)</label>
                    <input type="number" id="input-liquidar-valor" required min="1" max="${dividaTotal}" class="w-full p-2 border border-borda rounded-md bg-fundo-principal">
                </div>
            </div>
            <footer class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
                <button type="submit" class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">Registar Pagamento</button>
            </footer>
        </form>
    </div>`;
};

export const mount = (closeModal, cliente) => {
    const form = document.getElementById('form-liquidar-divida');
    const inputValor = form.querySelector('#input-liquidar-valor');
    inputValor.focus();

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const valor = parseFloat(inputValor.value);
        if (!valor || valor <= 0) {
            return Toast.mostrarNotificacao("Insira um valor de pagamento válido.", "erro");
        }
        
        const dividaTotal = cliente.dividas.reduce((total, divida) => {
            if (divida.tipo === 'debito') return total + divida.valor;
            if (divida.tipo === 'credito') return total - Math.abs(divida.valor);
            return total;
        }, 0);

        if (valor > dividaTotal) {
            return Toast.mostrarNotificacao("O valor a pagar não pode ser maior que a dívida atual.", "erro");
        }

        store.dispatch({ type: 'SETTLE_DEBT', payload: { clienteId: cliente.id, valor } });
        Toast.mostrarNotificacao("Pagamento de dívida registado.");
        closeModal();
    });
    
    form.querySelector('.btn-fechar-modal').addEventListener('click', closeModal);
    
    document.getElementById('modal-liquidar-divida-overlay').addEventListener('click', e => {
        if (e.target.id === 'modal-liquidar-divida-overlay') {
            closeModal();
        }
    });
};

export const unmount = () => {};