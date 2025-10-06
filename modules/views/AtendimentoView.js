// /modules/views/AtendimentoView.js - (v10.0 - View SPA Refatorada com GSAP)
'use strict';

import store from '../services/Store.js';
import { 
    abrirModalNovaConta, 
    abrirModalAddPedido,
    abrirModalPagamento,
    abrirModalConfirmacao
} from '../components/Modals.js';
import { mostrarNotificacao } from '../components/Toast.js';

let unsubscribe = null;
let viewNode = null;

/**
 * Função auxiliar para renderizar um único card de conta.
 * @param {object} conta - O objeto da conta a ser renderizado.
 * @returns {string} O HTML do card da conta.
 */
function renderContaCard(conta) {
    const subtotal = conta.pedidos.reduce((total, p) => total + (p.preco * p.qtd), 0);
    const contaEstaVazia = conta.pedidos.length === 0;

    const pedidosHTML = contaEstaVazia
        ? '<p class="text-center text-texto-secundario py-4">Nenhum pedido nesta conta.</p>'
        : conta.pedidos.map((pedido, index) => `
            <div class="flex justify-between items-center py-2 border-b border-borda last:border-b-0">
                <span>${pedido.qtd}x ${pedido.nome}</span>
                <div class="flex items-center gap-4">
                    <span class="font-semibold">${(pedido.preco * pedido.qtd).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                    <button class="btn-icon btn-remover-item text-red-500 hover:text-red-700" data-index="${index}" title="Remover Item" aria-label="Remover Item">
                        <i class="lni lni-trash-can"></i>
                    </button>
                </div>
            </div>
        `).join('');

    return `
        <div class="conta-card bg-fundo-secundario rounded-lg shadow-md overflow-hidden" data-id="${conta.id}">
            <div class="card-header p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <h3 class="text-xl font-bold">${conta.nome}</h3>
                <div class="text-right">
                    <span class="font-bold text-lg block">${subtotal.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                    <span class="text-xs text-texto-secundario">${conta.pedidos.length} Itens</span>
                </div>
            </div>
            <div class="card-body border-t border-borda" style="display: none;">
                <div class="p-4">${pedidosHTML}</div>
                <div class="p-4 bg-gray-50 dark:bg-gray-900/50 flex gap-2">
                    <button class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded btn-adicionar-pedido">+ Pedido</button>
                    <button class="w-full text-white font-bold py-2 px-4 rounded btn-finalizar-pagamento ${contaEstaVazia ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}" ${contaEstaVazia ? 'disabled' : ''}>Finalizar</button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Renderiza a lista de contas ativas na UI.
 */
function renderAccountList() {
    if (!viewNode) return;
    
    const state = store.getState();
    const contasAtivas = state.contasAtivas.filter(c => c.status === 'ativa');
    const listaContasEl = viewNode.querySelector('#lista-contas-ativas');
    const emptyStateEl = viewNode.querySelector('#atendimento-empty-state');

    if (!listaContasEl || !emptyStateEl) return;

    if (contasAtivas.length === 0) {
        emptyStateEl.classList.remove('hidden');
        listaContasEl.classList.add('hidden');
        listaContasEl.innerHTML = '';
    } else {
        emptyStateEl.classList.add('hidden');
        listaContasEl.classList.remove('hidden');
        // Para evitar perder o estado de qual card está aberto, fazemos uma atualização inteligente
        contasAtivas.forEach(conta => {
            const elExistente = listaContasEl.querySelector(`.conta-card[data-id="${conta.id}"]`);
            if (elExistente) {
                // Se o elemento já existe, substitui o seu conteúdo para não perder a expansão
                elExistente.innerHTML = renderContaCard(conta).replace(/^<div[^>]*>|<\/div>$/g, '');
            } else {
                // Se for novo, adiciona ao final
                listaContasEl.insertAdjacentHTML('beforeend', renderContaCard(conta));
            }
        });
        // Remove elementos que já não existem no estado
        Array.from(listaContasEl.children).forEach(child => {
            if (!contasAtivas.some(c => c.id === child.dataset.id)) {
                child.remove();
            }
        });
    }
}

/**
 * Retorna o HTML do ecrã de Atendimento.
 * @returns {string} O HTML completo do ecrã.
 */
function render() {
    return `
        <section id="view-atendimento" class="p-4">
            <div id="lista-contas-ativas" class="space-y-4"></div>
            <div id="atendimento-empty-state" class="hidden text-center text-texto-secundario py-16 px-4 flex flex-col items-center justify-center h-full">
                <i class="lni lni-clipboard text-6xl text-gray-300 dark:text-gray-600"></i>
                <h2 class="text-xl font-semibold mt-4">Nenhuma Conta Ativa</h2>
                <p class="mt-2 max-w-xs">Toque no botão '+' para iniciar um novo atendimento.</p>
            </div>
        </section>
        <button id="btn-fab-add-conta" class="fab z-40 fixed bottom-20 right-4 w-14 h-14 bg-primaria text-white rounded-full flex justify-center items-center text-2xl shadow-lg">
            <i class="lni lni-plus"></i>
        </button>
    `;
}

/**
 * Adiciona os event listeners ao ecrã após ser renderizado.
 */
function mount() {
    viewNode = document.getElementById('app-root');
    
    // Renderiza a lista inicial
    renderAccountList();

    // Inscreve-se no store para re-renderizar a lista em caso de mudanças
    unsubscribe = store.subscribe(renderAccountList);

    // Listeners
    viewNode.querySelector('#btn-fab-add-conta')?.addEventListener('click', abrirModalNovaConta);

    const listaContasEl = viewNode.querySelector('#lista-contas-ativas');
    listaContasEl?.addEventListener('click', (event) => {
        const card = event.target.closest('.conta-card');
        if (!card) return;

        const contaId = card.dataset.id;
        const conta = store.getState().contasAtivas.find(c => c.id === contaId);
        if (!conta) return;

        const cardHeader = event.target.closest('.card-header');
        const targetButton = event.target.closest('button');

        // Lógica de expandir/fechar com GSAP
        if (cardHeader) {
            const cardBody = card.querySelector('.card-body');
            const isExpanded = card.classList.contains('expanded');

            // Fecha todos os outros cards abertos
            document.querySelectorAll('.conta-card.expanded').forEach(otherCard => {
                if (otherCard !== card) {
                    const otherBody = otherCard.querySelector('.card-body');
                    gsap.to(otherBody, { height: 0, duration: 0.3, onComplete: () => { otherBody.style.display = 'none'; } });
                    otherCard.classList.remove('expanded');
                }
            });

            if (isExpanded) {
                gsap.to(cardBody, { height: 0, duration: 0.3, onComplete: () => { cardBody.style.display = 'none'; } });
                card.classList.remove('expanded');
            } else {
                card.classList.add('expanded');
                cardBody.style.display = 'block';
                gsap.fromTo(cardBody, { height: 0 }, { height: 'auto', duration: 0.3 });
            }
        }

        // Lógica dos botões de ação
        if (!targetButton) return;

        if (targetButton.classList.contains('btn-adicionar-pedido')) {
            abrirModalAddPedido(contaId);
        } else if (targetButton.classList.contains('btn-finalizar-pagamento')) {
            abrirModalPagamento(conta);
        } else if (targetButton.classList.contains('btn-remover-item')) {
            const itemIndex = parseInt(targetButton.dataset.index, 10);
            abrirModalConfirmacao(
                "Remover Item?",
                `Tem a certeza que deseja remover este item da conta? O stock será devolvido à Loja.`,
                () => {
                    store.dispatch({ type: 'REMOVE_ORDER_ITEM', payload: { contaId, itemIndex } });
                    mostrarNotificacao("Item removido com sucesso.");
                }
            );
        }
    });
}

/**
 * Remove os listeners e anula a inscrição no store.
 */
function unmount() {
    if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
    }
    viewNode = null;
}

export default {
    render,
    mount,
    unmount
};