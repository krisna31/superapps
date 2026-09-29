/**
 * Web Crypto API Zero-Knowledge Vault Cryptography
 * Uses PBKDF2 (100k iterations, SHA-256) + AES-256-GCM.
 */

const VERIFIER_PLAINTEXT = 'SUPERAPPS_VAULT_AUTHENTICATED_V1';
const PBKDF2_ITERATIONS = 100000;

export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function base64ToBuffer(base64: string): Uint8Array {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptBytes(data: Uint8Array, key: CryptoKey): Promise<{ cipher: Uint8Array; iv: Uint8Array }> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
    },
    key,
    data as unknown as BufferSource
  );
  return {
    cipher: new Uint8Array(encrypted),
    iv: iv,
  };
}

export async function decryptBytes(cipher: Uint8Array, iv: Uint8Array, key: CryptoKey): Promise<Uint8Array> {
  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
    },
    key,
    cipher as unknown as BufferSource
  );
  return new Uint8Array(decrypted);
}

export async function encryptText(text: string, key: CryptoKey): Promise<{ cipherBase64: string; ivBase64: string }> {
  const enc = new TextEncoder();
  const { cipher, iv } = await encryptBytes(enc.encode(text), key);
  return {
    cipherBase64: bufferToBase64(cipher),
    ivBase64: bufferToBase64(iv),
  };
}

export async function decryptText(cipherBase64: string, ivBase64: string, key: CryptoKey): Promise<string> {
  const cipher = base64ToBuffer(cipherBase64);
  const iv = base64ToBuffer(ivBase64);
  const decrypted = await decryptBytes(cipher, iv, key);
  const dec = new TextDecoder();
  return dec.decode(decrypted);
}

export async function initializeVaultCredentials(password: string): Promise<{
  saltBase64: string;
  verifierCipherBase64: string;
  verifierIvBase64: string;
  key: CryptoKey;
}> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKeyFromPassword(password, salt);
  const { cipherBase64, ivBase64 } = await encryptText(VERIFIER_PLAINTEXT, key);

  return {
    saltBase64: bufferToBase64(salt),
    verifierCipherBase64: cipherBase64,
    verifierIvBase64: ivBase64,
    key,
  };
}

export async function verifyPasswordAndDeriveKey(
  password: string,
  saltBase64: string,
  verifierCipherBase64: string,
  verifierIvBase64: string
): Promise<{ isValid: boolean; key?: CryptoKey }> {
  try {
    const salt = base64ToBuffer(saltBase64);
    const key = await deriveKeyFromPassword(password, salt);
    const decrypted = await decryptText(verifierCipherBase64, verifierIvBase64, key);
    if (decrypted === VERIFIER_PLAINTEXT) {
      return { isValid: true, key };
    }
    return { isValid: false };
  } catch (err) {
    return { isValid: false };
  }
}

/**
 * Encrypt arbitrary payload with a user password for export (.vault)
 */
export async function exportEncryptedPayload(data: Uint8Array, exportPassword: string): Promise<string> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKeyFromPassword(exportPassword, salt);
  const { cipher, iv } = await encryptBytes(data, key);

  const container = {
    app: 'Superapps OS',
    version: 1,
    exportedAt: new Date().toISOString(),
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
    payload: bufferToBase64(cipher),
  };

  return JSON.stringify(container, null, 2);
}

/**
 * Decrypt a .vault payload with user password
 */
export async function importEncryptedPayload(containerJson: string, importPassword: string): Promise<Uint8Array> {
  const container = JSON.parse(containerJson);
  if (!container.salt || !container.iv || !container.payload) {
    throw new Error('Invalid Superapps backup file format.');
  }

  const salt = base64ToBuffer(container.salt);
  const iv = base64ToBuffer(container.iv);
  const cipher = base64ToBuffer(container.payload);

  const key = await deriveKeyFromPassword(importPassword, salt);
  return await decryptBytes(cipher, iv, key);
}

/**
 * Check if platform authenticator (TouchID, Windows Hello, FaceID) is available
 */
export async function isPlatformBiometricsAvailable(): Promise<boolean> {
  if (
    typeof window !== 'undefined' &&
    window.PublicKeyCredential &&
    PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable
  ) {
    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
      return false;
    }
  }
  return false;
}
