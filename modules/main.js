// main.js - O Ponto de Entrada e Orquestrador da Aplicação (v2.5 Estável)
'use strict';

import { carregarEstado, estado } from './state.js';
import * as ui from './ui.js';
import * as modals from './modals.js';
import * as handlers from './handlers.js';
import * as sel from './selectors.js';
import * as security from './security.js';

/**
 * Função de inicialização da aplicação.
 * Orquestra o fluxo de verificação de segurança antes de mostrar a app principal.
 */
async function inicializarApp() {
    // CORREÇÃO: Verificação de integridade da UI para evitar erros de cache.
    // Se os modais de segurança não existirem no DOM, é porque a versão do HTML
    // está desatualizada. A função para para evitar o erro "TypeError".
    if (!sel.modalAtivacao || !sel.modalCriarSenha || !sel.modalInserirSenha) {
        console.error("Interface de segurança não encontrada. A versão do HTML em cache pode estar desatualizada. Um 'hard refresh' (Ctrl+Shift+R) pode ser necessário.");
        return; // Para a execução para prevenir o erro.
    }

    // Orquestração de arranque
    try {
        const licencaAtiva = await security.verificarLicencaAtiva();
        if (!licencaAtiva) {
            sel.modalAtivacao.classList.remove('hidden');
            return;
        }

        const senhaExiste = security.verificarSeSenhaExiste();
        if (!senhaExiste) {
            sel.modalCriarSenha.classList.remove('hidden');
            return;
        }

        sel.modalInserirSenha.classList.remove('hidden');
        sel.inputInserirPin.focus();
    } catch (error) {
        console.error("Ocorreu um erro durante a inicialização da segurança:", error);
        // Pode-se mostrar uma mensagem de erro ao utilizador aqui
    }
}

/**
 * Configura os listeners para detetar mudanças na conectividade (online/offline).
 */
function setupConnectivityListener() {
    const handleConnectionChange = () => {
        if (!sel.offlineIndicator) return;
        if (navigator.onLine) {
            sel.offlineIndicator.classList.remove('bg-red-600', 'visible');
            sel.offlineIndicator.classList.add('bg-green-600', 'visible');
            sel.offlineIndicator.textContent = 'De volta online!';
            setTimeout(() => {
                sel.offlineIndicator.classList.remove('visible');
            }, 3000);
        } else {
            sel.offlineIndicator.classList.remove('bg-green-600');
            sel.offlineIndicator.classList.add('bg-red-600', 'visible');
            sel.offlineIndicator.textContent = 'Sem ligação. A app está em modo offline.';
        }
    };
    window.addEventListener('online', handleConnectionChange);
    window.addEventListener('offline', handleConnectionChange);
    if (!navigator.onLine) handleConnectionChange();
}


// ===================================
// EVENT LISTENERS PRINCIPAIS
// ===================================
document.addEventListener('DOMContentLoaded', inicializarApp);

sel.bottomNav.addEventListener('click', (event) => {
    const target = event.target.closest('.nav-btn');
    if (target) ui.navigateToTab(target.dataset.tab);
});


// ===================================
// LISTENERS DA ABA ATENDIMENTO
// ===================================
sel.seletorCliente.addEventListener('change', () => ui.atualizarTodaUI());
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


// ===================================
// LISTENERS DA ABA INVENTÁRIO
// ===================================
sel.btnAddProduto.addEventListener('click', modals.abrirModalAddProduto);
sel.inputBuscaInventario.addEventListener('input', () => ui.renderizarInventario());
sel.listaInventario.addEventListener('click', (event) => {
    const target = event.target.closest('button');
    if (!target) return;
    const produtoId = target.dataset.id;
    if (target.classList.contains('btn-editar-produto')) modals.abrirModalEditProduto(produtoId);
    if (target.classList.contains('btn-adicionar-armazem')) modals.abrirModalAddStock(produtoId);
    if (target.classList.contains('btn-mover-geleira')) modals.abrirModalMoverStock(produtoId);
});

// ===================================
// LISTENERS DA ABA RELATÓRIOS
// ===================================
sel.btnVerFechoDiaAtual.addEventListener('click', modals.abrirModalFechoGlobal);
sel.btnMesAnterior.addEventListener('click', () => {
    const data = new Date(estado.dataAtualCalendario);
    data.setMonth(data.getMonth() - 1);
    handlers.handleMudarDataCalendario(data);
});
sel.btnMesSeguinte.addEventListener('click', () => {
    const data = new Date(estado.dataAtualCalendario);
    data.setMonth(data.getMonth() + 1);
    handlers.handleMudarDataCalendario(data);
});
sel.calendarioGridDias.addEventListener('click', (event) => {
    const target = event.target.closest('[data-dia]');
    if (!target) return;
    const dia = parseInt(target.dataset.dia);
    const ano = estado.dataAtualCalendario.getFullYear();
    const mes = estado.dataAtualCalendario.getMonth();
    const dataClicadaStr = new Date(ano, mes, dia).toDateString();
    const relatorioIndex = (estado.historicoFechos || []).findIndex(rel => new Date(rel.data).toDateString() === dataClicadaStr);
    if (relatorioIndex !== -1) {
        modals.abrirModalFechoGlobalHistorico(relatorioIndex);
    }
});


