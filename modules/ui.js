// /modules/ui.js - Responsável por todas as manipulações do DOM e renderizações da interface.

import { estado, dataAtualCalendario } from './state.js';
import { dbVendasTotal, dbVendasNumerario, dbVendasTpa, dbContasAtivas, dbAlertasStock, dbTopProdutoNome, dbTopProdutoQtd, tabContents, bottomNav, seletorCliente, vistaClienteAtivo, inputBuscaInventario, listaInventario, calendarioTitulo, calendarioGridDias, fgDataRelatorio, fgTotalVendido, fgTotalNumerario, fgTotalTpa, fgContasFechadas, fgMediaPorConta, fgListaProdutos, autocompleteResults, alertaStockContainer, toastNotificacao } from './selectors.js';

let filaDeNotificacoes = [];
let notificacaoAtiva = false;

function processarFilaDeNotificacoes() {
    if (notificacaoAtiva || filaDeNotificacoes.length === 0) {
        return;
    }
    notificacaoAtiva = true;
    const notificacao = filaDeNotificacoes.shift();

    toastNotificacao.textContent = notificacao.mensagem;
    toastNotificacao.classList.remove('bg-green-500', 'bg-red-500');
    if (notificacao.tipo === 'sucesso') {
        toastNotificacao.classList.add('bg-green-500');
    } else {
        toastNotificacao.classList.add('bg-red-500');
    }
    toastNotificacao.classList.remove('hidden', 'opacity-0');

    setTimeout(() => {
        toastNotificacao.classList.add('opacity-0');
        toastNotificacao.addEventListener('transitionend', () => {
            toastNotificacao.classList.add('hidden');
            notificacaoAtiva = false;
            processarFilaDeNotificacoes();
        }, { once: true });
    }, 3000);
}

export function mostrarNotificacao(mensagem, tipo = 'sucesso') {
    filaDeNotificacoes.push({ mensagem, tipo });
    processarFilaDeNotificacoes();
}

export function navigateToTab(tabId) {
    tabContents.forEach(tab => tab.classList.add('hidden'));
    bottomNav.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active', 'text-blue-500', 'border-blue-500');
        btn.classList.add('text-gray-500', 'border-transparent');
    });
    document.getElementById(tabId).classList.remove('hidden');
    const activeButton = document.querySelector(`.nav-btn[data-tab="${tabId}"]`);
    activeButton.classList.add('active', 'text-blue-500', 'border-blue-500');
    activeButton.classList.remove('text-gray-500', 'border-transparent');
}

export function renderizarDashboard() {
    const contasFechadas = estado.contasAtivas.filter(c => c.status === 'fechada');
    
    let totalVendas = 0, totalNumerario = 0, totalTpa = 0;
    
    contasFechadas.forEach(conta => {
        const valorConta = conta.valorFinal || 0;
        totalVendas += valorConta;
        if (conta.metodoPagamento === 'Numerário') totalNumerario += valorConta;
        else if (conta.metodoPagamento === 'TPA') totalTpa += valorConta;
    });

    dbVendasTotal.textContent = totalVendas.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    dbVendasNumerario.textContent = totalNumerario.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    dbVendasTpa.textContent = totalTpa.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });

    const contasAtivas = estado.contasAtivas.filter(c => c.status === 'ativa');
    dbContasAtivas.textContent = contasAtivas.length;
    
    const itensComStockBaixo = estado.inventario.filter(item => item.stockGeleira > 0 && item.stockGeleira <= item.stockMinimo);
    dbAlertasStock.textContent = itensComStockBaixo.length;
    
    const produtosVendidos = {};
    contasFechadas.forEach(conta => {
        conta.pedidos.forEach(pedido => {
            produtosVendidos[pedido.nome] = (produtosVendidos[pedido.nome] || 0) + pedido.qtd;
        });
    });

    let topProdutoNome = '—', topProdutoQtd = 0;
    if (Object.keys(produtosVendidos).length > 0) {
        const [nome, qtd] = Object.entries(produtosVendidos).reduce((a, b) => b[1] > a[1] ? b : a);
        topProdutoNome = nome;
        topProdutoQtd = qtd;
    }
    
    dbTopProdutoNome.textContent = topProdutoNome;
    dbTopProdutoQtd.textContent = `${topProdutoQtd} vendidos`;
}

export function renderizarSeletorDeClientes() {
    const contasAtivas = estado.contasAtivas.filter(c => c.status === 'ativa');
    const clienteSelecionadoAnteriormente = seletorCliente.value;
    seletorCliente.innerHTML = '<option value="">Nenhum cliente ativo</option>';
    if (contasAtivas.length === 0) return;

    contasAtivas.forEach(conta => {
        const option = document.createElement('option');
        option.value = conta.id;
        option.textContent = conta.nome;
        seletorCliente.appendChild(option);
    });
    if (contasAtivas.some(c => c.id == clienteSelecionadoAnteriormente)) {
        seletorCliente.value = clienteSelecionadoAnteriormente;
    }
}

