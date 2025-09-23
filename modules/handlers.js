// /modules/handlers.js - Contém a lógica de negócio e os gestores de eventos.

import { estado, salvarEstado, produtoSelecionadoParaPedido, relatorioAtualParaExportar } from './state.js';
import { atualizarTodaUI, mostrarNotificacao } from './ui.js';
import * as modals from './modals.js';
import * as sel from './selectors.js';
import * as security from './security.js';

// ===================================
// HANDLERS DE SEGURANÇA (CORRIGIDOS)
// ===================================

/**
 * Gere a submissão do formulário de ativação de licença.
 * @param {Event} event O evento de submissão do formulário.
 */
export async function handleAtivacaoLicenca(event) {
    event.preventDefault();
    const chave = sel.inputChaveLicenca.value;
    sel.ativacaoMensagemErro.textContent = '';

    if (!security.validarFormatoChave(chave)) {
        sel.ativacaoMensagemErro.textContent = 'O formato da chave de licença é inválido.';
        return;
    }

    await security.ativarLicenca(chave);
    mostrarNotificacao('Aplicação ativada com sucesso!', 'sucesso');
    
    // **CORREÇÃO: Em vez de recarregar, faz a transição direta para o próximo ecrã.**
    sel.modalAtivacao.classList.add('hidden');
    sel.modalCriarSenha.classList.remove('hidden');
}

/**
 * Gere a submissão do formulário de criação de senha (PIN).
 * @param {Event} event O evento de submissão do formulário.
 */
export async function handleCriarSenha(event) {
    event.preventDefault();
    const pin = sel.inputCriarPin.value;
    sel.criarSenhaMensagemErro.textContent = '';

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        sel.criarSenhaMensagemErro.textContent = 'O PIN deve ter exatamente 4 dígitos numéricos.';
        return;
    }

    await security.guardarHashSenha(pin);
    mostrarNotificacao('Senha criada com sucesso!', 'sucesso');

    // **CORREÇÃO: Em vez de recarregar, faz a transição direta para o ecrã de login.**
    sel.modalCriarSenha.classList.add('hidden');
    sel.modalInserirSenha.classList.remove('hidden');
}

/**
 * Gere a submissão do formulário de inserção de senha (PIN) para login.
 * @param {Event} event O evento de submissão do formulário.
 */
export async function handleInserirSenha(event) {
    event.preventDefault();
    const pin = sel.inputInserirPin.value;
    sel.inserirSenhaMensagemErro.textContent = '';

    const bloqueio = security.verificarBloqueio();
    if (bloqueio.bloqueado) {
        sel.inserirSenhaMensagemErro.textContent = `Muitas tentativas. Tente novamente em ${Math.ceil(bloqueio.tempoRestante)} segundos.`;
        return;
    }

    if (pin.length !== 4) {
        sel.inserirSenhaMensagemErro.textContent = 'O PIN deve ter 4 dígitos.';
        return;
    }

    const senhaCorreta = await security.verificarSenha(pin);

    if (senhaCorreta) {
        security.limparTentativas();
        sel.modalInserirSenha.classList.add('hidden');
        sel.appContainer.classList.remove('hidden');
        sel.bottomNav.classList.remove('hidden');
        // A UI principal já foi preparada pelo orquestrador em main.js
    } else {
        security.registrarTentativaFalhada();
        const novoBloqueio = security.verificarBloqueio();
        if (novoBloqueio.bloqueado) {
            sel.inserirSenhaMensagemErro.textContent = `PIN incorreto. Acesso bloqueado por ${Math.ceil(novoBloqueio.tempoRestante)}s.`;
        } else {
            sel.inserirSenhaMensagemErro.textContent = 'PIN incorreto. Tente novamente.';
        }
        sel.inputInserirPin.value = '';
    }
}

/**
 * Gere o fluxo "Esqueci-me da senha", que requer reativação.
 */
export function handleEsqueciSenha() {
    modals.abrirModalConfirmacao(
        'Esqueceu-se da Senha?',
        'Isto irá remover a sua senha e desativar a licença neste dispositivo. Terá de inserir novamente a sua chave de licença para continuar.',
        () => {
            security.invalidarSenha();
            security.desativarLicenca();
            mostrarNotificacao('Senha removida. Por favor, reative a aplicação.', 'sucesso');
            setTimeout(() => location.reload(), 2000); // Aqui o reload é intencional para reiniciar o processo.
        }
    );
}


// ===================================
// HANDLERS DA APLICAÇÃO (EXISTENTES)
// ===================================

