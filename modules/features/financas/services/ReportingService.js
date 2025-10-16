// /modules/features/financas/services/ReportingService.js (VERSÃO COMPLETA E CORRIGIDA)
'use strict';

/**
 * Calcula o relatório de vendas para o dia atual.
 */
export function calcularRelatorioDia(state) {
    const hojeString = new Date().toDateString();
    const contasFechadasHoje = state.contasAtivas.filter(c => c.status === 'fechada' && new Date(c.dataFecho).toDateString() === hojeString);
    
    let totalVendido = 0;
    let totalCustoVendido = 0;
    const produtosVendidos = {};

    contasFechadasHoje.forEach(conta => {
        totalVendido += conta.valorFinal;
        conta.pedidos.forEach(pedido => {
            totalCustoVendido += (pedido.custo || 0) * pedido.qtd;
            produtosVendidos[pedido.nome] = (produtosVendidos[pedido.nome] || 0) + pedido.qtd;
        });
    });

    const lucroBruto = totalVendido - totalCustoVendido;
    const totalNumerario = contasFechadasHoje.filter(c => c.metodoPagamento === 'Numerário').reduce((sum, c) => sum + c.valorFinal, 0);
    const totalTpa = contasFechadasHoje.filter(c => c.metodoPagamento === 'TPA').reduce((sum, c) => sum + c.valorFinal, 0);
    const numContasFechadas = contasFechadasHoje.length;
    const mediaPorConta = numContasFechadas > 0 ? totalVendido / numContasFechadas : 0;

    return { 
        id: `fecho-${new Date().toISOString().split('T')[0]}`,
        data: new Date().toISOString(), 
        totalVendido, 
        totalCustoVendido,
        lucroBruto,
        totalNumerario, 
        totalTpa, 
        numContasFechadas, 
        mediaPorConta, 
        produtosVendidos,
        contasFechadas: contasFechadasHoje
    };
}

/**
 * RESTAURADO: Exporta o relatório de vendas do dia para PDF.
 */
export function exportarRelatorioPDF(relatorio, config) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const nomeEmpresa = config.businessName || 'Gestor de Bar Pro';
    const dataFormatada = new Date(relatorio.data).toLocaleDateString('pt-PT');
    
    doc.setFontSize(18);
    doc.text(nomeEmpresa, 14, 22);
    doc.setFontSize(12);
    doc.text(`Relatório de Fecho do Dia: ${dataFormatada}`, 14, 30);

    const estatisticasBody = [
        ['Total Vendido', relatorio.totalVendido.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })],
        ['Custo das Vendas', relatorio.totalCustoVendido.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })],
        ['Lucro Bruto', relatorio.lucroBruto.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })],
        [''],
        ['Total em Numerário', relatorio.totalNumerario.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })],
        ['Total em TPA', relatorio.totalTpa.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })],
        ['Contas Fechadas', relatorio.numContasFechadas],
        ['Média por Conta', relatorio.mediaPorConta.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })],
    ];

    doc.autoTable({
        startY: 40,
        head: [['Estatísticas Gerais', 'Valor']],
        body: estatisticasBody,
        didParseCell: function (data) {
            if (data.row.raw[0] === 'Lucro Bruto') data.cell.styles.fontStyle = 'bold';
        }
    });

    const produtosHead = [['Quantidade', 'Produto']];
    const produtosBody = Object.entries(relatorio.produtosVendidos).map(([nome, qtd]) => [qtd, nome]);
    
    doc.autoTable({ head: produtosHead, body: produtosBody });

    doc.save(`Fecho-Dia-${new Date(relatorio.data).toISOString().split('T')[0]}.pdf`);
}

/**
 * RESTAURADO: Exporta o relatório de vendas do dia para XLS (Excel).
 */
export function exportarRelatorioXLS(relatorio, config) {
    const nomeEmpresa = config.businessName || 'Gestor de Bar Pro';
    const dataFormatada = new Date(relatorio.data).toLocaleDateString('pt-PT');
    const dados = [
        [nomeEmpresa],
        [`Relatório de Fecho do Dia - ${dataFormatada}`],
        [],
        ["Estatísticas Gerais", "Valor"],
        ["Total Vendido", relatorio.totalVendido],
        ["Custo das Vendas", relatorio.totalCustoVendido],
        ["Lucro Bruto", relatorio.lucroBruto],
        [],
        ["Total em Numerário", relatorio.totalNumerario],
        ["Total em TPA", relatorio.totalTpa],
        ["Contas Fechadas", relatorio.numContasFechadas],
        ["Média por Conta", relatorio.mediaPorConta],
        [],
        ["Produtos Vendidos", "Quantidade"],
        ...Object.entries(relatorio.produtosVendidos).map(([nome, qtd]) => [nome, qtd])
    ];
    const ws = XLSX.utils.aoa_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fecho do Dia");
    XLSX.writeFile(wb, `Fecho-Dia-${new Date(relatorio.data).toISOString().split('T')[0]}.xlsx`);
}


