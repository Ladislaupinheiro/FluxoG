// /modules/security.js - Módulo para gerir a segurança e licenciamento da aplicação.
// Versão 2.1 - Conforme especificações aprovadas.

// Chaves para o localStorage
const LICENSE_KEY = 'app_validation_token';
const PIN_HASH_KEY = 'app_pin_hash';
const FAILED_ATTEMPTS_KEY = 'app_failed_attempts';
const LOCKOUT_TIMESTAMP_KEY = 'app_lockout_timestamp';

// Configurações de segurança
const MAX_ATTEMPTS = 5; // Tentativas antes do bloqueio
const LOCKOUT_DURATION = 30 * 1000; // 30 segundos de bloqueio

// ===================================
// GESTÃO DE LICENCIAMENTO
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
 * Combina uma chave de licença e um ID de dispositivo para criar um hash de validação.
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
 * Valida o formato da chave de licença.
 * @param {string} chave - A chave de licença.
 * @returns {boolean} - Verdadeiro se o formato for válido.
 */
export function validarFormatoChave(chave) {
    const regex = /^GESTORBAR-(\w{4})-(\w{4})-(\w{4})$/;
    return regex.test(chave.trim().toUpperCase());
}

/**
 * Ativa a aplicação guardando o hash de validação no localStorage.
 * @param {string} chave - A chave de licença válida.
 */
export async function ativarLicenca(chave) {
    const deviceId = await gerarDeviceId();
    const hashValidacao = await gerarHashValidacao(chave, deviceId);
    localStorage.setItem(LICENSE_KEY, hashValidacao);
}

/**
 * Verifica se a licença está ativa.
 * @returns {Promise<boolean>} - Verdadeiro se a licença existir.
 */
export async function verificarLicencaAtiva() {
    return localStorage.getItem(LICENSE_KEY) !== null;
}

/**
 * Desativa a licença, removendo-a do armazenamento. Usado no fluxo "Esqueci-me da senha".
 */
export function desativarLicenca() {
    localStorage.removeItem(LICENSE_KEY);
}


// ===================================
// GESTÃO DE SENHA (PIN)
// ===================================

/**
 * Gera um hash SHA-256 seguro a partir de um PIN.
 * @param {string} pin - O PIN de 4 dígitos.
 * @returns {Promise<string>} O hash em formato hexadecimal.
 */
export async function gerarHashSenha(pin) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pin));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Guarda o hash de uma nova senha no localStorage.
 * @param {string} pin - O PIN a ser guardado.
 */
export async function guardarHashSenha(pin) {
    const hash = await gerarHashSenha(pin);
    localStorage.setItem(PIN_HASH_KEY, hash);
}

/**
 * Verifica se o PIN inserido corresponde ao hash guardado.
 * @param {string} pin - O PIN inserido pelo utilizador.
 * @returns {Promise<boolean>} - Verdadeiro se o PIN estiver correto.
 */
export async function verificarSenha(pin) {
    const hashGuardado = localStorage.getItem(PIN_HASH_KEY);
    if (!hashGuardado) return false;
    const hashInserido = await gerarHashSenha(pin);
    return hashInserido === hashGuardado;
}

/**
 * Verifica se já existe uma senha definida.
 * @returns {boolean}
 */
export function verificarSeSenhaExiste() {
    return localStorage.getItem(PIN_HASH_KEY) !== null;
}

/**
 * Remove a senha do armazenamento. Usado no fluxo "Esqueci-me da senha".
 */
export function invalidarSenha() {
    localStorage.removeItem(PIN_HASH_KEY);
}


// ===================================
// GESTÃO DE TENTATIVAS (RATE LIMITING)
// ===================================

/**
 * Verifica se a conta está bloqueada por excesso de tentativas.
 * @returns {{bloqueado: boolean, tempoRestante: number}} - Retorna o estado de bloqueio e o tempo restante em segundos.
 */
export function verificarBloqueio() {
    const lockoutTimestamp = parseInt(localStorage.getItem(LOCKOUT_TIMESTAMP_KEY) || '0');
    const agora = Date.now();
    
    if (lockoutTimestamp > agora) {
        const tempoRestante = Math.ceil((lockoutTimestamp - agora) / 1000);
        return { bloqueado: true, tempoRestante };
    }
    return { bloqueado: false, tempoRestante: 0 };
}

/**
 * Regista uma tentativa de login falhada e bloqueia se necessário.
 */
export function registrarTentativaFalhada() {
    let tentativas = parseInt(localStorage.getItem(FAILED_ATTEMPTS_KEY) || '0') + 1;
    
    if (tentativas >= MAX_ATTEMPTS) {
        const tempoBloqueio = Date.now() + LOCKOUT_DURATION;
        localStorage.setItem(LOCKOUT_TIMESTAMP_KEY, tempoBloqueio.toString());
        localStorage.setItem(FAILED_ATTEMPTS_KEY, '0'); // Reseta as tentativas após bloquear
    } else {
        localStorage.setItem(FAILED_ATTEMPTS_KEY, tentativas.toString());
    }
}

/**
 * Limpa os contadores de tentativas falhadas, tipicamente após um login bem-sucedido.
 */
export function limparTentativas() {
    localStorage.removeItem(FAILED_ATTEMPTS_KEY);
    localStorage.removeItem(LOCKOUT_TIMESTAMP_KEY);
}
