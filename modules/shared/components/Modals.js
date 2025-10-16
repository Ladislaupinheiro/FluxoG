// /modules/shared/components/Modals.js (ATUALIZADO)
'use strict';

import store from '../services/Store.js';

// --- IMPORTAÇÕES ESTÁTICAS DE TODOS OS MODAIS ---
import * as BackupRestoreModal from '../../features/settings/components/BackupRestoreModal.js';
import * as ConfirmacaoModal from '../ui/ConfirmacaoModal.js';
import * as CustomerPerformanceModal from '../../features/clientes/components/CustomerPerformanceModal.js';
import * as DicaDoDiaModal from '../../features/dashboard/components/DicaDoDiaModal.js';
import * as FechoGlobalModal from '../../features/financas/components/FechoGlobalModal.js';
import * as FormAddClienteModal from '../../features/clientes/components/FormAddClienteModal.js';
import * as FormAddDividaModal from '../../features/clientes/components/FormAddDividaModal.js';
import * as FormAddFornecedorModal from '../../features/inventario/components/FormAddFornecedorModal.js';
import * as FormAddPedidoModal from '../../features/atendimento/components/FormAddPedidoModal.js';
import * as FormAddProdutoCatalogoModal from '../../features/inventario/components/FormAddProdutoCatalogoModal.js';
import * as FormAddProdutoModal from '../../features/inventario/components/FormAddProdutoModal.js';
import * as FormAddStockModal from '../../features/inventario/components/FormAddStockModal.js';
import * as FormEditBusinessNameModal from '../../features/dashboard/components/FormEditBusinessNameModal.js';
import * as FormEditClienteModal from '../../features/clientes/components/FormEditClienteModal.js'; // <-- NOVO
import * as FormEditProdutoModal from '../../features/inventario/components/FormEditProdutoModal.js';
import * as FormExportarComprasModal from '../../features/financas/components/FormExportarComprasModal.js';
import * as FormGerirCategoriasModal from '../../features/inventario/components/FormGerirCategoriasModal.js';
import * as FormLiquidarDividaModal from '../../features/clientes/components/FormLiquidarDividaModal.js';
import * as FormMoverStockModal from '../../features/inventario/components/FormMoverStockModal.js';
import * as FormNovaContaModal from '../../features/atendimento/components/FormNovaContaModal.js';
import * as FormNovaDespesaModal from '../../features/financas/components/FormNovaDespesaModal.js';
import * as FormPagamentoModal from '../../features/atendimento/components/FormPagamentoModal.js';
import * as ProductPerformanceModal from '../../features/inventario/components/ProductPerformanceModal.js';
import * as FormRegistarCompraModal from '../../features/inventario/components/FormRegistarCompraModal.js';
import * as ShortcutManagementModal from '../../features/inventario/components/ShortcutManagementModal.js';

// --- MAPA DE COMPONENTES ---
const modalComponents = {
    BackupRestoreModal, ConfirmacaoModal, CustomerPerformanceModal, DicaDoDiaModal, FechoGlobalModal,
    FormAddClienteModal, FormAddDividaModal, FormAddFornecedorModal, FormAddPedidoModal,
    FormAddProdutoCatalogoModal, FormAddProdutoModal, FormAddStockModal, FormEditBusinessNameModal,
    FormEditClienteModal, FormEditProdutoModal, FormExportarComprasModal, FormGerirCategoriasModal, // <-- NOVO
    FormLiquidarDividaModal, FormMoverStockModal, FormNovaContaModal, FormNovaDespesaModal,
    FormPagamentoModal, ProductPerformanceModal, FormRegistarCompraModal, ShortcutManagementModal,
};

let modalsContainer = null;
let appRoot = null;
let activeModal = { close: () => {} };

async function openModal(modalName, renderArgs = [], mountArgs = []) {
    if (typeof activeModal.close === 'function') activeModal.close();
    const component = modalComponents[modalName];
    if (!component) { console.error(`Falha: Componente "${modalName}" não encontrado.`); return; }
    appRoot.classList.add('app-desfocada');
    modalsContainer.innerHTML = component.render(...renderArgs);
    const closeModal = () => {
        if (typeof component.unmount === 'function') component.unmount();
        modalsContainer.innerHTML = '';
        appRoot.classList.remove('app-desfocada');
        activeModal = { close: () => {} };
    };
    activeModal.close = closeModal;
    component.mount(closeModal, ...mountArgs);
}

function init() {
    modalsContainer = document.getElementById('modals-container');
    appRoot = document.getElementById('app-root');
}

// --- API Pública de Modais ---
export function abrirModalEditCliente(cliente) { openModal('FormEditClienteModal', [cliente], [cliente]); } // <-- NOVO

// ... (restante da API, sem alterações)
export function abrirModalExportarCompras() { openModal('FormExportarComprasModal'); }
export function abrirModalAddCliente(onClientAddedCallback) { openModal('FormAddClienteModal', [], [onClientAddedCallback]); }
export function abrirModalAddDivida(cliente) { openModal('FormAddDividaModal', [cliente], [cliente]); }
export function abrirModalAddFornecedor() { openModal('FormAddFornecedorModal'); }
export function abrirModalAddPedido(contaId) { const conta = store.getState().contasAtivas.find(c => c.id === contaId); if (conta) openModal('FormAddPedidoModal', [conta], [contaId]); }
export function abrirModalAddProduto() { openModal('FormAddProdutoModal'); }
export function abrirModalAddProdutoCatalogo(fornecedor) { openModal('FormAddProdutoCatalogoModal', [fornecedor], [fornecedor]); }
export function abrirModalAddStock(produto) { openModal('FormAddStockModal'); }
export function abrirModalBackupRestore() { openModal('BackupRestoreModal'); }
export function abrirModalConfirmacao(titulo, mensagem, onConfirmCallback) { openModal('ConfirmacaoModal', [titulo, mensagem], [titulo, mensagem, onConfirmCallback]); }
export function abrirModalCustomerPerformance(customerInsights, periodo) { openModal('CustomerPerformanceModal', [customerInsights, periodo], [customerInsights, periodo]); }
export function abrirModalDicaDoDia(dica) { openModal('DicaDoDiaModal', [dica]); }
export function abrirModalEditBusinessName(nomeAtual) { openModal('FormEditBusinessNameModal', [nomeAtual], [nomeAtual]); }
export function abrirModalEditProduto(produto) { openModal('FormEditProdutoModal', [produto], [produto]); }
export function abrirModalFechoGlobal(relatorio, isHistoric) { openModal('FechoGlobalModal', [relatorio, isHistoric], [relatorio, isHistoric]); }
export function abrirModalGerirCategorias() { openModal('FormGerirCategoriasModal'); }
export function abrirModalLiquidarDivida(cliente) { openModal('FormLiquidarDividaModal', [cliente], [cliente]); }
export function abrirModalMoverStock(produto) { openModal('FormMoverStockModal', [produto], [produto]); }
export function abrirModalNovaConta() { openModal('FormNovaContaModal'); }
export function abrirModalNovaDespesa() { openModal('FormNovaDespesaModal'); }
export function abrirModalPagamento(conta) { openModal('FormPagamentoModal', [conta], [conta]); }
export function abrirModalProductPerformance(performanceData, periodo) { openModal('ProductPerformanceModal', [performanceData, periodo], [performanceData, periodo]); }
export function abrirModalRegistarCompra(fornecedor) { openModal('FormRegistarCompraModal', [fornecedor], [fornecedor]); }
export function abrirModalShortcutManagement(produto) { openModal('ShortcutManagementModal', [produto], [produto]); }

export { init };