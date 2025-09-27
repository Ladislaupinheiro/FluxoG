// /modules/handlers.js - (v7.3 - Relatórios Profissionais)
'use strict';

import { estado, produtoSelecionadoParaPedido, setProdutoSelecionado, relatorioAtualParaExportar } from './state.js';
import * as ui from './ui.js';
import * as modals from './modals.js';
import * as sel from './selectors.js';
import * as db from './database.js';

// ... (todas as outras funções de handlers, como handleCriarNovaConta, etc., permanecem inalteradas) ...
export async function handleCriarNovaConta(event) {
    event.preventDefault();
    const nomeConta = sel.inputNomeConta.value.trim();
    if (!nomeConta) { ui.mostrarNotificacao("O nome da conta não pode estar vazio.", "erro"); return; }
    if (estado.contasAtivas.some(c => c.status === 'ativa' && c.nome.toLowerCase() === nomeConta.toLowerCase())) {
        ui.mostrarNotificacao(`Já existe uma conta ativa com o nome "${nomeConta}".`, "erro"); return;
    }
    const maxId = estado.contasAtivas.reduce((max, c) => c.id > max ? c.id : max, 0);
    const novaContaObj = { id: maxId + 1, nome: nomeConta, pedidos: [], dataAbertura: new Date().toISOString(), status: 'ativa' };
    estado.contasAtivas.push(novaContaObj);
    await db.salvarItem('contas', novaContaObj);
    modals.fecharModalNovaConta();
    ui.renderizarSeletorDeClientes();
    sel.seletorCliente.value = novaContaObj.id;
    ui.renderizarVistaClienteAtivo();
    ui.mostrarNotificacao(`Conta "${nomeConta}" criada com sucesso!`);
}

export async function handleAddPedido(event) {
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
    if (pedidoExistente) {
        pedidoExistente.qtd += quantidade;
    } else {
        conta.pedidos.push({ produtoId: produto.id, nome: produto.nome, preco: produto.preco, qtd: quantidade });
    }
    await db.salvarItem('contas', conta);
    await db.salvarItem('inventario', produto);
    modals.fecharModalAddPedido();
    ui.atualizarTodaUI();
    ui.mostrarNotificacao(`${quantidade}x ${produto.nome} adicionado(s)!`);
}

export async function handleSalvarNovoNome(event) {
    event.preventDefault();
    const idConta = parseInt(sel.hiddenEditNomeId.value);
    const novoNome = sel.inputEditNome.value.trim();
    const conta = estado.contasAtivas.find(c => c.id === idConta);
    if (!conta || !novoNome) { ui.mostrarNotificacao("O nome não pode estar vazio.", "erro"); return; }
    conta.nome = novoNome;
    await db.salvarItem('contas', conta);
    modals.fecharModalEditNome();
    ui.atualizarTodaUI();
    ui.mostrarNotificacao(`Conta renomeada para "${novoNome}"!`);
}

export async function handleFinalizarPagamento() {
    const idConta = parseInt(sel.pagamentoContaIdInput.value);
    const metodoBtn = sel.pagamentoMetodosContainer.querySelector('.border-blue-500');
    if (!metodoBtn) { ui.mostrarNotificacao("Selecione um método de pagamento.", "erro"); return; }
    const conta = estado.contasAtivas.find(c => c.id === idConta);
    if (!conta) return;
    conta.status = 'fechada';
    conta.dataFecho = new Date().toISOString();
    conta.metodoPagamento = metodoBtn.dataset.metodo;
    conta.valorFinal = conta.pedidos.reduce((total, p) => total + (p.preco * p.qtd), 0);
    await db.salvarItem('contas', conta);
    modals.fecharModalPagamento();
    ui.atualizarTodaUI();
    ui.mostrarNotificacao(`Conta "${conta.nome}" finalizada com sucesso!`);
}

export async function handleAddProduto(event) {
    event.preventDefault();
    const nome = sel.inputProdutoNome.value.trim();
    const preco = parseFloat(sel.inputProdutoPreco.value);
    const stock = parseInt(sel.inputProdutoStock.value);
    const stockMinimo = parseInt(sel.inputProdutoStockMinimo.value);
    if (!nome || isNaN(preco) || preco <= 0 || isNaN(stock) || stock < 0 || isNaN(stockMinimo) || stockMinimo < 0) {
        ui.mostrarNotificacao("Dados inválidos. Verifique os valores.", "erro"); return;
    }
    const novoProduto = { id: crypto.randomUUID(), nome, preco, stockArmazem: stock, stockGeleira: 0, stockMinimo };
    estado.inventario.push(novoProduto);
    await db.salvarItem('inventario', novoProduto);
    modals.fecharModalAddProduto();
    ui.atualizarTodaUI();
    ui.mostrarNotificacao(`Produto "${nome}" adicionado!`);
}

