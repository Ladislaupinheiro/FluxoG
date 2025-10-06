// /modules/components/Modals.js - (v12.1 - CORRIGIDO E FUNCIONAL)
'use strict';

import store from '../services/Store.js';
import * as Toast from './Toast.js';
import { exportarRelatorioPDF, exportarRelatorioXLS, debounce } from '../services/utils.js';
import * as Storage from '../services/Storage.js';

// --- State e Seletores Internos ---
const sel = {};
let onConfirmCallback = null;
let relatorioAtual = null;
let produtoSelecionadoParaPedido = null;

const htmlContent = `
    <div id="modal-confirmacao-overlay" class="fixed inset-0 bg-black bg-opacity-60 hidden items-center justify-center z-[100] p-4">
        <div class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-sm">
            <div class="p-6 text-center">
                <h3 id="modal-confirmacao-titulo" class="text-xl font-bold mb-2"></h3>
                <p id="modal-confirmacao-mensagem" class="text-texto-secundario mb-6"></p>
                <div class="flex justify-center gap-4">
                    <button id="btn-cancelar-confirmacao" class="px-6 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 font-semibold">Cancelar</button>
                    <button id="btn-confirmar-acao" class="px-6 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold">Confirmar</button>
                </div>
            </div>
        </div>
    </div>
    <div id="modal-nova-conta-overlay" class="fixed inset-0 bg-black bg-opacity-60 hidden items-center justify-center z-[100] p-4">
        <form id="form-nova-conta" class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-sm">
            <header class="flex justify-between items-center p-4 border-b border-borda">
                <h3 class="text-xl font-bold">Nova Conta</h3>
                <button type="button" class="btn-fechar-modal text-2xl" data-modal="modal-nova-conta-overlay">&times;</button>
            </header>
            <div class="p-4">
                <label for="input-nome-conta" class="block text-sm font-medium text-texto-secundario mb-1">Nome da Conta / Mesa</label>
                <input type="text" id="input-nome-conta" required class="w-full p-2 border border-borda rounded-md bg-fundo-principal" placeholder="Ex: Mesa 5">
            </div>
            <footer class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
                <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Criar Conta</button>
            </footer>
        </form>
    </div>
    <div id="modal-add-produto-overlay" class="fixed inset-0 bg-black bg-opacity-60 hidden items-center justify-center z-[100] p-4">
        <form id="form-add-produto" class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-sm">
            <header class="flex justify-between items-center p-4 border-b border-borda">
                <h3 class="text-xl font-bold">Adicionar Produto</h3>
                <button type="button" class="btn-fechar-modal text-2xl" data-modal="modal-add-produto-overlay">&times;</button>
            </header>
            <div class="p-4 space-y-4">
                <div>
                    <label for="input-produto-nome" class="block text-sm font-medium mb-1">Nome do Produto</label>
                    <input type="text" id="input-produto-nome" required class="w-full p-2 border border-borda rounded-md bg-fundo-principal" placeholder="Ex: Cerveja Cuca">
                </div>
                <div>
                    <label for="input-produto-preco" class="block text-sm font-medium mb-1">Preço de Venda (Kz)</label>
                    <input type="number" id="input-produto-preco" required min="0" step="any" class="w-full p-2 border border-borda rounded-md bg-fundo-principal" placeholder="1000">
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label for="input-produto-stock" class="block text-sm font-medium mb-1">Stock Inicial</label>
                        <input type="number" id="input-produto-stock" required min="0" class="w-full p-2 border border-borda rounded-md bg-fundo-principal" placeholder="24">
                    </div>
                    <div>
                        <label for="input-produto-stock-minimo" class="block text-sm font-medium mb-1">Stock Mínimo</label>
                        <input type="number" id="input-produto-stock-minimo" required min="0" class="w-full p-2 border border-borda rounded-md bg-fundo-principal" placeholder="6">
                    </div>
                </div>
            </div>
            <footer class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
                <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Adicionar ao Inventário</button>
            </footer>
        </form>
    </div>
    <div id="modal-edit-produto-overlay" class="fixed inset-0 bg-black bg-opacity-60 hidden items-center justify-center z-[100] p-4">
        <form id="form-edit-produto" class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-sm">
            <input type="hidden" id="hidden-edit-produto-id">
            <header class="flex justify-between items-center p-4 border-b border-borda">
                <h3 class="text-xl font-bold">Editar Produto</h3>
                <button type="button" class="btn-fechar-modal text-2xl" data-modal="modal-edit-produto-overlay">&times;</button>
            </header>
            <div class="p-4 space-y-4">
                <div>
                    <label for="input-edit-produto-nome" class="block text-sm font-medium mb-1">Nome do Produto</label>
                    <input type="text" id="input-edit-produto-nome" required class="w-full p-2 border border-borda rounded-md bg-fundo-principal">
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label for="input-edit-produto-preco" class="block text-sm font-medium mb-1">Preço (Kz)</label>
                        <input type="number" id="input-edit-produto-preco" required min="0" step="any" class="w-full p-2 border border-borda rounded-md bg-fundo-principal">
                    </div>
                    <div>
                        <label for="input-edit-produto-stock-minimo" class="block text-sm font-medium mb-1">Stock Mínimo</label>
                        <input type="number" id="input-edit-produto-stock-minimo" required min="0" class="w-full p-2 border border-borda rounded-md bg-fundo-principal">
                    </div>
                </div>
            </div>
            <footer class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
                <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Salvar Alterações</button>
            </footer>
        </form>
    </div>
    <div id="modal-add-stock-overlay" class="fixed inset-0 bg-black bg-opacity-60 hidden items-center justify-center z-[100] p-4">
        <form id="form-add-stock" class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-sm">
            <input type="hidden" id="hidden-add-stock-id">
            <header class="flex justify-between items-center p-4 border-b border-borda">
                <h3 class="text-xl font-bold">Adicionar Stock (Armazém)</h3>
                <button type="button" class="btn-fechar-modal text-2xl" data-modal="modal-add-stock-overlay">&times;</button>
            </header>
            <div class="p-4">
                <p class="mb-2">Adicionar ao produto: <strong id="add-stock-nome-produto"></strong></p>
                <label for="input-add-stock-quantidade" class="block text-sm font-medium text-texto-secundario mb-1">Quantidade a Adicionar</label>
                <input type="number" id="input-add-stock-quantidade" required min="1" class="w-full p-2 border border-borda rounded-md bg-fundo-principal" placeholder="Ex: 12">
            </div>
            <footer class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
                <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Confirmar Entrada</button>
            </footer>
        </form>
    </div>
    <div id="modal-mover-stock-overlay" class="fixed inset-0 bg-black bg-opacity-60 hidden items-center justify-center z-[100] p-4">
        <form id="form-mover-stock" class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-sm">
            <input type="hidden" id="hidden-mover-stock-id">
            <header class="flex justify-between items-center p-4 border-b border-borda">
                <h3 class="text-xl font-bold">Mover Stock para Loja</h3>
                <button type="button" class="btn-fechar-modal text-2xl" data-modal="modal-mover-stock-overlay">&times;</button>
            </header>
            <div class="p-4">
                <p class="mb-2">Mover de: <strong id="mover-stock-nome-produto"></strong></p>
                <p class="text-sm text-texto-secundario mb-2">Disponível no Armazém: <span id="mover-stock-armazem-qtd"></span> un.</p>
                <label for="input-mover-stock-quantidade" class="block text-sm font-medium text-texto-secundario mb-1">Quantidade a Mover</label>
                <input type="number" id="input-mover-stock-quantidade" required min="1" class="w-full p-2 border border-borda rounded-md bg-fundo-principal" placeholder="Ex: 6">
            </div>
            <footer class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
                <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Mover para Loja</button>
            </footer>
        </form>
    </div>
    <div id="modal-add-pedido-overlay" class="fixed inset-0 bg-black bg-opacity-60 hidden items-center justify-center z-[100] p-4">
        <form id="form-add-pedido" class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-sm">
            <input type="hidden" id="hidden-conta-id">
            <header class="flex justify-between items-center p-4 border-b border-borda">
                <h3 class="text-xl font-bold">Adicionar Pedido a <span id="modal-pedido-nome-conta"></span></h3>
                <button type="button" class="btn-fechar-modal text-2xl" data-modal="modal-add-pedido-overlay">&times;</button>
            </header>
            <div class="p-4 space-y-4">
                <div class="relative">
                    <label for="input-busca-produto-pedido" class="block text-sm font-medium mb-1">Buscar Produto (na Loja)</label>
                    <input type="search" id="input-busca-produto-pedido" class="w-full p-2 border border-borda rounded-md bg-fundo-principal" placeholder="Comece a digitar o nome...">
                    <div id="autocomplete-results" class="absolute w-full bg-fundo-secundario border border-borda rounded-b-lg shadow-lg z-10 max-h-40 overflow-y-auto hidden"></div>
                </div>
                <div id="detalhes-produto-selecionado" class="hidden p-3 bg-blue-50 dark:bg-gray-700 rounded-lg space-y-2">
                    <div class="flex justify-between items-center">
                        <span class="font-bold text-lg" id="pedido-nome-produto"></span>
                        <span class="font-semibold text-blue-600 dark:text-blue-400" id="pedido-preco-produto"></span>
                    </div>
                    <div class="text-sm text-texto-secundario">Stock disponível na Loja: <span id="pedido-stock-disponivel" class="font-bold"></span></div>
                    <div>
                        <label for="input-quantidade" class="block text-sm font-medium mb-1">Quantidade</label>
                        <input type="number" id="input-quantidade" required min="1" class="w-full p-2 border border-borda rounded-md bg-fundo-principal" value="1">
                    </div>
                </div>
            </div>
            <footer class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
                <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Adicionar à Conta</button>
            </footer>
        </form>
    </div>
    <div id="modal-pagamento-overlay" class="fixed inset-0 bg-black bg-opacity-60 hidden items-center justify-center z-[100] p-4">
        <div id="form-pagamento" class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-sm" data-conta-id="" data-metodo="">
            <header class="flex justify-between items-center p-4 border-b border-borda">
                <h3 class="text-xl font-bold">Finalizar Pagamento</h3>
                <button type="button" class="btn-fechar-modal text-2xl" data-modal="modal-pagamento-overlay">&times;</button>
            </header>
            <div class="p-4 text-center">
                <p class="text-texto-secundario">Total a Pagar</p>
                <span id="pagamento-total-span" class="text-5xl font-bold block my-4">Kz 0,00</span>
                <p class="font-semibold mb-3">Selecione o Método de Pagamento</p>
                <div id="pagamento-metodos-container" class="grid grid-cols-2 gap-4">
                    <button class="pagamento-metodo-btn flex flex-col items-center p-4 border-2 border-borda rounded-lg" data-metodo="Numerário">
                        <i class="lni lni-money-location text-4xl text-green-500"></i>
                        <span class="mt-2 font-semibold">Numerário</span>
                    </button>
                    <button class="pagamento-metodo-btn flex flex-col items-center p-4 border-2 border-borda rounded-lg" data-metodo="TPA">
                        <i class="lni lni-credit-cards text-4xl text-blue-500"></i>
                        <span class="mt-2 font-semibold">TPA</span>
                    </button>
                </div>
            </div>
            <footer class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
                <button id="btn-confirmar-pagamento" disabled class="w-full bg-gray-400 cursor-not-allowed text-white font-bold py-3 px-4 rounded">Confirmar Pagamento</button>
            </footer>
        </div>
    </div>
    <div id="modal-add-cliente-overlay" class="fixed inset-0 bg-black bg-opacity-60 hidden items-center justify-center z-[100] p-4">
        <form id="form-add-cliente" class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-sm">
            <header class="flex justify-between items-center p-4 border-b border-borda">
                <h3 class="text-xl font-bold">Novo Cliente</h3>
                <button type="button" class="btn-fechar-modal text-2xl" data-modal="modal-add-cliente-overlay">&times;</button>
            </header>
            <div class="p-4 space-y-4">
                <div>
                    <label for="input-cliente-nome" class="block text-sm font-medium mb-1">Nome Completo</label>
                    <input type="text" id="input-cliente-nome" required class="w-full p-2 border border-borda rounded-md bg-fundo-principal" placeholder="Nome do cliente">
                </div>
                <div>
                    <label for="input-cliente-contacto" class="block text-sm font-medium mb-1">Contacto (Opcional)</label>
                    <input type="tel" id="input-cliente-contacto" class="w-full p-2 border border-borda rounded-md bg-fundo-principal" placeholder="9xx xxx xxx">
                </div>
                <div>
                    <label for="input-cliente-categoria" class="block text-sm font-medium mb-1">Categoria (Opcional)</label>
                    <input type="text" id="input-cliente-categoria" class="w-full p-2 border border-borda rounded-md bg-fundo-principal" placeholder="Ex: Amigo, VIP">
                </div>
            </div>
            <footer class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
                <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Registar Cliente</button>
            </footer>
        </form>
    </div>
    <div id="modal-nova-despesa-overlay" class="fixed inset-0 bg-black bg-opacity-60 hidden items-center justify-center z-[100] p-4">
        <form id="form-nova-despesa" class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-sm">
            <header class="flex justify-between items-center p-4 border-b border-borda">
                <h3 class="text-xl font-bold">Registar Despesa</h3>
                <button type="button" class="btn-fechar-modal text-2xl" data-modal="modal-nova-despesa-overlay">&times;</button>
            </header>
            <div class="p-4 space-y-4">
                <div>
                    <label for="input-despesa-descricao" class="block text-sm font-medium mb-1">Descrição</label>
                    <input type="text" id="input-despesa-descricao" required class="w-full p-2 border border-borda rounded-md bg-fundo-principal" placeholder="Ex: Compra de gelo">
                </div>
                <div>
                    <label for="input-despesa-valor" class="block text-sm font-medium mb-1">Valor (Kz)</label>
                    <input type="number" id="input-despesa-valor" required min="1" class="w-full p-2 border border-borda rounded-md bg-fundo-principal">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Método de Pagamento</label>
                    <div id="despesa-metodos-container" class="grid grid-cols-2 gap-4">
                        <button type="button" class="pagamento-metodo-btn flex flex-col items-center p-3 border-2 border-borda rounded-lg" data-metodo="Numerário">
                            <i class="lni lni-money-location text-3xl text-green-500"></i>
                            <span class="mt-1 font-semibold text-sm">Numerário</span>
                        </button>
                        <button type="button" class="pagamento-metodo-btn flex flex-col items-center p-3 border-2 border-borda rounded-lg" data-metodo="TPA">
                            <i class="lni lni-credit-cards text-3xl text-blue-500"></i>
                            <span class="mt-1 font-semibold text-sm">TPA</span>
                        </button>
                    </div>
                    <input type="hidden" id="hidden-despesa-metodo" required>
                </div>
            </div>
            <footer class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
                <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Registar Despesa</button>
            </footer>
        </form>
    </div>
    <div id="modal-add-divida-overlay" class="fixed inset-0 bg-black bg-opacity-60 hidden items-center justify-center z-[100] p-4">
        <form id="form-add-divida" class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-sm" data-cliente-id="">
            <header class="flex justify-between items-center p-4 border-b border-borda">
                <h3 class="text-xl font-bold">Adicionar Dívida</h3>
                <button type="button" class="btn-fechar-modal text-2xl" data-modal="modal-add-divida-overlay">&times;</button>
            </header>
            <div class="p-4 space-y-4">
                <p>Cliente: <strong id="modal-divida-cliente-nome"></strong></p>
                <div>
                    <label for="input-divida-valor" class="block text-sm font-medium mb-1">Valor da Dívida (Kz)</label>
                    <input type="number" id="input-divida-valor" required min="1" class="w-full p-2 border border-borda rounded-md bg-fundo-principal">
                </div>
                <div>
                    <label for="input-divida-descricao" class="block text-sm font-medium mb-1">Descrição</label>
                    <input type="text" id="input-divida-descricao" required class="w-full p-2 border border-borda rounded-md bg-fundo-principal" placeholder="Ex: 2 Cervejas">
                </div>
            </div>
            <footer class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
                <button type="submit" class="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">Adicionar Dívida</button>
            </footer>
        </form>
    </div>
    <div id="modal-liquidar-divida-overlay" class="fixed inset-0 bg-black bg-opacity-60 hidden items-center justify-center z-[100] p-4">
        <form id="form-liquidar-divida" class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-sm" data-cliente-id="">
            <header class="flex justify-between items-center p-4 border-b border-borda">
                <h3 class="text-xl font-bold">Liquidar Dívida</h3>
                <button type="button" class="btn-fechar-modal text-2xl" data-modal="modal-liquidar-divida-overlay">&times;</button>
            </header>
            <div class="p-4 space-y-4">
                <p>Cliente: <strong id="modal-liquidar-cliente-nome"></strong></p>
                <p class="text-sm">Dívida Atual: <strong id="modal-liquidar-divida-atual" class="text-red-500"></strong></p>
                <div>
                    <label for="input-liquidar-valor" class="block text-sm font-medium mb-1">Valor a Pagar (Kz)</label>
                    <input type="number" id="input-liquidar-valor" required min="1" class="w-full p-2 border border-borda rounded-md bg-fundo-principal">
                </div>
            </div>
            <footer class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
                <button type="submit" class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">Registar Pagamento</button>
            </footer>
        </form>
    </div>
    <div id="modal-relatorio-periodo-overlay" class="fixed inset-0 bg-black bg-opacity-60 hidden items-center justify-center z-[100] p-4">
        <div class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-sm max-h-[90vh] flex flex-col">
            <header class="flex justify-between items-center p-4 border-b border-borda">
                <h3 id="relatorio-periodo-titulo" class="text-xl font-bold">Relatório de Período</h3>
                <button type="button" class="btn-fechar-modal text-2xl" data-modal="modal-relatorio-periodo-overlay">&times;</button>
            </header>
            <div class="p-4 space-y-3 overflow-y-auto">
                <div id="relatorio-periodo-tabela-container" class="space-y-2"></div>
            </div>
            <footer class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg space-y-3 border-t border-borda">
                <h4 class="text-md font-bold text-center">Resumo do Período</h4>
                <div class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <span class="font-semibold text-green-600">Total Entradas:</span>
                    <span id="relatorio-total-entradas" class="text-right font-bold text-green-600"></span>
                    <span class="font-semibold text-red-600">Total Saídas:</span>
                    <span id="relatorio-total-saidas" class="text-right font-bold text-red-600"></span>
                    <div class="col-span-2 border-t border-borda my-1"></div>
                    <span class="font-semibold text-blue-600 text-lg">SALDO FINAL:</span>
                    <span id="relatorio-saldo-final" class="text-right font-bold text-blue-600 text-lg"></span>
                </div>
            </footer>
        </div>
    </div>
    <div id="modal-fecho-global-overlay" class="fixed inset-0 bg-black bg-opacity-60 hidden items-center justify-center z-[100] p-4">
        <div class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-sm max-h-[90vh] flex flex-col">
            <header class="flex justify-between items-center p-4 border-b border-borda">
                <h3 class="text-xl font-bold">Relatório do Dia</h3>
                <button type="button" class="btn-fechar-modal text-2xl" data-modal="modal-fecho-global-overlay">&times;</button>
            </header>
            <div class="p-4 space-y-4 overflow-y-auto">
                <p id="fg-data-relatorio" class="text-center font-semibold text-texto-secundario"></p>
                <div class="bg-blue-50 dark:bg-gray-700 p-4 rounded-lg text-center">
                    <p class="text-sm">Total Vendido</p>
                    <p id="fg-total-vendido" class="text-4xl font-bold text-blue-600 dark:text-blue-400"></p>
                </div>
                <div class="grid grid-cols-2 gap-2 text-center text-sm">
                    <p>Numerário: <strong id="fg-total-numerario" class="block"></strong></p>
                    <p>TPA: <strong id="fg-total-tpa" class="block"></strong></p>
                    <p>Contas Fechadas: <strong id="fg-contas-fechadas" class="block"></strong></p>
                    <p>Média/Conta: <strong id="fg-media-por-conta" class="block"></strong></p>
                </div>
                <div>
                    <h4 class="font-bold text-center mt-4 mb-2 border-t border-borda pt-2">Produtos Vendidos</h4>
                    <div id="fg-lista-produtos" class="space-y-1 max-h-40 overflow-y-auto pr-2"></div>
                </div>
            </div>
            <footer class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg space-y-2">
                <div id="fg-botoes-relatorio" class="hidden gap-2">
                    <button id="btn-exportar-pdf" class="w-full bg-red-500 text-white font-bold py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-1"><i class="lni lni-download"></i> PDF</button>
                    <button id="btn-exportar-xls" class="w-full bg-green-600 text-white font-bold py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-1"><i class="lni lni-download"></i> EXCEL</button>
                </div>
                <button id="btn-arquivar-dia" class="w-full bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2">
                    <i class="lni lni-archive"></i> Arquivar Relatório do Dia
                </button>
            </footer>
        </div>
    </div>
    <div id="modal-backup-restore-overlay" class="fixed inset-0 bg-black bg-opacity-60 hidden items-center justify-center z-[100] p-4">
        <div class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-sm">
            <header class="flex justify-between items-center p-4 border-b border-borda">
                <h3 class="text-xl font-bold">Backup e Restauro</h3>
                <button type="button" class="btn-fechar-modal text-2xl" data-modal="modal-backup-restore-overlay">&times;</button>
            </header>
            <div class="p-4 space-y-4">
                <div>
                    <h4 class="font-semibold mb-2">Criar Backup</h4>
                    <p class="text-sm text-texto-secundario mb-2">Guarde todos os dados da aplicação (inventário, vendas, clientes) num ficheiro JSON seguro.</p>
                    <button id="btn-criar-backup" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-2"><i class="lni lni-download"></i> Criar e Descarregar Backup</button>
                </div>
                <div class="border-t border-borda pt-4">
                    <h4 class="font-semibold mb-2 text-red-500">Restaurar a Partir de um Ficheiro</h4>
                    <p class="text-sm text-texto-secundario mb-2">Atenção: Restaurar um backup irá apagar TODOS os dados atuais. Use com cuidado.</p>
                    <input type="file" id="input-restaurar-backup" class="hidden" accept=".json">
                    <button id="btn-abrir-seletor-ficheiro" class="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-2"><i class="lni lni-upload"></i> Selecionar Ficheiro de Backup</button>
                </div>
            </div>
        </div>
    </div>
    <div id="modal-limpar-dados-overlay" class="fixed inset-0 bg-black bg-opacity-60 hidden items-center justify-center z-[100] p-4">
        <div class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-sm">
            <header class="flex justify-between items-center p-4 border-b border-borda">
                <h3 class="text-xl font-bold text-red-500">Limpar Todos os Dados</h3>
                <button type="button" class="btn-fechar-modal text-2xl" data-modal="modal-limpar-dados-overlay">&times;</button>
            </header>
            <div class="p-4">
                <p class="text-sm text-texto-secundario mb-4">Esta é uma ação irreversível. Todos os seus produtos, vendas e clientes serão apagados permanentemente.</p>
                <label for="input-confirmar-limpeza" class="block font-medium mb-1">Para confirmar, escreva <strong class="text-red-500">APAGAR</strong> na caixa abaixo.</label>
                <input type="text" id="input-confirmar-limpeza" class="w-full p-2 border border-borda rounded-md bg-fundo-principal" placeholder="APAGAR">
            </div>
            <footer class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
                <button id="btn-confirmar-limpeza-final" disabled class="w-full bg-gray-400 cursor-not-allowed text-white font-bold py-3 px-4 rounded">Apagar Tudo Permanentemente</button>
            </footer>
        </div>
    </div>
    <div id="modal-dica-overlay" class="fixed inset-0 bg-black bg-opacity-60 hidden items-center justify-center z-[100] p-4">
        <div class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-sm">
            <header class="flex justify-between items-center p-4 border-b border-borda">
                <div>
                    <h3 class="text-xl font-bold">Dica de Gestão</h3>
                    <p id="dica-categoria" class="text-sm text-blue-600 dark:text-blue-400 font-semibold"></p>
                </div>
                <button type="button" class="btn-fechar-modal text-2xl self-start" data-modal="modal-dica-overlay">&times;</button>
            </header>
            <div class="p-4">
                <h4 id="dica-titulo" class="text-lg font-bold mb-2"></h4>
                <p id="dica-conteudo" class="text-texto-secundario"></p>
            </div>
            <footer class="p-4 text-center">
                 <button class="btn-fechar-modal w-full max-w-xs mx-auto bg-blue-600 text-white font-bold py-2 px-4 rounded" data-modal="modal-dica-overlay">Entendido</button>
            </footer>
        </div>
    </div>
    <div id="modal-edit-business-name-overlay" class="fixed inset-0 bg-black bg-opacity-60 hidden items-center justify-center z-[100] p-4">
        <form id="form-edit-business-name" class="bg-fundo-secundario rounded-lg shadow-xl w-full max-w-sm">
            <header class="flex justify-between items-center p-4 border-b border-borda">
                <h3 class="text-xl font-bold">Nome do Estabelecimento</h3>
                <button type="button" class="btn-fechar-modal text-2xl" data-modal="modal-edit-business-name-overlay">&times;</button>
            </header>
            <div class="p-4">
                <label for="input-edit-business-name" class="block text-sm font-medium text-texto-secundario mb-1">Novo Nome</label>
                <input type="text" id="input-edit-business-name" required class="w-full p-2 border border-borda rounded-md bg-fundo-principal">
            </div>
            <footer class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
                <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Salvar Nome</button>
            </footer>
        </form>
    </div>
`;

