// /modules/components/Toast.js - (v9.0)
'use strict';

const sel = {};
let filaDeNotificacoes = [];
let notificacaoAtiva = false;
let timeoutAtivo = null;

const NOTIFICATION_QUEUE_LIMIT = 5;

/**
 * Processa a fila de notificações, exibindo uma de cada vez.
 */
function processarFila() {
    if (notificacaoAtiva || filaDeNotificacoes.length === 0) {
        return;
    }
    notificacaoAtiva = true;
    const { mensagem, tipo } = filaDeNotificacoes.shift();

    sel.toast.textContent = mensagem;
    // Reseta as classes de cor e visibilidade antes de aplicar as novas
    sel.toast.className = 'fixed top-5 left-1/2 -translate-x-1/2 px-6 py-3 rounded-md text-white font-semibold shadow-lg transition-all duration-300 z-[200]';

    const cor = tipo === 'sucesso' ? 'bg-green-500' : 'bg-red-500';
    sel.toast.classList.add(cor);

    // Força um reflow para garantir que a animação de entrada funcione
    void sel.toast.offsetWidth;

    // Animação de entrada
    sel.toast.classList.remove('opacity-0', '-translate-y-20');

    // Animação de saída
    timeoutAtivo = setTimeout(() => {
        sel.toast.classList.add('opacity-0', '-translate-y-20');
        
        // Espera a transição CSS terminar antes de esconder e processar a próxima
        const handleTransitionEnd = () => {
            sel.toast.classList.add('hidden');
            notificacaoAtiva = false;
            processarFila();
        };
        sel.toast.addEventListener('transitionend', handleTransitionEnd, { once: true });

    }, 3000);
}

/**
 * Adiciona uma nova notificação à fila para ser exibida.
 * @param {string} mensagem - A mensagem a ser exibida.
 * @param {string} [tipo='sucesso'] - O tipo de notificação ('sucesso' ou 'erro').
 */
export function mostrarNotificacao(mensagem, tipo = 'sucesso') {
    if (filaDeNotificacoes.length >= NOTIFICATION_QUEUE_LIMIT) {
        filaDeNotificacoes.shift();
    }
    filaDeNotificacoes.push({ mensagem, tipo });
    processarFila();
}

/**
 * Função de inicialização do componente de Toast.
 */
export function init() {
    sel.toast = document.getElementById('toast-notificacao');
}