export async function handleEditProduto(event) {
    event.preventDefault();
    const id = sel.hiddenEditProdutoId.value;
    const produto = estado.inventario.find(p => p.id === id);
    if (!produto) { ui.mostrarNotificacao("Produto não encontrado.", "erro"); return; }
    produto.nome = sel.inputEditProdutoNome.value.trim();
    produto.preco = parseFloat(sel.inputEditProdutoPreco.value);
    produto.stockMinimo = parseInt(sel.inputEditProdutoStockMinimo.value);
    await db.salvarItem('inventario', produto);
    modals.fecharModalEditProduto();
    ui.atualizarTodaUI();
    ui.mostrarNotificacao(`Produto "${produto.nome}" atualizado!`);
}

export async function handleAddStock(event) {
    event.preventDefault();
    const produtoId = sel.hiddenAddStockId.value;
    const produto = estado.inventario.find(p => p.id === produtoId);
    if (!produto) return;
    const quantidade = parseInt(sel.inputAddStockQuantidade.value);
    if (isNaN(quantidade) || quantidade === 0) { ui.mostrarNotificacao("Insira um número válido diferente de zero.", "erro"); return; }
    if ((produto.stockArmazem + quantidade) < 0) {
        ui.mostrarNotificacao(`Stock do armazém não pode ser negativo.`, "erro"); return;
    }
    produto.stockArmazem += quantidade;
    await db.salvarItem('inventario', produto);
    modals.fecharModalAddStock();
    ui.atualizarTodaUI();
    ui.mostrarNotificacao(quantidade > 0 ? `${quantidade} un. adicionadas.` : `${Math.abs(quantidade)} un. removidas.`);
}

export async function handleFormMoverStock(event) {
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
    await db.salvarItem('inventario', produto);
    modals.fecharModalMoverStock();
    ui.atualizarTodaUI();
    ui.mostrarNotificacao(`${quantidade} un. de ${produto.nome} movidas para a geleira.`);
}

export async function handleRemoverItem(idConta, itemIndex) {
    const conta = estado.contasAtivas.find(c => c.id === idConta);
    if (!conta) return;
    const pedidoRemovido = conta.pedidos.splice(itemIndex, 1)[0];
    if (!pedidoRemovido) return;
    await db.salvarItem('contas', conta);
    const produtoInventario = estado.inventario.find(p => p.id === pedidoRemovido.produtoId);
    if (produtoInventario) {
        produtoInventario.stockGeleira += pedidoRemovido.qtd;
        await db.salvarItem('inventario', produtoInventario);
    }
    ui.atualizarTodaUI();
    ui.mostrarNotificacao("Item removido.");
}

export function handleArquivarDia() {
    const hojeStr = new Date().toDateString();
    const fechoDeHojeExiste = estado.historicoFechos.some(rel => new Date(rel.data).toDateString() === hojeStr);
    if (fechoDeHojeExiste) {
        ui.mostrarNotificacao("O dia de hoje já foi fechado e arquivado.", "erro");
        return;
    }
    const contasFechadas = estado.contasAtivas.filter(c => c.status === 'fechada');
    if (contasFechadas.length === 0) {
        ui.mostrarNotificacao("Não existem vendas fechadas para arquivar. Não é possível fechar o dia.", "erro");
        return;
    }
    const contasAbertas = estado.contasAtivas.filter(c => c.status === 'ativa');
    if (contasAbertas.length > 0) {
        const nomesContas = contasAbertas.map(c => c.nome).join(', ');
        ui.mostrarNotificacao(`Feche as seguintes contas antes de arquivar: ${nomesContas}`, 'erro');
        return;
    }
    modals.abrirModalConfirmacao(
        'Arquivar o Dia?',
        'Todas as contas fechadas serão arquivadas e o dia será reiniciado. Esta ação não pode ser desfeita.',
        async () => {
            try {
                const relatorio = modals.calcularRelatorioDia();
                relatorio.data = new Date().toISOString();
                await db.salvarItem('historico', relatorio);
                const promessasApagar = estado.contasAtivas.map(c => db.apagarItem('contas', c.id));
                await Promise.all(promessasApagar);
                const promessasAtualizar = [];
                estado.inventario.forEach(item => {
                    if (item.stockGeleira > 0) {
                        item.stockArmazem += item.stockGeleira;
                        item.stockGeleira = 0;
                        promessasAtualizar.push(db.salvarItem('inventario', item));
                    }
                });
                await Promise.all(promessasAtualizar);
                estado.contasAtivas = [];
                estado.historicoFechos.push(relatorio);
                modals.fecharModalFechoGlobal();
                ui.atualizarTodaUI();
                ui.mostrarNotificacao("Dia arquivado com sucesso!");
            } catch (error) {
                console.error("Erro ao arquivar o dia:", error);
                ui.mostrarNotificacao("Ocorreu um erro ao arquivar o dia.", "erro");
            }
        }
    );
}

export function handleSelecaoAutocomplete(id, nome) {
    const produto = estado.inventario.find(p => p.id === id);
    if (produto) setProdutoSelecionado(produto);
}


// ===================================
// FUNÇÕES DE EXPORTAÇÃO REFATORADAS
// ===================================