function handleNovaConta(event) {
    event.preventDefault();
    const nomeConta = sel.inputNomeConta.value.trim();
    if (!nomeConta) {
        Toast.mostrarNotificacao("O nome da conta não pode estar vazio.", "erro");
        return;
    }
    if (store.getState().contasAtivas.some(c => c.status === 'ativa' && c.nome.toLowerCase() === nomeConta.toLowerCase())) {
        Toast.mostrarNotificacao(`Já existe uma conta ativa com o nome "${nomeConta}".`, "erro");
        return;
    }
    const novaContaObj = { id: crypto.randomUUID(), nome: nomeConta, pedidos: [], dataAbertura: new Date().toISOString(), status: 'ativa' };
    store.dispatch({ type: 'ADD_ACCOUNT', payload: novaContaObj });
    fecharModalNovaConta();
    Toast.mostrarNotificacao(`Conta "${nomeConta}" criada com sucesso!`);
}

function handleAddProduto(event) {
    event.preventDefault();
    const nome = sel.inputProdutoNome.value.trim();
    const preco = parseFloat(sel.inputProdutoPreco.value);
    const stock = parseInt(sel.inputProdutoStock.value);
    const stockMinimo = parseInt(sel.inputProdutoStockMinimo.value);
    if (!nome || isNaN(preco) || preco <= 0 || isNaN(stock) || stock < 0 || isNaN(stockMinimo) || stockMinimo < 0) {
        Toast.mostrarNotificacao("Dados inválidos. Verifique os valores.", "erro"); return;
    }
    const novoProduto = { id: crypto.randomUUID(), nome, preco, stockArmazem: stock, stockLoja: 0, stockMinimo };
    store.dispatch({ type: 'ADD_PRODUCT', payload: novoProduto });
    fecharModalAddProduto();
    Toast.mostrarNotificacao(`Produto "${nome}" adicionado!`);
}

