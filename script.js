'use strict';

// ===================================
// 1. GESTÃO DE ESTADO (STATE)
// ===================================
const estado = {
    contasAtivas: [],
    inventario: [
        { id: 'cuca', nome: 'Cuca', stock: 200, stockMinimo: 100, preco: 1500 },
        { id: 'nocal', nome: 'Nocal', stock: 150, stockMinimo: 100, preco: 1500 }
    ],
    config: {
        valorCaucaoPadrao: 2000
    }
};

// ===================================
// 2. SELETORES DE ELEMENTOS DO DOM
// ===================================
// Navegação e Abas
const bottomNav = document.getElementById('bottom-nav');
const tabContents = document.querySelectorAll('.tab-content');

// Aba Atendimento
const seletorCliente = document.getElementById('seletor-cliente');
const vistaClienteAtivo = document.getElementById('vista-cliente-ativo');
const btnAbrirConta = document.getElementById('btn-abrir-conta');
const alertaStockContainer = document.getElementById('alerta-stock-container');

// Modal Nova Conta
const modalOverlay = document.getElementById('modal-overlay');
const formNovaConta = document.getElementById('form-nova-conta');
const inputNomeConta = document.getElementById('input-nome-conta');
const btnCancelarModal = document.getElementById('btn-cancelar-modal');

// Modal Adicionar Pedido
const modalAddPedidoOverlay = document.getElementById('modal-add-pedido-overlay');
const modalPedidoNomeConta = document.getElementById('modal-pedido-nome-conta');
const formAddPedido = document.getElementById('form-add-pedido');
const hiddenContaId = document.getElementById('hidden-conta-id');
const selectProduto = document.getElementById('select-produto');
const inputQuantidade = document.getElementById('input-quantidade');
const btnCancelarPedidoModal = document.getElementById('btn-cancelar-pedido-modal');

// Modal de Pagamento
const modalPagamentoOverlay = document.getElementById('modal-pagamento-overlay');
const pagamentoContaIdInput = document.getElementById('pagamento-conta-id');
const pagamentoNomeContaSpan = document.getElementById('pagamento-nome-conta');
const pagamentoTotalSpan = document.getElementById('pagamento-total');
const pagamentoMetodosContainer = document.getElementById('pagamento-metodos-container');
const btnCancelarPagamentoModal = document.getElementById('btn-cancelar-pagamento-modal');
const btnConfirmarPagamento = document.getElementById('btn-confirmar-pagamento');

// Notificação Toast
const toastNotificacao = document.getElementById('toast-notificacao');
let toastTimeout;


// ===================================
// 3. FUNÇÕES PRINCIPAIS
// ===================================

/**
 * Exibe uma notificação Toast na tela.
 * @param {string} mensagem O texto a ser exibido.
 * @param {string} tipo 'sucesso' (verde) ou 'erro' (vermelho).
 */
function mostrarNotificacao(mensagem, tipo = 'sucesso') {
    clearTimeout(toastTimeout);

    toastNotificacao.textContent = mensagem;

    toastNotificacao.classList.remove('bg-green-500', 'bg-red-500');
    if (tipo === 'sucesso') {
        toastNotificacao.classList.add('bg-green-500');
    } else {
        toastNotificacao.classList.add('bg-red-500');
    }

    toastNotificacao.classList.remove('hidden', 'opacity-0');

    toastTimeout = setTimeout(() => {
        toastNotificacao.classList.add('opacity-0');
        toastNotificacao.addEventListener('transitionend', () => {
            toastNotificacao.classList.add('hidden');
        }, { once: true });
    }, 3000);
}

/**
 * LÓGICA DE NAVEGAÇÃO
 */
function navigateToTab(tabId) {
    tabContents.forEach(tab => tab.classList.add('hidden'));
    bottomNav.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active', 'text-blue-500', 'border-blue-500');
        btn.classList.add('text-gray-500', 'border-transparent');
    });
    document.getElementById(tabId).classList.remove('hidden');
    const activeButton = document.querySelector(`.nav-btn[data-tab="${tabId}"]`);
    activeButton.classList.add('active', 'text-blue-500', 'border-blue-500');
    activeButton.classList.remove('text-gray-500', 'border-transparent');
}

