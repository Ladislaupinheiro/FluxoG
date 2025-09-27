// main.js - O Ponto de Entrada e Orquestrador da Aplicação (v6.1 - Integração com State/DB)
'use strict';

import { estado, carregarEstadoInicial, dataAtualCalendario } from './state.js';
import * as ui from './ui.js';
import * as modals from './modals.js';
import * as handlers from './handlers.js';
import * as sel from './selectors.js';

/**
 * Função de debounce para limitar a frequência de execução de uma função.
 * @param {Function} func - A função a ser executada.
 * @param {number} delay - O tempo de espera em milissegundos.
 * @returns {Function}
 */
function debounce(func, delay = 300) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Função de arranque principal da aplicação, agora simplificada.
 */
async function inicializarApp() {
    try {
        // A lógica de verificação de licença e PIN foi removida.
        // A aplicação agora carrega o estado e inicia diretamente.
        await carregarEstadoInicial(); 

        // Mostra a interface principal da aplicação
        sel.appContainer.classList.remove('hidden');
        sel.bottomNav.classList.remove('hidden');
        
        // Decide qual a melhor aba para mostrar no arranque
        if (estado.inventario.length === 0) {
            ui.navigateToTab('tab-inventario');
        } else {
            const contasAtivas = estado.contasAtivas.filter(c => c.status === 'ativa');
            if (contasAtivas.length > 0) {
                 ui.navigateToTab('tab-atendimento');
            } else {
                 ui.navigateToTab('tab-dashboard');
            }
        }
        ui.atualizarTodaUI();

    } catch (error) {
        console.error("Erro crítico durante a inicialização:", error);
        document.body.innerHTML = `<div class="fixed inset-0 bg-red-800 text-white flex flex-col justify-center items-center p-4 text-center"><h1 class="text-2xl font-bold mb-4">Erro Crítico</h1><p>A aplicação não conseguiu arrancar. Por favor, limpe os dados de navegação e tente novamente.</p></div>`;
    }
}

/**
 * Regista todos os event listeners da aplicação.
 */