function handleEditProduto(event) {
    event.preventDefault();
    const id = sel.hiddenEditProdutoId.value;
    const produto = store.getState().inventario.find(p => p.id === id);
    if (!produto) return;
    const produtoAtualizado = { ...produto, nome: sel.inputEditProdutoNome.value.trim(), preco: parseFloat(sel.inputEditProdutoPreco.value), stockMinimo: parseInt(sel.inputEditProdutoStockMinimo.value) };
    store.dispatch({ type: 'UPDATE_PRODUCT', payload: produtoAtualizado });
    fecharModalEditProduto();
    Toast.mostrarNotificacao(`Produto "${produtoAtualizado.nome}" atualizado!`);
}

function handleAddStock(event) {
    event.preventDefault();
    const produtoId = sel.hiddenAddStockId.value;
    const quantidade = parseInt(sel.inputAddStockQuantidade.value);
    if (isNaN(quantidade) || quantidade <= 0) {
        Toast.mostrarNotificacao("Insira uma quantidade positiva.", "erro"); return;
    }
    store.dispatch({ type: 'ADD_STOCK', payload: { produtoId, quantidade } });
    fecharModalAddStock();
    Toast.mostrarNotificacao(`${quantidade} un. adicionadas.`);
}

function handleMoverStock(event) {
    event.preventDefault();
    const produtoId = sel.hiddenMoverStockId.value;
    const quantidade = parseInt(sel.inputMoverStockQuantidade.value);
    const produto = store.getState().inventario.find(p => p.id === produtoId);
    if (!produto || isNaN(quantidade) || quantidade <= 0) {
        Toast.mostrarNotificacao("A quantidade deve ser um número positivo.", "erro"); return;
    }
    if (quantidade > produto.stockArmazem) {
        Toast.mostrarNotificacao(`Apenas ${produto.stockArmazem} un. disponíveis no armazém.`, "erro"); return;
    }
    store.dispatch({ type: 'MOVE_STOCK', payload: { produtoId, quantidade } });
    fecharModalMoverStock();
    Toast.mostrarNotificacao(`${quantidade} un. movidas para a loja.`);
}

