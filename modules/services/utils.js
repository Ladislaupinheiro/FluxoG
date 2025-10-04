// /modules/services/utils.js - Funções de utilidade e de negócio
'use strict';

/**
 * Calcula as métricas do relatório de fecho de dia com base no estado atual.
 * @param {object} state - O objeto de estado completo do store.
 * @returns {object} O objeto do relatório calculado.
 */
export function calcularRelatorioDia(state) {
    const hojeString = new Date().toDateString();
    const contasFechadasHoje = state.contasAtivas.filter(c => c.status === 'fechada' && new Date(c.dataFecho).toDateString() === hojeString);
    
    const totalVendido = contasFechadasHoje.reduce((sum, conta) => sum + conta.valorFinal, 0);
    const totalNumerario = contasFechadasHoje.filter(c => c.metodoPagamento === 'Numerário').reduce((sum, c) => sum + c.valorFinal, 0);
    const totalTpa = contasFechadasHoje.filter(c => c.metodoPagamento === 'TPA').reduce((sum, c) => sum + c.valorFinal, 0);
    const numContasFechadas = contasFechadasHoje.length;
    const mediaPorConta = numContasFechadas > 0 ? totalVendido / numContasFechadas : 0;
    
    const produtosVendidos = {};
    contasFechadasHoje.forEach(conta => {
        conta.pedidos.forEach(pedido => {
            produtosVendidos[pedido.nome] = (produtosVendidos[pedido.nome] || 0) + pedido.qtd;
        });
    });

    return { 
        id: `fecho-${new Date().toISOString().split('T')[0]}`,
        data: new Date().toISOString(), 
        totalVendido, 
        totalNumerario, 
        totalTpa, 
        numContasFechadas, 
        mediaPorConta, 
        produtosVendidos 
    };
}

/**
 * Gera e descarrega um relatório de fecho de dia em formato PDF (v2.0 - Design Profissional).
 * @param {object} relatorio - O objeto de relatório gerado por calcularRelatorioDia.
 * @param {object} config - O objeto de configuração da aplicação.
 */
export function exportarRelatorioPDF(relatorio, config) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const nomeEmpresa = config.businessName || 'Gestor de Bar Pro';
    const dataFormatada = new Date(relatorio.data).toLocaleDateString('pt-PT');
    const horaFormatada = new Date(relatorio.data).toLocaleTimeString('pt-PT');

    // Cabeçalho
    doc.setFontSize(16);
    doc.text(nomeEmpresa, 14, 22);
    doc.setFontSize(10);
    doc.text(`Data: ${dataFormatada}`, 206, 22, { align: 'right' });
    doc.text(`Hora: ${horaFormatada}`, 206, 28, { align: 'right' });

    // Título Principal
    doc.setFontSize(20);
    doc.text("Relatório de Fecho do Dia", 105, 40, { align: 'center' });

    // Tabela 1: Estatísticas Gerais
    const estatisticasBody = [
        ['Total Vendido', relatorio.totalVendido.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })],
        ['Total em Numerário', relatorio.totalNumerario.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })],
        ['Total em TPA', relatorio.totalTpa.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })],
        ['Contas Fechadas', relatorio.numContasFechadas],
        ['Média por Conta', relatorio.mediaPorConta.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })],
    ];

    doc.autoTable({
        startY: 50,
        head: [['Estatísticas Gerais', 'Valor']],
        body: estatisticasBody,
        headStyles: { fillColor: [41, 128, 185] }, // Azul mais sóbrio
        theme: 'striped'
    });

    // Tabela 2: Produtos Vendidos
    const produtosHead = [['Quantidade', 'Produto']];
    const produtosBody = Object.entries(relatorio.produtosVendidos).map(([nome, qtd]) => [qtd, nome]);
    
    doc.autoTable({
        head: produtosHead,
        body: produtosBody,
        headStyles: { fillColor: [41, 128, 185] },
        theme: 'striped'
    });

    doc.save(`Fecho-Dia-${new Date(relatorio.data).toISOString().split('T')[0]}.pdf`);
}

/**
 * Gera e descarrega um relatório de fecho de dia em formato Excel (v2.0 - Design Profissional).
 * @param {object} relatorio - O objeto de relatório gerado por calcularRelatorioDia.
 * @param {object} config - O objeto de configuração da aplicação.
 */
export function exportarRelatorioXLS(relatorio, config) {
    const nomeEmpresa = config.businessName || 'Gestor de Bar Pro';
    const dataFormatada = new Date(relatorio.data).toLocaleDateString('pt-PT');
    const horaFormatada = new Date(relatorio.data).toLocaleTimeString('pt-PT');

    // Preparar dados com formatação
    const dados = [
        [nomeEmpresa],
        ["Relatório de Fecho do Dia"],
        [`Data: ${dataFormatada} | Hora: ${horaFormatada}`],
        [],
        ["Estatísticas Gerais"],
        ["Descrição", "Valor"],
        ["Total Vendido", relatorio.totalVendido.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })],
        ["Total em Numerário", relatorio.totalNumerario.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })],
        ["Total em TPA", relatorio.totalTpa.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })],
        ["Contas Fechadas", relatorio.numContasFechadas],
        ["Média por Conta", relatorio.mediaPorConta.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })],
        [],
        ["Produtos Vendidos"],
        ["Quantidade", "Produto"],
        ...Object.entries(relatorio.produtosVendidos).map(([nome, qtd]) => [qtd, nome])
    ];

    const ws = XLSX.utils.aoa_to_sheet(dados);
    
    // Definir largura das colunas para melhor legibilidade
    ws['!cols'] = [{ wch: 25 }, { wch: 25 }]; 

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fecho do Dia");
    XLSX.writeFile(wb, `Fecho-Dia-${new Date(relatorio.data).toISOString().split('T')[0]}.xlsx`);
}