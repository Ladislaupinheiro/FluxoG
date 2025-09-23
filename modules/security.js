// /modules/security.js - Módulo para gerir a segurança e licenciamento da aplicação.

const LICENCE_STORAGE_KEY = 'app_licence_data';
const PIN_STORAGE_KEY = 'app_pin_hash';
const FAILED_ATTEMPTS_KEY = 'app_failed_pin_attempts';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 60 * 1000; // 60 segundos

// ===================================
// GESTÃO DA LICENÇA
// ===================================

/**
 * Gera uma "impressão digital" única para o dispositivo/browser atual.
 * @returns {Promise<string>} Uma string hash representando o ID do dispositivo.
 */
async function _gerarDeviceId() {
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
async function _gerarHashValidacao(chave, deviceId) {
    const dadosCombinados = `${chave.trim().toUpperCase()}-${deviceId}`;
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(dadosCombinados));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Valida o formato da chave de licença.
 * @param {string} chave - A chave de licença.
 * @returns {boolean} - Verdadeiro se o formato da chave for válido.
 */
export function validarFormatoChave(chave) {
    const regex = /^GESTORBAR-(\w{4})-(\w{4})-(\w{4})$/;
    return regex.test(chave.trim().toUpperCase());
}

/**
 * Ativa a aplicação, guardando os dados da licença de forma segura.
 * @param {string} chave - A chave de licença válida.
 */
export async function ativarLicenca(chave) {
    const deviceId = await _gerarDeviceId();
    const hashValidacao = await _gerarHashValidacao(chave, deviceId);
    const dadosLicenca = {
        chaveOfuscada: btoa(chave.trim().toUpperCase()), // Guarda a chave em base64
        hashValidacao: hashValidacao
    };
    localStorage.setItem(LICENCE_STORAGE_KEY, JSON.stringify(dadosLicenca));
}

/**
 * Desativa a licença, removendo os seus dados. Usado no fluxo "Esqueci-me da Senha".
 */
export function desativarLicenca() {
    localStorage.removeItem(LICENCE_STORAGE_KEY);
}

/**
 * Verifica se a licença está ativa E é válida para este dispositivo específico.
 * Esta função corre sempre que a aplicação inicia.
 * @returns {Promise<boolean>} - Verdadeiro se a licença for válida para este dispositivo.
 */
export async function verificarLicencaAtiva() {
    const dadosGuardados = localStorage.getItem(LICENCE_STORAGE_KEY);
    if (!dadosGuardados) return false;

    try {
        const dadosLicenca = JSON.parse(dadosGuardados);
        if (!dadosLicenca.chaveOfuscada || !dadosLicenca.hashValidacao) return false;

        const chaveOriginal = atob(dadosLicenca.chaveOfuscada);
        const deviceIdAtual = await _gerarDeviceId();
        const hashAtual = await _gerarHashValidacao(chaveOriginal, deviceIdAtual);
        
        // A validação crítica: o hash guardado tem de corresponder ao hash gerado agora.
        return hashAtual === dadosLicenca.hashValidacao;

    } catch (error) {
        console.error("Erro ao validar licença:", error);
        return false;
    }
}


// ===================================
// GESTÃO DA SENHA (PIN)
// ===================================

/**
 * Gera um hash SHA-256 a partir de um PIN.
 * @param {string} pin - O PIN de 4 dígitos.
 * @returns {Promise<string>} O hash hexadecimal do PIN.
 */
async function _gerarHashSenha(pin) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pin));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Guarda o hash de um novo PIN no localStorage.
 * @param {string} pin - O PIN de 4 dígitos.
 */
export async function guardarHashSenha(pin) {
    const hash = await _gerarHashSenha(pin);
    localStorage.setItem(PIN_STORAGE_KEY, hash);
}

/**
 * Verifica se um PIN inserido corresponde ao PIN guardado.
 * @param {string} pin - O PIN inserido pelo utilizador.
 * @returns {Promise<boolean>} - Verdadeiro se os PINs corresponderem.
 */
export async function verificarSenha(pin) {
    const hashGuardado = localStorage.getItem(PIN_STORAGE_KEY);
    if (!hashGuardado) return false;
    const hashInserido = await _gerarHashSenha(pin);
    return hashInserido === hashGuardado;
}

/**
 * Verifica se já existe uma senha (PIN) guardada.
 * @returns {boolean}
 */
export function verificarSeSenhaExiste() {
    return localStorage.getItem(PIN_STORAGE_KEY) !== null;
}

/**
 * Remove a senha guardada. Usado no fluxo "Esqueci-me da Senha".
 */
export function invalidarSenha() {
    localStorage.removeItem(PIN_STORAGE_KEY);
}

// ===================================
// GESTÃO DE TENTATIVAS DE LOGIN
// ===================================

/**
 * Regista uma tentativa de login falhada.
 */
export function registrarTentativaFalhada() {
    let tentativas = [];
    try {
        tentativas = JSON.parse(localStorage.getItem(FAILED_ATTEMPTS_KEY)) || [];
    } catch {
        tentativas = [];
    }
    tentativas.push(Date.now());
    localStorage.setItem(FAILED_ATTEMPTS_KEY, JSON.stringify(tentativas));
}

/**
 * Verifica se o acesso está bloqueado e por quanto tempo.
 * @returns {{bloqueado: boolean, tempoRestante: number}}
 */
export function verificarBloqueio() {
    let tentativas = [];
    try {
        tentativas = JSON.parse(localStorage.getItem(FAILED_ATTEMPTS_KEY)) || [];
    } catch {
        tentativas = [];
    }
    
    // Filtra tentativas que já expiraram
    const agora = Date.now();
    const tentativasRecentes = tentativas.filter(t => (agora - t) < LOCKOUT_DURATION);
    localStorage.setItem(FAILED_ATTEMPTS_KEY, JSON.stringify(tentativasRecentes));

    if (tentativasRecentes.length >= MAX_ATTEMPTS) {
        const tempoDesdeUltimaTentativa = agora - tentativasRecentes[tentativasRecentes.length - 1];
        const tempoRestante = (LOCKOUT_DURATION - tempoDesdeUltimaTentativa) / 1000;
        return { bloqueado: true, tempoRestante: tempoRestante > 0 ? tempoRestante : 0 };
    }

    return { bloqueado: false, tempoRestante: 0 };
}

/**
 * Limpa o registo de tentativas falhadas após um login bem-sucedido.
 */
export function limparTentativas() {
    localStorage.removeItem(FAILED_ATTEMPTS_KEY);
}