function handleAddPedido(event) {
    event.preventDefault();
    const contaId = sel.hiddenContaId.value;
    const quantidade = parseInt(sel.inputQuantidade.value);

    if (!produtoSelecionadoParaPedido) {
        Toast.mostrarNotificacao("Por favor, selecione um produto válido da lista.", "erro");
        return;
    }
    if (isNaN(quantidade) || quantidade <= 0) {
        Toast.mostrarNotificacao("Por favor, insira uma quantidade válida.", "erro");
        return;
    }
    if (quantidade > produtoSelecionadoParaPedido.stockLoja) {
        Toast.mostrarNotificacao(`Stock insuficiente. Apenas ${produtoSelecionadoParaPedido.stockLoja} disponíveis.`, "erro");
        return;
    }

    store.dispatch({ type: 'ADD_ORDER_ITEM', payload: { contaId, produto: produtoSelecionadoParaPedido, quantidade } });
    Toast.mostrarNotificacao("Pedido adicionado com sucesso.");
    fecharModalAddPedido();
}

const debouncedBuscaProduto = debounce(handleBuscaProdutoPedido, 300);

function handleBuscaProdutoPedido() {
    const termo = sel.inputBuscaProdutoPedido.value.toLowerCase();
    produtoSelecionadoParaPedido = null;
    sel.detalhesProdutoSelecionado.classList.add('hidden');

    if (termo.length < 2) {
        sel.autocompleteResults.innerHTML = '';
        sel.autocompleteResults.classList.add('hidden');
        return;
    }

    const resultados = store.getState().inventario.filter(p => p.nome.toLowerCase().includes(termo) && p.stockLoja > 0);
    
    sel.autocompleteResults.innerHTML = '';
    if (resultados.length > 0) {
        resultados.forEach(produto => {
            const item = document.createElement('div');
            item.className = 'p-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer';
            item.textContent = `${produto.nome} (Disp: ${produto.stockLoja})`;
            item.addEventListener('click', () => {
                sel.inputBuscaProdutoPedido.value = produto.nome;
                produtoSelecionadoParaPedido = produto;
                sel.autocompleteResults.classList.add('hidden');
                
                sel.pedidoNomeProduto.textContent = produto.nome;
                sel.pedidoPrecoProduto.textContent = produto.preco.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
                sel.pedidoStockDisponivel.textContent = produto.stockLoja;
                sel.detalhesProdutoSelecionado.classList.remove('hidden');
                sel.inputQuantidade.max = produto.stockLoja;
                sel.inputQuantidade.focus();
            });
            sel.autocompleteResults.appendChild(item);
        });
        sel.autocompleteResults.classList.remove('hidden');
    } else {
        sel.autocompleteResults.innerHTML = `<div class="p-2 text-center text-sm text-gray-500">Nenhum produto encontrado na loja.</div>`;
        sel.autocompleteResults.classList.remove('hidden');
    }
}

