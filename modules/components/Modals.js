// /modules/components/Modals.js - Componente para Gestão de Modais (v7.4 - Gestão de Dívidas)
'use strict';

import store from '../services/Store.js';
import * as Toast from './Toast.js';
import { exportarRelatorioPDF, exportarRelatorioXLS } from '../services/utils.js';

const sel = {};
let onConfirmCallback = null;
let relatorioAtual = null; // Guarda os dados do relatório visível no modal

function querySelectors() {
    // Modal Nova Conta
    sel.modalNovaContaOverlay = document.getElementById('modal-nova-conta-overlay');
    sel.formNovaConta = document.getElementById('form-nova-conta');
    sel.inputNomeConta = document.getElementById('input-nome-conta');

    // Modal Adicionar Pedido
    sel.modalAddPedidoOverlay = document.getElementById('modal-add-pedido-overlay');
    sel.formAddPedido = document.getElementById('form-add-pedido');
    sel.modalPedidoNomeConta = document.getElementById('modal-pedido-nome-conta');
    sel.hiddenContaId = document.getElementById('hidden-conta-id');
    sel.inputBuscaProdutoPedido = document.getElementById('input-busca-produto-pedido');
    sel.autocompleteResults = document.getElementById('autocomplete-results');

    // Modal Pagamento
    sel.modalPagamentoOverlay = document.getElementById('modal-pagamento-overlay');
    sel.pagamentoContaIdInput = document.getElementById('pagamento-conta-id');
    sel.pagamentoNomeContaSpan = document.getElementById('pagamento-nome-conta');
    sel.pagamentoTotalSpan = document.getElementById('pagamento-total');
    sel.pagamentoMetodosContainer = document.getElementById('pagamento-metodos-container');
    sel.btnConfirmarPagamento = document.getElementById('btn-confirmar-pagamento');

    // Modal Adicionar/Editar Produto
    sel.modalAddProdutoOverlay = document.getElementById('modal-add-produto-overlay');
    sel.formAddProduto = document.getElementById('form-add-produto');
    sel.inputProdutoNome = document.getElementById('input-produto-nome');
    sel.modalEditProdutoOverlay = document.getElementById('modal-edit-produto-overlay');
    sel.formEditProduto = document.getElementById('form-edit-produto');
    sel.hiddenEditProdutoId = document.getElementById('hidden-edit-produto-id');
    sel.inputEditProdutoNome = document.getElementById('input-edit-produto-nome');
    sel.inputEditProdutoPreco = document.getElementById('input-edit-produto-preco');
    sel.inputEditProdutoStockMinimo = document.getElementById('input-edit-produto-stock-minimo');

    // Modal Adicionar Cliente
    sel.modalAddClienteOverlay = document.getElementById('modal-add-cliente-overlay');
    sel.formAddCliente = document.getElementById('form-add-cliente');
    sel.inputClienteNome = document.getElementById('input-cliente-nome');

    // Modais de Stock
    sel.modalAddStockOverlay = document.getElementById('modal-add-stock-overlay');
    sel.formAddStock = document.getElementById('form-add-stock');
    sel.hiddenAddStockId = document.getElementById('hidden-add-stock-id');
    sel.addStockNomeProduto = document.getElementById('add-stock-nome-produto');
    sel.modalMoverStockOverlay = document.getElementById('modal-mover-stock-overlay');
    sel.formMoverStock = document.getElementById('form-mover-stock');
    sel.hiddenMoverStockId = document.getElementById('hidden-mover-stock-id');
    sel.moverStockNomeProduto = document.getElementById('mover-stock-nome-produto');
    sel.moverStockArmazemQtd = document.getElementById('mover-stock-armazem-qtd');
    sel.inputMoverStockQuantidade = document.getElementById('input-mover-stock-quantidade');
    
    // Modal Fecho Global
    sel.modalFechoGlobalOverlay = document.getElementById('modal-fecho-global-overlay');
    sel.fgDataRelatorio = document.getElementById('fg-data-relatorio');
    sel.fgTotalVendido = document.getElementById('fg-total-vendido');
    sel.fgTotalNumerario = document.getElementById('fg-total-numerario');
    sel.fgTotalTpa = document.getElementById('fg-total-tpa');
    sel.fgContasFechadas = document.getElementById('fg-contas-fechadas');
    sel.fgMediaPorConta = document.getElementById('fg-media-por-conta');
    sel.fgListaProdutos = document.getElementById('fg-lista-produtos');
    sel.btnArquivarDia = document.getElementById('btn-arquivar-dia');
    sel.btnExportarPdf = document.getElementById('btn-exportar-pdf');
    sel.btnExportarXls = document.getElementById('btn-exportar-xls');

    // Modal Confirmação
    sel.modalConfirmacaoOverlay = document.getElementById('modal-confirmacao-overlay');
    sel.modalConfirmacaoTitulo = document.getElementById('modal-confirmacao-titulo');
    sel.modalConfirmacaoMensagem = document.getElementById('modal-confirmacao-mensagem');
    sel.btnConfirmarConfirmacaoModal = document.getElementById('btn-confirmar-confirmacao-modal');

    // Modal de Backup e Restauro
    sel.modalBackupRestoreOverlay = document.getElementById('modal-backup-restore-overlay');

    // Modal Dica do Dia
    sel.modalDicaOverlay = document.getElementById('modal-dica-overlay');
    sel.dicaCategoria = document.getElementById('dica-categoria');
    sel.dicaTitulo = document.getElementById('dica-titulo');
    sel.dicaConteudo = document.getElementById('dica-conteudo');

    // MODAIS DE DÍVIDAS
    sel.modalAddDividaOverlay = document.getElementById('modal-add-divida-overlay');
    sel.formAddDivida = document.getElementById('form-add-divida');
    sel.modalDividaClienteNome = document.getElementById('modal-divida-cliente-nome');
    sel.inputDividaValor = document.getElementById('input-divida-valor');
    sel.inputDividaDescricao = document.getElementById('input-divida-descricao');
    
    sel.modalLiquidarDividaOverlay = document.getElementById('modal-liquidar-divida-overlay');
    sel.formLiquidarDivida = document.getElementById('form-liquidar-divida');
    sel.modalLiquidarClienteNome = document.getElementById('modal-liquidar-cliente-nome');
    sel.modalLiquidarDividaAtual = document.getElementById('modal-liquidar-divida-atual');
    sel.inputLiquidarValor = document.getElementById('input-liquidar-valor');
}

