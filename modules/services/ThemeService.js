// /modules/services/ThemeService.js - (v10.0 - NOVO)
'use strict';

const THEME_STORAGE_KEY = 'gestorbar-theme';
let systemThemeListener = null;

/**
 * Aplica um tema à aplicação, definindo o atributo no elemento <html>.
 * @param {string} theme - O tema a ser aplicado ('light' or 'dark').
 */
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
}

/**
 * Guarda a preferência de tema do utilizador no localStorage.
 * @param {string} theme - O tema a ser guardado.
 */
function saveTheme(theme) {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
}

/**
 * Remove a preferência guardada, fazendo a app voltar a respeitar o tema do sistema.
 */
function clearSavedTheme() {
    localStorage.removeItem(THEME_STORAGE_KEY);
}

/**
 * Ouve as mudanças no tema do sistema operativo e aplica-as se não houver override do utilizador.
 * @param {MediaQueryListEvent} e - O evento de mudança.
 */
function handleSystemThemeChange(e) {
    const newTheme = e.matches ? 'dark' : 'light';
    // Só muda o tema se o utilizador não tiver escolhido um manualmente.
    if (!localStorage.getItem(THEME_STORAGE_KEY)) {
        applyTheme(newTheme);
    }
}

/**
 * Alterna entre o tema 'light' e 'dark', guarda a escolha e desativa o listener do sistema.
 */
function toggleTheme() {
    const currentTheme = getCurrentTheme();
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    applyTheme(newTheme);
    saveTheme(newTheme);

    // Uma vez que o utilizador escolhe manualmente, paramos de ouvir o tema do sistema.
    if (systemThemeListener) {
        systemThemeListener.removeEventListener('change', handleSystemThemeChange);
    }
}

/**
 * Obtém o tema atualmente ativo na aplicação.
 * @returns {string} 'dark' ou 'light'.
 */
function getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
}

/**
 * Inicializa o serviço de tema. Deve ser chamado uma única vez no arranque da app.
 */
function init() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

    if (savedTheme) {
        // Se o utilizador já escolheu um tema, aplica-o.
        applyTheme(savedTheme);
    } else {
        // Se não, verifica a preferência do sistema operativo.
        systemThemeListener = window.matchMedia('(prefers-color-scheme: dark)');
        const initialSystemTheme = systemThemeListener.matches ? 'dark' : 'light';
        applyTheme(initialSystemTheme);
        
        // E começa a ouvir por futuras mudanças no tema do sistema.
        systemThemeListener.addEventListener('change', handleSystemThemeChange);
    }
}

export default {
    init,
    toggleTheme,
    getCurrentTheme
};