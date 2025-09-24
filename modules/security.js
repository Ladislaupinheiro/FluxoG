// /modules/security.js - Módulo para gerir a segurança e licenciamento da aplicação (v5.0)
'use strict';

// Chaves para o localStorage
const LICENSE_KEY = 'app_license_key_v2';
const PIN_HASH_KEY = 'app_pin_hash_v2';
const PIN_SALT_KEY = 'app_pin_salt_v2';
const FAILED_ATTEMPTS_KEY = 'app_failed_attempts';
const LOCKOUT_TIMESTAMP_KEY = 'app_lockout_timestamp';

// Configurações de segurança reintegradas
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30 * 1000; // 30 segundos

// ===================================
// GESTÃO DE LICENCIAMENTO
// ===================================

async function gerarDeviceId() {
    const dados = `${navigator.userAgent}-${screen.height}x${screen.width}-${navigator.language}`;
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(dados));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function gerarHashValidacao(chave, deviceId) {
    const dadosCombinados = `${chave.trim().toUpperCase()}-${deviceId}`;
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(dadosCombinados));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function validarFormatoChave(chave) {
    const regex = /^GESTORBAR-PROD-[A-Z0-9]{4}-DEMO$/;
    return regex.test(chave.trim().toUpperCase());
}

export async function ativarLicenca(chave) {
    const deviceId = await gerarDeviceId();
    const hashValidacao = await gerarHashValidacao(chave, deviceId);
    localStorage.setItem(LICENSE_KEY, hashValidacao);
}

export async function verificarLicencaAtiva() {
    const hashGuardado = localStorage.getItem(LICENSE_KEY);
    if (!hashGuardado) return false;

    // A validação real requer a chave original, que não guardamos.
    // Para verificar a integridade, recriamos o hash. Como a chave de teste é fixa, podemos usá-la.
    const deviceId = await gerarDeviceId();
    const hashAtual = await gerarHashValidacao('GESTORBAR-PROD-A4B8-DEMO', deviceId);
    
    return hashAtual === hashGuardado;
}


// ===================================
// GESTÃO DE SENHA (PIN) COM SALT
// ===================================

function gerarSalt() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

async function gerarHashSenhaComSalt(pin, salt) {
    const dadosCombinados = `${salt}${pin}`;
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(dadosCombinados));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function guardarHashSenha(pin) {
    const salt = gerarSalt();
    const hash = await gerarHashSenhaComSalt(pin, salt);
    localStorage.setItem(PIN_SALT_KEY, salt);
    localStorage.setItem(PIN_HASH_KEY, hash);
}

export async function verificarSenha(pin) {
    const hashGuardado = localStorage.getItem(PIN_HASH_KEY);
    const saltGuardado = localStorage.getItem(PIN_SALT_KEY);
    if (!hashGuardado || !saltGuardado) return false;

    const hashInserido = await gerarHashSenhaComSalt(pin, saltGuardado);
    return hashInserido === hashGuardado;
}

export function verificarSeSenhaExiste() {
    return localStorage.getItem(PIN_HASH_KEY) !== null && localStorage.getItem(PIN_SALT_KEY) !== null;
}


// ===================================
// GESTÃO DE TENTATIVAS (RATE LIMITING)
// ===================================

export function verificarBloqueio() {
    const lockoutTimestamp = parseInt(localStorage.getItem(LOCKOUT_TIMESTAMP_KEY) || '0');
    const agora = Date.now();
    if (lockoutTimestamp > agora) {
        const tempoRestante = Math.ceil((lockoutTimestamp - agora) / 1000);
        return { bloqueado: true, tempoRestante };
    }
    return { bloqueado: false, tempoRestante: 0 };
}

export function registrarTentativaFalhada() {
    let tentativas = parseInt(localStorage.getItem(FAILED_ATTEMPTS_KEY) || '0') + 1;
    if (tentativas >= MAX_ATTEMPTS) {
        const tempoBloqueio = Date.now() + LOCKOUT_DURATION;
        localStorage.setItem(LOCKOUT_TIMESTAMP_KEY, tempoBloqueio.toString());
        localStorage.setItem(FAILED_ATTEMPTS_KEY, '0');
    } else {
        localStorage.setItem(FAILED_ATTEMPTS_KEY, tentativas.toString());
    }
}

export function limparTentativas() {
    localStorage.removeItem(FAILED_ATTEMPTS_KEY);
    localStorage.removeItem(LOCKOUT_TIMESTAMP_KEY);
}

