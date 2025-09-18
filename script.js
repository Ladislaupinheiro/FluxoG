'use strict';

// ===================================
// 1. GESTÃO DE ESTADO (STATE)
// ===================================
const estado = {
    contasAtivas: [],
    inventario: [],
    historicoFechos: [],
    config: {}
};

// ===================================
// 2. SELETORES DE ELEMENTOS DO DOM
// ===================================
// Navegação e Abas
const bottomNav = document.getElementById('bottom-nav');
const tabContents = document.querySelectorAll('.tab-content');

// Aba Dashboard
const dbVendasHoje = document.getElementById('db-vendas-hoje');
const dbContasAtivas = document.getElementById('db-contas-ativas');
const dbAlertasStock = document.getElementById('db-alertas-stock');

// Aba Atendimento
const seletorCliente = document.getElementById('seletor-cliente');
const vistaClienteAtivo = document.getElementById('vista-cliente-ativo');
const btnAbrirConta = document.getElementById('btn-abrir-conta');
const alertaStockContainer = document.getElementById('alerta-stock-container');

// Aba Inventário
const btnAddProduto = document.getElementById('btn-add-produto');
const listaInventario = document.getElementById('lista-inventario');
const inputBuscaInventario = document.getElementById('input-busca-inventario');

// Aba Fluxo de Caixa
const btnFechoGlobal = document.getElementById('btn-fecho-global');

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

// Modal Adicionar Produto
const modalAddProdutoOverlay = document.getElementById('modal-add-produto-overlay');
const formAddProduto = document.getElementById('form-add-produto');
const inputProdutoNome = document.getElementById('input-produto-nome');
const inputProdutoPreco = document.getElementById('input-produto-preco');
const inputProdutoStock = document.getElementById('input-produto-stock');
const inputProdutoStockMinimo = document.getElementById('input-produto-stock-minimo');
const btnCancelarAddProdutoModal = document.getElementById('btn-cancelar-add-produto-modal');

// Modal Editar Produto
const modalEditProdutoOverlay = document.getElementById('modal-edit-produto-overlay');
const formEditProduto = document.getElementById('form-edit-produto');
const hiddenEditProdutoId = document.getElementById('hidden-edit-produto-id');
const inputEditProdutoNome = document.getElementById('input-edit-produto-nome');
const inputEditProdutoPreco = document.getElementById('input-edit-produto-preco');
const inputEditProdutoStock = document.getElementById('input-edit-produto-stock');
const inputEditProdutoStockMinimo = document.getElementById('input-edit-produto-stock-minimo');
const btnCancelarEditProdutoModal = document.getElementById('btn-cancelar-edit-produto-modal');

// Modal Editar Nome da Conta
const modalEditNomeOverlay = document.getElementById('modal-edit-nome-overlay');
const formEditNome = document.getElementById('form-edit-nome');
const hiddenEditNomeId = document.getElementById('hidden-edit-nome-id');
const inputEditNome = document.getElementById('input-edit-nome');
const btnCancelarEditNomeModal = document.getElementById('btn-cancelar-edit-nome-modal');

// Modal Adicionar Stock
const modalAddStockOverlay = document.getElementById('modal-add-stock-overlay');
const formAddStock = document.getElementById('form-add-stock');
const hiddenAddStockId = document.getElementById('hidden-add-stock-id');
const addStockNomeProduto = document.getElementById('add-stock-nome-produto');
const inputAddStockQuantidade = document.getElementById('input-add-stock-quantidade');
const btnCancelarAddStockModal = document.getElementById('btn-cancelar-add-stock-modal');

// Modal Fecho Global
const modalFechoGlobalOverlay = document.getElementById('modal-fecho-global-overlay');
const fgDataRelatorio = document.getElementById('fg-data-relatorio');
const fgTotalVendido = document.getElementById('fg-total-vendido');
const fgTotalNumerario = document.getElementById('fg-total-numerario');
const fgTotalTpa = document.getElementById('fg-total-tpa');
const fgContasFechadas = document.getElementById('fg-contas-fechadas');
const fgMediaPorConta = document.getElementById('fg-media-por-conta');
const fgListaProdutos = document.getElementById('fg-lista-produtos');
const btnArquivarDia = document.getElementById('btn-arquivar-dia');
const btnCancelarFechoGlobalModal = document.getElementById('btn-cancelar-fecho-global-modal');