export function handleCriarNovaConta(event) {
    event.preventDefault();
    const nomeConta = sel.inputNomeConta.value.trim();
    if (!nomeConta) { mostrarNotificacao("O nome da conta não pode estar vazio.", "erro"); return; }
    if (estado.contasAtivas.some(c => c.status === 'ativa' && c.nome.toLowerCase() === nomeConta.toLowerCase())) {
        mostrarNotificacao(`Já existe uma conta ativa com o nome "${nomeConta}".`, "erro"); return;
    }
    const maxId = estado.contasAtivas.reduce((max, c) => c.id > max ? c.id : max, 0);
    estado.contasAtivas.push({ id: maxId + 1, nome: nomeConta, pedidos: [], dataAbertura: new Date(), status: 'ativa' });
    modals.fecharModalNovaConta();
    sel.seletorCliente.value = estado.contasAtivas[estado.contasAtivas.length - 1].id;
    atualizarTodaUI();
    salvarEstado();
    mostrarNotificacao(`Conta "${nomeConta}" criada com sucesso!`);
}

export function handleAddPedido(event) {
    event.preventDefault();
    const idConta = parseInt(sel.hiddenContaId.value), quantidade = parseInt(sel.inputQuantidade.value);
    if (!produtoSelecionadoParaPedido) { mostrarNotificacao("Por favor, selecione um produto da lista.", "erro"); return; }
    
    const idProduto = produtoSelecionadoParaPedido.id;
    const conta = estado.contasAtivas.find(c => c.id === idConta);
    const produto = estado.inventario.find(p => p.id === idProduto);
    if (!conta || !produto || !quantidade || quantidade <= 0) { mostrarNotificacao("Dados de pedido inválidos.", "erro"); return; }
    if (quantidade > produto.stockGeleira) { mostrarNotificacao(`Stock insuficiente. Apenas ${produto.stockGeleira} disponíveis na geleira.`, "erro"); return; }

    produto.stockGeleira -= quantidade;
    const pedidoExistente = conta.pedidos.find(p => p.produtoId === produto.id);
    if (pedidoExistente) pedidoExistente.qtd += quantidade;
    else conta.pedidos.push({ produtoId: produto.id, nome: produto.nome, preco: produto.preco, qtd: quantidade });
    
    modals.fecharModalAddPedido();
    atualizarTodaUI();
    salvarEstado();
    mostrarNotificacao(`${quantidade}x ${produto.nome} adicionado(s)!`);
}

export function handleSalvarNovoNome(event) {
    event.preventDefault();
    const idConta = parseInt(sel.hiddenEditNomeId.value);
    const novoNome = sel.inputEditNome.value.trim();
    const conta = estado.contasAtivas.find(c => c.id === idConta);
    if (!conta || !novoNome) { mostrarNotificacao("O nome não pode estar vazio.", "erro"); return; }
    conta.nome = novoNome;
    modals.fecharModalEditNome();
    atualizarTodaUI();
    salvarEstado();
    mostrarNotificacao(`Conta renomeada para "${novoNome}"!`);
}

export function handleFinalizarPagamento() {
    const idConta = parseInt(sel.pagamentoContaIdInput.value);
    const metodoBtn = sel.pagamentoMetodosContainer.querySelector('.border-blue-500');
    if (!metodoBtn) { mostrarNotificacao("Por favor, selecione um método de pagamento.", "erro"); return; }
    
    const conta = estado.contasAtivas.find(c => c.id === idConta);
    if (!conta) return;
    conta.status = 'fechada';
    conta.dataFecho = new Date();
    conta.metodoPagamento = metodoBtn.dataset.metodo;
    conta.valorFinal = conta.pedidos.reduce((total, p) => total + (p.preco * p.qtd), 0);
    
    modals.fecharModalPagamento();
    atualizarTodaUI();
    salvarEstado();
    mostrarNotificacao(`Conta "${conta.nome}" finalizada com sucesso!`);
}

export function handleAddProduto(event) {
    event.preventDefault();
    const nome = sel.inputProdutoNome.value.trim();
    const preco = parseFloat(sel.inputProdutoPreco.value);
    const stock = parseInt(sel.inputProdutoStock.value);
    const stockMinimo = parseInt(sel.inputProdutoStockMinimo.value);
    if (!nome || isNaN(preco) || preco <= 0 || isNaN(stock) || stock < 0 || isNaN(stockMinimo) || stockMinimo < 0) {
        mostrarNotificacao("Dados inválidos. Verifique os valores.", "erro"); return;
    }
    estado.inventario.push({ id: crypto.randomUUID(), nome, preco, stockArmazem: stock, stockGeleira: 0, stockMinimo });
    modals.fecharModalAddProduto();
    atualizarTodaUI();
    salvarEstado();
    mostrarNotificacao(`Produto "${nome}" adicionado com sucesso!`);
}

