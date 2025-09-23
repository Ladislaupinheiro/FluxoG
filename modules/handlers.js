// /modules/handlers.js - Contém a lógica de negócio e os gestores de eventos (v3.3)
'use strict';

import { estado, salvarEstado, produtoSelecionadoParaPedido, setProdutoSelecionado, setDataAtual, relatorioAtualParaExportar } from './state.js';
import { mostrarNotificacao, renderizarDashboard, renderizarSeletorDeClientes, renderizarVistaClienteAtivo, renderizarInventario, verificarAlertasDeStock, navigateToTab, atualizarTodaUI } from './ui.js';
import * as modals from './modals.js';
import * as sel from './selectors.js';
import * as security from './security.js';

// ===================================
// HANDLERS DE SEGURANÇA
// ===================================

export async function handleAtivacao(event) {
    event.preventDefault();
    const chave = sel.inputChaveLicenca.value.trim().toUpperCase();
    sel.mensagemErroAtivacao.classList.add('hidden');

    if (!chave) {
        sel.mensagemErroAtivacao.textContent = 'Por favor, insira uma chave de licença.';
        sel.mensagemErroAtivacao.classList.remove('hidden');
        return;
    }
    
    const regex = /^GESTORBAR-PROD-[A-Z0-9]{4}-DEMO$/;
    if (!regex.test(chave)) {
        sel.mensagemErroAtivacao.textContent = 'O formato da chave de licença é inválido.';
        sel.mensagemErroAtivacao.classList.remove('hidden');
        return;
    }

    try {
        await security.ativarLicenca(chave);
        sel.modalAtivacao.classList.add('hidden');
        sel.modalCriarSenha.classList.remove('hidden');
        sel.inputCriarPin.focus();
    } catch (error) {
        console.error("Erro ao ativar a licença:", error);
        sel.mensagemErroAtivacao.textContent = 'Ocorreu um erro inesperado. Tente novamente.';
        sel.mensagemErroAtivacao.classList.remove('hidden');
    }
}

export async function handleCriarSenha(event) {
    event.preventDefault();
    const pin = sel.inputCriarPin.value;
    const confirmarPin = sel.inputConfirmarPin.value;
    sel.mensagemErroCriarSenha.classList.add('hidden');

    if (pin.length !== 4 || confirmarPin.length !== 4 || !/^\d{4}$/.test(pin)) {
        sel.mensagemErroCriarSenha.textContent = 'O PIN deve conter exatamente 4 dígitos numéricos.';
        sel.mensagemErroCriarSenha.classList.remove('hidden');
        return;
    }
    if (pin !== confirmarPin) {
        sel.mensagemErroCriarSenha.textContent = 'Os PINs não coincidem. Tente novamente.';
        sel.mensagemErroCriarSenha.classList.remove('hidden');
        return;
    }

    try {
        await security.guardarHashSenha(pin);
        iniciarSessao();
    } catch (error) {
        console.error("Erro ao guardar o PIN:", error);
        sel.mensagemErroCriarSenha.textContent = 'Ocorreu um erro ao guardar o PIN. Tente novamente.';
        sel.mensagemErroCriarSenha.classList.remove('hidden');
    }
}

export async function handleVerificarSenha(event) {
    event.preventDefault();
    if (security.verificarBloqueio()) {
        const tempoRestante = security.obterTempoBloqueioRestante();
        sel.mensagemErroInserirSenha.textContent = `Aplicação bloqueada. Tente novamente em ${tempoRestante} segundos.`;
        sel.mensagemErroInserirSenha.classList.remove('hidden');
        return;
    }

    const pin = sel.inputInserirPin.value;
    sel.mensagemErroInserirSenha.classList.add('hidden');

    try {
        const pinCorreto = await security.verificarSenha(pin);
        if (pinCorreto) {
            security.limparTentativasFalhadas();
            iniciarSessao();
        } else {
            security.registrarTentativaFalhada();
            sel.mensagemErroInserirSenha.textContent = 'PIN incorreto. Tente novamente.';
            sel.mensagemErroInserirSenha.classList.remove('hidden');
        }
    } catch (error) {
        console.error("Erro ao verificar o PIN:", error);
        sel.mensagemErroInserirSenha.textContent = 'Ocorreu um erro ao verificar o PIN. Tente novamente.';
        sel.mensagemErroInserirSenha.classList.remove('hidden');
    }
}

export function handleEsqueciSenha() {
    modals.abrirModalConfirmacao(
        'Esqueceu-se do PIN?',
        'Isto irá limpar todos os dados da aplicação, incluindo inventário e contas. Terá de reativar a aplicação com a sua chave de licença original. Deseja continuar?',
        () => {
            try {
                localStorage.clear();
                window.location.reload();
            } catch (error) {
                console.error("Erro ao tentar limpar os dados:", error);
                mostrarNotificacao("Não foi possível limpar os dados. Por favor, faça-o manualmente nas configurações do browser.", "erro");
            }
        }
    );
}

