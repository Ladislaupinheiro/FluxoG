// /modules/handlers.js - Contém a lógica de negócio e os gestores de eventos (v5.0)
'use strict';

import { estado, salvarEstado, carregarEstado, produtoSelecionadoParaPedido, setProdutoSelecionado, setDataAtual, relatorioAtualParaExportar } from './state.js';
import * as ui from './ui.js';
import * as modals from './modals.js';
import * as sel from './selectors.js';
import * as security from './security.js';


/**
 * Função auxiliar que inicia a sessão do utilizador após uma autenticação bem-sucedida.
 */
function iniciarSessao() {
    carregarEstado();
    
    // Mostra a interface principal da aplicação
    sel.appContainer.classList.remove('hidden');
    sel.bottomNav.classList.remove('hidden');

    if (estado.inventario.length === 0) {
        ui.navigateToTab('tab-inventario');
    } else {
        ui.navigateToTab('tab-atendimento');
    }
    ui.atualizarTodaUI();
}


// ===================================
// HANDLERS DE SEGURANÇA
// ===================================

export async function handleAtivacao(event) {
    event.preventDefault();
    const chave = sel.inputChaveLicenca.value.trim().toUpperCase();
    sel.mensagemErroAtivacao.textContent = '';

    if (!security.validarFormatoChave(chave)) {
        sel.mensagemErroAtivacao.textContent = 'O formato da chave de licença é inválido.';
        return;
    }

    await security.ativarLicenca(chave);
    ui.mostrarNotificacao('Aplicação ativada com sucesso!', 'sucesso');
    
    sel.modalAtivacao.classList.add('hidden');
    sel.modalCriarSenha.classList.remove('hidden');
    sel.inputCriarPin.focus();
}

export async function handleCriarSenha(event) {
    event.preventDefault();
    const pin = sel.inputCriarPin.value;
    const confirmarPin = sel.inputConfirmarPin.value;
    sel.mensagemErroCriarSenha.textContent = '';

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        sel.mensagemErroCriarSenha.textContent = 'O PIN deve ter exatamente 4 dígitos.';
        return;
    }

    if (pin !== confirmarPin) {
        sel.mensagemErroCriarSenha.textContent = 'Os PINs não coincidem.';
        return;
    }

    await security.guardarHashSenha(pin);
    ui.mostrarNotificacao('PIN criado com sucesso!', 'sucesso');

    sel.modalCriarSenha.classList.add('hidden');
    iniciarSessao();
}

export async function handleVerificarSenha(event) {
    event.preventDefault();
    const pin = sel.inputInserirPin.value;
    sel.mensagemErroInserirSenha.textContent = '';

    const bloqueio = security.verificarBloqueio();
    if (bloqueio.bloqueado) {
        sel.mensagemErroInserirSenha.textContent = `Muitas tentativas. Tente novamente em ${Math.ceil(bloqueio.tempoRestante)}s.`;
        return;
    }

    const senhaCorreta = await security.verificarSenha(pin);

    if (senhaCorreta) {
        security.limparTentativas();
        sel.modalInserirSenha.classList.add('hidden');
        iniciarSessao();
    } else {
        security.registrarTentativaFalhada();
        const novoBloqueio = security.verificarBloqueio();
        if (novoBloqueio.bloqueado) {
            sel.mensagemErroInserirSenha.textContent = `PIN incorreto. Acesso bloqueado por ${Math.ceil(novoBloqueio.tempoRestante)}s.`;
        } else {
            sel.mensagemErroInserirSenha.textContent = 'PIN incorreto. Tente novamente.';
        }
        sel.inputInserirPin.value = '';
        sel.inputInserirPin.focus();
    }
}

export function handleEsqueciSenha() {
    modals.abrirModalConfirmacao(
        'Esqueceu-se do PIN?',
        'Isto irá limpar todos os dados da aplicação e desativar a licença. Terá de reativar com a sua chave original.',
        () => {
            localStorage.clear();
            ui.mostrarNotificacao('Dados limpos. A aplicação será recarregada.');
            setTimeout(() => window.location.reload(), 2000);
        }
    );
}

// ===================================
// HANDLERS DA APLICAÇÃO
// ===================================

export function handleCriarNovaConta(event) {
    event.preventDefault();
    const nomeConta = sel.inputNomeConta.value.trim();
    if (!nomeConta) { ui.mostrarNotificacao("O nome da conta não pode estar vazio.", "erro"); return; }
    if (estado.contasAtivas.some(c => c.status === 'ativa' && c.nome.toLowerCase() === nomeConta.toLowerCase())) {
        ui.mostrarNotificacao(`Já existe uma conta ativa com o nome "${nomeConta}".`, "erro"); return;
    }
    const maxId = estado.contasAtivas.reduce((max, c) => c.id > max ? c.id : max, 0);
    estado.contasAtivas.push({ id: maxId + 1, nome: nomeConta, pedidos: [], dataAbertura: new Date(), status: 'ativa' });
    modals.fecharModalNovaConta();
    sel.seletorCliente.value = estado.contasAtivas[estado.contasAtivas.length - 1].id;
    ui.atualizarTodaUI();
    salvarEstado();
    ui.mostrarNotificacao(`Conta "${nomeConta}" criada com sucesso!`);
}