// Notificação Toast
const toastNotificacao = document.getElementById('toast-notificacao');
let toastTimeout;


// ===================================
// 3. FUNÇÕES PRINCIPAIS
// ===================================

function salvarEstado() {
    localStorage.setItem('gestorBarEstado', JSON.stringify(estado));
}

function carregarEstado() {
    const estadoSalvo = localStorage.getItem('gestorBarEstado');
    if (estadoSalvo) {
        Object.assign(estado, JSON.parse(estadoSalvo));
    }
}

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

function renderizarDashboard() {
    const contasFechadas = estado.contasAtivas.filter(c => c.status === 'fechada');
    const totalVendas = contasFechadas.reduce((total, conta) => total + (conta.valorFinal || 0), 0);
    dbVendasHoje.textContent = totalVendas.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });

    const contasAtivas = estado.contasAtivas.filter(c => c.status === 'ativa');
    dbContasAtivas.textContent = contasAtivas.length;

    const itensComStockBaixo = estado.inventario.filter(item => item.stockAtual > 0 && item.stockAtual <= item.stockMinimo);
    dbAlertasStock.textContent = itensComStockBaixo.length;
}

function atualizarTodaUI() {
    renderizarDashboard();
    renderizarSeletorDeClientes();
    renderizarVistaClienteAtivo();
    renderizarInventario();
    verificarAlertasDeStock();
}

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
        conta.pedidos.forEach((pedido, index) => {
            pedidosHTML += `
                <div class="flex justify-between items-center py-2 border-b">
                    <span>${pedido.qtd}x ${pedido.nome}</span>
                    <div class="flex items-center gap-4">
                        <span class="font-semibold">${(pedido.preco * pedido.qtd).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                        <button class="btn-icon btn-remover-item text-red-500 hover:text-red-700" data-index="${index}" data-id="${conta.id}" title="Remover Item">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            `;
        });
    }
    const subtotal = conta.pedidos.reduce((total, p) => total + (p.preco * p.qtd), 0);
    const contaEstaVazia = conta.pedidos.length === 0;
    const vistaHTML = `
        <div class="bg-white p-4 rounded-lg shadow-md">
             <div class="cartao-header flex justify-between items-center border-b pb-2 mb-4">
                <div class="cartao-titulo flex items-center gap-2">
                    <h3 class="text-xl font-bold">${conta.nome}</h3>
                    <button class="btn-icon btn-editar-nome text-lg text-gray-500 hover:text-blue-500" data-id="${conta.id}" title="Editar Nome">
                        <i class="fas fa-pencil-alt"></i>
                    </button>
                </div>
            </div>
            <div class="mb-4">${pedidosHTML}</div>
            <div class="mt-4 pt-4 border-t">
                <div class="flex justify-between font-bold text-lg">
                    <span>Subtotal:</span>
                    <span>${subtotal.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                </div>
            </div>
            <div class="flex gap-2 mt-4">
                <button class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded btn-adicionar-pedido" data-id="${conta.id}">+ Adicionar Pedido</button>
                <button class="w-full text-white font-bold py-2 px-4 rounded btn-finalizar-pagamento ${contaEstaVazia ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}" 
                        data-id="${conta.id}" ${contaEstaVazia ? 'disabled' : ''}>
                    Finalizar Pagamento
                </button>
            </div>
        </div>
    `;
    vistaClienteAtivo.innerHTML = vistaHTML;
}