// ===================================
// FUNÇÃO CENTRAL DE LOGIN E PREPARAÇÃO
// ===================================

function iniciarSessao() {
    try {
        sel.modalAtivacao.classList.add('hidden');
        sel.modalCriarSenha.classList.add('hidden');
        sel.modalInserirSenha.classList.add('hidden');

        sel.appContainer.classList.remove('hidden');
        sel.bottomNav.classList.remove('hidden');

        carregarEstado();
        navigateToTab('tab-atendimento');
        atualizarTodaUI();
    } catch (error) {
        console.error("Erro crítico ao iniciar a sessão:", error);
        document.body.innerHTML = `<div style="color: red; text-align: center; padding: 20px;">Ocorreu um erro crítico ao carregar a aplicação.</div>`;
    }
}


// ===================================
// HANDLERS DA APLICAÇÃO
// ===================================

export function handleCriarNovaConta(event) {
    event.preventDefault();
    try {
        const nomeConta = sel.inputNomeConta.value.trim();
        if (!nomeConta) {
            mostrarNotificacao("O nome da conta não pode estar vazio.", "erro");
            return;
        }
        if (estado.contasAtivas.some(c => c.status === 'ativa' && c.nome.toLowerCase() === nomeConta.toLowerCase())) {
            mostrarNotificacao(`Já existe uma conta ativa com o nome "${nomeConta}".`, "erro");
            return;
        }
        const maxId = estado.contasAtivas.reduce((max, c) => c.id > max ? c.id : max, 0);
        estado.contasAtivas.push({ id: maxId + 1, nome: nomeConta, pedidos: [], dataAbertura: new Date(), status: 'ativa' });
        modals.fecharModalNovaConta();
        sel.seletorCliente.value = estado.contasAtivas[estado.contasAtivas.length - 1].id;
        
        // Otimização: Renderização específica
        renderizarDashboard();
        renderizarSeletorDeClientes();
        renderizarVistaClienteAtivo();

        salvarEstado();
        mostrarNotificacao(`Conta "${nomeConta}" criada com sucesso!`);
    } catch (error) {
        console.error("Erro em handleCriarNovaConta:", error);
        mostrarNotificacao("Ocorreu um erro ao criar a conta.", "erro");
    }
}

export function handleAddPedido(event) {
    event.preventDefault();
    try {
        const idConta = parseInt(sel.hiddenContaId.value);
        const quantidade = parseInt(sel.inputQuantidade.value);
        if (!produtoSelecionadoParaPedido) {
            mostrarNotificacao("Por favor, selecione um produto da lista.", "erro");
            return;
        }
        const idProduto = produtoSelecionadoParaPedido.id;
        const conta = estado.contasAtivas.find(c => c.id === idConta);
        const produto = estado.inventario.find(p => p.id === idProduto);
        
        if (!conta || !produto || isNaN(quantidade) || quantidade <= 0) {
            mostrarNotificacao("Dados de pedido inválidos.", "erro");
            return;
        }
        if (quantidade > produto.stockGeleira) {
            mostrarNotificacao(`Stock insuficiente. Apenas ${produto.stockGeleira} disponíveis na geleira.`, "erro");
            return;
        }

        produto.stockGeleira -= quantidade;
        const pedidoExistente = conta.pedidos.find(p => p.produtoId === produto.id);
        if (pedidoExistente) {
            pedidoExistente.qtd += quantidade;
        } else {
            conta.pedidos.push({ produtoId: produto.id, nome: produto.nome, preco: produto.preco, qtd: quantidade });
        }
        
        modals.fecharModalAddPedido();
        
        // Otimização: Renderização específica
        renderizarVistaClienteAtivo();
        verificarAlertasDeStock();
        renderizarDashboard();

        salvarEstado();
        mostrarNotificacao(`${quantidade}x ${produto.nome} adicionado(s)!`);
    } catch (error) {
        console.error("Erro em handleAddPedido:", error);
        mostrarNotificacao("Ocorreu um erro ao adicionar o pedido.", "erro");
    }
}

export function handleSalvarNovoNome(event) {
    event.preventDefault();
    try {
        const idConta = parseInt(sel.hiddenEditNomeId.value);
        const novoNome = sel.inputEditNome.value.trim();
        const conta = estado.contasAtivas.find(c => c.id === idConta);
        if (!conta || !novoNome) {
            mostrarNotificacao("O nome não pode estar vazio.", "erro");
            return;
        }
        conta.nome = novoNome;
        modals.fecharModalEditNome();
        
        // Otimização: Renderização específica
        renderizarSeletorDeClientes();
        renderizarVistaClienteAtivo();

        salvarEstado();
        mostrarNotificacao(`Conta renomeada para "${novoNome}"!`);
    } catch (error) {
        console.error("Erro em handleSalvarNovoNome:", error);
        mostrarNotificacao("Ocorreu um erro ao renomear a conta.", "erro");
    }
}