export function init() {
    querySelectors();

    // Listener para o botão de exportar PDF no modal de fecho global
    if (sel.btnExportarPdf) {
        sel.btnExportarPdf.addEventListener('click', () => {
            if (relatorioAtual) {
                const config = store.getState().config; // Obter config atual
                exportarRelatorioPDF(relatorioAtual, config);
            } else {
                Toast.mostrarNotificacao("Dados do relatório não encontrados.", "erro");
            }
        });
    }

    // Listener para o botão de exportar XLS no modal de fecho global
    if (sel.btnExportarXls) {
        sel.btnExportarXls.addEventListener('click', () => {
            if (relatorioAtual) {
                const config = store.getState().config; // Obter config atual
                exportarRelatorioXLS(relatorioAtual, config);
            } else {
                Toast.mostrarNotificacao("Dados do relatório não encontrados.", "erro");
            }
        });
    }

    // Listener de delegação de eventos para o MODAL DE PAGAMENTO (CORREÇÃO DO BUG)
    if (sel.modalPagamentoOverlay) {
        let metodoSelecionado = null;

        sel.modalPagamentoOverlay.addEventListener('click', (event) => {
            const metodoBtn = event.target.closest('.pagamento-metodo-btn');
            const confirmarBtn = event.target.closest('#btn-confirmar-pagamento');

            if (metodoBtn) {
                // Remove a seleção de outros botões
                sel.pagamentoMetodosContainer.querySelectorAll('.pagamento-metodo-btn').forEach(btn => {
                    btn.classList.remove('border-blue-500', 'bg-blue-100');
                });
                // Adiciona a seleção ao botão clicado
                metodoBtn.classList.add('border-blue-500', 'bg-blue-100');
                metodoSelecionado = metodoBtn.dataset.metodo;
                
                // Ativa o botão de confirmação
                sel.btnConfirmarPagamento.disabled = false;
                sel.btnConfirmarPagamento.classList.remove('bg-gray-400', 'cursor-not-allowed');
                sel.btnConfirmarPagamento.classList.add('bg-blue-500', 'hover:bg-blue-600');
            }

            if (confirmarBtn && !confirmarBtn.disabled) {
                const contaId = sel.pagamentoContaIdInput.value;
                if (contaId && metodoSelecionado) {
                    store.dispatch({
                        type: 'FINALIZE_PAYMENT',
                        payload: { contaId, metodoPagamento: metodoSelecionado }
                    });
                    Toast.mostrarNotificacao("Pagamento finalizado com sucesso!");
                    fecharModalPagamento();
                    metodoSelecionado = null; // Limpa a seleção
                }
            }
        });
    }

    if (sel.btnConfirmarConfirmacaoModal) {
        sel.btnConfirmarConfirmacaoModal.addEventListener('click', () => {
            if (typeof onConfirmCallback === 'function') {
                onConfirmarCallback();
            }
            fecharModalConfirmacao();
        });
    }
}