/**
 * LÓGICA DA ABA DE ATENDIMENTO
 */
function renderizarSeletorDeClientes() {
    const contasAtivas = estado.contasAtivas.filter(c => c.status === 'ativa');
    const clienteSelecionadoAnteriormente = seletorCliente.value;
    seletorCliente.innerHTML = '';

    if (contasAtivas.length === 0) {
        seletorCliente.innerHTML = '<option value="">Nenhum cliente ativo</option>';
        return;
    }

    contasAtivas.forEach(conta => {
        const option = document.createElement('option');
        option.value = conta.id;
        option.textContent = conta.nome;
        seletorCliente.appendChild(option);
    });

    if (contasAtivas.some(c => c.id == clienteSelecionadoAnteriormente)) {
        seletorCliente.value = clienteSelecionadoAnteriormente;
    }
}

function renderizarVistaClienteAtivo() {
    const idContaSelecionada = parseInt(seletorCliente.value);
    const conta = estado.contasAtivas.find(c => c.id === idContaSelecionada);

    if (!conta) {
        vistaClienteAtivo.innerHTML = '<p class="text-center text-gray-500 py-8">Selecione ou crie um cliente para iniciar o atendimento.</p>';
        return;
    }

    let pedidosHTML = '';
    if (conta.pedidos.length === 0) {
        pedidosHTML = '<p class="text-center text-gray-500 py-4">Nenhum pedido nesta conta.</p>';
    } else {
        conta.pedidos.forEach(pedido => {
            pedidosHTML += `
                <div class="flex justify-between items-center py-2 border-b">
                    <span>${pedido.qtd}x ${pedido.nome}</span>
                    <span class="font-semibold">${(pedido.preco * pedido.qtd).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                </div>
            `;
        });
    }

    const subtotal = conta.pedidos.reduce((total, p) => total + (p.preco * p.qtd), 0);
    
    const vistaHTML = `
        <div class="bg-white p-4 rounded-lg shadow-md">
             <div class="cartao-header flex justify-between items-baseline border-b pb-2 mb-4">
                <div class="cartao-titulo flex items-center gap-2">
                    <h3 class="text-xl font-bold">${conta.nome}</h3>
                    <button class="btn-icon btn-editar-nome text-lg" data-id="${conta.id}" title="Editar Nome">✏️</button>
                </div>
            </div>
            <div class="mb-4">
                ${pedidosHTML}
            </div>
            <div class="mt-4 pt-4 border-t">
                <div class="flex justify-between font-bold text-lg">
                    <span>Subtotal:</span>
                    <span>${subtotal.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                </div>
            </div>
            <div class="flex gap-2 mt-4">
                <button class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded btn-adicionar-pedido" data-id="${conta.id}">+ Adicionar Pedido</button>
                <button class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded btn-finalizar-pagamento" data-id="${conta.id}">Finalizar Pagamento</button>
            </div>
        </div>
    `;
    vistaClienteAtivo.innerHTML = vistaHTML;
}

// --- Funções de Controlo de Modais ---
function abrirModalNovaConta() {
    modalOverlay.classList.remove('hidden');
    inputNomeConta.focus();
}

function fecharModalNovaConta() {
    modalOverlay.classList.add('hidden');
    formNovaConta.reset();
}

function abrirModalAddPedido(idConta) {
    const conta = estado.contasAtivas.find(c => c.id === idConta);
    if (!conta) return;

    modalPedidoNomeConta.textContent = conta.nome;
    hiddenContaId.value = idConta;
    
    selectProduto.innerHTML = '<option value="">Selecione um produto...</option>';
    estado.inventario.forEach(item => {
        if (item.stock > 0) {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = `${item.nome} (${item.stock} disp.)`;
            selectProduto.appendChild(option);
        }
    });

    modalAddPedidoOverlay.classList.remove('hidden');
    inputQuantidade.focus();
}

function fecharModalAddPedido() {
    modalAddPedidoOverlay.classList.add('hidden');
    formAddPedido.reset();
}