export function handleFinalizarPagamento() {
    try {
        const idConta = parseInt(sel.pagamentoContaIdInput.value);
        const metodoBtn = sel.pagamentoMetodosContainer.querySelector('.border-blue-500');
        if (!metodoBtn) {
            mostrarNotificacao("Por favor, selecione um método de pagamento.", "erro");
            return;
        }
        const conta = estado.contasAtivas.find(c => c.id === idConta);
        if (!conta) return;
        conta.status = 'fechada';
        conta.dataFecho = new Date();
        conta.metodoPagamento = metodoBtn.dataset.metodo;
        conta.valorFinal = conta.pedidos.reduce((total, p) => total + (p.preco * p.qtd), 0);
        
        modals.fecharModalPagamento();
        
        // Otimização: Renderização específica
        renderizarDashboard();
        renderizarSeletorDeClientes();
        renderizarVistaClienteAtivo();

        salvarEstado();
        mostrarNotificacao(`Conta "${conta.nome}" finalizada com sucesso!`);
    } catch (error) {
        console.error("Erro em handleFinalizarPagamento:", error);
        mostrarNotificacao("Ocorreu um erro ao finalizar o pagamento.", "erro");
    }
}

export function handleAddProduto(event) {
    event.preventDefault();
    try {
        const nome = sel.inputProdutoNome.value.trim();
        const preco = parseFloat(sel.inputProdutoPreco.value);
        const stock = parseInt(sel.inputProdutoStock.value);
        const stockMinimo = parseInt(sel.inputProdutoStockMinimo.value);

        if (!nome || isNaN(preco) || preco < 0 || isNaN(stock) || stock < 0 || isNaN(stockMinimo) || stockMinimo < 0) {
            mostrarNotificacao("Dados inválidos. Verifique todos os campos.", "erro");
            return;
        }

        estado.inventario.push({ id: crypto.randomUUID(), nome, preco, stockArmazem: stock, stockGeleira: 0, stockMinimo });
        modals.fecharModalAddProduto();
        
        // Otimização: Renderização específica
        renderizarInventario();

        salvarEstado();
        mostrarNotificacao(`Produto "${nome}" adicionado com sucesso!`);
    } catch (error) {
        console.error("Erro em handleAddProduto:", error);
        mostrarNotificacao("Ocorreu um erro ao adicionar o produto.", "erro");
    }
}

export function handleEditProduto(event) {
    event.preventDefault();
    try {
        const id = sel.hiddenEditProdutoId.value;
        const produto = estado.inventario.find(p => p.id === id);
        if (!produto) {
            mostrarNotificacao("Produto não encontrado.", "erro");
            return;
        }
        const nome = sel.inputEditProdutoNome.value.trim();
        const preco = parseFloat(sel.inputEditProdutoPreco.value);
        const stockMinimo = parseInt(sel.inputEditProdutoStockMinimo.value);
        if (!nome || isNaN(preco) || preco < 0 || isNaN(stockMinimo) || stockMinimo < 0) {
            mostrarNotificacao("Dados inválidos. Verifique os valores.", "erro");
            return;
        }
        produto.nome = nome;
        produto.preco = preco;
        produto.stockMinimo = stockMinimo;
        
        modals.fecharModalEditProduto();
        
        // Otimização: Renderização específica
        renderizarInventario();
        renderizarVistaClienteAtivo(); // Para garantir que os preços/nomes são atualizados se o item estiver num carrinho

        salvarEstado();
        mostrarNotificacao(`Produto "${nome}" atualizado com sucesso!`);
    } catch (error) {
        console.error("Erro em handleEditProduto:", error);
        mostrarNotificacao("Ocorreu um erro ao editar o produto.", "erro");
    }
}

export function handleAddStock(event) {
    event.preventDefault();
    try {
        const produtoId = sel.hiddenAddStockId.value;
        const produto = estado.inventario.find(p => p.id === produtoId);
        if (!produto) return;
        const quantidade = parseInt(sel.inputAddStockQuantidade.value);
        if (isNaN(quantidade)) {
            mostrarNotificacao("Por favor, insira um número válido.", "erro");
            return;
        }
        produto.stockArmazem += quantidade;
        modals.fecharModalAddStock();
        
        // Otimização: Renderização específica
        renderizarInventario();

        salvarEstado();
        mostrarNotificacao(quantidade >= 0 ? `${quantidade} un. adicionadas ao armazém.` : `${Math.abs(quantidade)} un. removidas do armazém.`);
    } catch (error) {
        console.error("Erro em handleAddStock:", error);
        mostrarNotificacao("Ocorreu um erro ao atualizar o stock.", "erro");
    }
}

