// main.js - O Ponto de Entrada e Orquestrador da Aplicação (v3.0 Refatorado)
'use strict';

import { carregarEstado, estado } from './state.js';
import * as ui from './ui.js';
import * as modals from './modals.js';
import * as handlers from './handlers.js';
import * as sel from './selectors.js';
import * as security from './security.js';

/**
 * Mostra uma mensagem de erro final e acionável quando a aplicação não consegue carregar
 * devido a uma inconsistência de cache.
 */
function handleCriticalCacheError() {
    console.error("Erro Crítico: Inconsistência de cache detetada. A aplicação não pode arrancar.");
    // Limpa qualquer flag de recuperação para evitar estados de erro persistentes.
    sessionStorage.removeItem('recoveryInProgress');
    
    document.body.innerHTML = `
        <div style="padding: 20px; text-align: center; font-family: sans-serif; background-color: #fff1f2; color: #b91c1c; border: 1px solid #fecaca; margin: 20px auto; border-radius: 8px; max-width: 600px;">
            <h1 style="font-size: 1.5em; margin-bottom: 10px;">Erro Crítico na Aplicação</h1>
            <p>Não foi possível carregar a versão mais recente da aplicação devido a um problema de cache persistente.</p>
            <p style="margin-top: 15px;"><strong>Por favor, siga estes passos para resolver:</strong></p>
            <ol style="text-align: left; display: inline-block; margin-top: 10px; padding-left: 20px;">
                <li style="margin-bottom: 5px;">1. Abra as configurações do seu browser.</li>
                <li style="margin-bottom: 5px;">2. Vá para "Privacidade e Segurança".</li>
                <li>3. Encontre "Limpar dados de navegação" e limpe os "Dados do site" ou "Cookies e outros dados do site".</li>
            </ol>
            <p style="margin-top: 15px;">Após limpar os dados, recarregue a página.</p>
        </div>`;
}


/**
 * Função de inicialização da aplicação.
 * Orquestra o fluxo de verificação de segurança antes de mostrar a app principal.
 */
