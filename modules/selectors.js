// /modules/selectors.js - Centraliza a seleção de todos os elementos do DOM.

// Navegação e Abas
export const bottomNav = document.getElementById('bottom-nav');
export const tabContents = document.querySelectorAll('.tab-content');

// Aba Dashboard
export const dbVendasTotal = document.getElementById('db-vendas-total');
export const dbVendasNumerario = document.getElementById('db-vendas-numerario');
export const dbVendasTpa = document.getElementById('db-vendas-tpa');
export const dbContasAtivas = document.getElementById('db-contas-ativas');
export const dbAlertasStock = document.getElementById('db-alertas-stock');
export const dbTopProdutoNome = document.getElementById('db-top-produto-nome');
export const dbTopProdutoQtd = document.getElementById('db-top-produto-qtd');

// Aba Atendimento
export const seletorCliente = document.getElementById('seletor-cliente');
export const vistaClienteAtivo = document.getElementById('vista-cliente-ativo');
export const btnAbrirConta = document.getElementById('btn-abrir-conta');
export const alertaStockContainer = document.getElementById('alerta-stock-container');

// Aba Inventário
export const btnAddProduto = document.getElementById('btn-add-produto');
export const listaInventario = document.getElementById('lista-inventario');
export const inputBuscaInventario = document.getElementById('input-busca-inventario');

// Aba Fecho / Relatórios
export const btnVerFechoDiaAtual = document.getElementById('btn-ver-fecho-dia-atual');
export const calendarioTitulo = document.getElementById('calendario-titulo');
export const calendarioGridDias = document.getElementById('calendario-grid-dias');
export const btnMesAnterior = document.getElementById('btn-mes-anterior');
export const btnMesSeguinte = document.getElementById('btn-mes-seguinte');

// Modal Nova Conta
export const modalOverlay = document.getElementById('modal-overlay');
export const formNovaConta = document.getElementById('form-nova-conta');
export const inputNomeConta = document.getElementById('input-nome-conta');
export const btnCancelarModal = document.getElementById('btn-cancelar-modal');

// Modal Adicionar Pedido
export const modalAddPedidoOverlay = document.getElementById('modal-add-pedido-overlay');
export const modalPedidoNomeConta = document.getElementById('modal-pedido-nome-conta');
export const formAddPedido = document.getElementById('form-add-pedido');
export const hiddenContaId = document.getElementById('hidden-conta-id');
export const inputQuantidade = document.getElementById('input-quantidade');
export const btnCancelarPedidoModal = document.getElementById('btn-cancelar-pedido-modal');
export const inputBuscaProdutoPedido = document.getElementById('input-busca-produto-pedido');
export const autocompleteResults = document.getElementById('autocomplete-results');

// Modal de Pagamento
export const modalPagamentoOverlay = document.getElementById('modal-pagamento-overlay');
export const pagamentoContaIdInput = document.getElementById('pagamento-conta-id');
export const pagamentoNomeContaSpan = document.getElementById('pagamento-nome-conta');
export const pagamentoTotalSpan = document.getElementById('pagamento-total');
export const pagamentoMetodosContainer = document.getElementById('pagamento-metodos-container');
export const btnCancelarPagamentoModal = document.getElementById('btn-cancelar-pagamento-modal');
export const btnConfirmarPagamento = document.getElementById('btn-confirmar-pagamento');

// Modal Adicionar Produto
export const modalAddProdutoOverlay = document.getElementById('modal-add-produto-overlay');
export const formAddProduto = document.getElementById('form-add-produto');
export const inputProdutoNome = document.getElementById('input-produto-nome');
export const inputProdutoPreco = document.getElementById('input-produto-preco');
export const inputProdutoStock = document.getElementById('input-produto-stock');
export const inputProdutoStockMinimo = document.getElementById('input-produto-stock-minimo');
export const btnCancelarAddProdutoModal = document.getElementById('btn-cancelar-add-produto-modal');

