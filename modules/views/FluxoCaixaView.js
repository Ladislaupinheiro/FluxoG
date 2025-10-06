// /modules/views/FluxoCaixaView.js - (v10.0 - View SPA Refatorada)
'use strict';

import store from '../services/Store.js';
// ATUALIZADO: Importa as novas funções de relatório
import { abrirModalFechoGlobal, abrirModalNovaDespesa, abrirModalRelatorioPeriodo } from '../components/Modals.js';
import { calcularRelatorioDia, gerarRelatorioPorPeriodo } from '../services/utils.js';

let unsubscribe = null;
let viewNode = null;
let dataAtualCalendario = new Date(); // Estado local para o mês/ano a ser exibido

/**
 * Renderiza o grid do calendário para o mês e ano em `dataAtualCalendario`.
 */
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

    const primeiroDiaDoMes = new Date(ano, mes, 1).getDay();
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();
    
    const diasComRelatorio = new Set(
        (state.historicoFechos || []).map(relatorio => {
            const dataRelatorio = new Date(relatorio.data);
            return dataRelatorio.getFullYear() === ano && dataRelatorio.getMonth() === mes ? dataRelatorio.getDate() : null;
        }).filter(Boolean)
    );

    for (let i = 0; i < primeiroDiaDoMes; i++) {
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

/**
 * Retorna o HTML do ecrã de Fluxo de Caixa.
 * @returns {string} O HTML completo do ecrã.
 */
function render() {
    return `
        <section id="view-fluxo-caixa" class="p-4 flex flex-col h-full">
            <header class="bg-fundo-secundario p-4 rounded-lg shadow-md mb-4 space-y-4">
                <div>
                    <h3 class="text-sm font-semibold text-texto-secundario mb-2">Relatórios de Caixa</h3>
                    <div id="botoes-filtro-periodo" class="grid grid-cols-4 gap-2 text-xs">
                        <button data-periodo="hoje" class="filtro-btn bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-1 rounded-lg">Hoje</button>
                        <button data-periodo="semana" class="filtro-btn bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-1 rounded-lg">Semana</button>
                        <button data-periodo="quinzena" class="filtro-btn bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-1 rounded-lg">Quinzena</button>
                        <button data-periodo="mes" class="filtro-btn bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-1 rounded-lg">Mês</button>
                    </div>
                </div>

                <div class="border-t border-borda pt-4">
                    <h3 class="text-sm font-semibold text-texto-secundario mb-2">Ações Rápidas</h3>
                     <button id="btn-nova-despesa" class="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-sm">
                        <i class="lni lni-plus"></i> Novo Lançamento (Despesa)
                    </button>
                </div>
            </header>

            <div id="calendario-container" class="flex-grow bg-fundo-secundario p-4 rounded-lg shadow-md">
                 <h3 class="text-sm font-semibold text-texto-secundario mb-2 text-center">Histórico de Fechos Diários</h3>
                 <div id="calendario-nav" class="flex justify-between items-center mb-2">
                    <button id="btn-mes-anterior" class="p-2 text-lg rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><i class="lni lni-chevron-left"></i></button>
                    <h2 id="calendario-titulo" class="text-lg font-bold"></h2>
                    <button id="btn-mes-seguinte" class="p-2 text-lg rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><i class="lni lni-chevron-right"></i></button>
                </div>
                <div class="grid grid-cols-7 gap-2 text-center font-bold text-texto-secundario text-sm mb-2">
                    <div>D</div><div>S</div><div>T</div><div>Q</div><div>Q</div><div>S</div><div>S</div>
                </div>
                <div id="calendario-grid-dias" class="grid grid-cols-7 gap-2"></div>
            </div>
            
            <footer class="pt-4 mt-4">
                <button id="btn-ver-fecho-dia-atual" class="w-full max-w-sm mx-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg flex items-center justify-center gap-2">
                    <i class="lni lni-printer"></i>
                    <span>Fechar o Dia</span>
                </button>
            </footer>
        </section>
    `;
}

/**
 * Adiciona os event listeners ao ecrã após ser renderizado.
 */
function mount() {
    viewNode = document.getElementById('app-root');
    dataAtualCalendario = new Date();

    renderCalendarGrid();
    unsubscribe = store.subscribe(renderCalendarGrid);

    viewNode.querySelector('#btn-nova-despesa')?.addEventListener('click', abrirModalNovaDespesa);
    
    // ATUALIZADO: Lógica para os novos botões de filtro
    viewNode.querySelector('#botoes-filtro-periodo')?.addEventListener('click', (event) => {
        const button = event.target.closest('.filtro-btn');
        if (!button) return;

        const periodo = button.dataset.periodo;
        const state = store.getState();
        const hoje = new Date();
        let dataInicio, dataFim = new Date();
        let titulo = '';

        switch(periodo) {
            case 'hoje':
                dataInicio = hoje;
                titulo = 'Relatório de Hoje';
                break;
            case 'semana':
                dataInicio = new Date(hoje.setDate(hoje.getDate() - hoje.getDay()));
                titulo = 'Relatório desta Semana';
                break;
            case 'quinzena':
                dataInicio = new Date(hoje.setDate(hoje.getDate() - 14));
                 titulo = 'Relatório da Última Quinzena';
                break;
            case 'mes':
                dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                titulo = 'Relatório deste Mês';
                break;
        }

        const relatorio = gerarRelatorioPorPeriodo(state, dataInicio, dataFim);
        abrirModalRelatorioPeriodo(relatorio, titulo);
    });

    viewNode.querySelector('#btn-mes-anterior')?.addEventListener('click', () => {
        dataAtualCalendario.setMonth(dataAtualCalendario.getMonth() - 1);
        renderCalendarGrid();
    });

    viewNode.querySelector('#btn-mes-seguinte')?.addEventListener('click', () => {
        dataAtualCalendario.setMonth(dataAtualCalendario.getMonth() + 1);
        renderCalendarGrid();
    });

    viewNode.querySelector('#calendario-grid-dias')?.addEventListener('click', (event) => {
        const diaEl = event.target.closest('[data-dia]');
        if (diaEl) {
            const dia = parseInt(diaEl.dataset.dia, 10);
            const state = store.getState();
            const dataProcurada = new Date(dataAtualCalendario.getFullYear(), dataAtualCalendario.getMonth(), dia);
            const relatorio = state.historicoFechos.find(rel => new Date(rel.data).toDateString() === dataProcurada.toDateString());
            if (relatorio) {
                abrirModalFechoGlobal(relatorio, true);
            }
        }
    });
    
    viewNode.querySelector('#btn-ver-fecho-dia-atual')?.addEventListener('click', () => {
        const relatorioDoDia = calcularRelatorioDia(store.getState());
        abrirModalFechoGlobal(relatorioDoDia, false);
    });
}

/**
 * Remove os listeners e anula a inscrição no store.
 */
function unmount() {
    if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
    }
    viewNode = null;
}

export default {
    render,
    mount,
    unmount
};