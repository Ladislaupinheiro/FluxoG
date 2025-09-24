// /modules/selectors.js - Centraliza a seleção de todos os elementos do DOM (v5.0)
'use strict';

// Os seletores são declarados com `let` para que possam ser inicializados mais tarde.
export let appContainer, bottomNav, tabContents, dbVendasTotal, dbVendasNumerario, 
    dbVendasTpa, dbContasAtivas, dbAlertasStock, dbTopProdutoNome, dbTopProdutoQtd, 
    seletorCliente, vistaClienteAtivo, btnAbrirConta, alertaStockContainer, 
    btnAddProduto, listaInventario, inputBuscaInventario, btnVerFechoDiaAtual, 
    calendarioTitulo, calendarioGridDias, btnMesAnterior, btnMesSeguinte, 
    modalOverlay, formNovaConta, inputNomeConta, btnCancelarModal, modalAddPedidoOverlay, 
    modalPedidoNomeConta, formAddPedido, hiddenContaId, inputQuantidade, 
    btnCancelarPedidoModal, inputBuscaProdutoPedido, autocompleteResults, 
    modalPagamentoOverlay, pagamentoContaIdInput, pagamentoNomeContaSpan, 
    pagamentoTotalSpan, pagamentoMetodosContainer, btnCancelarPagamentoModal, 
    btnConfirmarPagamento, modalAddProdutoOverlay, formAddProduto, inputProdutoNome, 
    inputProdutoPreco, inputProdutoStock, inputProdutoStockMinimo, 
    btnCancelarAddProdutoModal, modalEditProdutoOverlay, formEditProduto, 
    hiddenEditProdutoId, inputEditProdutoNome, inputEditProdutoPreco, 
    inputEditProdutoStockMinimo, btnCancelarEditProdutoModal, modalEditNomeOverlay, 
    formEditNome, hiddenEditNomeId, inputEditNome, btnCancelarEditNomeModal, 
    modalAddStockOverlay, formAddStock, hiddenAddStockId, addStockNomeProduto, 
    inputAddStockQuantidade, btnCancelarAddStockModal, modalMoverStockOverlay, 
    formMoverStock, hiddenMoverStockId, moverStockNomeProduto, moverStockArmazemQtd, 
    moverStockGeleiraQtd, inputMoverStockQuantidade, btnCancelarMoverStockModal, 
    modalFechoGlobalOverlay, fgDataRelatorio, fgTotalVendido, fgTotalNumerario, 
    fgTotalTpa, fgContasFechadas, fgMediaPorConta, fgListaProdutos, btnArquivarDia, 
    btnCancelarFechoGlobalModal, btnExportarPdf, btnExportarXls, 
    modalConfirmacaoOverlay, modalConfirmacaoTitulo, modalConfirmacaoMensagem, 
    btnCancelarConfirmacaoModal, btnConfirmarConfirmacaoModal, toastNotificacao, 
    offlineIndicator, modalAtivacao, formAtivacao, inputChaveLicenca, 
    mensagemErroAtivacao, modalCriarSenha, formCriarSenha, inputCriarPin, 
    inputConfirmarPin, mensagemErroCriarSenha, modalInserirSenha, formInserirSenha, 
    inputInserirPin, mensagemErroInserirSenha, btnEsqueciSenha;

/**
 * Inicializa todos os seletores do DOM.
 * Deve ser chamada apenas após o evento 'DOMContentLoaded'.
 */
