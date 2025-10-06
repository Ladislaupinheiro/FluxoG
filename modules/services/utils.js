// /modules/services/utils.js - (v11.1 - Adicionada lógica de ranking de produtos)
'use strict';

/**
 * Agrupa uma sequência de chamadas de função numa única chamada após um atraso.
 * @param {Function} func A função a ser executada após o atraso.
 * @param {number} delay O tempo de espera em milissegundos.
 * @returns {Function} A nova função "debounced".
 */
export function debounce(func, delay = 300) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

// ADICIONADO: Lógica para calcular o ranking de produtos vendidos no dia
/**
 * Analisa as contas fechadas no dia corrente e retorna uma lista de produtos ordenados por quantidade vendida.
 * @param {object} state - O estado completo da aplicação.
 * @returns {Array<[string, number]>} Um array de arrays, onde cada subarray é [nomeDoProduto, quantidadeVendida], ordenado pela quantidade.
 */
export function getRankedProductsBySales(state) {
    const hojeString = new Date().toDateString();
    const contasFechadasHoje = state.contasAtivas.filter(c => 
        c.status === 'fechada' && new Date(c.dataFecho).toDateString() === hojeString
    );

    const produtosVendidos = contasFechadasHoje.flatMap(c => c.pedidos).reduce((acc, pedido) => {
        acc[pedido.nome] = (acc[pedido.nome] || 0) + pedido.qtd;
        return acc;
    }, {});

    return Object.entries(produtosVendidos).sort(([, a], [, b]) => b - a);
}


/**
 * Calcula o gasto total de cada cliente e retorna uma lista ordenada.
 * @param {object} state - O estado completo da aplicação.
 * @returns {Array<object>} Uma lista de objetos de cliente, cada um com uma nova propriedade `gastoTotal`, ordenada por esse valor.
 */
export function getRankedClients(state) {
    const { clientes, historicoFechos } = state;
    const gastosPorCliente = {};

    clientes.forEach(cliente => {
        gastosPorCliente[cliente.id] = 0;
    });

    historicoFechos.forEach(fecho => {
        if (fecho.contasFechadas) {
            fecho.contasFechadas.forEach(conta => {
                if (conta.clienteId && gastosPorCliente.hasOwnProperty(conta.clienteId)) {
                    gastosPorCliente[conta.clienteId] += conta.valorFinal;
                }
            });
        }
    });

    const clientesComGastos = clientes.map(cliente => ({
        ...cliente,
        gastoTotal: gastosPorCliente[cliente.id] || 0
    }));

    return clientesComGastos.sort((a, b) => b.gastoTotal - a.gastoTotal);
}


/**
 * Calcula o estado da aplicação após a ação de arquivar o dia.
 * @param {object} state O estado atual completo da aplicação.
 * @returns {object} Um objeto contendo os novos arrays de estado.
 */
export function gerarEstadoAposArquivo(state) {
    const contasAtivasAposArquivo = state.contasAtivas.filter(c => c.status === 'ativa');
    const contasFechadasParaApagar = state.contasAtivas.filter(c => c.status === 'fechada');

    const inventarioAtualizado = state.inventario.map(item => {
        if (item.stockLoja > 0) {
            return { ...item, stockArmazem: item.stockArmazem + item.stockLoja, stockLoja: 0 };
        }
        return item;
    });

    const contasFechadasComCliente = contasFechadasParaApagar.map(conta => {
        const cliente = state.clientes.find(c => c.nome.toLowerCase() === conta.nome.toLowerCase());
        if (cliente) {
            return { ...conta, clienteId: cliente.id };
        }
        return conta;
    });

    return { contasAtivasAposArquivo, inventarioAtualizado, contasFechadasParaApagar, contasFechadasComCliente };
}


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

    const { contasFechadasComCliente } = gerarEstadoAposArquivo(state);

    return { 
        id: `fecho-${new Date().toISOString().split('T')[0]}`,
        data: new Date().toISOString(), 
        totalVendido, 
        totalNumerario, 
        totalTpa, 
        numContasFechadas, 
        mediaPorConta, 
        produtosVendidos,
        contasFechadas: contasFechadasComCliente
    };
}