function renderizarInventario() {
    const termoBusca = inputBuscaInventario.value.toLowerCase().trim();
    const inventarioParaMostrar = estado.inventario.filter(item => 
        item.nome.toLowerCase().includes(termoBusca)
    );
    listaInventario.innerHTML = '';
    if (inventarioParaMostrar.length === 0) {
        if (termoBusca) {
            listaInventario.innerHTML = `<p class="text-center text-gray-500 py-8">Nenhum produto encontrado para "${inputBuscaInventario.value}".</p>`;
        } else {
            listaInventario.innerHTML = '<p class="text-center text-gray-500 py-8">Nenhum produto no inventário.</p>';
        }
        return;
    }
    const inventoryHTML = inventarioParaMostrar.map(item => {
        const vendidos = (item.stockInicial + item.entradas) - item.stockAtual;
        const isLowStock = item.stockAtual > 0 && item.stockAtual <= item.stockMinimo;
        const destaqueClasse = isLowStock ? 'border-2 border-red-500 bg-red-50' : 'shadow-md';

        return `
        <div class="bg-white p-4 rounded-lg ${destaqueClasse}">
            <div class="flex justify-between items-start">
                <div>
                    <p class="font-bold text-lg">${item.nome}</p>
                    <p class="text-sm text-gray-600">Preço: ${item.preco.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p>
                </div>
                <div class="flex gap-4">
                    <button class="btn-icon btn-add-stock text-2xl text-green-500 hover:text-green-700" data-id="${item.id}" title="Adicionar Stock">
                        <i class="fas fa-plus-circle"></i>
                    </button>
                    <button class="btn-icon btn-edit-produto text-2xl text-gray-500 hover:text-blue-500" data-id="${item.id}" title="Editar Produto">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </div>
            <div class="mt-4 pt-2 border-t grid grid-cols-4 text-center">
                <div><p class="text-xs text-gray-500">Inicial</p><p class="font-semibold">${item.stockInicial}</p></div>
                <div><p class="text-xs text-blue-500">Entradas</p><p class="font-semibold text-blue-500">+${item.entradas}</p></div>
                <div><p class="text-xs text-red-500">Vendido</p><p class="font-semibold text-red-500">${vendidos}</p></div>
                <div><p class="text-xs text-green-600">Atual</p><p class="font-bold text-lg text-green-600">${item.stockAtual}</p></div>
            </div>
        </div>
    `}).join('');
    listaInventario.innerHTML = `<div class="space-y-4">${inventoryHTML}</div>`;
}

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
        if (item.stockAtual > 0) {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = `${item.nome} (${item.stockAtual} disp.)`;
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
    const totalPagar = conta.pedidos.reduce((total, p) => total + (p.preco * p.qtd), 0);
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
    btnConfirmarPagamento.classList.remove('bg-blue-500', 'hover:bg-blue-600');
    btnConfirmarPagamento.classList.add('bg-gray-400', 'cursor-not-allowed');
}
function abrirModalAddProduto() {
    modalAddProdutoOverlay.classList.remove('hidden');
    inputProdutoNome.focus();
}
function fecharModalAddProduto() {
    modalAddProdutoOverlay.classList.add('hidden');
    formAddProduto.reset();
}
function abrirModalEditProduto(produtoId) {
    const produto = estado.inventario.find(p => p.id === produtoId);
    if (!produto) return;
    hiddenEditProdutoId.value = produto.id;
    inputEditProdutoNome.value = produto.nome;
    inputEditProdutoPreco.value = produto.preco;
    inputEditProdutoStock.value = produto.stockAtual;
    inputEditProdutoStockMinimo.value = produto.stockMinimo;
    modalEditProdutoOverlay.classList.remove('hidden');
    inputEditProdutoNome.focus();
}
function fecharModalEditProduto() {
    modalEditProdutoOverlay.classList.add('hidden');
    formEditProduto.reset();
}
function abrirModalEditNome(idConta) {
    const conta = estado.contasAtivas.find(c => c.id === idConta);
    if (!conta) return;
    hiddenEditNomeId.value = idConta;
    inputEditNome.value = conta.nome;
    modalEditNomeOverlay.classList.remove('hidden');
    inputEditNome.focus();
}
function fecharModalEditNome() {
    modalEditNomeOverlay.classList.add('hidden');
    formEditNome.reset();
}
function abrirModalAddStock(produtoId) {
    const produto = estado.inventario.find(p => p.id === produtoId);
    if (!produto) return;
    hiddenAddStockId.value = produto.id;
    addStockNomeProduto.textContent = produto.nome;
    modalAddStockOverlay.classList.remove('hidden');
    inputAddStockQuantidade.focus();
}
function fecharModalAddStock() {
    modalAddStockOverlay.classList.add('hidden');
    formAddStock.reset();
}
function calcularRelatorioDia() {
    const hoje = new Date();
    const contasFechadasHoje = estado.contasAtivas.filter(c => {
        if (c.status !== 'fechada' || !c.dataFecho) return false;
        const dataFecho = new Date(c.dataFecho);
        return dataFecho.toDateString() === hoje.toDateString();
    });
    const totalVendido = contasFechadasHoje.reduce((sum, conta) => sum + conta.valorFinal, 0);
    const totalNumerario = contasFechadasHoje.filter(c => c.metodoPagamento === 'Numerário').reduce((sum, conta) => sum + conta.valorFinal, 0);
    const totalTpa = contasFechadasHoje.filter(c => c.metodoPagamento === 'TPA').reduce((sum, conta) => sum + conta.valorFinal, 0);
    const numContasFechadas = contasFechadasHoje.length;
    const mediaPorConta = numContasFechadas > 0 ? totalVendido / numContasFechadas : 0;
    const produtosVendidos = {};
    contasFechadasHoje.forEach(conta => {
        conta.pedidos.forEach(pedido => {
            produtosVendidos[pedido.nome] = (produtosVendidos[pedido.nome] || 0) + pedido.qtd;
        });
    });
    return { data: hoje, totalVendido, totalNumerario, totalTpa, numContasFechadas, mediaPorConta, produtosVendidos };
}
function renderizarRelatorioFechoGlobal() {
    const relatorio = calcularRelatorioDia();
    fgDataRelatorio.textContent = relatorio.data.toLocaleDateString('pt-PT', { dateStyle: 'full' });
    fgTotalVendido.textContent = relatorio.totalVendido.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    fgTotalNumerario.textContent = relatorio.totalNumerario.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    fgTotalTpa.textContent = relatorio.totalTpa.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    fgContasFechadas.textContent = relatorio.numContasFechadas;
    fgMediaPorConta.textContent = relatorio.mediaPorConta.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    fgListaProdutos.innerHTML = '';
    if (Object.keys(relatorio.produtosVendidos).length === 0) {
        fgListaProdutos.innerHTML = '<span>Nenhum produto vendido hoje.</span>';
    } else {
        for (const [nome, qtd] of Object.entries(relatorio.produtosVendidos)) {
            const produtoHTML = `<div class="flex justify-between"><span class="font-semibold">${qtd}x</span><span>${nome}</span></div>`;
            fgListaProdutos.insertAdjacentHTML('beforeend', produtoHTML);
        }
    }
}
function abrirModalFechoGlobal() {
    renderizarRelatorioFechoGlobal();
    modalFechoGlobalOverlay.classList.remove('hidden');
}
function fecharModalFechoGlobal() {
    modalFechoGlobalOverlay.classList.add('hidden');
}