function abrirModalPagamento(idConta) {
    const conta = estado.contasAtivas.find(c => c.id === idConta);
    if (!conta) return;

    const subtotal = conta.pedidos.reduce((total, p) => total + (p.preco * p.qtd), 0);
    const totalPagar = subtotal - (conta.caucao || 0);

    pagamentoContaIdInput.value = idConta;
    pagamentoNomeContaSpan.textContent = conta.nome;
    pagamentoTotalSpan.textContent = totalPagar.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    
    modalPagamentoOverlay.classList.remove('hidden');
}

function fecharModalPagamento() {
    modalPagamentoOverlay.classList.add('hidden');
    pagamentoMetodosContainer.querySelectorAll('.pagamento-metodo-btn').forEach(btn => {
        btn.classList.remove('border-blue-500', 'bg-blue-100', 'font-bold');
        btn.classList.add('border-gray-300');
    });
    btnConfirmarPagamento.disabled = true;
    btnConfirmarPagamento.classList.add('bg-blue-200', 'cursor-not-allowed');
    btnConfirmarPagamento.classList.remove('bg-blue-500', 'hover:bg-blue-600');
}


// --- Funções de Lógica de Negócio ---
function handleCriarNovaConta(event) {
    event.preventDefault();
    const nomeConta = inputNomeConta.value.trim();
    if (!nomeConta) {
        alert("O nome da conta não pode estar vazio.");
        return;
    }
    const maxId = estado.contasAtivas.reduce((max, c) => c.id > max ? c.id : max, 0);
    const novaConta = {
        id: maxId + 1,
        nome: nomeConta,
        caucao: estado.config.valorCaucaoPadrao,
        pedidos: [],
        dataAbertura: new Date(),
        status: 'ativa'
    };
    estado.contasAtivas.push(novaConta);
    fecharModalNovaConta();
    renderizarSeletorDeClientes();
    seletorCliente.value = novaConta.id;
    renderizarVistaClienteAtivo();
    mostrarNotificacao(`Conta "${nomeConta}" criada com sucesso!`);
}

function handleAddPedido(event) {
    event.preventDefault();
    const idConta = parseInt(hiddenContaId.value);
    const idProduto = selectProduto.value;
    const quantidade = parseInt(inputQuantidade.value);
    const conta = estado.contasAtivas.find(c => c.id === idConta);
    const produto = estado.inventario.find(p => p.id === idProduto);
    if (!conta || !produto || !quantidade) {
        alert("Por favor, preencha todos os campos.");
        return;
    }
    if (quantidade > produto.stock) {
        alert(`Stock insuficiente. Apenas ${produto.stock} unidades de ${produto.nome} disponíveis.`);
        return;
    }
    produto.stock -= quantidade;
    const pedidoExistente = conta.pedidos.find(p => p.nome === produto.nome);
    if (pedidoExistente) {
        pedidoExistente.qtd += quantidade;
    } else {
        conta.pedidos.push({
            nome: produto.nome,
            preco: produto.preco,
            qtd: quantidade
        });
    }
    fecharModalAddPedido();
    renderizarVistaClienteAtivo();
    verificarAlertasDeStock();
    mostrarNotificacao(`${quantidade}x ${produto.nome} adicionado(s)!`);
}

function handleEditarNomeConta(idConta) {
    const conta = estado.contasAtivas.find(c => c.id === idConta);
    if (!conta) return;
    const novoNome = prompt("Digite o novo nome para a conta:", conta.nome);
    if (novoNome && novoNome.trim() !== '') {
        conta.nome = novoNome.trim();
        renderizarSeletorDeClientes();
        renderizarVistaClienteAtivo();
        mostrarNotificacao(`Conta renomeada para "${novoNome}"!`);
    }
}