function handleFinalizarPagamento(event) {
    const metodoBtn = event.target.closest('.pagamento-metodo-btn');
    const confirmarBtn = event.target.closest('#btn-confirmar-pagamento');
    const contaId = sel.formPagamento.dataset.contaId;

    if (metodoBtn) {
        sel.pagamentoMetodosContainer.querySelectorAll('.pagamento-metodo-btn').forEach(btn => btn.classList.remove('border-blue-500', 'bg-blue-100', 'dark:bg-gray-700'));
        metodoBtn.classList.add('border-blue-500', 'bg-blue-100', 'dark:bg-gray-700');
        
        sel.btnConfirmarPagamento.disabled = false;
        sel.btnConfirmarPagamento.classList.remove('bg-gray-400', 'cursor-not-allowed');
        sel.btnConfirmarPagamento.classList.add('bg-blue-500');
        sel.formPagamento.dataset.metodo = metodoBtn.dataset.metodo;
    }

    if (confirmarBtn && !confirmarBtn.disabled) {
        const metodoPagamento = sel.formPagamento.dataset.metodo;
        if (contaId && metodoPagamento) {
            store.dispatch({ type: 'FINALIZE_PAYMENT', payload: { contaId, metodoPagamento } });
            Toast.mostrarNotificacao("Pagamento finalizado com sucesso!");
            fecharModalPagamento();
        }
    }
}

function handleAddCliente(event) {
    event.preventDefault();
    const nome = sel.inputClienteNome.value.trim();
    if (!nome) {
        Toast.mostrarNotificacao("O nome do cliente é obrigatório.", "erro");
        return;
    }
    const novoCliente = {
        id: crypto.randomUUID(),
        nome,
        contacto: sel.inputClienteContacto.value.trim(),
        categoria: sel.inputClienteCategoria.value.trim(),
        dataRegisto: new Date().toISOString(),
        dividas: [],
    };
    store.dispatch({ type: 'ADD_CLIENT', payload: novoCliente });
    fecharModalAddCliente();
    Toast.mostrarNotificacao(`Cliente "${nome}" adicionado.`);
    window.location.hash = `#/cliente-detalhes/${novoCliente.id}`;
}

function handleNovaDespesa(event) {
    event.preventDefault();
    const descricao = sel.inputDespesaDescricao.value.trim();
    const valor = parseFloat(sel.inputDespesaValor.value);
    const metodoPagamento = sel.hiddenDespesaMetodo.value;

    if (!descricao || !valor || valor <= 0 || !metodoPagamento) {
        Toast.mostrarNotificacao("Por favor, preencha todos os campos.", "erro");
        return;
    }

    const novaDespesa = {
        id: crypto.randomUUID(),
        data: new Date().toISOString(),
        descricao,
        valor,
        metodoPagamento
    };

    store.dispatch({ type: 'ADD_EXPENSE', payload: novaDespesa });
    Toast.mostrarNotificacao("Despesa registada com sucesso.");
    fecharModalNovaDespesa();
}

function handleAddDivida(event) {
    event.preventDefault();
    const valor = parseFloat(sel.inputDividaValor.value);
    const descricao = sel.inputDividaDescricao.value.trim();
    const clienteId = sel.formAddDivida.dataset.clienteId;

    if (!valor || valor <= 0 || !descricao || !clienteId) {
        Toast.mostrarNotificacao("Por favor, preencha todos os campos.", "erro");
        return;
    }
    store.dispatch({ type: 'ADD_DEBT', payload: { clienteId, valor, descricao } });
    Toast.mostrarNotificacao("Dívida adicionada.");
    fecharModalAddDivida();
}

function handleLiquidarDivida(event) {
    event.preventDefault();
    const valor = parseFloat(sel.inputLiquidarValor.value);
    const clienteId = sel.formLiquidarDivida.dataset.clienteId;
    if (!valor || valor <= 0 || !clienteId) {
        Toast.mostrarNotificacao("Por favor, insira um valor válido.", "erro");
        return;
    }
    store.dispatch({ type: 'SETTLE_DEBT', payload: { clienteId, valor } });
    Toast.mostrarNotificacao("Pagamento registado.");
    fecharModalLiquidarDivida();
}

function handleArquivarDia() {
    const state = store.getState();
    const hojeStr = new Date().toDateString();
    
    if (state.historicoFechos.some(rel => new Date(rel.data).toDateString() === hojeStr)) {
        Toast.mostrarNotificacao("O dia de hoje já foi fechado e arquivado.", "erro");
        return;
    }
    const contasFechadasHoje = state.contasAtivas.filter(c => c.status === 'fechada' && new Date(c.dataFecho).toDateString() === hojeStr);
    if (contasFechadasHoje.length === 0) {
        Toast.mostrarNotificacao("Não existem vendas fechadas para arquivar.", "erro");
        return;
    }
    
    abrirModalConfirmacao(
        'Arquivar o Dia?',
        'Todas as contas fechadas serão arquivadas e o stock da loja será zerado. Esta ação não pode ser desfeita.',
        () => {
            const relatorio = relatorioAtual; 
            store.dispatch({ type: 'ARCHIVE_DAY', payload: { relatorio } });
            fecharModalFechoGlobal();
            Toast.mostrarNotificacao("Dia arquivado com sucesso!");
        }
    );
}

function handleCreateBackup() {
    Toast.mostrarNotificacao("A preparar o backup...");
    const state = store.getState();
    const backupData = { appName: 'GestorBarPro', version: 1, timestamp: new Date().toISOString(), data: state };
    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gestorbar-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    fecharModalBackupRestore();
    Toast.mostrarNotificacao("Backup criado com sucesso!");
}

function handleRestoreFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const backupData = JSON.parse(e.target.result);
            if (backupData.appName !== 'GestorBarPro' || !backupData.data) {
                throw new Error("Ficheiro de backup inválido.");
            }
            fecharModalBackupRestore();
            abrirModalConfirmacao(
                'Confirmar Restauro?',
                'Todos os dados atuais serão PERMANENTEMENTE apagados. Esta ação não pode ser desfeita e a aplicação será reiniciada.',
                async () => {
                    Toast.mostrarNotificacao("A restaurar... A aplicação irá recarregar.");
                    await Promise.all([
                        Storage.limparStore('inventario'),
                        Storage.limparStore('contas'),
                        Storage.limparStore('historico'),
                        Storage.limparStore('clientes'),
                        Storage.limparStore('config')
                    ]);
                    
                    const { inventario, contasAtivas, historicoFechos, clientes, config } = backupData.data;
                    await Promise.all([
                        ...(inventario || []).map(item => Storage.salvarItem('inventario', item)),
                        ...(contasAtivas || []).map(item => Storage.salvarItem('contas', item)),
                        ...(historicoFechos || []).map(item => Storage.salvarItem('historico', item)),
                        ...(clientes || []).map(item => Storage.salvarItem('clientes', item)),
                        Storage.salvarItem('config', { key: 'appConfig', ...config })
                    ]);

                    setTimeout(() => window.location.reload(), 1500);
                }
            );
        } catch (error) {
            Toast.mostrarNotificacao(error.message, "erro");
        } finally {
            event.target.value = '';
        }
    };
    reader.readAsText(file);
}

function handleLimparDados() {
    const input = sel.inputConfirmarLimpeza.value;
    if (input === 'APAGAR') {
        Toast.mostrarNotificacao("A limpar todos os dados... A aplicação será reiniciada.");
        Promise.all([
            Storage.limparStore('inventario'),
            Storage.limparStore('contas'),
            Storage.limparStore('historico'),
            Storage.limparStore('clientes'),
            Storage.limparStore('config')
        ]).then(() => {
            setTimeout(() => window.location.reload(), 1500);
        });
    }
}

function handleEditBusinessName(event) {
    event.preventDefault();
    const novoNome = sel.inputEditBusinessName.value.trim();
    if (novoNome) {
        store.dispatch({ type: 'UPDATE_CONFIG', payload: { businessName: novoNome } });
        Toast.mostrarNotificacao("Nome do estabelecimento atualizado.");
    }
    fecharModalEditBusinessName();
}