/**
 * Gera um relatório financeiro consolidado para um determinado período.
 * @param {object} state - O estado completo da aplicação.
 * @param {Date} dataInicio - A data de início do período (inclusiva).
 * @param {Date} dataFim - A data de fim do período (inclusiva).
 * @returns {object} Um objeto estruturado com os dados do relatório.
 */
export function gerarRelatorioPorPeriodo(state, dataInicio, dataFim) {
    dataInicio.setHours(0, 0, 0, 0);
    dataFim.setHours(23, 59, 59, 999);

    const relatorio = {
        dataInicio,
        dataFim,
        totalEntradas: 0,
        totalEntradasNumerario: 0,
        totalEntradasTpa: 0,
        totalSaidas: 0,
        totalSaidasNumerario: 0,
        totalSaidasTpa: 0,
        saldoFinal: 0,
        detalhesPorDia: {}
    };

    state.historicoFechos.forEach(fecho => {
        const dataFecho = new Date(fecho.data);
        if (dataFecho >= dataInicio && dataFecho <= dataFim) {
            const diaString = dataFecho.toISOString().split('T')[0];
            if (!relatorio.detalhesPorDia[diaString]) {
                relatorio.detalhesPorDia[diaString] = { data: dataFecho, entradasNum: 0, entradasTpa: 0, saidasNum: 0, saidasTpa: 0 };
            }
            relatorio.detalhesPorDia[diaString].entradasNum += fecho.totalNumerario;
            relatorio.detalhesPorDia[diaString].entradasTpa += fecho.totalTpa;

            relatorio.totalEntradas += fecho.totalVendido;
            relatorio.totalEntradasNumerario += fecho.totalNumerario;
            relatorio.totalEntradasTpa += fecho.totalTpa;
        }
    });

    state.despesas.forEach(despesa => {
        const dataDespesa = new Date(despesa.data);
        if (dataDespesa >= dataInicio && dataDespesa <= dataFim) {
            const diaString = dataDespesa.toISOString().split('T')[0];
             if (!relatorio.detalhesPorDia[diaString]) {
                relatorio.detalhesPorDia[diaString] = { data: dataDespesa, entradasNum: 0, entradasTpa: 0, saidasNum: 0, saidasTpa: 0 };
            }
            if (despesa.metodoPagamento === 'Numerário') {
                relatorio.detalhesPorDia[diaString].saidasNum += despesa.valor;
                relatorio.totalSaidasNumerario += despesa.valor;
            } else if (despesa.metodoPagamento === 'TPA') {
                relatorio.detalhesPorDia[diaString].saidasTpa += despesa.valor;
                relatorio.totalSaidasTpa += despesa.valor;
            }
            relatorio.totalSaidas += despesa.valor;
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
    const horaFormatada = new Date(relatorio.data).toLocaleTimeString('pt-PT');

    doc.setFontSize(16);
    doc.text(nomeEmpresa, 14, 22);
    doc.setFontSize(10);
    doc.text(`Data: ${dataFormatada}`, 206, 22, { align: 'right' });
    doc.text(`Hora: ${horaFormatada}`, 206, 28, { align: 'right' });

    doc.setFontSize(20);
    doc.text("Relatório de Fecho do Dia", 105, 40, { align: 'center' });

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
        headStyles: { fillColor: [41, 128, 185] },
        theme: 'striped'
    });

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
 * Gera e descarrega um relatório de fecho de dia em formato Excel.
 * @param {object} relatorio - O objeto de relatório.
 * @param {object} config - O objeto de configuração da aplicação.
 */
export function exportarRelatorioXLS(relatorio, config) {
    const nomeEmpresa = config.businessName || 'Gestor de Bar Pro';
    const dataFormatada = new Date(relatorio.data).toLocaleDateString('pt-PT');
    const horaFormatada = new Date(relatorio.data).toLocaleTimeString('pt-PT');

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
    
    ws['!cols'] = [{ wch: 25 }, { wch: 25 }]; 

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fecho do Dia");
    XLSX.writeFile(wb, `Fecho-Dia-${new Date(relatorio.data).toISOString().split('T')[0]}.xlsx`);
}