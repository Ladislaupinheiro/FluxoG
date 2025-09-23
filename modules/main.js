// main.js - O Ponto de Entrada e Orquestrador da Aplicação (v2.7 com Recuperação Segura)
'use strict';

import { carregarEstado, estado } from './state.js';
import * as ui from './ui.js';
import * as modals from './modals.js';
import * as handlers from './handlers.js';
import * as sel from './selectors.js';
import * as security from './security.js';

/**
 * Mostra uma mensagem de erro final e acionável quando a recuperação automática entra em loop.
 */
function handleRecoveryFailure() {
    console.error("A recuperação automática entrou em loop. A exibir mensagem de erro final.");
    sessionStorage.removeItem('recoveryInProgress'); // Limpa a flag para permitir futuras tentativas após a correção manual.
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
 * Tenta recuperar a aplicação de um estado de cache inconsistente.
 * Desregista o service worker, limpa a cache e recarrega a página.
 */
async function attemptRecovery() {
    console.warn("Inconsistência de cache detetada. A iniciar recuperação automática...");
    try {
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
                await registration.unregister();
                console.log("Service Worker desregistado com sucesso.");
            }
        }

        const keys = await caches.keys();
        await Promise.all(keys.map(key => {
            if (key.startsWith('gestorbar-')) {
                console.log(`A limpar cache antiga: ${key}`);
                return caches.delete(key);
            }
            return Promise.resolve();
        }));

        console.log("Recuperação concluída. A recarregar a página...");
        window.location.reload();

    } catch (error) {
        console.error("A recuperação automática falhou:", error);
        handleRecoveryFailure(); // Se a própria recuperação falhar, mostra a mensagem de erro.
    }
}


/**
 * Função de inicialização da aplicação.
 * Orquestra o fluxo de verificação de segurança antes de mostrar a app principal.
 */
async function inicializarApp() {
    // PASSO 1: VERIFICAR SE ESTAMOS NUM LOOP DE RECUPERAÇÃO
    if (sessionStorage.getItem('recoveryInProgress') === 'true') {
        // Se a flag existe, a recuperação automática anterior falhou. Mostra o erro final.
        handleRecoveryFailure();
        return;
    }

    // PASSO 2: VERIFICAÇÃO DE INTEGRIDADE DA UI
    if (!sel.modalAtivacao || !sel.modalCriarSenha || !sel.modalInserirSenha) {
        // A UI está desatualizada. Define a flag e inicia a recuperação.
        sessionStorage.setItem('recoveryInProgress', 'true');
        await attemptRecovery();
        return; // Para a execução para aguardar o recarregamento.
    }
    
    // PASSO 3: ARRANQUE BEM-SUCEDIDO
    // Se chegámos aqui, a integridade está OK. Limpa a flag de recuperação.
    sessionStorage.removeItem('recoveryInProgress');

    // Orquestração de arranque normal
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

