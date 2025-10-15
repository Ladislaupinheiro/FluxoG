// /modules/shared/components/Modals.js
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
import * as FormAddPedidoModal from '../../features/atendimento/components/FormAddPedidoModal.js';
import * as FormAddProdutoModal from '../../features/inventario/components/FormAddProdutoModal.js';
import * as FormAddStockModal from '../../features/inventario/components/FormAddStockModal.js';
import * as FormEditBusinessNameModal from '../../features/dashboard/components/FormEditBusinessNameModal.js';
import * as FormEditProdutoModal from '../../features/inventario/components/FormEditProdutoModal.js';
import * as FormLiquidarDividaModal from '../../features/clientes/components/FormLiquidarDividaModal.js';
import * as FormMoverStockModal from '../../features/inventario/components/FormMoverStockModal.js';
import * as FormNovaContaModal from '../../features/atendimento/components/FormNovaContaModal.js';
import * as FormNovaDespesaModal from '../../features/financas/components/FormNovaDespesaModal.js';
import * as FormPagamentoModal from '../../features/atendimento/components/FormPagamentoModal.js';
import * as ProductPerformanceModal from '../../features/inventario/components/ProductPerformanceModal.js';
import * as ShortcutManagementModal from '../../features/inventario/components/ShortcutManagementModal.js';

// --- MAPA DE COMPONENTES ---
const modalComponents = {
    BackupRestoreModal,
    ConfirmacaoModal,
    CustomerPerformanceModal,
    DicaDoDiaModal,
    FechoGlobalModal,
    FormAddClienteModal,
    FormAddDividaModal,
    FormAddPedidoModal,
    FormAddProdutoModal,
    FormAddStockModal,
    FormEditBusinessNameModal,
    FormEditProdutoModal,
    FormLiquidarDividaModal,
    FormMoverStockModal,
    FormNovaContaModal,
    FormNovaDespesaModal,
    FormPagamentoModal,
    ProductPerformanceModal,
    ShortcutManagementModal,
};

let modalsContainer = null;
let appRoot = null;
let activeModal = {
    close: () => {}
};

// Função genérica refatorada para usar o mapa de componentes
async function openModal(modalName, renderArgs = [], mountArgs = []) {
    if (typeof activeModal.close === 'function') {
        activeModal.close();
    }

    const component = modalComponents[modalName];
    if (!component) {
        console.error(`Falha ao carregar o modal: Componente "${modalName}" não encontrado.`);
        return;
    }

    appRoot.classList.add('app-desfocada');
    
    modalsContainer.innerHTML = component.render(...renderArgs);
    
    const closeModal = () => {
        if (typeof component.unmount === 'function') {
            component.unmount();
        }
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

// --- API Pública de Modais (sem alterações na assinatura) ---

export function abrirModalConfirmacao(titulo, mensagem, onConfirmCallback) {
    openModal('ConfirmacaoModal', [titulo, mensagem], [titulo, mensagem, onConfirmCallback]);
}

export function abrirModalNovaConta() {
    openModal('FormNovaContaModal');
}

export function abrirModalAddProduto() {
    openModal('FormAddProdutoModal');
}

export function abrirModalEditProduto(produto) {
    openModal('FormEditProdutoModal', [produto], [produto]);
}

export function abrirModalAddStock(produto) {
    openModal('FormAddStockModal', [produto], [produto]);
}

export function abrirModalMoverStock(produto) {
    openModal('FormMoverStockModal', [produto], [produto]);
}

export function abrirModalAddPedido(contaId) {
    const conta = store.getState().contasAtivas.find(c => c.id === contaId);
    if (conta) openModal('FormAddPedidoModal', [conta], [contaId]);
}

export function abrirModalPagamento(conta) {
    openModal('FormPagamentoModal', [conta], [conta]);
}

export function abrirModalAddCliente() {
    openModal('FormAddClienteModal');
}

export function abrirModalNovaDespesa() {
    openModal('FormNovaDespesaModal');
}

export function abrirModalAddDivida(cliente) {
    openModal('FormAddDividaModal', [cliente], [cliente]);
}

export function abrirModalLiquidarDivida(cliente) {
    openModal('FormLiquidarDividaModal', [cliente], [cliente]);
}

export function abrirModalFechoGlobal(relatorio, isHistoric) {
    openModal('FechoGlobalModal', [relatorio, isHistoric], [relatorio, isHistoric]);
}

export function abrirModalBackupRestore() {
    openModal('BackupRestoreModal');
}

export function abrirModalDicaDoDia(dica) {
    openModal('DicaDoDiaModal', [dica]);
}

export function abrirModalEditBusinessName(nomeAtual) {
    openModal('FormEditBusinessNameModal', [nomeAtual], [nomeAtual]);
}

export function abrirModalProductPerformance(performanceData, periodo) {
    openModal('ProductPerformanceModal', [performanceData, periodo], [performanceData, periodo]);
}

export function abrirModalCustomerPerformance(customerInsights, periodo) {
    openModal('CustomerPerformanceModal', [customerInsights, periodo], [customerInsights, periodo]);
}

export function abrirModalShortcutManagement(produto) {
    openModal('ShortcutManagementModal', [produto], [produto]);
}

export { init };