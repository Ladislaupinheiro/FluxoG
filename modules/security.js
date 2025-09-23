// /modules/security.js - Módulo para gerir a segurança e licenciamento da aplicação (v3.1)
'use strict';

// Chaves para o localStorage
const LICENSE_KEY = 'gestorbar_license_key_v1';
const VALIDATION_HASH_KEY = 'gestorbar_validation_hash_v1';
const PIN_HASH_KEY = 'gestorbar_pin_hash_v1';
const PIN_SALT_KEY = 'gestorbar_pin_salt_v1'; // NOVO: Chave para o salt do PIN
const FAILED_ATTEMPTS_KEY = 'gestorbar_failed_attempts_v1';
const LOCKOUT_TIMESTAMP_KEY = 'gestorbar_lockout_timestamp_v1';

// Constantes de segurança
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30 * 1000; // 30 segundos

// ===================================
// FUNÇÕES DE LICENCIAMENTO
// ===================================

/**
 * Gera uma "impressão digital" única para o dispositivo/browser atual.
 * @returns {Promise<string>} Uma string hash representando o ID do dispositivo.
 */
async function gerarDeviceId() {
    const dados = `${navigator.userAgent}-${screen.height}x${screen.width}-${navigator.language}-${navigator.platform}`;
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(dados));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Combina uma chave de licença e um ID de dispositivo para criar um hash de validação seguro.
 * @param {string} chave - A chave de licença inserida pelo utilizador.
 * @param {string} deviceId - O ID do dispositivo gerado.
 * @returns {Promise<string>} O hash de validação final.
 */
async function gerarHashValidacao(chave, deviceId) {
    const dadosCombinados = `${chave.trim().toUpperCase()}-${deviceId}`;
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(dadosCombinados));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Ofusca a chave de licença para armazenamento local.
 * @param {string} chave - A chave de licença.
 * @returns {string} - A chave ofuscada em Base64.
 */
function ofuscarChave(chave) {
    return btoa(chave);
}

/**
 * Desofusca a chave de licença do armazenamento local.
 * @param {string} chaveOfuscada - A chave ofuscada em Base64.
 * @returns {string} - A chave de licença original.
 */
function desofuscarChave(chaveOfuscada) {
    try {
        return atob(chaveOfuscada);
    } catch (e) {
        return null; // Retorna nulo se a string Base64 for inválida.
    }
}

/**
 * Ativa a aplicação guardando a chave (ofuscada) e o hash de validação no localStorage.
 * @param {string} chave - A chave de licença válida.
 */
export async function ativarLicenca(chave) {
    const deviceId = await gerarDeviceId();
    const hashValidacao = await gerarHashValidacao(chave, deviceId);
    
    localStorage.setItem(LICENSE_KEY, ofuscarChave(chave.trim().toUpperCase()));
    localStorage.setItem(VALIDATION_HASH_KEY, hashValidacao);
}

/**
 * Verifica se a licença está ativa e válida para este dispositivo.
 * @returns {Promise<boolean>} - Verdadeiro se a licença for válida, falso caso contrário.
 */
export async function verificarLicencaAtiva() {
    const chaveOfuscada = localStorage.getItem(LICENSE_KEY);
    const hashGuardado = localStorage.getItem(VALIDATION_HASH_KEY);

    if (!chaveOfuscada || !hashGuardado) {
        return false;
    }

    const chave = desofuscarChave(chaveOfuscada);
    if (!chave) return false;

    const deviceIdAtual = await gerarDeviceId();
    const hashRecalculado = await gerarHashValidacao(chave, deviceIdAtual);

    return hashRecalculado === hashGuardado;
}


// ===================================
// FUNÇÕES DE AUTENTICAÇÃO POR PIN (Refatorado com Salt)
// ===================================

/**
 * Gera um salt criptograficamente seguro.
 * @returns {string} - O salt em formato hexadecimal.
 */