// --- Funções Públicas de Abrir/Fechar ---
function abrirModalNovaConta() { sel.formNovaConta.reset(); sel.modalNovaContaOverlay.classList.remove('hidden'); sel.inputNomeConta.focus(); }
function fecharModalNovaConta() { sel.modalNovaContaOverlay.classList.add('hidden'); }
function abrirModalAddProduto() { sel.formAddProduto.reset(); sel.modalAddProdutoOverlay.classList.remove('hidden'); sel.inputProdutoNome.focus(); }
function fecharModalAddProduto() { sel.modalAddProdutoOverlay.classList.add('hidden'); }
function abrirModalEditProduto(produto) { if (!produto) return; sel.formEditProduto.reset(); sel.hiddenEditProdutoId.value = produto.id; sel.inputEditProdutoNome.value = produto.nome; sel.inputEditProdutoPreco.value = produto.preco; sel.inputEditProdutoStockMinimo.value = produto.stockMinimo; sel.modalEditProdutoOverlay.classList.remove('hidden'); sel.inputEditProdutoNome.focus(); }
function fecharModalEditProduto() { sel.modalEditProdutoOverlay.classList.add('hidden'); }
function abrirModalAddStock(produto) { if(!produto) return; sel.formAddStock.reset(); sel.hiddenAddStockId.value = produto.id; sel.addStockNomeProduto.textContent = produto.nome; sel.modalAddStockOverlay.classList.remove('hidden'); sel.inputAddStockQuantidade.focus(); }
function fecharModalAddStock() { sel.modalAddStockOverlay.classList.add('hidden'); }
function abrirModalMoverStock(produto) { if(!produto) return; sel.formMoverStock.reset(); sel.hiddenMoverStockId.value = produto.id; sel.moverStockNomeProduto.textContent = produto.nome; sel.moverStockArmazemQtd.textContent = produto.stockArmazem; sel.inputMoverStockQuantidade.max = produto.stockArmazem; sel.modalMoverStockOverlay.classList.remove('hidden'); sel.inputMoverStockQuantidade.focus();}
function fecharModalMoverStock() { sel.modalMoverStockOverlay.classList.add('hidden'); }
function abrirModalAddPedido(contaId) { const conta = store.getState().contasAtivas.find(c => c.id === contaId); if (!conta) return; sel.formAddPedido.reset(); sel.modalPedidoNomeConta.textContent = conta.nome; sel.hiddenContaId.value = contaId; produtoSelecionadoParaPedido = null; sel.detalhesProdutoSelecionado.classList.add('hidden'); sel.autocompleteResults.innerHTML = ''; sel.autocompleteResults.classList.add('hidden'); sel.modalAddPedidoOverlay.classList.remove('hidden'); sel.inputBuscaProdutoPedido.focus(); }
function fecharModalAddPedido() { sel.modalAddPedidoOverlay.classList.add('hidden'); }
function abrirModalPagamento(conta) { if (!conta) return; const subtotal = conta.pedidos.reduce((total, p) => total + (p.preco * p.qtd), 0); sel.pagamentoTotalSpan.textContent = subtotal.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' }); sel.formPagamento.dataset.contaId = conta.id; sel.btnConfirmarPagamento.disabled = true; sel.btnConfirmarPagamento.classList.add('bg-gray-400', 'cursor-not-allowed'); sel.btnConfirmarPagamento.classList.remove('bg-blue-500'); sel.pagamentoMetodosContainer.querySelectorAll('.pagamento-metodo-btn').forEach(btn => btn.classList.remove('border-blue-500', 'bg-blue-100', 'dark:bg-gray-700')); sel.modalPagamentoOverlay.classList.remove('hidden'); }
function fecharModalPagamento() { sel.modalPagamentoOverlay.classList.add('hidden'); }
function abrirModalAddCliente() { sel.formAddCliente.reset(); sel.modalAddClienteOverlay.classList.remove('hidden'); sel.inputClienteNome.focus(); }
function fecharModalAddCliente() { sel.modalAddClienteOverlay.classList.add('hidden'); }
function abrirModalNovaDespesa() { sel.formNovaDespesa.reset(); sel.modalNovaDespesaOverlay.classList.remove('hidden'); sel.inputDespesaDescricao.focus(); sel.despesaMetodosContainer.querySelectorAll('.pagamento-metodo-btn').forEach(btn => btn.classList.remove('border-blue-500', 'bg-blue-100', 'dark:bg-gray-700')); }
function fecharModalNovaDespesa() { sel.modalNovaDespesaOverlay.classList.add('hidden'); }
function abrirModalAddDivida(cliente) { if (!cliente) return; sel.formAddDivida.reset(); sel.formAddDivida.dataset.clienteId = cliente.id; sel.modalDividaClienteNome.textContent = cliente.nome; sel.modalAddDividaOverlay.classList.remove('hidden'); sel.inputDividaValor.focus(); }
function fecharModalAddDivida() { sel.modalAddDividaOverlay.classList.add('hidden'); }
function abrirModalLiquidarDivida(cliente) { if (!cliente) return; const dividaTotal = cliente.dividas.reduce((total, divida) => total + divida.valor, 0); sel.formLiquidarDivida.reset(); sel.formLiquidarDivida.dataset.clienteId = cliente.id; sel.modalLiquidarClienteNome.textContent = cliente.nome; sel.modalLiquidarDividaAtual.textContent = dividaTotal.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' }); sel.modalLiquidarDividaOverlay.classList.remove('hidden'); sel.inputLiquidarValor.focus(); }
function fecharModalLiquidarDivida() { sel.modalLiquidarDividaOverlay.classList.add('hidden'); }

function abrirModalFechoGlobal(relatorio, isHistoric = false) { relatorioAtual = relatorio; sel.fgDataRelatorio.textContent = new Date(relatorio.data).toLocaleDateString('pt-PT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); sel.fgTotalVendido.textContent = relatorio.totalVendido.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' }); sel.fgTotalNumerario.textContent = relatorio.totalNumerario.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' }); sel.fgTotalTpa.textContent = relatorio.totalTpa.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' }); sel.fgContasFechadas.textContent = relatorio.numContasFechadas; sel.fgMediaPorConta.textContent = relatorio.mediaPorConta.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' }); sel.fgListaProdutos.innerHTML = Object.entries(relatorio.produtosVendidos).sort(([, a], [, b]) => b - a).map(([nome, qtd]) => `<div class="flex justify-between text-sm"><span class="font-semibold">${qtd}x</span><span>${nome}</span></div>`).join(''); if (isHistoric) { sel.btnArquivarDia.classList.add('hidden'); sel.fgBotoesRelatorio.classList.remove('hidden'); sel.fgBotoesRelatorio.classList.add('flex'); } else { sel.btnArquivarDia.classList.remove('hidden'); sel.fgBotoesRelatorio.classList.add('hidden'); } sel.modalFechoGlobalOverlay.classList.remove('hidden');}
function fecharModalFechoGlobal() { sel.modalFechoGlobalOverlay.classList.add('hidden'); }
function abrirModalBackupRestore() { sel.modalBackupRestoreOverlay.classList.remove('hidden'); }
function fecharModalBackupRestore() { sel.modalBackupRestoreOverlay.classList.add('hidden'); }
function abrirModalLimparDados() { sel.inputConfirmarLimpeza.value = ''; sel.btnConfirmarLimpezaFinal.disabled = true; sel.btnConfirmarLimpezaFinal.classList.add('bg-gray-400', 'cursor-not-allowed'); sel.modalLimparDadosOverlay.classList.remove('hidden'); }
function fecharModalLimparDados() { sel.modalLimparDadosOverlay.classList.add('hidden'); }
function abrirModalDicaDoDia(dica) { if (!dica) return; sel.dicaCategoria.textContent = dica.category; sel.dicaTitulo.textContent = dica.title; sel.dicaConteudo.textContent = dica.content; sel.modalDicaOverlay.classList.remove('hidden'); }
function abrirModalEditBusinessName(currentName) { sel.formEditBusinessName.reset(); sel.inputEditBusinessName.value = currentName; sel.modalEditBusinessNameOverlay.classList.remove('hidden'); sel.inputEditBusinessName.focus(); }
function fecharModalEditBusinessName() { sel.modalEditBusinessNameOverlay.classList.add('hidden'); }
function abrirModalConfirmacao(titulo, mensagem, callback) { sel.modalConfirmacaoTitulo.textContent = titulo; sel.modalConfirmacaoMensagem.textContent = mensagem; onConfirmCallback = callback; sel.modalConfirmacaoOverlay.classList.remove('hidden'); }
function fecharModalConfirmacao() { sel.modalConfirmacaoOverlay.classList.add('hidden'); onConfirmCallback = null; }
function abrirModalRelatorioPeriodo(relatorio, titulo) {
    if (!relatorio) return;
    const formatarMoeda = (valor) => valor.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    sel.relatorioPeriodoTitulo.textContent = titulo;
    sel.relatorioTotalEntradas.textContent = formatarMoeda(relatorio.totalEntradas);
    sel.relatorioTotalSaidas.textContent = formatarMoeda(relatorio.totalSaidas);
    sel.relatorioSaldoFinal.textContent = formatarMoeda(relatorio.saldoFinal);
    sel.relatorioPeriodoTabelaContainer.innerHTML = '';
    if (relatorio.detalhesPorDia.length === 0) {
        sel.relatorioPeriodoTabelaContainer.innerHTML = `<p class="text-center text-texto-secundario py-4">Nenhum movimento no período.</p>`;
    } else {
        relatorio.detalhesPorDia.forEach(dia => {
            const saldoDia = (dia.entradasNum + dia.entradasTpa) - (dia.saidasNum + dia.saidasTpa);
            const corSaldo = saldoDia >= 0 ? 'text-green-600' : 'text-red-600';
            const linhaHTML = `
                <div class="bg-fundo-principal p-3 rounded-lg shadow-sm">
                    <div class="flex justify-between items-center font-bold mb-2">
                        <span>${new Date(dia.data).toLocaleDateString('pt-PT', { weekday: 'short', day: '2-digit', month: 'short' })}</span>
                        <span class="${corSaldo}">${formatarMoeda(saldoDia)}</span>
                    </div>
                    <div class="text-xs text-texto-secundario space-y-1">
                        <div class="flex justify-between"><span>(+) Entradas (NUM+TPA):</span> <span>${formatarMoeda(dia.entradasNum + dia.entradasTpa)}</span></div>
                        <div class="flex justify-between"><span>(-) Saídas (NUM+TPA):</span> <span>${formatarMoeda(dia.saidasNum + dia.saidasTpa)}</span></div>
                    </div>
                </div>
            `;
            sel.relatorioPeriodoTabelaContainer.insertAdjacentHTML('beforeend', linhaHTML);
        });
    }
    sel.modalRelatorioPeriodoOverlay.classList.remove('hidden');
}
function fecharModalRelatorioPeriodo() { sel.modalRelatorioPeriodoOverlay.classList.add('hidden'); }

