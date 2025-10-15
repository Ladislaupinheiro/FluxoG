// /modules/features/inventario/services/ProductAnalyticsService.js
'use strict';

/**
 * Agrega a performance de produtos para um determinado período.
 * Usado na AnálisesView.
 * @param {object} state 
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @param {string} categoria 
 * @returns {object} com as chaves: topSellers, topProfit, zombieProducts
 */
export function getProductPerformanceForPeriod(state, startDate, endDate, categoria = 'all') {
    const { historicoFechos, inventario } = state;
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    
    let productIdsInCategory = null;
    if (categoria !== 'all') {
        productIdsInCategory = new Set(inventario.filter(p => p.categoria === categoria).map(p => p.id));
    }

    const fechosNoPeriodo = historicoFechos.filter(fecho => new Date(fecho.data) >= startDate && new Date(fecho.data) <= endDate);

    const vendasAgregadas = {};

    fechosNoPeriodo.forEach(fecho => {
        (fecho.contasFechadas || []).forEach(conta => {
            conta.pedidos.forEach(pedido => {
                if (!productIdsInCategory || productIdsInCategory.has(pedido.produtoId)) {
                    if (!vendasAgregadas[pedido.produtoId]) {
                        const produtoInfo = inventario.find(p => p.id === pedido.produtoId) || {};
                        vendasAgregadas[pedido.produtoId] = { 
                            id: pedido.produtoId, 
                            nome: pedido.nome, 
                            qtd: 0, 
                            receita: 0, 
                            lucro: 0, 
                            custoUnitario: produtoInfo.custoUnitario || 0 
                        };
                    }
                    const custoPedido = (vendasAgregadas[pedido.produtoId].custoUnitario || 0);
                    vendasAgregadas[pedido.produtoId].qtd += pedido.qtd;
                    vendasAgregadas[pedido.produtoId].receita += pedido.preco * pedido.qtd;
                    vendasAgregadas[pedido.produtoId].lucro += (pedido.preco - custoPedido) * pedido.qtd;
                }
            });
        });
    });

    const produtosVendidosArr = Object.values(vendasAgregadas);
    const idsProdutosVendidos = new Set(produtosVendidosArr.map(p => p.id));
    
    const topSellers = [...produtosVendidosArr].sort((a, b) => b.qtd - a.qtd);
    const topProfit = [...produtosVendidosArr].sort((a, b) => b.lucro - a.lucro);
    
    const inventarioDaCategoria = categoria !== 'all' 
        ? inventario.filter(p => p.categoria === categoria) 
        : inventario;

    const zombieProducts = inventarioDaCategoria
        .filter(produto => !idsProdutosVendidos.has(produto.id))
        .sort((a, b) => (new Date(a.ultimaVenda) || 0) - (new Date(b.ultimaVenda) || 0));

    return { topSellers, topProfit, zombieProducts };
}

/**
 * Retorna os produtos mais vendidos no dia de hoje em quantidade.
 * Usado na DashboardView.
 * @param {object} state O estado completo da aplicação.
 * @returns {Array} Array de [nome, quantidade] ordenado.
 */
export function getTopSellingProductsToday(state) {
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