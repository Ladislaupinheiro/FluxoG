// /modules/modals.js - Responsável por abrir e fechar todos os modais da aplicação.

import { estado, setRelatorioAtual } from './state.js';
import * as sel from './selectors.js';
import { renderizarRelatorioFechoGlobal } from './ui.js';

// Função de cálculo movida para aqui para quebrar a dependência circular
export function calcularRelatorioDia() {
    const contasFechadasHoje = estado.contasAtivas.filter(c => c.status === 'fechada');
    const totalVendido = contasFechadasHoje.reduce((sum, conta) => sum + conta.valorFinal, 0);
    const totalNumerario = contasFechadasHoje.filter(c => c.metodoPagamento === 'Numerário').reduce((sum, c) => sum + c.valorFinal, 0);
    const totalTpa = contasFechadasHoje.filter(c => c.metodoPagamento === 'TPA').reduce((sum, c) => sum + c.valorFinal, 0);
    const numContasFechadas = contasFechadasHoje.length;
    const mediaPorConta = numContasFechadas > 0 ? totalVendido / numContasFechadas : 0;
    const produtosVendidos = {};
    contasFechadasHoje.forEach(conta => {
        conta.pedidos.forEach(pedido => {
            produtosVendidos[pedido.nome] = (produtosVendidos[pedido.nome] || 0) + pedido.qtd;
        });
    });
    return { data: new Date(), totalVendido, totalNumerario, totalTpa, numContasFechadas, mediaPorConta, produtosVendidos };
}

export let onConfirmCallback = null;

export function abrirModalConfirmacao(titulo, mensagem, onConfirm) {
    sel.modalConfirmacaoTitulo.textContent = titulo;
    sel.modalConfirmacaoMensagem.textContent = mensagem;
    onConfirmCallback = onConfirm;
    sel.modalConfirmacaoOverlay.classList.remove('hidden');
}
export function fecharModalConfirmacao() {
    sel.modalConfirmacaoOverlay.classList.add('hidden');
    onConfirmCallback = null;
}
export function abrirModalNovaConta() {
    sel.modalOverlay.classList.remove('hidden');
    sel.inputNomeConta.focus();
}
export function fecharModalNovaConta() {
    sel.modalOverlay.classList.add('hidden');
    sel.formNovaConta.reset();
}
export function abrirModalAddPedido(idConta) {
    const conta = estado.contasAtivas.find(c => c.id === idConta);
    if (!conta) return;
    sel.modalPedidoNomeConta.textContent = conta.nome;
    sel.hiddenContaId.value = idConta;
    sel.inputBuscaProdutoPedido.value = '';
    sel.autocompleteResults.classList.add('hidden');
    sel.modalAddPedidoOverlay.classList.remove('hidden');
    sel.inputBuscaProdutoPedido.focus();
}
export function fecharModalAddPedido() {
    sel.modalAddPedidoOverlay.classList.add('hidden');
    sel.formAddPedido.reset();
}
export function abrirModalPagamento(idConta) {
    const conta = estado.contasAtivas.find(c => c.id === idConta);
    if (!conta) return;
    const totalPagar = conta.pedidos.reduce((total, p) => total + (p.preco * p.qtd), 0);
    sel.pagamentoContaIdInput.value = idConta;
    sel.pagamentoNomeContaSpan.textContent = conta.nome;
    sel.pagamentoTotalSpan.textContent = totalPagar.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    sel.modalPagamentoOverlay.classList.remove('hidden');
}
export function fecharModalPagamento() {
    sel.modalPagamentoOverlay.classList.add('hidden');
    sel.pagamentoMetodosContainer.querySelectorAll('.pagamento-metodo-btn').forEach(btn => {
        btn.classList.remove('border-blue-500', 'bg-blue-100', 'font-bold');
        btn.classList.add('border-gray-300');
    });
    sel.btnConfirmarPagamento.disabled = true;
    sel.btnConfirmarPagamento.classList.remove('bg-blue-500', 'hover:bg-blue-600');
    sel.btnConfirmarPagamento.classList.add('bg-gray-400', 'cursor-not-allowed');
}
export function abrirModalAddProduto() {
    sel.modalAddProdutoOverlay.classList.remove('hidden');
    sel.inputProdutoNome.focus();
}
export function fecharModalAddProduto() {
    sel.modalAddProdutoOverlay.classList.add('hidden');
    sel.formAddProduto.reset();
}
export function abrirModalEditProduto(produtoId) {
    const produto = estado.inventario.find(p => p.id === produtoId);
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
export function abrirModalEditNome(idConta) {
    const conta = estado.contasAtivas.find(c => c.id === idConta);
    if (!conta) return;
    sel.hiddenEditNomeId.value = idConta;
    sel.inputEditNome.value = conta.nome;
    sel.modalEditNomeOverlay.classList.remove('hidden');
    sel.inputEditNome.focus();
}
export function fecharModalEditNome() {
    sel.modalEditNomeOverlay.classList.add('hidden');
    sel.formEditNome.reset();
}
export function abrirModalAddStock(produtoId) {
    const produto = estado.inventario.find(p => p.id === produtoId);
    if (!produto) return;
    sel.hiddenAddStockId.value = produto.id;
    sel.addStockNomeProduto.textContent = produto.nome;
    sel.modalAddStockOverlay.classList.remove('hidden');
    sel.inputAddStockQuantidade.focus();
}
export function fecharModalAddStock() {
    sel.modalAddStockOverlay.classList.add('hidden');
    sel.formAddStock.reset();
}
export function abrirModalMoverStock(produtoId) {
    const produto = estado.inventario.find(p => p.id === produtoId);
    if (!produto) return;
    sel.hiddenMoverStockId.value = produto.id;
    sel.moverStockNomeProduto.textContent = produto.nome;
    sel.moverStockArmazemQtd.textContent = produto.stockArmazem;
    sel.moverStockGeleiraQtd.textContent = produto.stockGeleira;
    sel.modalMoverStockOverlay.classList.remove('hidden');
    sel.inputMoverStockQuantidade.focus();
}
export function fecharModalMoverStock() {
    sel.modalMoverStockOverlay.classList.add('hidden');
    sel.formMoverStock.reset();
}
export function abrirModalFechoGlobal() { 
    const relatorio = calcularRelatorioDia();
    setRelatorioAtual(relatorio);
    renderizarRelatorioFechoGlobal(relatorio);
    sel.btnArquivarDia.classList.remove('hidden');
    sel.btnExportarPdf.classList.add('hidden');
    sel.btnExportarXls.classList.add('hidden');
    sel.modalFechoGlobalOverlay.classList.remove('hidden');
}
export function fecharModalFechoGlobal() {
    sel.modalFechoGlobalOverlay.classList.add('hidden');
}
export function abrirModalFechoGlobalHistorico(relatorioIndex) {
    const relatorio = estado.historicoFechos[relatorioIndex];
    if (!relatorio) return;
    setRelatorioAtual(relatorio);
    renderizarRelatorioFechoGlobal(relatorio);
    sel.btnArquivarDia.classList.add('hidden');
    sel.btnExportarPdf.classList.remove('hidden');
    sel.btnExportarXls.classList.remove('hidden');
    sel.modalFechoGlobalOverlay.classList.remove('hidden');
}