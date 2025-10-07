// /modules/components/modals/FechoGlobalModal.js
'use strict';

import store from '../../services/Store.js';
import * as Toast from '../Toast.js';
import { abrirModalConfirmacao } from '../Modals.js';
import { exportarRelatorioPDF, exportarRelatorioXLS } from '../../services/ReportingService.js';

export const render = (relatorio) => {
    const dataFormatada = new Date(relatorio.data).toLocaleDateString('pt-PT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const produtosVendidosHTML = Object.entries(relatorio.produtosVendidos)
        .sort(([, a], [, b]) => b - a)
        .map(([nome, qtd]) => `<div class="flex justify-between text-sm"><span class="font-semibold">${qtd}x</span><span>${nome}</span></div>`)
        .join('') || '<p class="text-sm text-center text-texto-secundario">Nenhum produto vendido.</p>';

    const corLucro = relatorio.lucroBruto >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500';

    return `
    <div id="modal-fecho-global-overlay" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4">
        <div class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-sm max-h-[90vh] flex flex-col">
            <header class="flex justify-between items-center p-4 border-b border-borda">
                <h3 class="text-xl font-bold">Relatório do Dia</h3>
                <button type="button" class="btn-fechar-modal text-2xl">&times;</button>
            </header>
            <div class="p-4 space-y-4 overflow-y-auto">
                <p class="text-center font-semibold text-texto-secundario">${dataFormatada}</p>
                
                <div class="space-y-2">
                    <div class="p-3 bg-blue-50 dark:bg-gray-700/50 rounded-lg text-center">
                        <p class="text-sm font-medium text-blue-800 dark:text-blue-300">Total Vendido</p>
                        <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">${relatorio.totalVendido.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p>
                    </div>
                    <div class="p-3 bg-red-50 dark:bg-gray-700/50 rounded-lg text-center">
                        <p class="text-sm font-medium text-red-800 dark:text-red-300">Custo das Vendas</p>
                        <p class="text-lg font-semibold text-red-500">- ${relatorio.totalCustoVendido.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p>
                    </div>
                    <div class="p-3 bg-green-50 dark:bg-gray-700/50 rounded-lg text-center border-2 border-green-500">
                        <p class="text-sm font-bold text-green-800 dark:text-green-300">LUCRO BRUTO</p>
                        <p class="text-4xl font-extrabold ${corLucro}">${relatorio.lucroBruto.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-2 text-center text-sm pt-2 border-t border-borda">
                    <p>Numerário: <strong class="block">${relatorio.totalNumerario.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</strong></p>
                    <p>TPA: <strong class="block">${relatorio.totalTpa.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</strong></p>
                    <p>Contas Fechadas: <strong class="block">${relatorio.numContasFechadas}</strong></p>
                    <p>Média/Conta: <strong class="block">${relatorio.mediaPorConta.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</strong></p>
                </div>
                <div>
                    <h4 class="font-bold text-center mt-4 mb-2 border-t border-borda pt-2">Produtos Vendidos</h4>
                    <div class="space-y-1 max-h-40 overflow-y-auto pr-2">${produtosVendidosHTML}</div>
                </div>
            </div>
            <footer id="footer-fecho-global" class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg space-y-2"></footer>
        </div>
    </div>`;
};

function handleArquivarDia(closeModal, relatorio) {
    const state = store.getState();
    const hojeStr = new Date().toDateString();
    if (state.historicoFechos.some(r => new Date(r.data).toDateString() === hojeStr)) {
        return Toast.mostrarNotificacao("O dia de hoje já foi fechado e arquivado.", "erro");
    }
    if (relatorio.numContasFechadas === 0) {
        return Toast.mostrarNotificacao("Não existem vendas fechadas para arquivar.", "erro");
    }
    abrirModalConfirmacao(
        'Arquivar o Dia?',
        'Todas as contas fechadas serão arquivadas e o stock da loja será zerado. Esta ação não pode ser desfeita.',
        () => {
            store.dispatch({ type: 'ARCHIVE_DAY', payload: { relatorio } });
            closeModal();
            Toast.mostrarNotificacao("Dia arquivado com sucesso!");
        }
    );
}

export const mount = (closeModal, relatorio, isHistoric) => {
    const footer = document.getElementById('footer-fecho-global');
    if (isHistoric) {
        footer.innerHTML = `
        <div class="flex gap-2">
            <button id="btn-exportar-pdf" class="w-full bg-red-500 text-white font-bold py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-1"><i class="lni lni-download"></i> PDF</button>
            <button id="btn-exportar-xls" class="w-full bg-green-600 text-white font-bold py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-1"><i class="lni lni-download"></i> EXCEL</button>
        </div>`;
        document.getElementById('btn-exportar-pdf')?.addEventListener('click', () => exportarRelatorioPDF(relatorio, store.getState().config));
        document.getElementById('btn-exportar-xls')?.addEventListener('click', () => exportarRelatorioXLS(relatorio, store.getState().config));
    } else {
        footer.innerHTML = `<button id="btn-arquivar-dia" class="w-full bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2"><i class="lni lni-archive"></i> Arquivar Relatório do Dia</button>`;
        document.getElementById('btn-arquivar-dia')?.addEventListener('click', () => handleArquivarDia(closeModal, relatorio));
    }

    document.querySelector('.btn-fechar-modal')?.addEventListener('click', closeModal);
    document.getElementById('modal-fecho-global-overlay')?.addEventListener('click', e => {
        if (e.target.id === 'modal-fecho-global-overlay') {
            closeModal();
        }
    });
};

export const unmount = () => {};