function handleFinalizarPagamento() {
    const idConta = parseInt(pagamentoContaIdInput.value);
    const metodoBtn = pagamentoMetodosContainer.querySelector('.border-blue-500');
    if (!metodoBtn) {
        alert("Por favor, selecione um método de pagamento.");
        return;
    }

    const metodoPagamento = metodoBtn.dataset.metodo;
    const conta = estado.contasAtivas.find(c => c.id === idConta);
    if (!conta) return;

    conta.status = 'fechada';
    conta.dataFecho = new Date();
    conta.metodoPagamento = metodoPagamento;
    conta.valorFinal = conta.pedidos.reduce((total, p) => total + (p.preco * p.qtd), 0) - (conta.caucao || 0);

    fecharModalPagamento();
    renderizarSeletorDeClientes();
    renderizarVistaClienteAtivo();
    mostrarNotificacao(`Conta "${conta.nome}" finalizada com sucesso!`);
}

function verificarAlertasDeStock() {
    const itensComStockBaixo = estado.inventario.filter(item => item.stock > 0 && item.stock <= item.stockMinimo);
    if (itensComStockBaixo.length > 0) {
        alertaStockContainer.textContent = `⚠️ Itens com Stock Baixo: ${itensComStockBaixo.length}`;
        alertaStockContainer.classList.remove('hidden');
    } else {
        alertaStockContainer.classList.add('hidden');
    }
}


function inicializarApp() {
    navigateToTab('tab-dashboard');
    renderizarSeletorDeClientes();
    renderizarVistaClienteAtivo();
    verificarAlertasDeStock();
}

// ===================================
// 4. EVENT LISTENERS
// ===================================
document.addEventListener('DOMContentLoaded', inicializarApp);

bottomNav.addEventListener('click', (event) => {
    const target = event.target.closest('.nav-btn');
    if (target) navigateToTab(target.dataset.tab);
});

seletorCliente.addEventListener('change', renderizarVistaClienteAtivo);

// Listeners do Modal de Nova Conta
btnAbrirConta.addEventListener('click', abrirModalNovaConta);
formNovaConta.addEventListener('submit', handleCriarNovaConta);
btnCancelarModal.addEventListener('click', fecharModalNovaConta);
modalOverlay.addEventListener('click', (event) => {
    if (event.target === modalOverlay) {
        fecharModalNovaConta();
    }
});

// Listeners do Modal Adicionar Pedido
formAddPedido.addEventListener('submit', handleAddPedido);
btnCancelarPedidoModal.addEventListener('click', fecharModalAddPedido);
modalAddPedidoOverlay.addEventListener('click', (event) => {
    if (event.target === modalAddPedidoOverlay) {
        fecharModalAddPedido();
    }
});

// Listeners do Modal de Pagamento
pagamentoMetodosContainer.addEventListener('click', (event) => {
    const target = event.target.closest('.pagamento-metodo-btn');
    if (!target) return;

    pagamentoMetodosContainer.querySelectorAll('.pagamento-metodo-btn').forEach(btn => {
        btn.classList.remove('border-blue-500', 'bg-blue-100', 'font-bold');
        btn.classList.add('border-gray-300');
    });
    
    target.classList.add('border-blue-500', 'bg-blue-100', 'font-bold');
    target.classList.remove('border-gray-300');

    btnConfirmarPagamento.disabled = false;
    btnConfirmarPagamento.classList.remove('bg-blue-200', 'cursor-not-allowed');
    btnConfirmarPagamento.classList.add('bg-blue-500', 'hover:bg-blue-600');
});

btnConfirmarPagamento.addEventListener('click', handleFinalizarPagamento);
btnCancelarPagamentoModal.addEventListener('click', fecharModalPagamento);
modalPagamentoOverlay.addEventListener('click', (event) => {
    if (event.target === modalPagamentoOverlay) {
        fecharModalPagamento();
    }
});

// Listener principal para a vista do cliente
vistaClienteAtivo.addEventListener('click', (event) => {
    const target = event.target.closest('button');
    if (!target) return;
    
    const idConta = parseInt(seletorCliente.value);

    if (target.classList.contains('btn-adicionar-pedido')) {
        abrirModalAddPedido(idConta);
    }
    if (target.classList.contains('btn-finalizar-pagamento')) {
        abrirModalPagamento(idConta);
    }
    if (target.classList.contains('btn-editar-nome')) {
        handleEditarNomeConta(idConta);
    }
});