// ===================================
// LISTENERS DOS MODAIS E FORMULÁRIOS
// ===================================

// --- Modais de Segurança ---
if(sel.formAtivacao) sel.formAtivacao.addEventListener('submit', handlers.handleAtivacao);
if(sel.formCriarSenha) sel.formCriarSenha.addEventListener('submit', handlers.handleCriarSenha);
if(sel.formInserirSenha) sel.formInserirSenha.addEventListener('submit', handlers.handleVerificarSenha);
if(sel.btnEsqueciSenha) sel.btnEsqueciSenha.addEventListener('click', handlers.handleEsqueciSenha);


// --- Outros Modais ---
sel.formNovaConta.addEventListener('submit', handlers.handleCriarNovaConta);
sel.btnCancelarModal.addEventListener('click', modals.fecharModalNovaConta);
sel.modalOverlay.addEventListener('click', (event) => { if (event.target === sel.modalOverlay) modals.fecharModalNovaConta(); });

sel.formAddPedido.addEventListener('submit', handlers.handleAddPedido);
sel.btnCancelarPedidoModal.addEventListener('click', modals.fecharModalAddPedido);
sel.modalAddPedidoOverlay.addEventListener('click', (event) => { if (event.target === sel.modalAddPedidoOverlay) modals.fecharModalAddPedido(); });
sel.inputBuscaProdutoPedido.addEventListener('input', () => ui.renderizarAutocomplete(sel.inputBuscaProdutoPedido.value));
sel.autocompleteResults.addEventListener('click', (event) => {
    const target = event.target.closest('[data-id]');
    if (target) {
        handlers.handleSelecaoAutocomplete(target.dataset.id, target.dataset.nome);
        sel.inputBuscaProdutoPedido.value = target.dataset.nome;
        sel.autocompleteResults.classList.add('hidden');
    }
});

sel.pagamentoMetodosContainer.addEventListener('click', (event) => {
    const target = event.target.closest('.pagamento-metodo-btn');
    if (!target) return;
    sel.pagamentoMetodosContainer.querySelectorAll('.pagamento-metodo-btn').forEach(btn => btn.classList.remove('border-blue-500', 'bg-blue-100', 'font-bold'));
    target.classList.add('border-blue-500', 'bg-blue-100', 'font-bold');
    sel.btnConfirmarPagamento.disabled = false;
    sel.btnConfirmarPagamento.classList.remove('bg-gray-400', 'cursor-not-allowed');
});
sel.btnConfirmarPagamento.addEventListener('click', handlers.handleFinalizarPagamento);
sel.btnCancelarPagamentoModal.addEventListener('click', modals.fecharModalPagamento);
sel.modalPagamentoOverlay.addEventListener('click', (event) => { if (event.target === sel.modalPagamentoOverlay) modals.fecharModalPagamento(); });

sel.formAddProduto.addEventListener('submit', handlers.handleAddProduto);
sel.btnCancelarAddProdutoModal.addEventListener('click', modals.fecharModalAddProduto);
sel.modalAddProdutoOverlay.addEventListener('click', (event) => { if (event.target === sel.modalAddProdutoOverlay) modals.fecharModalAddProduto(); });

sel.formEditProduto.addEventListener('submit', handlers.handleEditProduto);
sel.btnCancelarEditProdutoModal.addEventListener('click', modals.fecharModalEditProduto);
sel.modalEditProdutoOverlay.addEventListener('click', (event) => { if (event.target === sel.modalEditProdutoOverlay) modals.fecharModalEditProduto(); });

sel.formEditNome.addEventListener('submit', handlers.handleSalvarNovoNome);
sel.btnCancelarEditNomeModal.addEventListener('click', modals.fecharModalEditNome);
sel.modalEditNomeOverlay.addEventListener('click', (event) => { if (event.target === sel.modalEditNomeOverlay) modals.fecharModalEditNome(); });

sel.formAddStock.addEventListener('submit', handlers.handleAddStock);
sel.btnCancelarAddStockModal.addEventListener('click', modals.fecharModalAddStock);
sel.modalAddStockOverlay.addEventListener('click', (event) => { if (event.target === sel.modalAddStockOverlay) modals.fecharModalAddStock(); });

sel.formMoverStock.addEventListener('submit', handlers.handleFormMoverStock);
sel.btnCancelarMoverStockModal.addEventListener('click', modals.fecharModalMoverStock);
sel.modalMoverStockOverlay.addEventListener('click', (event) => { if (event.target === sel.modalMoverStockOverlay) modals.fecharModalMoverStock(); });

sel.btnArquivarDia.addEventListener('click', handlers.handleArquivarDia);
sel.btnCancelarFechoGlobalModal.addEventListener('click', modals.fecharModalFechoGlobal);
sel.btnExportarPdf.addEventListener('click', handlers.handleExportarPdf);
sel.btnExportarXls.addEventListener('click', handlers.handleExportarXls);

sel.btnCancelarConfirmacaoModal.addEventListener('click', modals.fecharModalConfirmacao);
sel.btnConfirmarConfirmacaoModal.addEventListener('click', () => {
    if (typeof modals.onConfirmCallback === 'function') {
        modals.onConfirmCallback();
    }
    modals.fecharModalConfirmacao();
});

setupConnectivityListener();