function configurarEventListeners() {
    // Navegação Principal
    sel.bottomNav.addEventListener('click', (event) => {
        const target = event.target.closest('.nav-btn');
        if (target) ui.navigateToTab(target.dataset.tab);
    });

    // Aba Atendimento
    sel.seletorCliente.addEventListener('change', () => ui.renderizarVistaClienteAtivo());
    sel.vistaClienteAtivo.addEventListener('click', (event) => {
        const target = event.target.closest('button');
        if (!target) return;
        const idConta = parseInt(target.dataset.id);
        if (target.classList.contains('btn-adicionar-pedido')) modals.abrirModalAddPedido(idConta);
        if (target.classList.contains('btn-finalizar-pagamento')) modals.abrirModalPagamento(idConta);
        if (target.classList.contains('btn-editar-nome')) modals.abrirModalEditNome(idConta);
        if (target.classList.contains('btn-remover-item')) {
            const itemIndex = parseInt(target.dataset.index);
            handlers.handleRemoverItem(idConta, itemIndex);
        }
    });
    sel.btnAbrirConta.addEventListener('click', modals.abrirModalNovaConta);

    // Aba Inventário
    sel.btnAddProduto.addEventListener('click', modals.abrirModalAddProduto);
    sel.inputBuscaInventario.addEventListener('input', debounce(ui.renderizarInventario));
    sel.listaInventario.addEventListener('click', (event) => {
        const target = event.target.closest('button');
        if (!target) return;
        const produtoId = target.dataset.id;
        if (target.classList.contains('btn-editar-produto')) modals.abrirModalEditProduto(produtoId);
        if (target.classList.contains('btn-adicionar-armazem')) modals.abrirModalAddStock(produtoId);
        if (target.classList.contains('btn-mover-geleira')) modals.abrirModalMoverStock(produtoId);
    });

    // Aba Fecho / Relatórios
    sel.btnVerFechoDiaAtual.addEventListener('click', modals.abrirModalFechoGlobal);
    sel.btnMesAnterior.addEventListener('click', () => {
        dataAtualCalendario.setMonth(dataAtualCalendario.getMonth() - 1);
        ui.renderizarCalendario();
    });
    sel.btnMesSeguinte.addEventListener('click', () => {
        dataAtualCalendario.setMonth(dataAtualCalendario.getMonth() + 1);
        ui.renderizarCalendario();
    });
    sel.calendarioGridDias.addEventListener('click', (event) => {
        const diaEl = event.target.closest('[data-dia]');
        if (diaEl) {
            const dia = parseInt(diaEl.dataset.dia, 10);
            const dataProcurada = new Date(dataAtualCalendario.getFullYear(), dataAtualCalendario.getMonth(), dia);
            const relatorioIndex = estado.historicoFechos.findIndex(rel => new Date(rel.data).toDateString() === dataProcurada.toDateString());
            if (relatorioIndex !== -1) {
                modals.abrirModalFechoGlobalHistorico(relatorioIndex);
            }
        }
    });

    // Formulários e Modais
    sel.formNovaConta.addEventListener('submit', handlers.handleCriarNovaConta);
    sel.formAddPedido.addEventListener('submit', handlers.handleAddPedido);
    sel.inputBuscaProdutoPedido.addEventListener('input', () => ui.renderizarAutocomplete(sel.inputBuscaProdutoPedido.value));
    sel.autocompleteResults.addEventListener('click', (event) => {
        const target = event.target;
        if (target.dataset.id) {
            handlers.handleSelecaoAutocomplete(target.dataset.id, target.dataset.nome);
            sel.inputBuscaProdutoPedido.value = target.dataset.nome;
            sel.autocompleteResults.classList.add('hidden');
            sel.inputQuantidade.focus();
        }
    });
    sel.pagamentoMetodosContainer.addEventListener('click', (event) => {
        const target = event.target.closest('.pagamento-metodo-btn');
        if (!target) return;
        sel.pagamentoMetodosContainer.querySelectorAll('.pagamento-metodo-btn').forEach(btn => {
            btn.classList.remove('border-blue-500', 'bg-blue-100', 'font-bold');
            btn.classList.add('border-gray-300');
        });
        target.classList.add('border-blue-500', 'bg-blue-100', 'font-bold');
        sel.btnConfirmarPagamento.disabled = false;
        sel.btnConfirmarPagamento.classList.remove('bg-gray-400', 'cursor-not-allowed');
        sel.btnConfirmarPagamento.classList.add('bg-blue-500', 'hover:bg-blue-600');
    });
    sel.btnConfirmarPagamento.addEventListener('click', handlers.handleFinalizarPagamento);
    sel.formAddProduto.addEventListener('submit', handlers.handleAddProduto);
    sel.formEditProduto.addEventListener('submit', handlers.handleEditProduto);
    sel.formEditNome.addEventListener('submit', handlers.handleSalvarNovoNome);
    sel.formAddStock.addEventListener('submit', handlers.handleAddStock);
    sel.formMoverStock.addEventListener('submit', handlers.handleFormMoverStock);
    sel.btnArquivarDia.addEventListener('click', handlers.handleArquivarDia);
    sel.btnExportarPdf.addEventListener('click', handlers.handleExportarPdf);
    sel.btnExportarXls.addEventListener('click', handlers.handleExportarXls);
    sel.btnConfirmarConfirmacaoModal.addEventListener('click', () => {
        if (typeof modals.onConfirmCallback === 'function') {
            modals.onConfirmCallback();
        }
        modals.fecharModalConfirmacao();
    });

    // Gestão genérica de fecho de modais
    document.addEventListener('click', (event) => {
        const modal = event.target.closest('.modal-container-wrapper');
        if (event.target.matches('.modal-container-wrapper') || event.target.matches('.btn-cancelar-modal')) {
             if (modal) modal.classList.add('hidden');
        }
    });
    
     document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            document.querySelectorAll('.modal-container-wrapper:not(.hidden)').forEach(modal => {
                modal.classList.add('hidden');
            });
        }
    });
}


// Ponto de entrada da aplicação
document.addEventListener('DOMContentLoaded', () => {
    sel.inicializarSeletores();
    configurarEventListeners();
    inicializarApp();
});