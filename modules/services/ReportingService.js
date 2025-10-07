// /modules/services/ReportingService.js - v14.1 (CORRIGIDO E COMPLETO)
'use strict';

// ... (calcularRelatorioDia e gerarRelatorioPorPeriodo permanecem os mesmos da versão anterior)
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
    const contasFechadasComCliente = contasFechadasHoje.map(conta => {
        const cliente = state.clientes.find(c => c.nome.toLowerCase() === conta.nome.toLowerCase());
        return cliente ? { ...conta, clienteId: cliente.id } : conta;
    });
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
        contasFechadas: contasFechadasComCliente
    };
}
export function gerarRelatorioPorPeriodo(state, dataInicio, dataFim) {
    dataInicio.setHours(0, 0, 0, 0);
    dataFim.setHours(23, 59, 59, 999);
    const relatorio = { dataInicio, dataFim, totalEntradas: 0, totalEntradasNumerario: 0, totalEntradasTpa: 0, totalSaidas: 0, saldoFinal: 0, detalhesPorDia: {} };
    state.historicoFechos.forEach(fecho => {
        const dataFecho = new Date(fecho.data);
        if (dataFecho >= dataInicio && dataFecho <= dataFim) {
            const diaString = dataFecho.toISOString().split('T')[0];
            if (!relatorio.detalhesPorDia[diaString]) {
                relatorio.detalhesPorDia[diaString] = { data: dataFecho, entradasNum: 0, entradasTpa: 0, saidas: 0 };
            }
            relatorio.detalhesPorDia[diaString].entradasNum += fecho.totalNumerario;
            relatorio.detalhesPorDia[diaString].entradasTpa += fecho.totalTpa;
            relatorio.totalEntradas += fecho.totalVendido;
            relatorio.totalEntradasNumerario += fecho.totalNumerario;
            relatorio.totalEntradasTpa += fecho.totalTpa;
        }
    });
    relatorio.saldoFinal = relatorio.totalEntradas - relatorio.totalSaidas;
    relatorio.detalhesPorDia = Object.values(relatorio.detalhesPorDia).sort((a, b) => a.data - b.data);
    return relatorio;
}


/**
 * Gera e descarrega um relatório de fecho de dia em formato PDF.
 * @param {object} relatorio - O objeto de relatório.
 * @param {object} config - O objeto de configuração da aplicação.
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

    // ALTERAÇÃO: Adicionadas as novas métricas ao corpo da tabela
    const estatisticasBody = [
        ['Total Vendido', relatorio.totalVendido.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })],
        ['Custo das Vendas', relatorio.totalCustoVendido.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })],
        ['Lucro Bruto', relatorio.lucroBruto.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })],
        [''], // Linha em branco para separação visual
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
            // Deixa a linha de Lucro Bruto a negrito
            if (data.row.raw[0] === 'Lucro Bruto') {
                data.cell.styles.fontStyle = 'bold';
            }
        }
    });

    const produtosHead = [['Quantidade', 'Produto']];
    const produtosBody = Object.entries(relatorio.produtosVendidos).map(([nome, qtd]) => [qtd, nome]);
    
    doc.autoTable({
        head: produtosHead,
        body: produtosBody,
    });

    doc.save(`Fecho-Dia-${new Date(relatorio.data).toISOString().split('T')[0]}.pdf`);
}

/**
 * Gera e descarrega um relatório de fecho de dia em formato Excel.
 * @param {object} relatorio - O objeto de relatório.
 * @param {object} config - O objeto de configuração da aplicação.
 */
export function exportarRelatorioXLS(relatorio, config) {
    const nomeEmpresa = config.businessName || 'Gestor de Bar Pro';
    const dataFormatada = new Date(relatorio.data).toLocaleDateString('pt-PT');

    // ALTERAÇÃO: Adicionadas as novas métricas aos dados do Excel
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