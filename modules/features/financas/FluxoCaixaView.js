// /modules/features/financas/FluxoCaixaView.js
'use strict';

import store from '../../shared/services/Store.js';
import { abrirModalFechoGlobal, abrirModalNovaDespesa } from '../../shared/components/Modals.js';
import { calcularRelatorioDia } from './services/ReportingService.js';

let unsubscribe = null;
let viewNode = null;
let dataAtualCalendario = new Date();

function renderCalendarGrid() {
    if (!viewNode) return;
    const state = store.getState();
    const ano = dataAtualCalendario.getFullYear();
    const mes = dataAtualCalendario.getMonth();
    const calendarioTituloEl = viewNode.querySelector('#calendario-titulo');
    const calendarioGridDiasEl = viewNode.querySelector('#calendario-grid-dias');
    if (!calendarioTituloEl || !calendarioGridDiasEl) return;

    const nomeDoMes = new Date(ano, mes).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
    calendarioTituloEl.textContent = nomeDoMes.charAt(0).toUpperCase() + nomeDoMes.slice(1);
    calendarioGridDiasEl.innerHTML = '';
    
    const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();
    
    const diasComRelatorio = new Set(
        (state.historicoFechos || []).map(relatorio => {
            const dataRelatorio = new Date(relatorio.data);
            return dataRelatorio.getFullYear() === ano && dataRelatorio.getMonth() === mes ? dataRelatorio.getDate() : null;
        }).filter(Boolean)
    );

    for (let i = 0; i < primeiroDiaSemana; i++) {
        calendarioGridDiasEl.appendChild(document.createElement('div'));
    }

    for (let dia = 1; dia <= diasNoMes; dia++) {
        const temRelatorio = diasComRelatorio.has(dia);
        const diaEl = document.createElement('div');
        diaEl.textContent = dia;
        diaEl.className = 'p-2 text-center rounded-full transition-colors duration-200';
        if (temRelatorio) {
            diaEl.classList.add('bg-blue-500', 'text-white', 'font-bold', 'cursor-pointer', 'hover:bg-blue-600');
            diaEl.dataset.dia = dia;
        } else {
            diaEl.classList.add('text-gray-400', 'dark:text-gray-600');
        }
        calendarioGridDiasEl.appendChild(diaEl);
    }
}

function render() {
    return `
        <section id="view-fluxo-caixa" class="p-4 flex flex-col h-full">
            <header class="bg-fundo-secundario p-4 rounded-lg shadow-md mb-4 space-y-4">
                <div id="calendario-nav" class="flex justify-between items-center">
                    <button id="btn-mes-anterior" class="p-2 text-lg rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><i class="lni lni-chevron-left"></i></button>
                    <h2 id="calendario-titulo" class="text-xl font-bold"></h2>
                    <button id="btn-mes-seguinte" class="p-2 text-lg rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><i class="lni lni-chevron-right"></i></button>
                </div>
            </header>
            <div id="calendario-container" class="flex-grow">
                <div class="grid grid-cols-7 gap-2 text-center font-bold text-texto-secundario text-sm mb-2">
                    <div>D</div><div>S</div><div>T</div><div>Q</div><div>Q</div><div>S</div><div>S</div>
                </div>
                <div id="calendario-grid-dias" class="grid grid-cols-7 gap-2"></div>
            </div>
            <footer class="pt-4 mt-4 grid grid-cols-2 gap-4">
                <button id="btn-registar-despesa" class="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg shadow flex items-center justify-center gap-2">
                    <i class="lni lni-arrow-down"></i>
                    <span>Registar Despesa</span>
                </button>
                <button id="btn-ver-fecho-dia-atual" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow flex items-center justify-center gap-2">
                    <i class="lni lni-printer"></i>
                    <span>Fechar o Dia</span>
                </button>
            </footer>
        </section>
    `;
}

function mount() {
    viewNode = document.getElementById('app-root');
    dataAtualCalendario = new Date();

    renderCalendarGrid();
    unsubscribe = store.subscribe(renderCalendarGrid);

    viewNode.querySelector('#btn-mes-anterior').addEventListener('click', () => {
        dataAtualCalendario.setMonth(dataAtualCalendario.getMonth() - 1);
        renderCalendarGrid();
    });

    viewNode.querySelector('#btn-mes-seguinte').addEventListener('click', () => {
        dataAtualCalendario.setMonth(dataAtualCalendario.getMonth() + 1);
        renderCalendarGrid();
    });

    viewNode.querySelector('#calendario-grid-dias').addEventListener('click', (event) => {
        const diaEl = event.target.closest('[data-dia]');
        if (diaEl) {
            const dia = parseInt(diaEl.dataset.dia, 10);
            const dataProcurada = new Date(dataAtualCalendario.getFullYear(), dataAtualCalendario.getMonth(), dia);
            const relatorio = store.getState().historicoFechos.find(rel => new Date(rel.data).toDateString() === dataProcurada.toDateString());
            if (relatorio) {
                abrirModalFechoGlobal(relatorio, true);
            }
        }
    });
    
    viewNode.querySelector('#btn-ver-fecho-dia-atual').addEventListener('click', () => {
        const relatorioDoDia = calcularRelatorioDia(store.getState());
        abrirModalFechoGlobal(relatorioDoDia, false);
    });

    viewNode.querySelector('#btn-registar-despesa').addEventListener('click', abrirModalNovaDespesa);
}

function unmount() {
    if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
    }
    viewNode = null;
}

export default { render, mount, unmount };