export function handleAddPedido(event) {
    event.preventDefault();
    const idConta = parseInt(sel.hiddenContaId.value);
    const quantidade = parseInt(sel.inputQuantidade.value);
    if (!produtoSelecionadoParaPedido) { ui.mostrarNotificacao("Selecione um produto.", "erro"); return; }
    
    const idProduto = produtoSelecionadoParaPedido.id;
    const conta = estado.contasAtivas.find(c => c.id === idConta);
    const produto = estado.inventario.find(p => p.id === idProduto);
    if (!conta || !produto || !quantidade || quantidade <= 0) { ui.mostrarNotificacao("Dados de pedido inválidos.", "erro"); return; }
    if (quantidade > produto.stockGeleira) { ui.mostrarNotificacao(`Stock insuficiente: ${produto.stockGeleira} disp.`, "erro"); return; }

    produto.stockGeleira -= quantidade;
    const pedidoExistente = conta.pedidos.find(p => p.produtoId === produto.id);
    if (pedidoExistente) pedidoExistente.qtd += quantidade;
    else conta.pedidos.push({ produtoId: produto.id, nome: produto.nome, preco: produto.preco, qtd: quantidade });
    
    modals.fecharModalAddPedido();
    ui.atualizarTodaUI();
    salvarEstado();
    ui.mostrarNotificacao(`${quantidade}x ${produto.nome} adicionado(s)!`);
}

export function handleSalvarNovoNome(event) {
    event.preventDefault();
    const idConta = parseInt(sel.hiddenEditNomeId.value);
    const novoNome = sel.inputEditNome.value.trim();
    const conta = estado.contasAtivas.find(c => c.id === idConta);
    if (!conta || !novoNome) { ui.mostrarNotificacao("O nome não pode estar vazio.", "erro"); return; }
    conta.nome = novoNome;
    modals.fecharModalEditNome();
    ui.atualizarTodaUI();
    salvarEstado();
    ui.mostrarNotificacao(`Conta renomeada para "${novoNome}"!`);
}

export function handleFinalizarPagamento() {
    const idConta = parseInt(sel.pagamentoContaIdInput.value);
    const metodoBtn = sel.pagamentoMetodosContainer.querySelector('.border-blue-500');
    if (!metodoBtn) { ui.mostrarNotificacao("Selecione um método de pagamento.", "erro"); return; }
    
    const conta = estado.contasAtivas.find(c => c.id === idConta);
    if (!conta) return;
    conta.status = 'fechada';
    conta.dataFecho = new Date();
    conta.metodoPagamento = metodoBtn.dataset.metodo;
    conta.valorFinal = conta.pedidos.reduce((total, p) => total + (p.preco * p.qtd), 0);
    
    modals.fecharModalPagamento();
    ui.atualizarTodaUI();
    salvarEstado();
    ui.mostrarNotificacao(`Conta "${conta.nome}" finalizada com sucesso!`);
}

export function handleAddProduto(event) {
    event.preventDefault();
    const nome = sel.inputProdutoNome.value.trim();
    const preco = parseFloat(sel.inputProdutoPreco.value);
    const stock = parseInt(sel.inputProdutoStock.value);
    const stockMinimo = parseInt(sel.inputProdutoStockMinimo.value);
    if (!nome || isNaN(preco) || preco <= 0 || isNaN(stock) || stock < 0 || isNaN(stockMinimo) || stockMinimo < 0) {
        ui.mostrarNotificacao("Dados inválidos. Verifique os valores.", "erro"); return;
    }
    estado.inventario.push({ id: crypto.randomUUID(), nome, preco, stockArmazem: stock, stockGeleira: 0, stockMinimo });
    modals.fecharModalAddProduto();
    ui.atualizarTodaUI();
    salvarEstado();
    ui.mostrarNotificacao(`Produto "${nome}" adicionado!`);
}