/**
 * Renderiza o HTML de todos os modais da aplicação.
 * @returns {string} O HTML completo do contentor de modais.
 */
function render() {
 return htmlContent;
}

/**
 * Adiciona todos os event listeners para todos os modais.
 */
function mount() {
    const modalsContainer = document.getElementById('modals-container');
    if (!modalsContainer) return;
    
    // --- Seletores Genéricos ---
    sel.allModals = modalsContainer.querySelectorAll('.fixed.inset-0');
    sel.closeButtons = modalsContainer.querySelectorAll('.btn-fechar-modal');
    // --- Seletores Específicos por Modal ---
    sel.modalConfirmacaoOverlay = document.getElementById('modal-confirmacao-overlay');
    sel.modalConfirmacaoTitulo = document.getElementById('modal-confirmacao-titulo');
    sel.modalConfirmacaoMensagem = document.getElementById('modal-confirmacao-mensagem');
    sel.btnConfirmarAcao = document.getElementById('btn-confirmar-acao');
    sel.btnCancelarConfirmacao = document.getElementById('btn-cancelar-confirmacao');
    sel.modalNovaContaOverlay = document.getElementById('modal-nova-conta-overlay');
    sel.formNovaConta = document.getElementById('form-nova-conta');
    sel.inputNomeConta = document.getElementById('input-nome-conta');
    sel.modalAddProdutoOverlay = document.getElementById('modal-add-produto-overlay');
    sel.formAddProduto = document.getElementById('form-add-produto');
    sel.inputProdutoNome = document.getElementById('input-produto-nome');
    sel.inputProdutoPreco = document.getElementById('input-produto-preco');
    sel.inputProdutoStock = document.getElementById('input-produto-stock');
    sel.inputProdutoStockMinimo = document.getElementById('input-produto-stock-minimo');
    sel.modalEditProdutoOverlay = document.getElementById('modal-edit-produto-overlay');
    sel.formEditProduto = document.getElementById('form-edit-produto');
    sel.hiddenEditProdutoId = document.getElementById('hidden-edit-produto-id');
    sel.inputEditProdutoNome = document.getElementById('input-edit-produto-nome');
    sel.inputEditProdutoPreco = document.getElementById('input-edit-produto-preco');
    sel.inputEditProdutoStockMinimo = document.getElementById('input-edit-produto-stock-minimo');
    sel.modalAddStockOverlay = document.getElementById('modal-add-stock-overlay');
    sel.formAddStock = document.getElementById('form-add-stock');
    sel.hiddenAddStockId = document.getElementById('hidden-add-stock-id');
    sel.addStockNomeProduto = document.getElementById('add-stock-nome-produto');
    sel.inputAddStockQuantidade = document.getElementById('input-add-stock-quantidade');
    sel.modalMoverStockOverlay = document.getElementById('modal-mover-stock-overlay');
    sel.formMoverStock = document.getElementById('form-mover-stock');
    sel.hiddenMoverStockId = document.getElementById('hidden-mover-stock-id');
    sel.moverStockNomeProduto = document.getElementById('mover-stock-nome-produto');
    sel.moverStockArmazemQtd = document.getElementById('mover-stock-armazem-qtd');
    sel.inputMoverStockQuantidade = document.getElementById('input-mover-stock-quantidade');
    sel.modalAddPedidoOverlay = document.getElementById('modal-add-pedido-overlay');
    sel.formAddPedido = document.getElementById('form-add-pedido');
    sel.hiddenContaId = document.getElementById('hidden-conta-id');
    sel.modalPedidoNomeConta = document.getElementById('modal-pedido-nome-conta');
    sel.inputBuscaProdutoPedido = document.getElementById('input-busca-produto-pedido');
    sel.autocompleteResults = document.getElementById('autocomplete-results');
    sel.detalhesProdutoSelecionado = document.getElementById('detalhes-produto-selecionado');
    sel.pedidoNomeProduto = document.getElementById('pedido-nome-produto');
    sel.pedidoPrecoProduto = document.getElementById('pedido-preco-produto');
    sel.pedidoStockDisponivel = document.getElementById('pedido-stock-disponivel');
    sel.inputQuantidade = document.getElementById('input-quantidade');
    sel.modalPagamentoOverlay = document.getElementById('modal-pagamento-overlay');
    sel.formPagamento = document.getElementById('form-pagamento');
    sel.pagamentoTotalSpan = document.getElementById('pagamento-total-span');
    sel.pagamentoMetodosContainer = document.getElementById('pagamento-metodos-container');
    sel.btnConfirmarPagamento = document.getElementById('btn-confirmar-pagamento');
    sel.modalAddClienteOverlay = document.getElementById('modal-add-cliente-overlay');
    sel.formAddCliente = document.getElementById('form-add-cliente');
    sel.inputClienteNome = document.getElementById('input-cliente-nome');
    sel.inputClienteContacto = document.getElementById('input-cliente-contacto');
    sel.inputClienteCategoria = document.getElementById('input-cliente-categoria');
    sel.modalNovaDespesaOverlay = document.getElementById('modal-nova-despesa-overlay');
    sel.formNovaDespesa = document.getElementById('form-nova-despesa');
    sel.inputDespesaDescricao = document.getElementById('input-despesa-descricao');
    sel.inputDespesaValor = document.getElementById('input-despesa-valor');
    sel.despesaMetodosContainer = document.getElementById('despesa-metodos-container');
    sel.hiddenDespesaMetodo = document.getElementById('hidden-despesa-metodo');
    sel.modalAddDividaOverlay = document.getElementById('modal-add-divida-overlay');
    sel.formAddDivida = document.getElementById('form-add-divida');
    sel.modalDividaClienteNome = document.getElementById('modal-divida-cliente-nome');
    sel.inputDividaValor = document.getElementById('input-divida-valor');
    sel.inputDividaDescricao = document.getElementById('input-divida-descricao');
    sel.modalLiquidarDividaOverlay = document.getElementById('modal-liquidar-divida-overlay');
    sel.formLiquidarDivida = document.getElementById('form-liquidar-divida');
    sel.modalLiquidarClienteNome = document.getElementById('modal-liquidar-cliente-nome');
    sel.modalLiquidarDividaAtual = document.getElementById('modal-liquidar-divida-atual');
    sel.inputLiquidarValor = document.getElementById('input-liquidar-valor');
    sel.modalFechoGlobalOverlay = document.getElementById('modal-fecho-global-overlay');
    sel.fgDataRelatorio = document.getElementById('fg-data-relatorio');
    sel.fgTotalVendido = document.getElementById('fg-total-vendido');
    sel.fgTotalNumerario = document.getElementById('fg-total-numerario');
    sel.fgTotalTpa = document.getElementById('fg-total-tpa');
    sel.fgContasFechadas = document.getElementById('fg-contas-fechadas');
    sel.fgMediaPorConta = document.getElementById('fg-media-por-conta');
    sel.fgListaProdutos = document.getElementById('fg-lista-produtos');
    sel.fgBotoesRelatorio = document.getElementById('fg-botoes-relatorio');
    sel.btnExportarPdf = document.getElementById('btn-exportar-pdf');
    sel.btnExportarXls = document.getElementById('btn-exportar-xls');
    sel.btnArquivarDia = document.getElementById('btn-arquivar-dia');
    sel.modalBackupRestoreOverlay = document.getElementById('modal-backup-restore-overlay');
    sel.btnCriarBackup = document.getElementById('btn-criar-backup');
    sel.inputRestaurarBackup = document.getElementById('input-restaurar-backup');
    sel.btnAbrirSeletorFicheiro = document.getElementById('btn-abrir-seletor-ficheiro');
    sel.modalLimparDadosOverlay = document.getElementById('modal-limpar-dados-overlay');
    sel.inputConfirmarLimpeza = document.getElementById('input-confirmar-limpeza');
    sel.btnConfirmarLimpezaFinal = document.getElementById('btn-confirmar-limpeza-final');
    sel.modalDicaOverlay = document.getElementById('modal-dica-overlay');
    sel.dicaCategoria = document.getElementById('dica-categoria');
    sel.dicaTitulo = document.getElementById('dica-titulo');
    sel.dicaConteudo = document.getElementById('dica-conteudo');
    sel.modalEditBusinessNameOverlay = document.getElementById('modal-edit-business-name-overlay');
    sel.formEditBusinessName = document.getElementById('form-edit-business-name');
    sel.inputEditBusinessName = document.getElementById('input-edit-business-name');
    sel.modalRelatorioPeriodoOverlay = document.getElementById('modal-relatorio-periodo-overlay');
    sel.relatorioPeriodoTitulo = document.getElementById('relatorio-periodo-titulo');
    sel.relatorioPeriodoTabelaContainer = document.getElementById('relatorio-periodo-tabela-container');
    sel.relatorioTotalEntradas = document.getElementById('relatorio-total-entradas');
    sel.relatorioTotalSaidas = document.getElementById('relatorio-total-saidas');
    sel.relatorioSaldoFinal = document.getElementById('relatorio-saldo-final');
    
    // --- Event Listeners ---
    sel.closeButtons.forEach(btn => {
        const modalId = btn.dataset.modal;
        if (modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                btn.addEventListener('click', () => modal.classList.add('hidden'));
            }
        }
    });
    sel.allModals.forEach(modal => {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.classList.add('hidden');
            }
        });
    });
    sel.btnConfirmarAcao.addEventListener('click', () => {
        if (typeof onConfirmCallback === 'function') {
            onConfirmCallback();
        }
        fecharModalConfirmacao();
    });
    sel.btnCancelarConfirmacao.addEventListener('click', fecharModalConfirmacao);
    sel.formNovaConta.addEventListener('submit', handleNovaConta);
    sel.formAddProduto.addEventListener('submit', handleAddProduto);
    sel.formEditProduto.addEventListener('submit', handleEditProduto);
    sel.formAddStock.addEventListener('submit', handleAddStock);
    sel.formMoverStock.addEventListener('submit', handleMoverStock);
    sel.formAddPedido.addEventListener('submit', handleAddPedido);
    sel.formAddCliente.addEventListener('submit', handleAddCliente);
    sel.formNovaDespesa.addEventListener('submit', handleNovaDespesa);
    sel.formAddDivida.addEventListener('submit', handleAddDivida);
    sel.formLiquidarDivida.addEventListener('submit', handleLiquidarDivida);
    sel.formEditBusinessName.addEventListener('submit', handleEditBusinessName);
    sel.inputBuscaProdutoPedido.addEventListener('input', debouncedBuscaProduto);
    sel.pagamentoMetodosContainer.addEventListener('click', handleFinalizarPagamento);
    sel.btnConfirmarPagamento.addEventListener('click', handleFinalizarPagamento);
    sel.despesaMetodosContainer.addEventListener('click', (event) => {
        const metodoBtn = event.target.closest('.pagamento-metodo-btn');
        if (metodoBtn) {
            sel.despesaMetodosContainer.querySelectorAll('.pagamento-metodo-btn').forEach(btn => btn.classList.remove('border-blue-500', 'bg-blue-100', 'dark:bg-gray-700'));
            metodoBtn.classList.add('border-blue-500', 'bg-blue-100', 'dark:bg-gray-700');
            sel.hiddenDespesaMetodo.value = metodoBtn.dataset.metodo;
        }
    });
    sel.btnArquivarDia.addEventListener('click', handleArquivarDia);
    sel.btnExportarPdf.addEventListener('click', () => exportarRelatorioPDF(relatorioAtual, store.getState().config));
    sel.btnExportarXls.addEventListener('click', () => exportarRelatorioXLS(relatorioAtual, store.getState().config));
    sel.btnCriarBackup.addEventListener('click', handleCreateBackup);
    sel.btnAbrirSeletorFicheiro.addEventListener('click', () => sel.inputRestaurarBackup.click());
    sel.inputRestaurarBackup.addEventListener('change', handleRestoreFromFile);
    sel.inputConfirmarLimpeza.addEventListener('input', () => {
        if (sel.inputConfirmarLimpeza.value === 'APAGAR') {
            sel.btnConfirmarLimpezaFinal.disabled = false;
            sel.btnConfirmarLimpezaFinal.classList.remove('bg-gray-400', 'cursor-not-allowed');
            sel.btnConfirmarLimpezaFinal.classList.add('bg-red-600', 'hover:bg-red-700');
        } else {
            sel.btnConfirmarLimpezaFinal.disabled = true;
            sel.btnConfirmarLimpezaFinal.classList.add('bg-gray-400', 'cursor-not-allowed');
            sel.btnConfirmarLimpezaFinal.classList.remove('bg-red-600', 'hover:bg-red-700');
        }
    });
    sel.btnConfirmarLimpezaFinal.addEventListener('click', handleLimparDados);
}

