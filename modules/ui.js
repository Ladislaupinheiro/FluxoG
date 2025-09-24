// /modules/ui.js - Responsável por todas as manipulações do DOM e renderizações da interface (v3.8)
'use strict';

import { estado, dataAtualCalendario } from './state.js';
import * as sel from './selectors.js';

// A constante foi movida de volta para aqui para eliminar a dependência do config.js
const NOTIFICATION_QUEUE_LIMIT = 5;

let filaDeNotificacoes = [];
let notificacaoAtiva = false;

// ===================================
// FUNÇÕES AUXILIARES DE CRIAÇÃO DE ELEMENTOS
// ===================================

/**
 * Cria um elemento HTML com classes, texto e atributos.
 * @param {string} tag - A tag HTML (ex: 'div', 'button').
 * @param {object} options - Opções para o elemento.
 * @param {string[]} [options.classes=[]] - Lista de classes CSS.
 * @param {string} [options.text=''] - Conteúdo de texto.
 * @param {object} [options.attrs={}] - Atributos (ex: { 'data-id': 1, 'aria-label': 'Descrição' }).
 * @param {HTMLElement[]} [options.children=[]] - Elementos filhos a serem anexados.
 * @returns {HTMLElement} - O elemento HTML criado.
 */
function criarElemento(tag, { classes = [], text = '', attrs = {}, children = [] } = {}) {
    const el = document.createElement(tag);
    if (classes.length) el.classList.add(...classes);
    if (text) el.textContent = text;
    for (const [key, value] of Object.entries(attrs)) {
        el.setAttribute(key, value);
    }
    for (const child of children) {
        el.appendChild(child);
    }
    return el;
}


// ===================================
// GESTÃO DE NOTIFICAÇÕES (Toast)
// ===================================

function processarFilaDeNotificacoes() {
    if (notificacaoAtiva || filaDeNotificacoes.length === 0) {
        return;
    }
    notificacaoAtiva = true;
    const notificacao = filaDeNotificacoes.shift();

    sel.toastNotificacao.textContent = notificacao.mensagem;
    sel.toastNotificacao.classList.remove('bg-green-500', 'bg-red-500', 'hidden', 'opacity-0');
    sel.toastNotificacao.classList.add(notificacao.tipo === 'sucesso' ? 'bg-green-500' : 'bg-red-500');

    setTimeout(() => {
        sel.toastNotificacao.classList.add('opacity-0');
        sel.toastNotificacao.addEventListener('transitionend', () => {
            sel.toastNotificacao.classList.add('hidden');
            notificacaoAtiva = false;
            processarFilaDeNotificacoes();
        }, { once: true });
    }, 3000);
}

export function mostrarNotificacao(mensagem, tipo = 'sucesso') {
    if (filaDeNotificacoes.length >= NOTIFICATION_QUEUE_LIMIT) {
        return;
    }
    filaDeNotificacoes.push({ mensagem, tipo });
    processarFilaDeNotificacoes();
}

// ===================================
// NAVEGAÇÃO E RENDERIZAÇÃO PRINCIPAL
// ===================================