// Modal Editar Produto
export const modalEditProdutoOverlay = document.getElementById('modal-edit-produto-overlay');
export const formEditProduto = document.getElementById('form-edit-produto');
export const hiddenEditProdutoId = document.getElementById('hidden-edit-produto-id');
export const inputEditProdutoNome = document.getElementById('input-edit-produto-nome');
export const inputEditProdutoPreco = document.getElementById('input-edit-produto-preco');
export const inputEditProdutoStockMinimo = document.getElementById('input-edit-produto-stock-minimo');
export const btnCancelarEditProdutoModal = document.getElementById('btn-cancelar-edit-produto-modal');

// Modal Editar Nome da Conta
export const modalEditNomeOverlay = document.getElementById('modal-edit-nome-overlay');
export const formEditNome = document.getElementById('form-edit-nome');
export const hiddenEditNomeId = document.getElementById('hidden-edit-nome-id');
export const inputEditNome = document.getElementById('input-edit-nome');
export const btnCancelarEditNomeModal = document.getElementById('btn-cancelar-edit-nome-modal');

// Modal Adicionar Stock
export const modalAddStockOverlay = document.getElementById('modal-add-stock-overlay');
export const formAddStock = document.getElementById('form-add-stock');
export const hiddenAddStockId = document.getElementById('hidden-add-stock-id');
export const addStockNomeProduto = document.getElementById('add-stock-nome-produto');
export const inputAddStockQuantidade = document.getElementById('input-add-stock-quantidade');
export const btnCancelarAddStockModal = document.getElementById('btn-cancelar-add-stock-modal');

// Modal Mover Stock
export const modalMoverStockOverlay = document.getElementById('modal-mover-stock-overlay');
export const formMoverStock = document.getElementById('form-mover-stock');
export const hiddenMoverStockId = document.getElementById('hidden-mover-stock-id');
export const moverStockNomeProduto = document.getElementById('mover-stock-nome-produto');
export const moverStockArmazemQtd = document.getElementById('mover-stock-armazem-qtd');
export const moverStockGeleiraQtd = document.getElementById('mover-stock-geleira-qtd');
export const inputMoverStockQuantidade = document.getElementById('input-mover-stock-quantidade');
export const btnCancelarMoverStockModal = document.getElementById('btn-cancelar-mover-stock-modal');

// Modal Fecho Global
export const modalFechoGlobalOverlay = document.getElementById('modal-fecho-global-overlay');
export const fgDataRelatorio = document.getElementById('fg-data-relatorio');
export const fgTotalVendido = document.getElementById('fg-total-vendido');
export const fgTotalNumerario = document.getElementById('fg-total-numerario');
export const fgTotalTpa = document.getElementById('fg-total-tpa');
export const fgContasFechadas = document.getElementById('fg-contas-fechadas');
export const fgMediaPorConta = document.getElementById('fg-media-por-conta');
export const fgListaProdutos = document.getElementById('fg-lista-produtos');
export const btnArquivarDia = document.getElementById('btn-arquivar-dia');
export const btnCancelarFechoGlobalModal = document.getElementById('btn-cancelar-fecho-global-modal');
export const btnExportarPdf = document.getElementById('btn-exportar-pdf');
export const btnExportarXls = document.getElementById('btn-exportar-xls');

// Modal de Confirmação
export const modalConfirmacaoOverlay = document.getElementById('modal-confirmacao-overlay');
export const modalConfirmacaoTitulo = document.getElementById('modal-confirmacao-titulo');
export const modalConfirmacaoMensagem = document.getElementById('modal-confirmacao-mensagem');
export const btnCancelarConfirmacaoModal = document.getElementById('btn-cancelar-confirmacao-modal');
export const btnConfirmarConfirmacaoModal = document.getElementById('btn-confirmar-confirmacao-modal');

// Notificação Toast
export const toastNotificacao = document.getElementById('toast-notificacao');

// Indicador de Conectividade
export const offlineIndicator = document.getElementById('offline-indicator');