/**
 * Inicializa o componente de Modais (renderiza e monta).
 */
function init() {
    const modalsContainer = document.getElementById('modals-container');
    if (modalsContainer) {
        modalsContainer.innerHTML = render();
        mount();
    }
}

// A API pública que as Views irão usar
export {
    init,
    abrirModalNovaConta, fecharModalNovaConta,
    abrirModalAddProduto, fecharModalAddProduto,
    abrirModalEditProduto, fecharModalEditProduto,
    abrirModalAddStock, fecharModalAddStock,
    abrirModalMoverStock, fecharModalMoverStock,
    abrirModalAddPedido, fecharModalAddPedido,
    abrirModalPagamento, fecharModalPagamento,
    abrirModalAddCliente, fecharModalAddCliente,
    abrirModalNovaDespesa, fecharModalNovaDespesa,
    abrirModalRelatorioPeriodo, fecharModalRelatorioPeriodo,
    abrirModalAddDivida, fecharModalAddDivida,
    abrirModalLiquidarDivida, fecharModalLiquidarDivida,
    abrirModalFechoGlobal, fecharModalFechoGlobal,
    abrirModalBackupRestore, fecharModalBackupRestore,
    abrirModalLimparDados, fecharModalLimparDados,
    abrirModalDicaDoDia,
    abrirModalEditBusinessName, fecharModalEditBusinessName,
    abrirModalConfirmacao, fecharModalConfirmacao
};