// --- Funções de Controlo de Modais ---
export function abrirModalNovaConta() {
    sel.modalNovaContaOverlay.classList.remove('hidden');
    sel.inputNomeConta.focus();
}
export function fecharModalNovaConta() {
    sel.modalNovaContaOverlay.classList.add('hidden');
    sel.formNovaConta.reset();
}

export function abrirModalAddPedido(contaId) {
    const state = store.getState();
    const conta = state.contasAtivas.find(c => c.id === contaId);
    if (!conta) return;
    sel.modalPedidoNomeConta.textContent = conta.nome;
    sel.hiddenContaId.value = contaId;
    sel.modalAddPedidoOverlay.classList.remove('hidden');
    sel.inputBuscaProdutoPedido.focus();
}

export function fecharModalAddPedido() {
    sel.modalAddPedidoOverlay.classList.add('hidden');
    sel.formAddPedido.reset();
}

export function abrirModalPagamento(conta) {
    if (!conta) return;
    const subtotal = conta.pedidos.reduce((total, p) => total + (p.preco * p.qtd), 0);
    sel.pagamentoContaIdInput.value = conta.id;
    sel.pagamentoNomeContaSpan.textContent = conta.nome;
    sel.pagamentoTotalSpan.textContent = subtotal.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    sel.modalPagamentoOverlay.classList.remove('hidden');
}

export function fecharModalPagamento() {
    sel.modalPagamentoOverlay.classList.add('hidden');
    // Reset buttons
    sel.btnConfirmarPagamento.disabled = true;
    sel.btnConfirmarPagamento.classList.add('bg-gray-400', 'cursor-not-allowed');
    sel.btnConfirmarPagamento.classList.remove('bg-blue-500', 'hover:bg-blue-600');
    sel.pagamentoMetodosContainer.querySelectorAll('.pagamento-metodo-btn').forEach(btn => {
        btn.classList.remove('border-blue-500', 'bg-blue-100', 'font-bold');
        btn.classList.add('border-gray-300');
    });
}

export function abrirModalAddProduto() {
    sel.modalAddProdutoOverlay.classList.remove('hidden');
    sel.inputProdutoNome.focus();
}
export function fecharModalAddProduto() {
    sel.modalAddProdutoOverlay.classList.add('hidden');
    sel.formAddProduto.reset();
}

export function abrirModalEditProduto(produto) {
    if (!produto) return;
    sel.hiddenEditProdutoId.value = produto.id;
    sel.inputEditProdutoNome.value = produto.nome;
    sel.inputEditProdutoPreco.value = produto.preco;
    sel.inputEditProdutoStockMinimo.value = produto.stockMinimo;
    sel.modalEditProdutoOverlay.classList.remove('hidden');
    sel.inputEditProdutoNome.focus();
}
export function fecharModalEditProduto() {
    sel.modalEditProdutoOverlay.classList.add('hidden');
    sel.formEditProduto.reset();
}

export function abrirModalAddCliente() {
    sel.modalAddClienteOverlay.classList.remove('hidden');
    sel.inputClienteNome.focus();
}
export function fecharModalAddCliente() {
    sel.modalAddClienteOverlay.classList.add('hidden');
    sel.formAddCliente.reset();
}

export function abrirModalAddStock(produto) {
    if(!produto) return;
    sel.hiddenAddStockId.value = produto.id;
    sel.addStockNomeProduto.textContent = produto.nome;
    sel.modalAddStockOverlay.classList.remove('hidden');
}
export function fecharModalAddStock() {
    sel.modalAddStockOverlay.classList.add('hidden');
    sel.formAddStock.reset();
}

