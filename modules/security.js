// /modules/security.js - Módulo para gerir a segurança e licenciamento da aplicação (v3.8)
'use strict';

// As constantes foram movidas de volta para aqui para eliminar a dependência do config.js
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 1000;

// Chaves usadas no localStorage
const LICENSE_KEY = 'app_license_key_v2';
const VALIDATION_HASH_KEY = 'app_validation_hash_v2';
const PIN_HASH_KEY = 'app_pin_hash_v2';
const PIN_SALT_KEY = 'app_pin_salt_v2';
const FAILED_ATTEMPTS_KEY = 'app_failed_attempts';
const LOCKOUT_TIMESTAMP_KEY = 'app_lockout_timestamp';

// Funções de ofuscação simples para a chave de licença
const obfuscate = (str) => btoa(str);
const deobfuscate = (str) => atob(str);

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
 * @param {string} chave - A chave de licença.
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
 * Ativa a aplicação guardando a chave ofuscada e o hash de validação.
 * @param {string} chave - A chave de licença válida.
 */
export async function ativarLicenca(chave) {
    const deviceId = await gerarDeviceId();
    const hashValidacao = await gerarHashValidacao(chave, deviceId);
    localStorage.setItem(LICENSE_KEY, obfuscate(chave.trim().toUpperCase()));
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
    try {
        const chave = deobfuscate(chaveOfuscada);
        const deviceId = await gerarDeviceId();
        const hashAtual = await gerarHashValidacao(chave, deviceId);
        return hashAtual === hashGuardado;
    } catch (error) {
        console.error("Erro ao validar licença:", error);
        return false;
    }
}

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
 * Verifica se o PIN inserido corresponde ao hash guardado.
 * @param {string} pin - O PIN inserido pelo utilizador.
 * @returns {Promise<boolean>} - Verdadeiro se o PIN for correto.
 */
export async function verificarSenha(pin) {
    const salt = localStorage.getItem(PIN_SALT_KEY);
    const hashGuardado = localStorage.getItem(PIN_HASH_KEY);
    if (!salt || !hashGuardado) return false;

    const hashNovo = await gerarHashSenha(pin, salt);
    return hashNovo === hashGuardado;
}

/**
 * Verifica se já existe uma senha (PIN) guardada.
 * @returns {boolean}
 */
export function verificarSeSenhaExiste() {
    return !!localStorage.getItem(PIN_HASH_KEY);
}

// --- Gestão de Bloqueio por Tentativas Falhadas ---

export function registrarTentativaFalhada() {
    let tentativas = parseInt(localStorage.getItem(FAILED_ATTEMPTS_KEY) || '0') + 1;
    if (tentativas >= MAX_FAILED_ATTEMPTS) {
        localStorage.setItem(LOCKOUT_TIMESTAMP_KEY, Date.now().toString());
        tentativas = 0; // Reseta as tentativas após o bloqueio
    }
    localStorage.setItem(FAILED_ATTEMPTS_KEY, tentativas.toString());
}

export function limparTentativasFalhadas() {
    localStorage.removeItem(FAILED_ATTEMPTS_KEY);
    localStorage.removeItem(LOCKOUT_TIMESTAMP_KEY);
}

export function verificarBloqueio() {
    const timestampBloqueio = parseInt(localStorage.getItem(LOCKOUT_TIMESTAMP_KEY) || '0');
    if (!timestampBloqueio) return false;

    const tempoDecorrido = Date.now() - timestampBloqueio;
    if (tempoDecorrido > LOCKOUT_DURATION_MS) {
        limparTentativasFalhadas(); // O tempo de bloqueio expirou
        return false;
    }
    return true; // Ainda está bloqueado
}

export function obterTempoBloqueioRestante() {
    const timestampBloqueio = parseInt(localStorage.getItem(LOCKOUT_TIMESTAMP_KEY) || '0');
    if (!timestampBloqueio) return 0;
    
    const tempoDecorrido = Date.now() - timestampBloqueio;
    const tempoRestante = LOCKOUT_DURATION_MS - tempoDecorrido;
    
    return Math.ceil(tempoRestante / 1000); // Retorna em segundos
}

