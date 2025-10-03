// /modules/components/Toast.js - Componente para Gestão de Notificações (v7.0)
'use strict';

const sel = {};
let filaDeNotificacoes = [];
let notificacaoAtiva = false;

const NOTIFICATION_QUEUE_LIMIT = 5;

/**
 * Processa a fila de notificações, exibindo uma de cada vez.
 */
function processarFilaDeNotificacoes() {
    if (notificacaoAtiva || filaDeNotificacoes.length === 0) {
        return;
    }
    notificacaoAtiva = true;
    const notificacao = filaDeNotificacoes.shift();

    sel.toastNotificacao.textContent = notificacao.mensagem;
    sel.toastNotificacao.classList.remove('bg-green-500', 'bg-red-500', 'hidden', 'opacity-0');
    
    // Define a cor com base no tipo
    const cor = notificacao.tipo === 'sucesso' ? 'bg-green-500' : 'bg-red-500';
    sel.toastNotificacao.classList.add(cor);
    
    // Torna a notificação visível
    sel.toastNotificacao.classList.remove('hidden');
    setTimeout(() => sel.toastNotificacao.classList.remove('opacity-0'), 50);

    // Esconde a notificação após um tempo
    const tempoDeEspera = 3000;
    setTimeout(() => {
        sel.toastNotificacao.classList.add('opacity-0');
        
        const onTransitionEnd = () => {
            sel.toastNotificacao.classList.add('hidden');
            notificacaoAtiva = false;
            processarFilaDeNotificacoes();
        };

        // Fallback de segurança caso o evento 'transitionend' não dispare
        const fallbackTimeout = setTimeout(() => {
            sel.toastNotificacao.removeEventListener('transitionend', onTransitionEnd);
            onTransitionEnd();
        }, tempoDeEspera + 500); // 500ms de margem de segurança

        sel.toastNotificacao.addEventListener('transitionend', () => {
            clearTimeout(fallbackTimeout);
            onTransitionEnd();
        }, { once: true });

    }, tempoDeEspera);
}

/**
 * Adiciona uma nova notificação à fila para ser exibida.
 * @param {string} mensagem - A mensagem a ser exibida.
 * @param {string} [tipo='sucesso'] - O tipo de notificação ('sucesso' ou 'erro').
 */
export function mostrarNotificacao(mensagem, tipo = 'sucesso') {
    if (filaDeNotificacoes.length >= NOTIFICATION_QUEUE_LIMIT) {
        // Evita que a fila cresça indefinidamente
        return;
    }
    filaDeNotificacoes.push({ mensagem, tipo });
    processarFilaDeNotificacoes();
}


/**
 * Função de inicialização do componente de Toast.
 */
export function init() {
    sel.toastNotificacao = document.getElementById('toast-notificacao');
}