// /modules/features/clientes/services/ClientAnalyticsService.js
'use strict';

/**
 * Calcula o gasto total de cada cliente em tempo real, lendo do histórico e das contas do dia.
 * Usado na ClientesView.
 * @param {object} state - O estado completo da aplicação.
 * @returns {Array<object>} Uma lista de objetos de cliente com a propriedade `gastoTotal`.
 */
export function getRankedClients(state) {
    const { clientes, historicoFechos, contasAtivas } = state;
    const gastosPorCliente = {};

    const processarContas = (contas) => {
        contas.forEach(conta => {
            if (conta.clienteId) {
                gastosPorCliente[conta.clienteId] = (gastosPorCliente[conta.clienteId] || 0) + (conta.valorFinal || 0);
            }
        });
    };

    const contasHistoricas = historicoFechos.flatMap(fecho => fecho.contasFechadas || []);
    processarContas(contasHistoricas);

    const contasDeHoje = contasAtivas.filter(conta => conta.status === 'fechada');
    processarContas(contasDeHoje);

    return clientes
        .map(cliente => ({
            ...cliente,
            gastoTotal: gastosPorCliente[cliente.id] || 0
        }))
        .sort((a, b) => b.gastoTotal - a.gastoTotal);
}

/**
 * Calcula estatísticas detalhadas para um único cliente.
 * Usado na ClienteDetalhesView.
 * @param {string} clienteId 
 * @param {object} state 
 * @returns {object}
 */
export function calculateClientProfile(clienteId, state) {
    const { historicoFechos, contasAtivas } = state;
    const profile = { gastoTotal: 0, visitas: 0, ticketMedio: 0, produtosPreferidos: {} };
    
    const todasAsContasDoCliente = [
        ...historicoFechos.flatMap(fecho => fecho.contasFechadas || []),
        ...contasAtivas.filter(conta => conta.status === 'fechada')
    ].filter(conta => conta.clienteId === clienteId);

    if (todasAsContasDoCliente.length === 0) {
        // Retorna um perfil zerado, mas com a estrutura correta
        profile.produtosPreferidos = [];
        return profile;
    }

    const diasDeVisita = new Set();
    todasAsContasDoCliente.forEach(conta => {
        profile.gastoTotal += conta.valorFinal || 0;
        if (conta.dataFecho) diasDeVisita.add(new Date(conta.dataFecho).toDateString());
        (conta.pedidos || []).forEach(pedido => {
            profile.produtosPreferidos[pedido.nome] = (profile.produtosPreferidos[pedido.nome] || 0) + pedido.qtd;
        });
    });

    profile.visitas = diasDeVisita.size;
    if (profile.visitas > 0) profile.ticketMedio = profile.gastoTotal / profile.visitas;
    profile.produtosPreferidos = Object.entries(profile.produtosPreferidos)
        .sort(([, a], [, b]) => b - a).slice(0, 3).map(([nome, qtd]) => ({ nome, qtd }));

    return profile;
}

/**
 * Agrega insights de clientes para um determinado período.
 * Usado na AnálisesView.
 * @param {object} state 
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @param {string} categoria 
 * @returns {object}
 */
export function getCustomerInsightsForPeriod(state, startDate, endDate, categoria = 'all') {
    const { historicoFechos, clientes, contasAtivas } = state;
    
    let productIdsInCategory = null;
    if (categoria !== 'all') {
        productIdsInCategory = new Set(state.inventario.filter(p => p.categoria === categoria).map(p => p.id));
    }
    
    const insightsPorCliente = {};

    const processarContas = (contas) => {
        contas.forEach(conta => {
            if (conta.clienteId) {
                if (!insightsPorCliente[conta.clienteId]) {
                    insightsPorCliente[conta.clienteId] = { 
                        id: conta.clienteId, 
                        gastoTotal: 0,
                        visitasSet: new Set()
                    };
                }

                let gastoNaCategoria = 0;
                conta.pedidos.forEach(pedido => {
                    if (!productIdsInCategory || productIdsInCategory.has(pedido.produtoId)) {
                        gastoNaCategoria += pedido.preco * pedido.qtd;
                    }
                });

                if (gastoNaCategoria > 0) {
                    insightsPorCliente[conta.clienteId].gastoTotal += gastoNaCategoria;
                    if (conta.dataFecho) {
                        insightsPorCliente[conta.clienteId].visitasSet.add(new Date(conta.dataFecho).toDateString());
                    }
                }
            }
        });
    };
    
    const fechosNoPeriodo = historicoFechos.flatMap(f => f.contasFechadas || []).filter(c => new Date(c.dataFecho) >= startDate && new Date(c.dataFecho) <= endDate);
    processarContas(fechosNoPeriodo);

    const contasDeHojeNoPeriodo = contasAtivas.filter(c => c.status === 'fechada' && new Date(c.dataFecho) >= startDate && new Date(c.dataFecho) <= endDate);
    processarContas(contasDeHojeNoPeriodo);

    const topSpenders = Object.values(insightsPorCliente)
        .map(insight => ({
            ...insight,
            nome: (clientes.find(c => c.id === insight.id) || {}).nome || 'Cliente Removido',
            visitas: insight.visitasSet.size
        }))
        .sort((a, b) => b.gastoTotal - a.gastoTotal);
        
    const newCustomersCount = clientes.filter(c => new Date(c.dataRegisto) >= startDate && new Date(c.dataRegisto) <= endDate).length;

    return { topSpenders, newCustomersCount };
}