// /modules/views/FluxoCaixaView.js - A View Reativa do Fluxo de Caixa (v7.0 - Final)
'use strict';

import store from '../services/Store.js';
import * as Modals from '../components/Modals.js';
import * as Toast from '../components/Toast.js';

const sel = {};
// Estado local da View para controlar o mês/ano do calendário
let dataAtualCalendario = new Date();

function querySelectors() {
    sel.calendarioTitulo = document.getElementById('calendario-titulo');
    sel.calendarioGridDias = document.getElementById('calendario-grid-dias');
    sel.btnMesAnterior = document.getElementById('btn-mes-anterior');
    sel.btnMesSeguinte = document.getElementById('btn-mes-seguinte');
    sel.btnVerFechoDiaAtual = document.getElementById('btn-ver-fecho-dia-atual');
    sel.btnArquivarDia = document.getElementById('btn-arquivar-dia');
}

/**
 * Função principal de renderização para a View de Fluxo de Caixa.
 */
function render() {
    const state = store.getState();
    const ano = dataAtualCalendario.getFullYear();
    const mes = dataAtualCalendario.getMonth();

    sel.calendarioTitulo.textContent = new Date(ano, mes).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase());
    sel.calendarioGridDias.innerHTML = '';

    const primeiroDiaDoMes = (new Date(ano, mes, 1).getDay() + 6) % 7;
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();
    
    // Lê os dados do store para saber que dias destacar
    const diasComRelatorio = new Set(
        (state.historicoFechos || []).map(relatorio => {
            const dataRelatorio = new Date(relatorio.data);
            return dataRelatorio.getFullYear() === ano && dataRelatorio.getMonth() === mes ? dataRelatorio.getDate() : null;
        }).filter(Boolean)
    );

    for (let i = 0; i < primeiroDiaDoMes; i++) {
        sel.calendarioGridDias.appendChild(document.createElement('div'));
    }

    for (let dia = 1; dia <= diasNoMes; dia++) {
        const temRelatorio = diasComRelatorio.has(dia);
        const diaEl = document.createElement('div');
        diaEl.textContent = dia;
        diaEl.className = 'p-2 text-center rounded-full';
        
        if (temRelatorio) {
            diaEl.classList.add('bg-blue-500', 'text-white', 'font-bold', 'cursor-pointer', 'hover:bg-blue-600');
            diaEl.dataset.dia = dia;
        } else {
            diaEl.classList.add('text-gray-400');
        }
        sel.calendarioGridDias.appendChild(diaEl);
    }
}

/**
 * Handler para arquivar o dia, que agora despacha uma ação para o store.
 */
function handleArquivarDia() {
    const state = store.getState();
    const hojeStr = new Date().toDateString();
    
    if (state.historicoFechos.some(rel => new Date(rel.data).toDateString() === hojeStr)) {
        Toast.mostrarNotificacao("O dia de hoje já foi fechado e arquivado.", "erro");
        return;
    }
    if (state.contasAtivas.filter(c => c.status === 'fechada').length === 0) {
        Toast.mostrarNotificacao("Não existem vendas fechadas para arquivar.", "erro");
        return;
    }
    
    Modals.abrirModalConfirmacao(
        'Arquivar o Dia?',
        'Todas as contas fechadas serão arquivadas e o dia será reiniciado. Esta ação não pode ser desfeita.',
        () => {
            // A função de cálculo do relatório está agora em Modals.js, mas poderia ser um utilitário.
            const relatorio = Modals.calcularRelatorioDia(); 
            relatorio.data = new Date().toISOString();
            
            store.dispatch({ type: 'ARCHIVE_DAY', payload: { relatorio } });

            Modals.fecharModalFechoGlobal();
            Toast.mostrarNotificacao("Dia arquivado com sucesso!");
        }
    );
}


/**
 * Função de inicialização da View.
 */
function init() {
    querySelectors();
    store.subscribe(render);

    sel.btnMesAnterior.addEventListener('click', () => {
        dataAtualCalendario.setMonth(dataAtualCalendario.getMonth() - 1);
        render(); // Re-renderiza o calendário para o novo mês
    });

    sel.btnMesSeguinte.addEventListener('click', () => {
        dataAtualCalendario.setMonth(dataAtualCalendario.getMonth() + 1);
        render();
    });

    sel.calendarioGridDias.addEventListener('click', (event) => {
        const diaEl = event.target.closest('[data-dia]');
        if (diaEl) {
            const dia = parseInt(diaEl.dataset.dia, 10);
            const state = store.getState();
            const dataProcurada = new Date(dataAtualCalendario.getFullYear(), dataAtualCalendario.getMonth(), dia);
            const relatorio = state.historicoFechos.find(rel => new Date(rel.data).toDateString() === dataProcurada.toDateString());
            if (relatorio) {
                Modals.abrirModalFechoGlobalHistorico(relatorio);
            }
        }
    });
    
    sel.btnVerFechoDiaAtual.addEventListener('click', Modals.abrirModalFechoGlobal);
    sel.btnArquivarDia.addEventListener('click', handleArquivarDia);
    
    render();
}

export default { init };