async function inicializarApp() {
    // PASSO 1: VERIFICAÇÃO DE INTEGRIDADE DA UI
    // Se os elementos essenciais da segurança não estão no DOM, é uma falha crítica de cache.
    if (!sel.modalAtivacao || !sel.modalCriarSenha || !sel.modalInserirSenha) {
        handleCriticalCacheError();
        return; // Para a execução completamente para evitar loops.
    }
    
    // PASSO 2: ORQUESTRAÇÃO DE ARRANQUE NORMAL (COM TRATAMENTO DE ERROS)
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
        if (sel.inputInserirPin) {
             sel.inputInserirPin.focus();
        }
    } catch (error) {
        console.error("Ocorreu um erro crítico durante a inicialização da segurança:", error);
        handleCriticalCacheError(); // Se a segurança falhar, mostra o ecrã de erro.
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

if (sel.bottomNav) {
    sel.bottomNav.addEventListener('click', (event) => {
        const target = event.target.closest('.nav-btn');
        if (target) ui.navigateToTab(target.dataset.tab);
    });
}

// ===================================
// LISTENERS DE INTERFACE (só são adicionados se os elementos existirem)
// ===================================

// --- Modais de Segurança ---
if(sel.formAtivacao) sel.formAtivacao.addEventListener('submit', handlers.handleAtivacao);
if(sel.formCriarSenha) sel.formCriarSenha.addEventListener('submit', handlers.handleCriarSenha);
if(sel.formInserirSenha) sel.formInserirSenha.addEventListener('submit', handlers.handleVerificarSenha);
if(sel.btnEsqueciSenha) sel.btnEsqueciSenha.addEventListener('click', handlers.handleEsqueciSenha);

// --- Outros Modais ---
if (sel.formNovaConta) sel.formNovaConta.addEventListener('submit', handlers.handleCriarNovaConta);
if (sel.btnCancelarModal) sel.btnCancelarModal.addEventListener('click', modals.fecharModalNovaConta);
if (sel.modalOverlay) sel.modalOverlay.addEventListener('click', (event) => { if (event.target === sel.modalOverlay) modals.fecharModalNovaConta(); });

if (sel.formAddPedido) sel.formAddPedido.addEventListener('submit', handlers.handleAddPedido);
if (sel.btnCancelarPedidoModal) sel.btnCancelarPedidoModal.addEventListener('click', modals.fecharModalAddPedido);
if (sel.modalAddPedidoOverlay) sel.modalAddPedidoOverlay.addEventListener('click', (event) => { if (event.target === sel.modalAddPedidoOverlay) modals.fecharModalAddPedido(); });
if (sel.inputBuscaProdutoPedido) sel.inputBuscaProdutoPedido.addEventListener('input', () => ui.renderizarAutocomplete(sel.inputBuscaProdutoPedido.value));
if (sel.autocompleteResults) sel.autocompleteResults.addEventListener('click', (event) => {
    const target = event.target.closest('[data-id]');
    if (target) {
        handlers.handleSelecaoAutocomplete(target.dataset.id, target.dataset.nome);
        sel.inputBuscaProdutoPedido.value = target.dataset.nome;
        sel.autocompleteResults.classList.add('hidden');
    }
});

if (sel.pagamentoMetodosContainer) sel.pagamentoMetodosContainer.addEventListener('click', (event) => {
    const target = event.target.closest('.pagamento-metodo-btn');
    if (!target) return;
    sel.pagamentoMetodosContainer.querySelectorAll('.pagamento-metodo-btn').forEach(btn => btn.classList.remove('border-blue-500', 'bg-blue-100', 'font-bold'));
    target.classList.add('border-blue-500', 'bg-blue-100', 'font-bold');
    sel.btnConfirmarPagamento.disabled = false;
    sel.btnConfirmarPagamento.classList.remove('bg-gray-400', 'cursor-not-allowed');
});
if (sel.btnConfirmarPagamento) sel.btnConfirmarPagamento.addEventListener('click', handlers.handleFinalizarPagamento);
if (sel.btnCancelarPagamentoModal) sel.btnCancelarPagamentoModal.addEventListener('click', modals.fecharModalPagamento);
if (sel.modalPagamentoOverlay) sel.modalPagamentoOverlay.addEventListener('click', (event) => { if (event.target === sel.modalPagamentoOverlay) modals.fecharModalPagamento(); });

if (sel.formAddProduto) sel.formAddProduto.addEventListener('submit', handlers.handleAddProduto);
if (sel.btnCancelarAddProdutoModal) sel.btnCancelarAddProdutoModal.addEventListener('click', modals.fecharModalAddProduto);
if (sel.modalAddProdutoOverlay) sel.modalAddProdutoOverlay.addEventListener('click', (event) => { if (event.target === sel.modalAddProdutoOverlay) modals.fecharModalAddProduto(); });

if (sel.formEditProduto) sel.formEditProduto.addEventListener('submit', handlers.handleEditProduto);
if (sel.btnCancelarEditProdutoModal) sel.btnCancelarEditProdutoModal.addEventListener('click', modals.fecharModalEditProduto);
if (sel.modalEditProdutoOverlay) sel.modalEditProdutoOverlay.addEventListener('click', (event) => { if (event.target === sel.modalEditProdutoOverlay) modals.fecharModalEditProduto(); });

if (sel.formEditNome) sel.formEditNome.addEventListener('submit', handlers.handleSalvarNovoNome);
if (sel.btnCancelarEditNomeModal) sel.btnCancelarEditNomeModal.addEventListener('click', modals.fecharModalEditNome);
if (sel.modalEditNomeOverlay) sel.modalEditNomeOverlay.addEventListener('click', (event) => { if (event.target === sel.modalEditNomeOverlay) modals.fecharModalEditNome(); });

if (sel.formAddStock) sel.formAddStock.addEventListener('submit', handlers.handleAddStock);
if (sel.btnCancelarAddStockModal) sel.btnCancelarAddStockModal.addEventListener('click', modals.fecharModalAddStock);
if (sel.modalAddStockOverlay) sel.modalAddStockOverlay.addEventListener('click', (event) => { if (event.target === sel.modalAddStockOverlay) modals.fecharModalAddStock(); });

if (sel.formMoverStock) sel.formMoverStock.addEventListener('submit', handlers.handleFormMoverStock);
if (sel.btnCancelarMoverStockModal) sel.btnCancelarMoverStockModal.addEventListener('click', modals.fecharModalMoverStock);
if (sel.modalMoverStockOverlay) sel.modalMoverStockOverlay.addEventListener('click', (event) => { if (event.target === sel.modalMoverStockOverlay) modals.fecharModalMoverStock(); });

if (sel.btnArquivarDia) sel.btnArquivarDia.addEventListener('click', handlers.handleArquivarDia);
if (sel.btnCancelarFechoGlobalModal) sel.btnCancelarFechoGlobalModal.addEventListener('click', modals.fecharModalFechoGlobal);
if (sel.btnExportarPdf) sel.btnExportarPdf.addEventListener('click', handlers.handleExportarPdf);
if (sel.btnExportarXls) sel.btnExportarXls.addEventListener('click', handlers.handleExportarXls);

if (sel.btnCancelarConfirmacaoModal) sel.btnCancelarConfirmacaoModal.addEventListener('click', modals.fecharModalConfirmacao);
if (sel.btnConfirmarConfirmacaoModal) sel.btnConfirmarConfirmacaoModal.addEventListener('click', () => {
    if (typeof modals.onConfirmCallback === 'function') {
        modals.onConfirmCallback();
    }
    modals.fecharModalConfirmacao();
});

// A conectividade só é configurada se a UI principal for carregada.
if (sel.offlineIndicator) {
    setupConnectivityListener();
}