// --- Funções para Histórico de Compras ---

function agruparComprasPorDia(compras) {
    const agrupado = new Map();
    compras.forEach(compra => {
        const dataStr = new Date(compra.data).toLocaleDateString('pt-PT');
        if (!agrupado.has(dataStr)) {
            agrupado.set(dataStr, { data: new Date(compra.data), compras: [], totalDia: 0 });
        }
        const dia = agrupado.get(dataStr);
        dia.compras.push(compra);
        dia.totalDia += compra.valorTotal;
    });
    return agrupado;
}

export function exportarRelatorioComprasPDF(compras, state, startDate, endDate) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const { config, fornecedores, inventario } = state;
    const nomeEmpresa = config.businessName || 'Gestor de Bar Pro';
    const periodoStr = `${startDate.toLocaleDateString('pt-PT')} a ${endDate.toLocaleDateString('pt-PT')}`;

    doc.setFontSize(18);
    doc.text(nomeEmpresa, 14, 22);
    doc.setFontSize(12);
    doc.text(`Relatório de Compras: ${periodoStr}`, 14, 30);

    const comprasAgrupadas = agruparComprasPorDia(compras);
    let yPos = 40;

    for (const [dataStr, dadosDia] of comprasAgrupadas) {
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(`Dia: ${dataStr}`, 14, yPos);
        yPos += 7;

        const body = dadosDia.compras.map(c => {
            const fornecedorNome = fornecedores.find(f => f.id === c.fornecedorId)?.nome || 'N/A';
            const produtoCatalogo = fornecedores.find(f => f.id === c.fornecedorId)?.catalogo.find(p => p.id === c.produtoCatalogoId);
            const produtoNome = inventario.find(p=>p.catalogoId === c.produtoCatalogoId)?.nome || produtoCatalogo?.nome || 'N/A';
            return [produtoNome, fornecedorNome, c.quantidade, c.valorTotal.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })];
        });

        doc.autoTable({
            startY: yPos,
            head: [['Produto', 'Fornecedor', 'Qtd.', 'Valor Total']],
            body: body,
            didDrawPage: (data) => { yPos = data.cursor.y; }
        });

        yPos = doc.lastAutoTable.finalY + 5;
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text(`Total do Dia: ${dadosDia.totalDia.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}`, 14, yPos);
        yPos += 10;
    }
    doc.save(`Relatorio-Compras-${new Date().toISOString().split('T')[0]}.pdf`);
}

export function exportarRelatorioComprasXLS(compras, state, startDate, endDate) {
    const { config, fornecedores, inventario } = state;
    const nomeEmpresa = config.businessName || 'Gestor de Bar Pro';
    const periodoStr = `${startDate.toLocaleDateString('pt-PT')} a ${endDate.toLocaleDateString('pt-PT')}`;
    const dados = [
        [nomeEmpresa],
        [`Relatório de Compras - ${periodoStr}`],
        [],
        ["Data", "Produto", "Fornecedor", "Quantidade", "Valor Total", "Método de Pagamento"]
    ];

    compras.forEach(c => {
        const fornecedorNome = fornecedores.find(f => f.id === c.fornecedorId)?.nome || 'N/A';
        const produtoCatalogo = fornecedores.find(f => f.id === c.fornecedorId)?.catalogo.find(p => p.id === c.produtoCatalogoId);
        const produtoNome = inventario.find(p=>p.catalogoId === c.produtoCatalogoId)?.nome || produtoCatalogo?.nome || 'N/A';
        dados.push([new Date(c.data).toLocaleDateString('pt-PT'), produtoNome, fornecedorNome, c.quantidade, c.valorTotal, c.metodoPagamento]);
    });
    const ws = XLSX.utils.aoa_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Histórico de Compras");
    XLSX.writeFile(wb, `Relatorio-Compras-${new Date().toISOString().split('T')[0]}.xlsx`);
}