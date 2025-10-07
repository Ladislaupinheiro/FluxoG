// /modules/components/Modals.js - ATUALIZADO (com "Modo de Foco")
'use strict';

import store from '../services/Store.js';

let modalsContainer = null;
let appRoot = null; // Referência para o contentor principal
let activeModal = null;

// Função auxiliar para carregar, renderizar e montar um modal
async function openModal(modalName, ...args) {
    if (activeModal) {
        activeModal.close();
    }

    // ATIVA O MODO DE FOCO
    appRoot?.classList.add('app-desfocada');

    try {
        const modalComponent = await import(`./modals/${modalName}.js`);
        modalsContainer.innerHTML = modalComponent.render(...args);
        activeModal = modalComponent;
        
        modalComponent.mount(closeActiveModal, ...args);

    } catch (error) {
        console.error(`Falha ao carregar o modal ${modalName}:`, error);
        // Garante que o modo de foco é desativado em caso de erro
        appRoot?.classList.remove('app-desfocada');
    }
}

// Função para fechar e limpar o modal ativo
function closeActiveModal() {
    if (activeModal && typeof activeModal.unmount === 'function') {
        activeModal.unmount();
    }
    modalsContainer.innerHTML = '';
    activeModal = null;

    // DESATIVA O MODO DE FOCO
    appRoot?.classList.remove('app-desfocada');
}

// --- API PÚBLICA ---

export function init() {
    modalsContainer = document.getElementById('modals-container');
    appRoot = document.getElementById('app-root'); // Guarda a referência do app-root
    if (!modalsContainer || !appRoot) {
        console.error("Contentores '#modals-container' ou '#app-root' não encontrados.");
    }
}

// O resto da API pública permanece o mesmo
export const abrirModalConfirmacao = (titulo, mensagem, callback) => openModal('ConfirmacaoModal', titulo, mensagem, callback);
export const abrirModalNovaConta = () => openModal('FormNovaContaModal');
export const abrirModalAddProduto = () => openModal('FormAddProdutoModal');
export const abrirModalEditProduto = (produto) => openModal('FormEditProdutoModal', produto);
export const abrirModalAddStock = (produto) => openModal('FormAddStockModal', produto);
export const abrirModalMoverStock = (produto) => openModal('FormMoverStockModal', produto);
export const abrirModalAddPedido = (contaId) => openModal('FormAddPedidoModal', contaId);
export const abrirModalPagamento = (conta) => openModal('FormPagamentoModal', conta);
export const abrirModalAddCliente = () => openModal('FormAddClienteModal');
export const abrirModalAddDivida = (cliente) => openModal('FormAddDividaModal', cliente);
export const abrirModalLiquidarDivida = (cliente) => openModal('FormLiquidarDividaModal', cliente);
export const abrirModalFechoGlobal = (relatorio, isHistoric) => openModal('FechoGlobalModal', relatorio, isHistoric);
export const abrirModalNovaDespesa = () => openModal('FormNovaDespesaModal');
export const abrirModalBackupRestore = () => openModal('BackupRestoreModal');
export const abrirModalDicaDoDia = (dica) => openModal('DicaDoDiaModal', dica);
export const abrirModalEditBusinessName = (nomeAtual) => openModal('FormEditBusinessNameModal', nomeAtual);

export { closeActiveModal as fecharModal };