function handleCriarNovaConta(event) {
    event.preventDefault();
    const nomeConta = inputNomeConta.value.trim();
    if (!nomeConta) { mostrarNotificacao("O nome da conta não pode estar vazio.", "erro"); return; }
    const nomeNormalizado = nomeConta.toLowerCase();
    if (estado.contasAtivas.some(c => c.status === 'ativa' && c.nome.toLowerCase() === nomeNormalizado)) {
        mostrarNotificacao(`Já existe uma conta ativa com o nome "${nomeConta}".`, "erro");
        return;
    }
    const maxId = estado.contasAtivas.reduce((max, c) => c.id > max ? c.id : max, 0);
    const novaConta = { id: maxId + 1, nome: nomeConta, pedidos: [], dataAbertura: new Date(), status: 'ativa' };
    estado.contasAtivas.push(novaConta);
    fecharModalNovaConta();
    seletorCliente.value = novaConta.id;
    atualizarTodaUI();
    salvarEstado();
    mostrarNotificacao(`Conta "${nomeConta}" criada com sucesso!`);
}
function handleAddPedido(event) {
    event.preventDefault();
    const idConta = parseInt(hiddenContaId.value);
    const idProduto = selectProduto.value;
    const quantidade = parseInt(inputQuantidade.value);
    const conta = estado.contasAtivas.find(c => c.id === idConta);
    const produto = estado.inventario.find(p => p.id === idProduto);
    if (!conta || !produto || !quantidade) { mostrarNotificacao("Por favor, preencha todos os campos.", "erro"); return; }
    if (quantidade <= 0) { mostrarNotificacao("A quantidade deve ser positiva.", "erro"); return; }
    if (quantidade > produto.stockAtual) { mostrarNotificacao(`Stock insuficiente. Apenas ${produto.stockAtual} unidades de ${produto.nome} disponíveis.`, "erro"); return; }
    produto.stockAtual -= quantidade;
    const pedidoExistente = conta.pedidos.find(p => p.produtoId === produto.id);
    if (pedidoExistente) {
        pedidoExistente.qtd += quantidade;
    } else {
        conta.pedidos.push({ produtoId: produto.id, nome: produto.nome, preco: produto.preco, qtd: quantidade });
    }
    fecharModalAddPedido();
    atualizarTodaUI();
    salvarEstado();
    mostrarNotificacao(`${quantidade}x ${produto.nome} adicionado(s)!`);
}
function handleSalvarNovoNome(event) {
    event.preventDefault();
    const idConta = parseInt(hiddenEditNomeId.value);
    const novoNome = inputEditNome.value.trim();
    const conta = estado.contasAtivas.find(c => c.id === idConta);
    if (!conta || !novoNome) { mostrarNotificacao("O nome não pode estar vazio.", "erro"); return; }
    conta.nome = novoNome;
    fecharModalEditNome();
    atualizarTodaUI();
    salvarEstado();
    mostrarNotificacao(`Conta renomeada para "${novoNome}"!`);
}
function handleFinalizarPagamento() {
    const idConta = parseInt(pagamentoContaIdInput.value);
    const metodoBtn = pagamentoMetodosContainer.querySelector('.border-blue-500');
    if (!metodoBtn) { mostrarNotificacao("Por favor, selecione um método de pagamento.", "erro"); return; }
    const metodoPagamento = metodoBtn.dataset.metodo;
    const conta = estado.contasAtivas.find(c => c.id === idConta);
    if (!conta) return;
    conta.status = 'fechada';
    conta.dataFecho = new Date();
    conta.metodoPagamento = metodoPagamento;
    conta.valorFinal = conta.pedidos.reduce((total, p) => total + (p.preco * p.qtd), 0);
    fecharModalPagamento();
    atualizarTodaUI();
    salvarEstado();
    mostrarNotificacao(`Conta "${conta.nome}" finalizada com sucesso!`);
}
function handleAddProduto(event) {
    event.preventDefault();
    const nome = inputProdutoNome.value.trim();
    const preco = parseFloat(inputProdutoPreco.value);
    const stock = parseInt(inputProdutoStock.value);
    const stockMinimo = parseInt(inputProdutoStockMinimo.value);
    if (!nome || preco <= 0 || stock < 0 || stockMinimo < 0 || isNaN(preco) || isNaN(stock) || isNaN(stockMinimo)) { mostrarNotificacao("Dados inválidos. Verifique os valores.", "erro"); return; }
    const novoProduto = { id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, nome, preco, stockInicial: stock, stockAtual: stock, entradas: 0, stockMinimo };
    estado.inventario.push(novoProduto);
    fecharModalAddProduto();
    atualizarTodaUI();
    salvarEstado();
    mostrarNotificacao(`Produto "${nome}" adicionado com sucesso!`);
}
function handleEditProduto(event) {
    event.preventDefault();
    const id = hiddenEditProdutoId.value;
    const produto = estado.inventario.find(p => p.id === id);
    if (!produto) { mostrarNotificacao("Produto não encontrado.", "erro"); return; }
    const nome = inputEditProdutoNome.value.trim();
    const preco = parseFloat(inputEditProdutoPreco.value);
    const stockAtualNovo = parseInt(inputEditProdutoStock.value);
    const stockMinimo = parseInt(inputEditProdutoStockMinimo.value);
    if (!nome || preco <= 0 || stockAtualNovo < 0 || stockMinimo < 0 || isNaN(preco) || isNaN(stockAtualNovo) || isNaN(stockMinimo)) { mostrarNotificacao("Dados inválidos. Verifique os valores.", "erro"); return; }
    const diferencaStock = stockAtualNovo - produto.stockAtual;
    produto.nome = nome;
    produto.preco = preco;
    produto.stockAtual = stockAtualNovo;
    produto.entradas += diferencaStock;
    produto.stockMinimo = stockMinimo;
    fecharModalEditProduto();
    atualizarTodaUI();
    salvarEstado();
    mostrarNotificacao(`Produto "${nome}" atualizado com sucesso!`);
}
function handleAddStock(event) {
    event.preventDefault();
    const produtoId = hiddenAddStockId.value;
    const produto = estado.inventario.find(p => p.id === produtoId);
    if (!produto) return;
    const quantidade = parseInt(inputAddStockQuantidade.value);
    if (isNaN(quantidade) || quantidade <= 0) { mostrarNotificacao("Por favor, insira um número válido e positivo.", "erro"); return; }
    produto.entradas += quantidade;
    produto.stockAtual += quantidade;
    fecharModalAddStock();
    atualizarTodaUI();
    salvarEstado();
    mostrarNotificacao(`${quantidade} un. adicionadas ao stock de ${produto.nome}!`);
}
function handleRemoverItem(idConta, itemIndex) {
    const conta = estado.contasAtivas.find(c => c.id === idConta);
    if (!conta) return;
    const pedidoRemovido = conta.pedidos[itemIndex];
    if(!pedidoRemovido) return;
    const produtoInventario = estado.inventario.find(p => p.id === pedidoRemovido.produtoId);
    if (produtoInventario) {
        produtoInventario.stockAtual += pedidoRemovido.qtd;
    }
    conta.pedidos.splice(itemIndex, 1);
    atualizarTodaUI();
    salvarEstado();
    mostrarNotificacao("Item removido com sucesso.");
}
function handleEditarNomeConta(idConta) {
    abrirModalEditNome(idConta);
}
function handleArquivarDia() {
    const confirmou = confirm("Tem a certeza que deseja arquivar o dia e iniciar um novo? Esta ação não pode ser desfeita e irá reiniciar o seu inventário para o dia seguinte.");
    if (!confirmou) return;
    const relatorio = calcularRelatorioDia();
    if (!estado.historicoFechos) { estado.historicoFechos = []; }
    estado.historicoFechos.push(relatorio);
    estado.contasAtivas = estado.contasAtivas.filter(c => c.status === 'ativa');
    estado.inventario.forEach(item => {
        item.stockInicial = item.stockAtual;
        item.entradas = 0;
    });
    fecharModalFechoGlobal();
    atualizarTodaUI();
    salvarEstado();
    mostrarNotificacao("Dia arquivado com sucesso. Pronto para um novo dia!");
}
function verificarAlertasDeStock() {
    const itensComStockBaixo = estado.inventario.filter(item => item.stockAtual > 0 && item.stockAtual <= item.stockMinimo);
    if (itensComStockBaixo.length > 0) {
        alertaStockContainer.textContent = `⚠️ Itens com Stock Baixo: ${itensComStockBaixo.length}`;
        alertaStockContainer.classList.remove('hidden');
    } else {
        alertaStockContainer.classList.add('hidden');
    }
}
function inicializarApp() {
    carregarEstado();
    navigateToTab('tab-dashboard');
    atualizarTodaUI();
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
vistaClienteAtivo.addEventListener('click', (event) => {
    const target = event.target.closest('button');
    if (!target) return;
    const idConta = parseInt(target.dataset.id);
    if (target.classList.contains('btn-adicionar-pedido')) { abrirModalAddPedido(idConta); }
    if (target.classList.contains('btn-finalizar-pagamento')) { abrirModalPagamento(idConta); }
    if (target.classList.contains('btn-editar-nome')) { handleEditarNomeConta(idConta); }
    if (target.classList.contains('btn-remover-item')) {
        const itemIndex = parseInt(target.dataset.index);
        handleRemoverItem(idConta, itemIndex);
    }
});
btnAbrirConta.addEventListener('click', abrirModalNovaConta);
formNovaConta.addEventListener('submit', handleCriarNovaConta);
btnCancelarModal.addEventListener('click', fecharModalNovaConta);
modalOverlay.addEventListener('click', (event) => { if (event.target === modalOverlay) { fecharModalNovaConta(); } });
formAddPedido.addEventListener('submit', handleAddPedido);
btnCancelarPedidoModal.addEventListener('click', fecharModalAddPedido);
modalAddPedidoOverlay.addEventListener('click', (event) => { if (event.target === modalAddPedidoOverlay) { fecharModalAddPedido(); } });
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
    btnConfirmarPagamento.classList.remove('bg-gray-400', 'cursor-not-allowed');
    btnConfirmarPagamento.classList.add('bg-blue-500', 'hover:bg-blue-600');
});
btnConfirmarPagamento.addEventListener('click', handleFinalizarPagamento);
btnCancelarPagamentoModal.addEventListener('click', fecharModalPagamento);
modalPagamentoOverlay.addEventListener('click', (event) => { if (event.target === modalPagamentoOverlay) { fecharModalPagamento(); } });
btnAddProduto.addEventListener('click', abrirModalAddProduto);
formAddProduto.addEventListener('submit', handleAddProduto);
btnCancelarAddProdutoModal.addEventListener('click', fecharModalAddProduto);
modalAddProdutoOverlay.addEventListener('click', (event) => { if (event.target === modalAddProdutoOverlay) { fecharModalAddProduto(); } });
formEditProduto.addEventListener('submit', handleEditProduto);
btnCancelarEditProdutoModal.addEventListener('click', fecharModalEditProduto);
modalEditProdutoOverlay.addEventListener('click', (event) => { if (event.target === modalEditProdutoOverlay) { fecharModalEditProduto(); } });
listaInventario.addEventListener('click', (event) => {
    const target = event.target.closest('button');
    if (!target) return;
    const produtoId = target.dataset.id;
    if (target.classList.contains('btn-edit-produto')) {
        abrirModalEditProduto(produtoId);
    }
    if (target.classList.contains('btn-add-stock')) {
        abrirModalAddStock(produtoId);
    }
});
inputBuscaInventario.addEventListener('input', renderizarInventario);
btnFechoGlobal.addEventListener('click', abrirModalFechoGlobal);
btnCancelarFechoGlobalModal.addEventListener('click', fecharModalFechoGlobal);
btnArquivarDia.addEventListener('click', handleArquivarDia);
formEditNome.addEventListener('submit', handleSalvarNovoNome);
btnCancelarEditNomeModal.addEventListener('click', fecharModalEditNome);
modalEditNomeOverlay.addEventListener('click', (event) => { if (event.target === modalEditNomeOverlay) { fecharModalEditNome(); } });
formAddStock.addEventListener('submit', handleAddStock);
btnCancelarAddStockModal.addEventListener('click', fecharModalAddStock);
modalAddStockOverlay.addEventListener('click', (event) => { if (event.target === modalAddStockOverlay) { fecharModalAddStock(); } });