export function handleFormMoverStock(event) {
    event.preventDefault();
    try {
        const produtoId = sel.hiddenMoverStockId.value;
        const produto = estado.inventario.find(p => p.id === produtoId);
        const quantidade = parseInt(sel.inputMoverStockQuantidade.value);

        if (!produto || isNaN(quantidade) || quantidade <= 0) {
            mostrarNotificacao("A quantidade para mover deve ser um número positivo.", "erro");
            return;
        }
        if (quantidade > produto.stockArmazem) {
            mostrarNotificacao(`Apenas ${produto.stockArmazem} un. disponíveis no armazém.`, "erro");
            return;
        }

        produto.stockArmazem -= quantidade;
        produto.stockGeleira += quantidade;
        modals.fecharModalMoverStock();
        
        // Otimização: Renderização específica
        renderizarInventario();
        verificarAlertasDeStock();
        renderizarDashboard(); // O contador de alertas do dashboard pode mudar

        salvarEstado();
        mostrarNotificacao(`${quantidade} un. de ${produto.nome} movidas para a geleira.`);
    } catch (error) {
        console.error("Erro em handleFormMoverStock:", error);
        mostrarNotificacao("Ocorreu um erro ao mover o stock.", "erro");
    }
}

export function handleRemoverItem(idConta, itemIndex) {
    try {
        const conta = estado.contasAtivas.find(c => c.id === idConta);
        if (!conta) return;
        const pedidoRemovido = conta.pedidos.splice(itemIndex, 1)[0];
        if (!pedidoRemovido) return;
        const produtoInventario = estado.inventario.find(p => p.id === pedidoRemovido.produtoId);
        if (produtoInventario) {
            produtoInventario.stockGeleira += pedidoRemovido.qtd;
        }
        
        // Otimização: Renderização específica
        renderizarVistaClienteAtivo();
        verificarAlertasDeStock(); // O stock voltou, o alerta pode desaparecer
        renderizarDashboard();

        salvarEstado();
        mostrarNotificacao("Item removido com sucesso.");
    } catch (error) {
        console.error("Erro em handleRemoverItem:", error);
        mostrarNotificacao("Ocorreu um erro ao remover o item.", "erro");
    }
}

export function handleArquivarDia() {
    modals.abrirModalConfirmacao(
        'Arquivar o Dia?',
        'O stock restante na geleira será devolvido ao armazém e as contas ativas serão limpas. Esta ação não pode ser desfeita.',
        () => {
            try {
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
                
                // Aqui, uma atualização completa é apropriada, pois tudo mudou.
                atualizarTodaUI();

                salvarEstado();
                mostrarNotificacao("Dia arquivado com sucesso. Pronto para um novo dia!");
            } catch (error) {
                console.error("Erro ao arquivar o dia:", error);
                mostrarNotificacao("Ocorreu um erro grave ao arquivar o dia.", "erro");
            }
        }
    );
}

export function handleSelecaoAutocomplete(id, nome) {
    const produto = estado.inventario.find(p => p.id === id);
    if (produto) {
        setProdutoSelecionado(produto);
    }
}

export function handleMudarDataCalendario(novaData) {
    setDataAtual(novaData);
    ui.renderizarCalendario();
}

export function handleExportarPdf() {
    if (!relatorioAtualParaExportar) return;
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        // ... Lógica de criação de PDF
        doc.text("Relatório de Fecho", 10, 10);
        doc.save(`Relatorio_${new Date(relatorioAtualParaExportar.data).toLocaleDateString('pt-PT')}.pdf`);
        mostrarNotificacao("PDF exportado com sucesso.");
    } catch (error) {
        console.error("Erro ao exportar PDF:", error);
        mostrarNotificacao("Ocorreu um erro ao exportar o PDF.", "erro");
    }
}

export function handleExportarXls() {
    if (!relatorioAtualParaExportar) return;
    try {
        const wb = XLSX.utils.book_new();
        // ... Lógica de criação de XLS
        const ws_data = [["Relatório de Fecho"], [new Date(relatorioAtualParaExportar.data).toLocaleDateString('pt-PT')]];
        const ws = XLSX.utils.aoa_to_sheet(ws_data);
        XLSX.utils.book_append_sheet(wb, ws, "Relatorio");
        XLSX.writeFile(wb, `Relatorio_${new Date(relatorioAtualParaExportar.data).toLocaleDateString('pt-PT')}.xlsx`);
        mostrarNotificacao("XLS exportado com sucesso.");
    } catch (error) {
        console.error("Erro ao exportar XLS:", error);
        mostrarNotificacao("Ocorreu um erro ao exportar o XLS.", "erro");
    }
}

