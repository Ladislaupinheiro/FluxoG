// main.js - O Ponto de Entrada e Orquestrador da Aplicação (v4.0)
'use strict';

import { carregarEstado, estado, dataAtualCalendario, setProdutoSelecionado } from './state.js';
import * as ui from './ui.js';
import * as modals from './modals.js';
import * as handlers from './handlers.js';
import * as sel from './selectors.js';
import * as security from './security.js';

// ===================================
// FUNÇÕES AUXILIARES
// ===================================

function debounce(func, delay = 250) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

// ===================================
// LÓGICA DE INICIALIZAÇÃO
// ===================================

/**
 * Função de arranque principal da aplicação.
 * É chamada apenas quando o DOM está completamente carregado.
 */
async function inicializarApp() {
    try {
        // Verificação de integridade: Garante que os elementos de segurança existem no HTML.
        if (!document.getElementById('security-container')) {
            // Este erro só deve acontecer em caso de falha grave do Service Worker.
            // A nova arquitetura do SW torna isto extremamente improvável.
            console.error("Erro Crítico: A estrutura HTML de segurança não foi encontrada.");
            document.body.innerHTML = `
                <div class="fixed inset-0 bg-red-800 text-white flex flex-col justify-center items-center p-4 text-center">
                    <h1 class="text-2xl font-bold mb-4">Erro Crítico de Cache</h1>
                    <p class="mb-4">A aplicação não conseguiu carregar a sua interface. Por favor, limpe os dados de navegação para este site nas configurações do seu browser e tente novamente.</p>
                </div>
            `;
            return;
        }

        const licencaAtiva = await security.verificarLicencaAtiva();
        if (!licencaAtiva) {
            sel.modalAtivacao.classList.remove('hidden');
            sel.inputChaveLicenca.focus();
            return;
        }

        const senhaExiste = security.verificarSeSenhaExiste();
        if (!senhaExiste) {
            sel.modalCriarSenha.classList.remove('hidden');
            sel.inputCriarPin.focus();
            return;
        }

        sel.modalInserirSenha.classList.remove('hidden');
        sel.inputInserirPin.focus();

    } catch (error) {
        console.error("Erro crítico durante a inicialização:", error);
        document.body.innerHTML = `
            <div class="fixed inset-0 bg-gray-800 text-white flex flex-col justify-center items-center p-4">
                <h1 class="text-2xl font-bold mb-4">Erro Crítico</h1>
                <p class="text-center mb-4">A aplicação não conseguiu arrancar devido a um erro inesperado.</p>
                <p class="text-sm text-gray-400">Por favor, tente limpar a cache do seu browser para esta página.</p>
            </div>
        `;
    }
}

// ===================================
// EVENT LISTENERS
// ===================================

// Garante que o JavaScript só é executado após o HTML estar completamente pronto.
// Esta é a correção central para o bug da tela branca.
document.addEventListener('DOMContentLoaded', () => {
    
    inicializarApp();

    // --- Listeners da Aplicação ---
    
    sel.bottomNav.addEventListener('click', (event) => {
        const target = event.target.closest('.nav-btn');
        if (target) ui.navigateToTab(target.dataset.tab);
    });

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
    sel.inputBuscaInventario.addEventListener('input', debounce(ui.renderizarInventario, 300));
    
    sel.listaInventario.addEventListener('click', (event) => {
        const target = event.target.closest('button');
        if (!target) return;
        const produtoId = target.dataset.id;
        if (target.classList.contains('btn-editar-produto')) modals.abrirModalEditProduto(produtoId);
        if (target.classList.contains('btn-adicionar-armazem')) modals.abrirModalAddStock(produtoId);
        if (target.classList.contains('btn-mover-geleira')) modals.abrirModalMoverStock(produtoId);
    });

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
        const target = event.target.closest('[data-dia]');
        if (!target) return;
        const dia = parseInt(target.dataset.dia);
        const ano = dataAtualCalendario.getFullYear();
        const mes = dataAtualCalendario.getMonth();
        const dataClicadaStr = new Date(ano, mes, dia).toDateString();
        const relatorio = estado.historicoFechos.find(rel => new Date(rel.data).toDateString() === dataClicadaStr);
        if (relatorio) {
            modals.abrirModalFechoGlobalHistorico(relatorio);
        }
    });

    // --- Listeners de Segurança ---
    sel.formAtivacao.addEventListener('submit', handlers.handleAtivacao);
    sel.formCriarSenha.addEventListener('submit', handlers.handleCriarSenha);
    sel.formInserirSenha.addEventListener('submit', handlers.handleVerificarSenha);
    sel.btnEsqueciSenha.addEventListener('click', handlers.handleEsqueciSenha);

    // --- Listeners de Formulários ---
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

    document.addEventListener('click', (event) => {
        if (event.target.matches('.modal-overlay')) {
            event.target.closest('.modal-container-wrapper').classList.add('hidden');
        }
        if (event.target.matches('.btn-cancelar-modal')) {
            event.target.closest('.modal-container-wrapper').classList.add('hidden');
        }
    });
});