export function handleExportarPdf() {
    if (!relatorioAtualParaExportar) return;
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const rel = relatorioAtualParaExportar;
    const dataStr = new Date(rel.data).toLocaleDateString('pt-PT', { dateStyle: 'full' });
    const MARGEM = 14;
    const LARGURA_PAGINA = doc.internal.pageSize.getWidth();
    let y = 20;

    // --- Cabeçalho ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('GestorBar Pro', LARGURA_PAGINA / 2, y, { align: 'center' });
    y += 8;
    doc.setFontSize(12);
    doc.text('Relatório de Fecho do Dia', LARGURA_PAGINA / 2, y, { align: 'center' });
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(dataStr, LARGURA_PAGINA / 2, y, { align: 'center' });
    y += 10;
    doc.line(MARGEM, y, LARGURA_PAGINA - MARGEM, y);
    y += 12;

    // --- Resumo Financeiro ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Resumo Financeiro', MARGEM, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const resumoX1 = MARGEM + 5;
    const resumoX2 = MARGEM + 60;
    doc.text('Total Vendido:', resumoX1, y);
    doc.text(rel.totalVendido.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' }), resumoX2, y);
    y += 7;
    doc.text('Total em Numerário:', resumoX1, y);
    doc.text(rel.totalNumerario.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' }), resumoX2, y);
    y += 7;
    doc.text('Total em TPA:', resumoX1, y);
    doc.text(rel.totalTpa.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' }), resumoX2, y);
    y += 9;
    doc.text('Nº de Contas:', resumoX1, y);
    doc.text(String(rel.numContasFechadas), resumoX2, y);
    y += 7;
    doc.text('Média por Conta:', resumoX1, y);
    doc.text(rel.mediaPorConta.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' }), resumoX2, y);
    y += 15;
    
    // --- Tabela de Produtos Vendidos ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Produtos Vendidos', MARGEM, y);
    y += 8;

    if (Object.keys(rel.produtosVendidos).length > 0) {
        const tableHead = [['Qtd', 'Produto']];
        const tableBody = Object.entries(rel.produtosVendidos).map(([nome, qtd]) => [`${qtd}x`, nome]);
        
        doc.autoTable({
            startY: y,
            head: tableHead,
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [22, 160, 133] },
            margin: { left: MARGEM, right: MARGEM }
        });
        y = doc.lastAutoTable.finalY + 10;
    } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text('Nenhum produto vendido.', MARGEM, y);
        y += 7;
    }
    
    // --- Rodapé ---
    const pageCount = doc.internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Gerado pelo GestorBar Pro em ${new Date().toLocaleDateString('pt-PT')}`, MARGEM, doc.internal.pageSize.getHeight() - 10);
        doc.text(`Pág ${i}/${pageCount}`, LARGURA_PAGINA - MARGEM, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
    }
    
    doc.save(`Relatorio_${new Date(rel.data).toISOString().split('T')[0]}.pdf`);
}

export function handleExportarXls() {
    if (!relatorioAtualParaExportar) return;
    
    const rel = relatorioAtualParaExportar;
    const dataStr = new Date(rel.data).toLocaleDateString('pt-PT');
    
    // --- Aba de Resumo ---
    const resumo_data = [
        ["Relatório de Fecho do Dia", dataStr], [],
        ["Métrica", "Valor"],
        ["Total Vendido (AOA)", rel.totalVendido],
        ["Total em Numerário (AOA)", rel.totalNumerario],
        ["Total em TPA (AOA)", rel.totalTpa],
        ["Número de Contas Fechadas", rel.numContasFechadas],
        ["Média por Conta (AOA)", Number(rel.mediaPorConta.toFixed(2))]
    ];
    const ws_resumo = XLSX.utils.aoa_to_sheet(resumo_data);
    ws_resumo['!cols'] = [{ wch: 25 }, { wch: 20 }];
    // Formatar células de moeda
    ws_resumo['B4'].z = '#,##0.00 "AOA"';
    ws_resumo['B5'].z = '#,##0.00 "AOA"';
    ws_resumo['B6'].z = '#,##0.00 "AOA"';
    ws_resumo['B8'].z = '#,##0.00 "AOA"';


    // --- Aba de Produtos ---
    const produtos_data = [["Quantidade", "Produto"]];
    if (Object.keys(rel.produtosVendidos).length > 0) {
        Object.entries(rel.produtosVendidos).forEach(([nome, qtd]) => {
            produtos_data.push([qtd, nome]);
        });
    } else {
        produtos_data.push(["-", "Nenhum produto vendido"]);
    }
    const ws_produtos = XLSX.utils.aoa_to_sheet(produtos_data);
    ws_produtos['!cols'] = [{ wch: 15 }, { wch: 40 }];
    
    // --- Criar o Workbook ---
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws_resumo, "Resumo");
    XLSX.utils.book_append_sheet(wb, ws_produtos, "Produtos Vendidos");
    
    XLSX.writeFile(wb, `Relatorio_${new Date(rel.data).toISOString().split('T')[0]}.xlsx`);
}