export function navigateToTab(tabId) {
    sel.tabContents.forEach(tab => tab.classList.add('hidden'));
    sel.bottomNav.querySelectorAll('.nav-btn').forEach(btn => {
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
    const contasAtivasAbertas = estado.contasAtivas.filter(c => c.status === 'ativa');
    const itensComStockBaixo = estado.inventario.filter(item => item.stockGeleira > 0 && item.stockGeleira <= item.stockMinimo);

    const totais = contasFechadas.reduce((acc, conta) => {
        const valor = conta.valorFinal || 0;
        acc.totalVendas += valor;
        if (conta.metodoPagamento === 'Numerário') acc.totalNumerario += valor;
        else if (conta.metodoPagamento === 'TPA') acc.totalTpa += valor;
        return acc;
    }, { totalVendas: 0, totalNumerario: 0, totalTpa: 0 });

    const produtosVendidos = contasFechadas.flatMap(c => c.pedidos).reduce((acc, pedido) => {
        acc[pedido.nome] = (acc[pedido.nome] || 0) + pedido.qtd;
        return acc;
    }, {});

    const [topProdutoNome = '—', topProdutoQtd = 0] = Object.entries(produtosVendidos).reduce((a, b) => b[1] > a[1] ? b : a, [null, 0]);

    sel.dbVendasTotal.textContent = totais.totalVendas.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    sel.dbVendasNumerario.textContent = totais.totalNumerario.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    sel.dbVendasTpa.textContent = totais.totalTpa.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    sel.dbContasAtivas.textContent = contasAtivasAbertas.length;
    sel.dbAlertasStock.textContent = itensComStockBaixo.length;
    sel.dbTopProdutoNome.textContent = topProdutoNome;
    sel.dbTopProdutoQtd.textContent = `${topProdutoQtd} vendidos`;
}

export function renderizarSeletorDeClientes() {
    const contasAtivas = estado.contasAtivas.filter(c => c.status === 'ativa');
    const clienteSelecionadoAnteriormente = sel.seletorCliente.value;
    sel.seletorCliente.innerHTML = ''; 
    
    sel.seletorCliente.appendChild(criarElemento('option', { text: 'Nenhum cliente ativo', attrs: { value: '' } }));

    contasAtivas.forEach(conta => {
        sel.seletorCliente.appendChild(criarElemento('option', { text: conta.nome, attrs: { value: conta.id } }));
    });

    if (contasAtivas.some(c => c.id == clienteSelecionadoAnteriormente)) {
        sel.seletorCliente.value = clienteSelecionadoAnteriormente;
    }
}

export function renderizarVistaClienteAtivo() {
    const idContaSelecionada = parseInt(sel.seletorCliente.value);
    const conta = estado.contasAtivas.find(c => c.id === idContaSelecionada);
    sel.vistaClienteAtivo.innerHTML = '';

    if (!conta) {
        sel.vistaClienteAtivo.appendChild(criarElemento('p', { text: 'Selecione ou crie um cliente para iniciar o atendimento.', classes: ['text-center', 'text-gray-500', 'py-8'] }));
        return;
    }

    let pedidosContainer;
    if (conta.pedidos.length > 0) {
        const pedidosElements = conta.pedidos.map((pedido, index) => 
            criarElemento('div', { classes: ['flex', 'justify-between', 'items-center', 'py-2', 'border-b'], children: [
                criarElemento('span', { text: `${pedido.qtd}x ${pedido.nome}` }),
                criarElemento('div', { classes: ['flex', 'items-center', 'gap-4'], children: [
                    criarElemento('span', { text: (pedido.preco * pedido.qtd).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' }), classes: ['font-semibold'] }),
                    criarElemento('button', { 
                        classes: ['btn-icon', 'btn-remover-item', 'text-red-500', 'hover:text-red-700'], 
                        attrs: { 
                            'data-index': index, 
                            'data-id': conta.id, 
                            title: 'Remover Item',
                            'aria-label': `Remover ${pedido.qtd}x ${pedido.nome} do pedido`
                        }, 
                        children: [
                            criarElemento('i', { classes: ['fas', 'fa-trash-alt'] })
                        ]
                    })
                ]})
            ]})
        );
        pedidosContainer = criarElemento('div', { classes: ['mb-4'], children: pedidosElements });
    } else {
        pedidosContainer = criarElemento('p', { text: 'Nenhum pedido nesta conta.', classes: ['text-center', 'text-gray-500', 'py-4'] });
    }

    const subtotal = conta.pedidos.reduce((total, p) => total + (p.preco * p.qtd), 0);
    const contaEstaVazia = conta.pedidos.length === 0;

    const cartaoCliente = criarElemento('div', { classes: ['bg-white', 'p-4', 'rounded-lg', 'shadow-md'], children: [
        criarElemento('div', { classes: ['cartao-header', 'flex', 'justify-between', 'items-center', 'border-b', 'pb-2', 'mb-4'], children: [
            criarElemento('div', { classes: ['cartao-titulo', 'flex', 'items-center', 'gap-2'], children: [
                criarElemento('h3', { text: conta.nome, classes: ['text-xl', 'font-bold'] }),
                criarElemento('button', { 
                    classes: ['btn-icon', 'btn-editar-nome', 'text-lg', 'text-gray-500', 'hover:text-blue-500'], 
                    attrs: { 'data-id': conta.id, title: 'Editar Nome', 'aria-label': `Editar nome da conta ${conta.nome}` }, 
                    children: [
                        criarElemento('i', { classes: ['fas', 'fa-pencil-alt'] })
                    ]
                })
            ]})
        ]}),
        pedidosContainer,
        criarElemento('div', { classes: ['mt-4', 'pt-4', 'border-t'], children: [
            criarElemento('div', { classes: ['flex', 'justify-between', 'font-bold', 'text-lg'], children: [
                criarElemento('span', { text: 'Subtotal:' }),
                criarElemento('span', { text: subtotal.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' }) })
            ]})
        ]}),
        criarElemento('div', { classes: ['flex', 'gap-2', 'mt-4'], children: [
            criarElemento('button', { text: '+ Adicionar Pedido', classes: ['w-full', 'bg-green-500', 'hover:bg-green-600', 'text-white', 'font-bold', 'py-2', 'px-4', 'rounded', 'btn-adicionar-pedido'], attrs: { 'data-id': conta.id } }),
            criarElemento('button', { text: 'Finalizar Pagamento', classes: ['w-full', 'text-white', 'font-bold', 'py-2', 'px-4', 'rounded', 'btn-finalizar-pagamento', contaEstaVazia ? 'bg-gray-400' : 'bg-blue-600', contaEstaVazia ? 'cursor-not-allowed' : 'hover:bg-blue-700'], attrs: { 'data-id': conta.id, ...(contaEstaVazia && { disabled: true }) } })
        ]})
    ]});
    
    sel.vistaClienteAtivo.appendChild(cartaoCliente);
}

export function renderizarInventario() {
    const termoBusca = sel.inputBuscaInventario.value.toLowerCase().trim();
    const inventarioParaMostrar = estado.inventario.filter(item => 
        item.nome.toLowerCase().includes(termoBusca)
    );
    sel.listaInventario.innerHTML = '';

    if (inventarioParaMostrar.length === 0) {
        const mensagem = termoBusca ? `Nenhum produto encontrado para "${sel.inputBuscaInventario.value}".` : 'Nenhum produto no inventário.';
        sel.listaInventario.appendChild(criarElemento('p', { text: mensagem, classes: ['text-center', 'text-gray-500', 'py-8'] }));
        return;
    }

    const inventoryElements = inventarioParaMostrar.map(item => {
        const isLowStock = item.stockGeleira > 0 && item.stockGeleira <= item.stockMinimo;
        const destaqueClasse = isLowStock ? ['border-2', 'border-red-500', 'bg-red-50'] : ['shadow-md'];
        
        return criarElemento('div', { classes: ['bg-white', 'p-4', 'rounded-lg', ...destaqueClasse], children: [
            criarElemento('div', { classes: ['flex', 'justify-between', 'items-start', 'mb-2'], children: [
                criarElemento('div', { children: [
                    criarElemento('p', { text: item.nome, classes: ['font-bold', 'text-lg'] }),
                    criarElemento('p', { text: `Preço: ${item.preco.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}`, classes: ['text-sm', 'text-gray-600'] })
                ]}),
                criarElemento('button', { 
                    classes: ['btn-icon', 'btn-editar-produto', 'text-xl', 'text-gray-500', 'hover:text-blue-500'], 
                    attrs: { 'data-id': item.id, title: 'Editar Produto', 'aria-label': `Editar produto ${item.nome}` }, 
                    children: [
                        criarElemento('i', { classes: ['fas', 'fa-pencil-alt'] })
                    ]
                })
            ]}),
            criarElemento('div', { classes: ['grid', 'grid-cols-2', 'gap-4', 'text-center', 'border-t', 'border-b', 'py-2', 'my-2'], children: [
                 criarElemento('div', { children: [
                    criarElemento('p', { text: 'ARMAZÉM', classes: ['text-xs', 'text-gray-500'] }),
                    criarElemento('p', { text: item.stockArmazem, classes: ['font-bold', 'text-2xl'] })
                ]}),
                criarElemento('div', { children: [
                    criarElemento('p', { text: 'GELEIRA', classes: ['text-xs', 'text-blue-500'] }),
                    criarElemento('p', { text: item.stockGeleira, classes: ['font-bold', 'text-2xl', 'text-blue-500'] })
                ]})
            ]}),
            criarElemento('div', { classes: ['flex', 'justify-end', 'items-center', 'gap-4', 'mt-2'], children: [
                criarElemento('button', { 
                    classes: ['btn-icon', 'btn-adicionar-armazem', 'text-2xl', 'text-green-500', 'hover:text-green-700'], 
                    attrs: { 'data-id': item.id, title: 'Adicionar ao Armazém', 'aria-label': `Adicionar stock de ${item.nome} ao armazém` }, 
                    children: [
                        criarElemento('i', { classes: ['fas', 'fa-box'] })
                    ]
                }),
                criarElemento('button', { 
                    classes: ['btn-icon', 'btn-mover-geleira', 'text-2xl', 'text-blue-500', 'hover:text-blue-700'], 
                    attrs: { 'data-id': item.id, title: 'Mover para Geleira', 'aria-label': `Mover stock de ${item.nome} para a geleira` }, 
                    children: [
                        criarElemento('i', { classes: ['fas', 'fa-arrow-right'] })
                    ]
                })
            ]})
        ]});
    });

    const container = criarElemento('div', { classes: ['space-y-4'], children: inventoryElements });
    sel.listaInventario.appendChild(container);
}

export function renderizarCalendario() {
    const ano = dataAtualCalendario.getFullYear();
    const mes = dataAtualCalendario.getMonth();

    sel.calendarioTitulo.textContent = new Date(ano, mes).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase());
    sel.calendarioGridDias.innerHTML = '';

    const primeiroDiaDoMes = (new Date(ano, mes, 1).getDay() + 6) % 7; 
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();
    const diasComRelatorio = new Set(
        (estado.historicoFechos || []).map(relatorio => {
            const dataRelatorio = new Date(relatorio.data);
            return dataRelatorio.getFullYear() === ano && dataRelatorio.getMonth() === mes ? dataRelatorio.getDate() : null;
        }).filter(Boolean)
    );

    for (let i = 0; i < primeiroDiaDoMes; i++) sel.calendarioGridDias.appendChild(criarElemento('div'));

    for (let dia = 1; dia <= diasNoMes; dia++) {
        const temRelatorio = diasComRelatorio.has(dia);
        const classes = ['p-2', 'text-center', 'rounded-full'];
        if (temRelatorio) {
            classes.push('bg-blue-500', 'text-white', 'font-bold', 'cursor-pointer', 'hover:bg-blue-600');
        } else {
            classes.push('text-gray-400');
        }
        
        const attrs = temRelatorio ? { 'data-dia': dia } : {};
        sel.calendarioGridDias.appendChild(criarElemento('div', { text: dia, classes, attrs }));
    }
}

export function renderizarRelatorioFechoGlobal(relatorio) {
    sel.fgDataRelatorio.textContent = new Date(relatorio.data).toLocaleDateString('pt-PT', { dateStyle: 'full' });
    sel.fgTotalVendido.textContent = relatorio.totalVendido.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    sel.fgTotalNumerario.textContent = relatorio.totalNumerario.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    sel.fgTotalTpa.textContent = relatorio.totalTpa.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    sel.fgContasFechadas.textContent = relatorio.numContasFechadas;
    sel.fgMediaPorConta.textContent = relatorio.mediaPorConta.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    sel.fgListaProdutos.innerHTML = '';

    if (Object.keys(relatorio.produtosVendidos).length > 0) {
        const productElements = Object.entries(relatorio.produtosVendidos).map(([nome, qtd]) => 
            criarElemento('div', { classes: ['flex', 'justify-between'], children: [
                criarElemento('span', { text: `${qtd}x`, classes: ['font-semibold'] }),
                criarElemento('span', { text: nome })
            ]})
        );
        productElements.forEach(el => sel.fgListaProdutos.appendChild(el));
    } else {
        sel.fgListaProdutos.appendChild(criarElemento('span', { text: 'Nenhum produto vendido hoje.' }));
    }
}

export function renderizarAutocomplete(filtro = '') {
    const termoBusca = filtro.toLowerCase().trim();
    sel.autocompleteResults.innerHTML = '';
    sel.autocompleteResults.classList.add('hidden');

    if (!termoBusca) return;
    
    const produtosFiltrados = estado.inventario.filter(item => 
        item.stockGeleira > 0 && item.nome.toLowerCase().includes(termoBusca)
    );

    if (produtosFiltrados.length === 0) return;

    produtosFiltrados.forEach(item => {
        const itemDiv = criarElemento('div', {
            text: `${item.nome} (${item.stockGeleira} disp.)`,
            classes: ['p-2', 'hover:bg-gray-100', 'cursor-pointer'],
            attrs: { 'data-id': item.id, 'data-nome': item.nome }
        });
        sel.autocompleteResults.appendChild(itemDiv);
    });
    sel.autocompleteResults.classList.remove('hidden');
}

export function verificarAlertasDeStock() {
    const itensComStockBaixo = estado.inventario.filter(item => item.stockGeleira > 0 && item.stockGeleira <= item.stockMinimo);
    if (itensComStockBaixo.length > 0) {
        sel.alertaStockContainer.textContent = `⚠️ Alerta: ${itensComStockBaixo.map(i => i.nome).join(', ')} com stock baixo na geleira.`;
        sel.alertaStockContainer.classList.remove('hidden');
    } else {
        sel.alertaStockContainer.classList.add('hidden');
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

