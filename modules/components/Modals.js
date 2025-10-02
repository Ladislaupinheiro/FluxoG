// /modules/components/Modals.js - Componente para Gestão de Modais (v7.0)
'use strict';

import store from '../services/Store.js';
import * as Toast from './Toast.js';

const sel = {};
let onConfirmCallback = null;

/**
 * Guarda as referências a todos os elementos de modais.
 */
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

    // Modal Adicionar Produto
    sel.modalAddProdutoOverlay = document.getElementById('modal-add-produto-overlay');
    sel.formAddProduto = document.getElementById('form-add-produto');
    sel.inputProdutoNome = document.getElementById('input-produto-nome');

    // Modal Adicionar Cliente
    sel.modalAddClienteOverlay = document.getElementById('modal-add-cliente-overlay');
    sel.formAddCliente = document.getElementById('form-add-cliente');
    sel.inputClienteNome = document.getElementById('input-cliente-nome');

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
}

export function init() {
    querySelectors();
    // Adiciona o listener para o botão de confirmação geral
    if (sel.btnConfirmarConfirmacaoModal) {
        sel.btnConfirmarConfirmacaoModal.addEventListener('click', () => {
            if (typeof onConfirmCallback === 'function') {
                onConfirmCallback();
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
    sel.inputBuscaProdutoPedido.value = '';
    sel.autocompleteResults.classList.add('hidden');
    sel.modalAddPedidoOverlay.classList.remove('hidden');
    sel.inputBuscaProdutoPedido.focus();
}
export function fecharModalAddPedido() {
    sel.modalAddPedidoOverlay.classList.add('hidden');
    sel.formAddPedido.reset();
}

export function abrirModalAddProduto() {
    sel.modalAddProdutoOverlay.classList.remove('hidden');
    sel.inputProdutoNome.focus();
}
export function fecharModalAddProduto() {
    sel.modalAddProdutoOverlay.classList.add('hidden');
    sel.formAddProduto.reset();
}

export function abrirModalAddCliente() {
    sel.modalAddClienteOverlay.classList.remove('hidden');
    sel.inputClienteNome.focus();
}
export function fecharModalAddCliente() {
    sel.modalAddClienteOverlay.classList.add('hidden');
    sel.formAddCliente.reset();
}

export function abrirModalPagamento(conta) {
    if (!conta) return;
    const totalPagar = conta.pedidos.reduce((total, p) => total + (p.preco * p.qtd), 0);
    sel.pagamentoContaIdInput.value = conta.id;
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

// Lógica de cálculo do relatório do dia
function calcularRelatorioDia() {
    const state = store.getState();
    const contasFechadasHoje = state.contasAtivas.filter(c => c.status === 'fechada');
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

function renderizarRelatorioNoModal(relatorio) {
    sel.fgDataRelatorio.textContent = new Date(relatorio.data).toLocaleDateString('pt-PT', { dateStyle: 'full' });
    sel.fgTotalVendido.textContent = relatorio.totalVendido.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    sel.fgTotalNumerario.textContent = relatorio.totalNumerario.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    sel.fgTotalTpa.textContent = relatorio.totalTpa.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    sel.fgContasFechadas.textContent = relatorio.numContasFechadas;
    sel.fgMediaPorConta.textContent = relatorio.mediaPorConta.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    sel.fgListaProdutos.innerHTML = '';

    if (Object.keys(relatorio.produtosVendidos).length > 0) {
        Object.entries(relatorio.produtosVendidos).map(([nome, qtd]) => {
            const el = document.createElement('div');
            el.className = 'flex justify-between';
            el.innerHTML = `<span class="font-semibold">${qtd}x</span><span>${nome}</span>`;
            sel.fgListaProdutos.appendChild(el);
        });
    } else {
        sel.fgListaProdutos.textContent = 'Nenhum produto vendido hoje.';
    }
}

export function abrirModalFechoGlobal() {
    const state = store.getState();
    const contasAbertas = state.contasAtivas.filter(c => c.status === 'ativa');
    if (contasAbertas.length > 0) {
        const nomesContas = contasAbertas.map(c => c.nome).join(', ');
        Toast.mostrarNotificacao(`Feche as seguintes contas antes de arquivar: ${nomesContas}`, 'erro');
        return;
    }

    const relatorio = calcularRelatorioDia();
    // setRelatorioAtual(relatorio); // Lógica a ser refatorada para o store, se necessário
    renderizarRelatorioNoModal(relatorio);
    sel.btnArquivarDia.classList.remove('hidden');
    sel.btnExportarPdf.classList.add('hidden');
    sel.btnExportarXls.classList.add('hidden');
    sel.modalFechoGlobalOverlay.classList.remove('hidden');
}
export function fecharModalFechoGlobal() {
    sel.modalFechoGlobalOverlay.classList.add('hidden');
}
export function abrirModalFechoGlobalHistorico(relatorio) {
    if (!relatorio) return;
    // setRelatorioAtual(relatorio); // Lógica a ser refatorada para o store, se necessário
    renderizarRelatorioNoModal(relatorio);
    sel.btnArquivarDia.classList.add('hidden');
    sel.btnExportarPdf.classList.remove('hidden');
    sel.btnExportarXls.classList.remove('hidden');
    sel.modalFechoGlobalOverlay.classList.remove('hidden');
}