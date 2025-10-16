// /modules/features/financas/components/FormExportarComprasModal.js (NOVO FICHEIRO)
'use strict';

import store from '../../../shared/services/Store.js';
import * as Toast from '../../../shared/components/Toast.js';
import { exportarRelatorioComprasPDF, exportarRelatorioComprasXLS } from '../services/ReportingService.js';

// Função auxiliar para formatar a data para o input type="date" (YYYY-MM-DD)
function toISODateString(date) {
    return date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
}

export const render = () => {
    const hoje = new Date();
    const primeiroDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    return `
<div id="modal-exportar-compras-overlay" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4">
    <form id="form-exportar-compras" class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-sm">
        <header class="flex justify-between items-center p-4 border-b border-borda">
            <h3 class="text-xl font-bold">Exportar Histórico de Compras</h3>
            <button type="button" class="btn-fechar-modal text-2xl">&times;</button>
        </header>
        <div class="p-4 space-y-4">
            <p class="text-sm text-texto-secundario">Selecione o período para o qual deseja gerar o relatório.</p>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label for="input-data-inicio" class="block text-sm font-medium mb-1">Data de Início</label>
                    <input type="date" id="input-data-inicio" required class="w-full p-2 border border-borda rounded-md bg-fundo-input" value="${toISODateString(primeiroDiaDoMes)}">
                </div>
                <div>
                    <label for="input-data-fim" class="block text-sm font-medium mb-1">Data de Fim</label>
                    <input type="date" id="input-data-fim" required class="w-full p-2 border border-borda rounded-md bg-fundo-input" value="${toISODateString(hoje)}">
                </div>
            </div>
        </div>
        <footer class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg grid grid-cols-2 gap-4">
            <button type="button" id="btn-exportar-pdf" class="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-2"><i class="lni lni-download"></i> PDF</button>
            <button type="button" id="btn-exportar-xls" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-2"><i class="lni lni-download"></i> EXCEL</button>
        </footer>
    </form>
</div>`;
};

export const mount = (closeModal) => {
    const form = document.getElementById('form-exportar-compras');
    const dataInicioInput = form.querySelector('#input-data-inicio');
    const dataFimInput = form.querySelector('#input-data-fim');
    const btnPDF = form.querySelector('#btn-exportar-pdf');
    const btnXLS = form.querySelector('#btn-exportar-xls');

    const handleExport = (formato) => {
        const startDate = new Date(dataInicioInput.value);
        const endDate = new Date(dataFimInput.value);
        endDate.setHours(23, 59, 59, 999); // Garante que o dia final é incluído

        if (!dataInicioInput.value || !dataFimInput.value || startDate > endDate) {
            return Toast.mostrarNotificacao("Por favor, selecione um período de datas válido.", "erro");
        }

        const state = store.getState();
        const comprasNoPeriodo = state.historicoCompras.filter(c => {
            const dataCompra = new Date(c.data);
            return dataCompra >= startDate && dataCompra <= endDate;
        });

        if (comprasNoPeriodo.length === 0) {
            return Toast.mostrarNotificacao("Não existem compras registadas no período selecionado.", "info");
        }

        if (formato === 'pdf') {
            exportarRelatorioComprasPDF(comprasNoPeriodo, state, startDate, endDate);
        } else if (formato === 'xls') {
            exportarRelatorioComprasXLS(comprasNoPeriodo, state, startDate, endDate);
        }

        closeModal();
    };

    btnPDF.addEventListener('click', () => handleExport('pdf'));
    btnXLS.addEventListener('click', () => handleExport('xls'));
    
    form.querySelector('.btn-fechar-modal').addEventListener('click', closeModal);
    document.getElementById('modal-exportar-compras-overlay').addEventListener('click', e => {
        if (e.target.id === 'modal-exportar-compras-overlay') {
            closeModal();
        }
    });
};

export const unmount = () => {};