export function handleEditProduto(event) {
    event.preventDefault();
    const id = sel.hiddenEditProdutoId.value;
    const produto = estado.inventario.find(p => p.id === id);
    if (!produto) { mostrarNotificacao("Produto não encontrado.", "erro"); return; }

    const nome = sel.inputEditProdutoNome.value.trim();
    const preco = parseFloat(sel.inputEditProdutoPreco.value);
    const stockMinimo = parseInt(sel.inputEditProdutoStockMinimo.value);
    if (!nome || isNaN(preco) || preco <= 0 || isNaN(stockMinimo) || stockMinimo < 0) {
        mostrarNotificacao("Dados inválidos. Verifique os valores.", "erro"); return;
    }
    
    produto.nome = nome;
    produto.preco = preco;
    produto.stockMinimo = stockMinimo;
    
    modals.fecharModalEditProduto();
    atualizarTodaUI();
    salvarEstado();
    mostrarNotificacao(`Produto "${nome}" atualizado com sucesso!`);
}

export function handleAddStock(event) {
    event.preventDefault();
    const produtoId = sel.hiddenAddStockId.value;
    const produto = estado.inventario.find(p => p.id === produtoId);
    if (!produto) return;
    const quantidade = parseInt(sel.inputAddStockQuantidade.value);
    if (isNaN(quantidade)) { mostrarNotificacao("Por favor, insira um número válido.", "erro"); return; }
    if ((produto.stockArmazem + quantidade) < 0) {
        mostrarNotificacao(`Operação inválida. Stock do armazém não pode ser negativo.`, "erro"); return;
    }
    produto.stockArmazem += quantidade;
    modals.fecharModalAddStock();
    atualizarTodaUI();
    salvarEstado();
    mostrarNotificacao(quantidade > 0 ? `${quantidade} un. adicionadas ao armazém.` : `${Math.abs(quantidade)} un. removidas do armazém.`);
}

export function handleMoverParaGeleira(produtoId, quantidade) {
    const produto = estado.inventario.find(p => p.id === produtoId);
    if (!produto || isNaN(quantidade) || quantidade <= 0) {
        mostrarNotificacao("A quantidade para mover deve ser um número positivo.", "erro"); return false;
    }
    if (quantidade > produto.stockArmazem) {
        mostrarNotificacao(`Apenas ${produto.stockArmazem} un. disponíveis no armazém.`, "erro"); return false;
    }
    produto.stockArmazem -= quantidade;
    produto.stockGeleira += quantidade;
    atualizarTodaUI();
    salvarEstado();
    mostrarNotificacao(`${quantidade} un. de ${produto.nome} movidas para a geleira.`);
    return true;
}

export function handleFormMoverStock(event) {
    event.preventDefault();
    const produtoId = sel.hiddenMoverStockId.value;
    const quantidade = parseInt(sel.inputMoverStockQuantidade.value);
    if (handleMoverParaGeleira(produtoId, quantidade)) {
        modals.fecharModalMoverStock();
    }
}

export function handleRemoverItem(idConta, itemIndex) {
    const conta = estado.contasAtivas.find(c => c.id === idConta);
    if (!conta) return;
    const pedidoRemovido = conta.pedidos.splice(itemIndex, 1)[0];
    if (!pedidoRemovido) return;
    const produtoInventario = estado.inventario.find(p => p.id === pedidoRemovido.produtoId);
    if (produtoInventario) produtoInventario.stockGeleira += pedidoRemovido.qtd;
    atualizarTodaUI();
    salvarEstado();
    mostrarNotificacao("Item removido com sucesso.");
}

export function handleArquivarDia() {
    modals.abrirModalConfirmacao(
        'Arquivar o Dia?',
        'O stock restante na geleira será devolvido ao armazém. Esta ação não pode ser desfeita.',
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
            atualizarTodaUI();
            salvarEstado();
            mostrarNotificacao("Dia arquivado com sucesso. Pronto para um novo dia!");
        }
    );
}

export function handleExportarPdf() {
    if (!relatorioAtualParaExportar) return;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    // Lógica de criação de PDF...
    doc.save(`Relatorio.pdf`);
}

export function handleExportarXls() {
if (!relatorioAtualParaExportar) return;
    const wb = XLSX.utils.book_new();
    // Lógica de criação de XLS...
    XLSX.writeFile(wb, `Relatorio.xlsx`);
}

