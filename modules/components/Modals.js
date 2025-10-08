// /modules/components/Modals.js
'use strict';

import store from '../services/Store.js';

let modalsContainer = null;
let appRoot = null;
let activeModal = {
    close: () => {}
};

// Função auxiliar genérica para abrir qualquer modal dinamicamente
async function openModal(modalName, renderArgs = [], mountArgs = []) {
    if (typeof activeModal.close === 'function') {
        activeModal.close();
    }

    appRoot.classList.add('app-desfocada');
    
    try {
        const component = await import(`./modals/${modalName}.js`);
        
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

    } catch (error) {
        console.error(`Falha ao carregar o modal ${modalName}:`, error);
        appRoot.classList.remove('app-desfocada');
    }
}

function init() {
    modalsContainer = document.getElementById('modals-container');
    appRoot = document.getElementById('app-root');
}

// --- API Pública de Modais ---

export function abrirModalConfirmacao(titulo, mensagem, onConfirmCallback) {
    openModal('ConfirmacaoModal', [titulo, mensagem], [titulo, mensagem, onConfirmCallback]);
}

export function abrirModalNovaConta() {
    openModal('FormNovaContaModal', [], []);
}

export function abrirModalAddProduto() {
    openModal('FormAddProdutoModal', [], []);
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
    if (!conta) {
        console.error("Tentativa de abrir modal para uma conta que não existe:", contaId);
        return;
    }
    openModal('FormAddPedidoModal', [conta], [contaId]);
}

export function abrirModalPagamento(conta) {
    openModal('FormPagamentoModal', [conta], [conta]);
}

export function abrirModalAddCliente() {
    openModal('FormAddClienteModal', [], []);
}

export function abrirModalNovaDespesa() {
    openModal('FormNovaDespesaModal', [], []);
}

export function abrirModalAddDivida(cliente) {
    openModal('FormAddDividaModal', [cliente], [cliente]);
}

export function abrirModalLiquidarDivida(cliente) {
    openModal('FormLiquidarDividaModal', [cliente], [cliente]);
}

export function abrirModalFechoGlobal(relatorio, isHistoric) {
    openModal('FechoGlobalModal', [relatorio], [relatorio, isHistoric]);
}

export function abrirModalBackupRestore() {
    openModal('BackupRestoreModal', [], []);
}

export function abrirModalDicaDoDia(dica) {
    openModal('DicaDoDiaModal', [dica], [dica]);
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

/**
 * NOVO: Abre o modal de gestão de atalhos para um produto específico.
 * @param {object} produto - O produto a ser gerido como atalho.
 */
export function abrirModalShortcutManagement(produto) {
    openModal('ShortcutManagementModal', [produto], [produto]);
}

// Inicializa o serviço de modais
export { init };