export function inicializarSeletores() {
    appContainer = document.getElementById('app-container');
    bottomNav = document.getElementById('bottom-nav');
    tabContents = document.querySelectorAll('.tab-content');
    dbVendasTotal = document.getElementById('db-vendas-total');
    dbVendasNumerario = document.getElementById('db-vendas-numerario');
    dbVendasTpa = document.getElementById('db-vendas-tpa');
    dbContasAtivas = document.getElementById('db-contas-ativas');
    dbAlertasStock = document.getElementById('db-alertas-stock');
    dbTopProdutoNome = document.getElementById('db-top-produto-nome');
    dbTopProdutoQtd = document.getElementById('db-top-produto-qtd');
    seletorCliente = document.getElementById('seletor-cliente');
    vistaClienteAtivo = document.getElementById('vista-cliente-ativo');
    btnAbrirConta = document.getElementById('btn-abrir-conta');
    alertaStockContainer = document.getElementById('alerta-stock-container');
    btnAddProduto = document.getElementById('btn-add-produto');
    listaInventario = document.getElementById('lista-inventario');
    inputBuscaInventario = document.getElementById('input-busca-inventario');
    btnVerFechoDiaAtual = document.getElementById('btn-ver-fecho-dia-atual');
    calendarioTitulo = document.getElementById('calendario-titulo');
    calendarioGridDias = document.getElementById('calendario-grid-dias');
    btnMesAnterior = document.getElementById('btn-mes-anterior');
    btnMesSeguinte = document.getElementById('btn-mes-seguinte');
    modalOverlay = document.getElementById('modal-overlay');
    formNovaConta = document.getElementById('form-nova-conta');
    inputNomeConta = document.getElementById('input-nome-conta');
    modalAddPedidoOverlay = document.getElementById('modal-add-pedido-overlay');
    modalPedidoNomeConta = document.getElementById('modal-pedido-nome-conta');
    formAddPedido = document.getElementById('form-add-pedido');
    hiddenContaId = document.getElementById('hidden-conta-id');
    inputQuantidade = document.getElementById('input-quantidade');
    inputBuscaProdutoPedido = document.getElementById('input-busca-produto-pedido');
    autocompleteResults = document.getElementById('autocomplete-results');
    modalPagamentoOverlay = document.getElementById('modal-pagamento-overlay');
    pagamentoContaIdInput = document.getElementById('pagamento-conta-id');
    pagamentoNomeContaSpan = document.getElementById('pagamento-nome-conta');
    pagamentoTotalSpan = document.getElementById('pagamento-total');
    pagamentoMetodosContainer = document.getElementById('pagamento-metodos-container');
    btnConfirmarPagamento = document.getElementById('btn-confirmar-pagamento');
    modalAddProdutoOverlay = document.getElementById('modal-add-produto-overlay');
    formAddProduto = document.getElementById('form-add-produto');
    inputProdutoNome = document.getElementById('input-produto-nome');
    inputProdutoPreco = document.getElementById('input-produto-preco');
    inputProdutoStock = document.getElementById('input-produto-stock');
    inputProdutoStockMinimo = document.getElementById('input-produto-stock-minimo');
    modalEditProdutoOverlay = document.getElementById('modal-edit-produto-overlay');
    formEditProduto = document.getElementById('form-edit-produto');
    hiddenEditProdutoId = document.getElementById('hidden-edit-produto-id');
    inputEditProdutoNome = document.getElementById('input-edit-produto-nome');
    inputEditProdutoPreco = document.getElementById('input-edit-produto-preco');
    inputEditProdutoStockMinimo = document.getElementById('input-edit-produto-stock-minimo');
    modalEditNomeOverlay = document.getElementById('modal-edit-nome-overlay');
    formEditNome = document.getElementById('form-edit-nome');
    hiddenEditNomeId = document.getElementById('hidden-edit-nome-id');
    inputEditNome = document.getElementById('input-edit-nome');
    modalAddStockOverlay = document.getElementById('modal-add-stock-overlay');
    formAddStock = document.getElementById('form-add-stock');
    hiddenAddStockId = document.getElementById('hidden-add-stock-id');
    addStockNomeProduto = document.getElementById('add-stock-nome-produto');
    inputAddStockQuantidade = document.getElementById('input-add-stock-quantidade');
    modalMoverStockOverlay = document.getElementById('modal-mover-stock-overlay');
    formMoverStock = document.getElementById('form-mover-stock');
    hiddenMoverStockId = document.getElementById('hidden-mover-stock-id');
    moverStockNomeProduto = document.getElementById('mover-stock-nome-produto');
    moverStockArmazemQtd = document.getElementById('mover-stock-armazem-qtd');
    moverStockGeleiraQtd = document.getElementById('mover-stock-geleira-qtd');
    inputMoverStockQuantidade = document.getElementById('input-mover-stock-quantidade');
    modalFechoGlobalOverlay = document.getElementById('modal-fecho-global-overlay');
    fgDataRelatorio = document.getElementById('fg-data-relatorio');
    fgTotalVendido = document.getElementById('fg-total-vendido');
    fgTotalNumerario = document.getElementById('fg-total-numerario');
    fgTotalTpa = document.getElementById('fg-total-tpa');
    fgContasFechadas = document.getElementById('fg-contas-fechadas');
    fgMediaPorConta = document.getElementById('fg-media-por-conta');
    fgListaProdutos = document.getElementById('fg-lista-produtos');
    btnArquivarDia = document.getElementById('btn-arquivar-dia');
    btnExportarPdf = document.getElementById('btn-exportar-pdf');
    btnExportarXls = document.getElementById('btn-exportar-xls');
    modalConfirmacaoOverlay = document.getElementById('modal-confirmacao-overlay');
    modalConfirmacaoTitulo = document.getElementById('modal-confirmacao-titulo');
    modalConfirmacaoMensagem = document.getElementById('modal-confirmacao-mensagem');
    btnConfirmarConfirmacaoModal = document.getElementById('btn-confirmar-confirmacao-modal');
    toastNotificacao = document.getElementById('toast-notificacao');
    offlineIndicator = document.getElementById('offline-indicator');

    // Seletores de Segurança
    modalAtivacao = document.getElementById('modal-ativacao-licenca');
    formAtivacao = document.getElementById('form-ativacao');
    inputChaveLicenca = document.getElementById('input-chave-licenca');
    mensagemErroAtivacao = document.getElementById('ativacao-mensagem-erro');
    modalCriarSenha = document.getElementById('modal-criar-senha');
    formCriarSenha = document.getElementById('form-criar-senha');
    inputCriarPin = document.getElementById('input-criar-pin');
    inputConfirmarPin = document.getElementById('input-confirmar-pin');
    mensagemErroCriarSenha = document.getElementById('criar-senha-mensagem-erro');
    modalInserirSenha = document.getElementById('modal-inserir-senha');
    formInserirSenha = document.getElementById('form-inserir-senha');
    inputInserirPin = document.getElementById('input-inserir-pin');
    mensagemErroInserirSenha = document.getElementById('inserir-senha-mensagem-erro');
    btnEsqueciSenha = document.getElementById('btn-esqueci-senha');
}

