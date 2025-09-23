// main.js - O Ponto de Entrada e Orquestrador da Aplicação
'use strict';

// Importa as funções de cada módulo
import { carregarEstado, estado, produtoSelecionadoParaPedido, dataAtualCalendario, setProdutoSelecionado } from './state.js';
import { navigateToTab, renderizarInventario, renderizarAutocomplete, atualizarTodaUI } from './ui.js';
import * as modals from './modals.js';
import * as handlers from './handlers.js';
import * as sel from './selectors.js';


// Função de inicialização da aplicação
function inicializarApp() {
    carregarEstado();
    
    if (estado.inventario.length === 0) {
        navigateToTab('tab-inventario');
    } else {
        navigateToTab('tab-atendimento');
    }
    
    atualizarTodaUI();
}

// ===================================
// EVENT LISTENERS
// ===================================
document.addEventListener('DOMContentLoaded', inicializarApp);

// Navegação Principal
sel.bottomNav.addEventListener('click', (event) => {
    const target = event.target.closest('.nav-btn');
    if (target) navigateToTab(target.dataset.tab);
});

// Aba Atendimento
sel.seletorCliente.addEventListener('change', () => atualizarTodaUI());
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
sel.inputBuscaInventario.addEventListener('input', renderizarInventario);
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
    atualizarTodaUI();
});
sel.btnMesSeguinte.addEventListener('click', () => {
    dataAtualCalendario.setMonth(dataAtualCalendario.getMonth() + 1);
    atualizarTodaUI();
});
sel.calendarioGridDias.addEventListener('click', (event) => {
    const target = event.target.closest('[data-dia]');
    if (!target) return;
    const dia = parseInt(target.dataset.dia);
    const ano = dataAtualCalendario.getFullYear();
    const mes = dataAtualCalendario.getMonth();
    const dataClicadaStr = new Date(ano, mes, dia).toDateString();
    const relatorioIndex = estado.historicoFechos.findIndex(rel => new Date(rel.data).toDateString() === dataClicadaStr);
    if (relatorioIndex !== -1) {
        modals.abrirModalFechoGlobalHistorico(relatorioIndex);
    }
});

// Gestão de Modais e Formulários
// Modal Nova Conta
sel.formNovaConta.addEventListener('submit', handlers.handleCriarNovaConta);
sel.btnCancelarModal.addEventListener('click', modals.fecharModalNovaConta);
sel.modalOverlay.addEventListener('click', (event) => { if (event.target === sel.modalOverlay) modals.fecharModalNovaConta(); });

// Modal Adicionar Pedido
sel.formAddPedido.addEventListener('submit', handlers.handleAddPedido);
sel.btnCancelarPedidoModal.addEventListener('click', modals.fecharModalAddPedido);
sel.modalAddPedidoOverlay.addEventListener('click', (event) => { if (event.target === sel.modalAddPedidoOverlay) modals.fecharModalAddPedido(); });
sel.inputBuscaProdutoPedido.addEventListener('input', () => renderizarAutocomplete(sel.inputBuscaProdutoPedido.value));
sel.autocompleteResults.addEventListener('click', (event) => {
    const target = event.target;
    if (target.dataset.id) {
        setProdutoSelecionado({ id: target.dataset.id, nome: target.dataset.nome });
        sel.inputBuscaProdutoPedido.value = target.dataset.nome;
        sel.autocompleteResults.classList.add('hidden');
    }
});

// Modal Pagamento
sel.pagamentoMetodosContainer.addEventListener('click', (event) => {
    const target = event.target.closest('.pagamento-metodo-btn');
    if (!target) return;
    sel.pagamentoMetodosContainer.querySelectorAll('.pagamento-metodo-btn').forEach(btn => {
        btn.classList.remove('border-blue-500', 'bg-blue-100', 'font-bold');
        btn.classList.add('border-gray-300');
    });
    target.classList.add('border-blue-500', 'bg-blue-100', 'font-bold');
    target.classList.remove('border-gray-300');
    sel.btnConfirmarPagamento.disabled = false;
    sel.btnConfirmarPagamento.classList.remove('bg-gray-400', 'cursor-not-allowed');
    sel.btnConfirmarPagamento.classList.add('bg-blue-500', 'hover:bg-blue-600');
});
sel.btnConfirmarPagamento.addEventListener('click', handlers.handleFinalizarPagamento);
sel.btnCancelarPagamentoModal.addEventListener('click', modals.fecharModalPagamento);
sel.modalPagamentoOverlay.addEventListener('click', (event) => { if (event.target === sel.modalPagamentoOverlay) modals.fecharModalPagamento(); });

// Modal Adicionar Produto
sel.formAddProduto.addEventListener('submit', handlers.handleAddProduto);
sel.btnCancelarAddProdutoModal.addEventListener('click', modals.fecharModalAddProduto);
sel.modalAddProdutoOverlay.addEventListener('click', (event) => { if (event.target === sel.modalAddProdutoOverlay) modals.fecharModalAddProduto(); });

// Modal Editar Produto
sel.formEditProduto.addEventListener('submit', handlers.handleEditProduto);
sel.btnCancelarEditProdutoModal.addEventListener('click', modals.fecharModalEditProduto);
sel.modalEditProdutoOverlay.addEventListener('click', (event) => { if (event.target === sel.modalEditProdutoOverlay) modals.fecharModalEditProduto(); });

// Modal Editar Nome
sel.formEditNome.addEventListener('submit', handlers.handleSalvarNovoNome);
sel.btnCancelarEditNomeModal.addEventListener('click', modals.fecharModalEditNome);
sel.modalEditNomeOverlay.addEventListener('click', (event) => { if (event.target === sel.modalEditNomeOverlay) modals.fecharModalEditNome(); });

// Modal Adicionar Stock
sel.formAddStock.addEventListener('submit', handlers.handleAddStock);
sel.btnCancelarAddStockModal.addEventListener('click', modals.fecharModalAddStock);
sel.modalAddStockOverlay.addEventListener('click', (event) => { if (event.target === sel.modalAddStockOverlay) modals.fecharModalAddStock(); });

// Modal Mover Stock
sel.formMoverStock.addEventListener('submit', handlers.handleFormMoverStock);
sel.btnCancelarMoverStockModal.addEventListener('click', modals.fecharModalMoverStock);
sel.modalMoverStockOverlay.addEventListener('click', (event) => { if (event.target === sel.modalMoverStockOverlay) modals.fecharModalMoverStock(); });

// Modal Fecho Global
sel.btnArquivarDia.addEventListener('click', handlers.handleArquivarDia);
sel.btnCancelarFechoGlobalModal.addEventListener('click', modals.fecharModalFechoGlobal);
sel.btnExportarPdf.addEventListener('click', handlers.handleExportarPdf);
sel.btnExportarXls.addEventListener('click', handlers.handleExportarXls);

// Modal Confirmação
sel.btnCancelarConfirmacaoModal.addEventListener('click', modals.fecharModalConfirmacao);
sel.btnConfirmarConfirmacaoModal.addEventListener('click', () => {
    if (typeof modals.onConfirmCallback === 'function') {
        modals.onConfirmCallback();
    }
    modals.fecharModalConfirmacao();
});