function gerarSalt() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Gera um hash seguro para um PIN usando um salt.
 * @param {string} pin - O PIN de 4 dígitos.
 * @param {string} salt - O salt para combinar com o PIN.
 * @returns {Promise<string>} - O hash SHA-256 resultante.
 */
async function gerarHashSenha(pin, salt) {
    const dadosCombinados = `${salt}-${pin}`;
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(dadosCombinados));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Guarda o hash e o salt de um novo PIN no localStorage.
 * @param {string} pin - O PIN a ser guardado.
 */
export async function guardarHashSenha(pin) {
    const salt = gerarSalt();
    const hash = await gerarHashSenha(pin, salt);
    localStorage.setItem(PIN_SALT_KEY, salt);
    localStorage.setItem(PIN_HASH_KEY, hash);
}

/**
 * Verifica se um PIN inserido corresponde ao que está guardado.
 * @param {string} pin - O PIN inserido pelo utilizador.
 * @returns {Promise<boolean>} - Verdadeiro se o PIN estiver correto, falso caso contrário.
 */
export async function verificarSenha(pin) {
    const salt = localStorage.getItem(PIN_SALT_KEY);
    const hashGuardado = localStorage.getItem(PIN_HASH_KEY);
    if (!salt || !hashGuardado) return false;

    const hashNovo = await gerarHashSenha(pin, salt);
    return hashNovo === hashGuardado;
}

/**
 * Verifica se já existe um hash de PIN guardado.
 * @returns {boolean} - Verdadeiro se existir, falso caso contrário.
 */
export function verificarSeSenhaExiste() {
    return !!localStorage.getItem(PIN_HASH_KEY);
}


// ===================================
// FUNÇÕES DE BLOQUEIO (Rate Limiting)
// ===================================

/**
 * Verifica se a aplicação está atualmente bloqueada por tentativas excessivas.
 * @returns {boolean} - Verdadeiro se estiver bloqueada.
 */
export function verificarBloqueio() {
    const lockoutTimestamp = parseInt(localStorage.getItem(LOCKOUT_TIMESTAMP_KEY) || '0');
    if (lockoutTimestamp > Date.now()) {
        return true; // Ainda está bloqueado.
    }
    // Se o tempo de bloqueio já passou, limpa os contadores.
    localStorage.removeItem(LOCKOUT_TIMESTAMP_KEY);
    localStorage.removeItem(FAILED_ATTEMPTS_KEY);
    return false;
}

/**
 * Regista uma tentativa de login falhada e bloqueia a aplicação se o limite for atingido.
 */
export function registrarTentativaFalhada() {
    let tentativas = parseInt(localStorage.getItem(FAILED_ATTEMPTS_KEY) || '0') + 1;
    
    if (tentativas >= MAX_ATTEMPTS) {
        const lockoutEndTime = Date.now() + LOCKOUT_DURATION;
        localStorage.setItem(LOCKOUT_TIMESTAMP_KEY, lockoutEndTime.toString());
        localStorage.setItem(FAILED_ATTEMPTS_KEY, tentativas.toString());
    } else {
        localStorage.setItem(FAILED_ATTEMPTS_KEY, tentativas.toString());
    }
}

/**
 * Limpa o contador de tentativas falhadas (usado após um login bem-sucedido).
 */
export function limparTentativasFalhadas() {
    localStorage.removeItem(FAILED_ATTEMPTS_KEY);
    localStorage.removeItem(LOCKOUT_TIMESTAMP_KEY);
}

/**
 * Obtém o tempo restante de bloqueio em segundos.
 * @returns {number} - O número de segundos restantes.
 */
export function obterTempoBloqueioRestante() {
    const lockoutTimestamp = parseInt(localStorage.getItem(LOCKOUT_TIMESTAMP_KEY) || '0');
    if (lockoutTimestamp <= Date.now()) return 0;
    
    return Math.ceil((lockoutTimestamp - Date.now()) / 1000);
}