export function handleEditProduto(event) {
    event.preventDefault();
    const id = sel.hiddenEditProdutoId.value;
    const produto = estado.inventario.find(p => p.id === id);
    if (!produto) { ui.mostrarNotificacao("Produto não encontrado.", "erro"); return; }

    const nome = sel.inputEditProdutoNome.value.trim();
    const preco = parseFloat(sel.inputEditProdutoPreco.value);
    const stockMinimo = parseInt(sel.inputEditProdutoStockMinimo.value);
    if (!nome || isNaN(preco) || preco <= 0 || isNaN(stockMinimo) || stockMinimo < 0) {
        ui.mostrarNotificacao("Dados inválidos. Verifique os valores.", "erro"); return;
    }
    
    produto.nome = nome;
    produto.preco = preco;
    produto.stockMinimo = stockMinimo;
    
    modals.fecharModalEditProduto();
    ui.atualizarTodaUI();
    salvarEstado();
    ui.mostrarNotificacao(`Produto "${nome}" atualizado!`);
}

export function handleAddStock(event) {
    event.preventDefault();
    const produtoId = sel.hiddenAddStockId.value;
    const produto = estado.inventario.find(p => p.id === produtoId);
    if (!produto) return;
    const quantidade = parseInt(sel.inputAddStockQuantidade.value);
    if (isNaN(quantidade)) { ui.mostrarNotificacao("Insira um número válido.", "erro"); return; }
    if ((produto.stockArmazem + quantidade) < 0) {
        ui.mostrarNotificacao(`Stock do armazém não pode ser negativo.`, "erro"); return;
    }
    produto.stockArmazem += quantidade;
    modals.fecharModalAddStock();
    ui.atualizarTodaUI();
    salvarEstado();
    ui.mostrarNotificacao(quantidade > 0 ? `${quantidade} un. adicionadas.` : `${Math.abs(quantidade)} un. removidas.`);
}

export function handleFormMoverStock(event) {
    event.preventDefault();
    const produtoId = sel.hiddenMoverStockId.value;
    const produto = estado.inventario.find(p => p.id === produtoId);
    const quantidade = parseInt(sel.inputMoverStockQuantidade.value);

    if (!produto || isNaN(quantidade) || quantidade <= 0) {
        ui.mostrarNotificacao("A quantidade deve ser um número positivo.", "erro"); return;
    }
    if (quantidade > produto.stockArmazem) {
        ui.mostrarNotificacao(`Apenas ${produto.stockArmazem} un. disponíveis.`, "erro"); return;
    }
    produto.stockArmazem -= quantidade;
    produto.stockGeleira += quantidade;
    modals.fecharModalMoverStock();
    ui.atualizarTodaUI();
    salvarEstado();
    ui.mostrarNotificacao(`${quantidade} un. de ${produto.nome} movidas para a geleira.`);
}

export function handleRemoverItem(idConta, itemIndex) {
    const conta = estado.contasAtivas.find(c => c.id === idConta);
    if (!conta) return;
    const pedidoRemovido = conta.pedidos.splice(itemIndex, 1)[0];
    if (!pedidoRemovido) return;
    const produtoInventario = estado.inventario.find(p => p.id === pedidoRemovido.produtoId);
    if (produtoInventario) produtoInventario.stockGeleira += pedidoRemovido.qtd;
    ui.atualizarTodaUI();
    salvarEstado();
    ui.mostrarNotificacao("Item removido.");
}

export function handleArquivarDia() {
    modals.abrirModalConfirmacao(
        'Arquivar o Dia?',
        'O stock da geleira será devolvido ao armazém. Esta ação não pode ser desfeita.',
        () => {
            const relatorio = modals.calcularRelatorioDia();
            if (!estado.historicoFechos) estado.historicoFechos = [];
            estado.historicoFechos.push(relatorio);
            estado.contasAtivas = []; 
            estado.inventario.forEach(item => {
                if (item.stockGeleira > 0) {
                    item.stockArmazem += item.stockGeleira;
                    item.stockGeleira = 0;
                }
            });
            modals.fecharModalFechoGlobal();
            ui.atualizarTodaUI();
            salvarEstado();
            ui.mostrarNotificacao("Dia arquivado com sucesso!");
        }
    );
}

export function handleSelecaoAutocomplete(id, nome) {
    const produto = estado.inventario.find(p => p.id === id);
    if (produto) setProdutoSelecionado(produto);
}

export function handleExportarPdf() {
    if (!relatorioAtualParaExportar) return;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    // Lógica de criação de PDF...
    doc.text("Relatório de Fecho", 10, 10);
    doc.save(`Relatorio_${new Date(relatorioAtualParaExportar.data).toLocaleDateString('pt-PT')}.pdf`);
}

export function handleExportarXls() {
    if (!relatorioAtualParaExportar) return;
    const wb = XLSX.utils.book_new();
    // Lógica de criação de XLS...
    const ws_data = [["Relatório"]];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, "Relatorio");
    XLSX.writeFile(wb, `Relatorio_${new Date(relatorioAtualParaExportar.data).toLocaleDateString('pt-PT')}.xlsx`);
}