export function abrirModalMoverStock(produto) {
    if(!produto) return;
    sel.hiddenMoverStockId.value = produto.id;
    sel.moverStockNomeProduto.textContent = produto.nome;
    sel.moverStockArmazemQtd.textContent = produto.stockArmazem;
    sel.inputMoverStockQuantidade.max = produto.stockArmazem;
    sel.modalMoverStockOverlay.classList.remove('hidden');
}
export function fecharModalMoverStock() {
    sel.modalMoverStockOverlay.classList.add('hidden');
    sel.formMoverStock.reset();
}

export function abrirModalFechoGlobal(relatorio) {
    relatorioAtual = relatorio; // Guarda o relatório atual para os botões de exportação
    sel.fgDataRelatorio.textContent = new Date(relatorio.data).toLocaleDateString('pt-PT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    sel.fgTotalVendido.textContent = relatorio.totalVendido.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    sel.fgTotalNumerario.textContent = relatorio.totalNumerario.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    sel.fgTotalTpa.textContent = relatorio.totalTpa.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    sel.fgContasFechadas.textContent = relatorio.numContasFechadas;
    sel.fgMediaPorConta.textContent = relatorio.mediaPorConta.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    
    sel.fgListaProdutos.innerHTML = Object.entries(relatorio.produtosVendidos).map(([nome, qtd]) => `<div class="flex justify-between text-sm"><span class="font-semibold">${qtd}x</span><span>${nome}</span></div>`).join('');
    
    sel.btnArquivarDia.classList.remove('hidden');
    sel.modalFechoGlobalOverlay.classList.remove('hidden');
}
export function fecharModalFechoGlobal() {
    sel.modalFechoGlobalOverlay.classList.add('hidden');
    relatorioAtual = null; // Limpa os dados do relatório ao fechar
}

export function abrirModalFechoGlobalHistorico(relatorio) {
    abrirModalFechoGlobal(relatorio);
    sel.btnArquivarDia.classList.add('hidden');
}

export function abrirModalConfirmacao(titulo, mensagem, callback) {
    sel.modalConfirmacaoTitulo.textContent = titulo;
    sel.modalConfirmacaoMensagem.textContent = mensagem;
    onConfirmCallback = callback;
    sel.modalConfirmacaoOverlay.classList.remove('hidden');
}
export function fecharModalConfirmacao() {
    sel.modalConfirmacaoOverlay.classList.add('hidden');
    onConfirmCallback = null;
}

// --- Funções para Modal de Backup/Restauro ---
export function abrirModalBackupRestore() {
    sel.modalBackupRestoreOverlay.classList.remove('hidden');
}
export function fecharModalBackupRestore() {
    sel.modalBackupRestoreOverlay.classList.add('hidden');
}

// --- Funções para Modal de Dica do Dia ---
export function abrirModalDicaDoDia(dica) {
    if (!dica) return;
    sel.dicaCategoria.textContent = dica.category;
    sel.dicaTitulo.textContent = dica.title;
    sel.dicaConteudo.textContent = dica.content;
    sel.modalDicaOverlay.classList.remove('hidden');
}
export function fecharModalDicaDoDia() {
    sel.modalDicaOverlay.classList.add('hidden');
}


// --- FUNÇÕES PARA MODAIS DE DÍVIDAS ---

export function abrirModalAddDivida(cliente) {
    if (!cliente) return;
    sel.modalDividaClienteNome.textContent = cliente.nome;
    sel.modalAddDividaOverlay.classList.remove('hidden');
    sel.inputDividaValor.focus();
}
export function fecharModalAddDivida() {
    sel.modalAddDividaOverlay.classList.add('hidden');
    sel.formAddDivida.reset();
}

export function abrirModalLiquidarDivida(cliente) {
    if (!cliente) return;
    const dividaTotal = cliente.dividas.reduce((total, divida) => total + divida.valor, 0);
    sel.modalLiquidarClienteNome.textContent = cliente.nome;
    sel.modalLiquidarDividaAtual.textContent = dividaTotal.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    sel.modalLiquidarDividaOverlay.classList.remove('hidden');
    sel.inputLiquidarValor.focus();
}
export function fecharModalLiquidarDivida() {
    sel.modalLiquidarDividaOverlay.classList.add('hidden');
    sel.formLiquidarDivida.reset();
}