export function renderizarVistaClienteAtivo() {
    const idContaSelecionada = parseInt(seletorCliente.value);
    const conta = estado.contasAtivas.find(c => c.id === idContaSelecionada);
    if (!conta) {
        vistaClienteAtivo.innerHTML = '<p class="text-center text-gray-500 py-8">Selecione ou crie um cliente para iniciar o atendimento.</p>';
        return;
    }
    let pedidosHTML = '<p class="text-center text-gray-500 py-4">Nenhum pedido nesta conta.</p>';
    if (conta.pedidos.length > 0) {
        pedidosHTML = conta.pedidos.map((pedido, index) => `
            <div class="flex justify-between items-center py-2 border-b">
                <span>${pedido.qtd}x ${pedido.nome}</span>
                <div class="flex items-center gap-4">
                    <span class="font-semibold">${(pedido.preco * pedido.qtd).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                    <button class="btn-icon btn-remover-item text-red-500 hover:text-red-700" data-index="${index}" data-id="${conta.id}" title="Remover Item">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
    const subtotal = conta.pedidos.reduce((total, p) => total + (p.preco * p.qtd), 0);
    const contaEstaVazia = conta.pedidos.length === 0;
    vistaClienteAtivo.innerHTML = `
        <div class="bg-white p-4 rounded-lg shadow-md">
             <div class="cartao-header flex justify-between items-center border-b pb-2 mb-4">
                <div class="cartao-titulo flex items-center gap-2">
                    <h3 class="text-xl font-bold">${conta.nome}</h3>
                    <button class="btn-icon btn-editar-nome text-lg text-gray-500 hover:text-blue-500" data-id="${conta.id}" title="Editar Nome">
                        <i class="fas fa-pencil-alt"></i>
                    </button>
                </div>
            </div>
            <div class="mb-4">${pedidosHTML}</div>
            <div class="mt-4 pt-4 border-t">
                <div class="flex justify-between font-bold text-lg">
                    <span>Subtotal:</span>
                    <span>${subtotal.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                </div>
            </div>
            <div class="flex gap-2 mt-4">
                <button class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded btn-adicionar-pedido" data-id="${conta.id}">+ Adicionar Pedido</button>
                <button class="w-full text-white font-bold py-2 px-4 rounded btn-finalizar-pagamento ${contaEstaVazia ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}" 
                        data-id="${conta.id}" ${contaEstaVazia ? 'disabled' : ''}>
                    Finalizar Pagamento
                </button>
            </div>
        </div>
    `;
}

export function renderizarInventario() {
    const termoBusca = inputBuscaInventario.value.toLowerCase().trim();
    const inventarioParaMostrar = estado.inventario.filter(item => 
        item.nome.toLowerCase().includes(termoBusca)
    );

    listaInventario.innerHTML = '';
    if (inventarioParaMostrar.length === 0) {
        listaInventario.innerHTML = termoBusca ? 
            `<p class="text-center text-gray-500 py-8">Nenhum produto encontrado para "${inputBuscaInventario.value}".</p>` :
            '<p class="text-center text-gray-500 py-8">Nenhum produto no inventário.</p>';
        return;
    }

    const inventoryHTML = inventarioParaMostrar.map(item => {
        const isLowStock = item.stockGeleira > 0 && item.stockGeleira <= item.stockMinimo;
        const destaqueClasse = isLowStock ? 'border-2 border-red-500 bg-red-50' : 'shadow-md';
        return `
        <div class="bg-white p-4 rounded-lg ${destaqueClasse}">
            <div class="flex justify-between items-start mb-2">
                <div>
                    <p class="font-bold text-lg">${item.nome}</p>
                    <p class="text-sm text-gray-600">Preço: ${item.preco.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p>
                </div>
                <button class="btn-icon btn-editar-produto text-xl text-gray-500 hover:text-blue-500" data-id="${item.id}" title="Editar Produto">
                    <i class="fas fa-pencil-alt"></i>
                </button>
            </div>
            <div class="grid grid-cols-2 gap-4 text-center border-t border-b py-2 my-2">
                <div>
                    <p class="text-xs text-gray-500">ARMAZÉM</p>
                    <p class="font-bold text-2xl">${item.stockArmazem}</p>
                </div>
                <div>
                    <p class="text-xs text-blue-500">GELEIRA</p>
                    <p class="font-bold text-2xl text-blue-500">${item.stockGeleira}</p>
                </div>
            </div>
            <div class="flex justify-end items-center gap-4 mt-2">
                <button class="btn-icon btn-adicionar-armazem text-2xl text-green-500 hover:text-green-700" data-id="${item.id}" title="Adicionar ao Armazém">
                    <i class="fas fa-box"></i>
                </button>
                <button class="btn-icon btn-mover-geleira text-2xl text-blue-500 hover:text-blue-700" data-id="${item.id}" title="Mover para Geleira">
                    <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        </div>
        `;
    }).join('');
    listaInventario.innerHTML = `<div class="space-y-4">${inventoryHTML}</div>`;
}

export function renderizarCalendario() {
    const ano = dataAtualCalendario.getFullYear();
    const mes = dataAtualCalendario.getMonth();

    calendarioTitulo.textContent = new Date(ano, mes).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase());
    calendarioGridDias.innerHTML = '';

    const primeiroDiaDoMes = new Date(ano, mes, 1).getDay();
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();
    const diasComRelatorio = new Set(
        (estado.historicoFechos || []).map(relatorio => {
            const dataRelatorio = new Date(relatorio.data);
            if (dataRelatorio.getFullYear() === ano && dataRelatorio.getMonth() === mes) {
                return dataRelatorio.getDate();
            }
        }).filter(Boolean)
    );

    for (let i = 0; i < primeiroDiaDoMes; i++) calendarioGridDias.innerHTML += '<div></div>';

    for (let dia = 1; dia <= diasNoMes; dia++) {
        const celulaDia = document.createElement('div');
        celulaDia.textContent = dia;
        celulaDia.className = 'p-2 text-center rounded-full';
        if (diasComRelatorio.has(dia)) {
            celulaDia.classList.add('bg-blue-500', 'text-white', 'font-bold', 'cursor-pointer', 'hover:bg-blue-600');
            celulaDia.dataset.dia = dia;
        } else {
            celulaDia.classList.add('text-gray-400');
        }
        calendarioGridDias.appendChild(celulaDia);
    }
}

export function renderizarRelatorioFechoGlobal(relatorio) {
    fgDataRelatorio.textContent = new Date(relatorio.data).toLocaleDateString('pt-PT', { dateStyle: 'full' });
    fgTotalVendido.textContent = relatorio.totalVendido.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    fgTotalNumerario.textContent = relatorio.totalNumerario.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    fgTotalTpa.textContent = relatorio.totalTpa.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    fgContasFechadas.textContent = relatorio.numContasFechadas;
    fgMediaPorConta.textContent = relatorio.mediaPorConta.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    fgListaProdutos.innerHTML = '';
    if (Object.keys(relatorio.produtosVendidos).length > 0) {
        for (const [nome, qtd] of Object.entries(relatorio.produtosVendidos)) {
            fgListaProdutos.innerHTML += `<div class="flex justify-between"><span class="font-semibold">${qtd}x</span><span>${nome}</span></div>`;
        }
    } else {
        fgListaProdutos.innerHTML = '<span>Nenhum produto vendido hoje.</span>';
    }
}

export function renderizarAutocomplete(filtro = '') {
    const termoBusca = filtro.toLowerCase().trim();
    autocompleteResults.innerHTML = '';
    
    if (!termoBusca) {
        autocompleteResults.classList.add('hidden');
        return;
    }
    
    const produtosFiltrados = estado.inventario.filter(item => 
        item.stockGeleira > 0 && item.nome.toLowerCase().includes(termoBusca)
    );

    if (produtosFiltrados.length === 0) {
        autocompleteResults.classList.add('hidden');
        return;
    }

    produtosFiltrados.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'p-2 hover:bg-gray-100 cursor-pointer';
        itemDiv.textContent = `${item.nome} (${item.stockGeleira} disp.)`;
        itemDiv.dataset.id = item.id;
        itemDiv.dataset.nome = item.nome;
        autocompleteResults.appendChild(itemDiv);
    });
    autocompleteResults.classList.remove('hidden');
}

export function verificarAlertasDeStock() {
    const itensComStockBaixo = estado.inventario.filter(item => item.stockGeleira > 0 && item.stockGeleira <= item.stockMinimo);
    if (itensComStockBaixo.length > 0) {
        alertaStockContainer.textContent = `⚠️ Alerta: ${itensComStockBaixo.map(i => i.nome).join(', ')} com stock baixo na geleira.`;
        alertaStockContainer.classList.remove('hidden');
    } else {
        alertaStockContainer.classList.add('hidden');
    }
}

export function atualizarTodaUI() {
    renderizarDashboard();
    renderizarSeletorDeClientes();
    renderizarVistaClienteAtivo();
    renderizarInventario();
    renderizarCalendario();
    verificarAlertasDeStock();
}