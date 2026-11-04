/**
 * Client-Side Web Cryptography Service (Milestone 4)
 * Uses native Web Crypto API (PBKDF2-SHA256 + AES-GCM 256-bit) for authenticated
 * encryption of workspace backups and sensitive data without external dependencies.
 */

export interface EncryptedBackupEnvelope {
  encrypted: true;
  version: number;
  algorithm: 'AES-GCM-256';
  kdf: 'PBKDF2-SHA256';
  iterations: number;
  salt: string;       // Base64-encoded 16-byte random salt
  iv: string;         // Base64-encoded 12-byte random initialization vector
  ciphertext: string; // Base64-encoded AES-GCM ciphertext + 128-bit auth tag
  createdAt: string;
}

const PBKDF2_ITERATIONS = 100_000;
const SALT_BYTE_LENGTH = 16;
const IV_BYTE_LENGTH = 12;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Derives a non-extractable 256-bit AES-GCM CryptoKey from a user passphrase and salt.
 */
async function deriveAesGcmKey(
  passphrase: string,
  salt: Uint8Array,
  iterations = PBKDF2_ITERATIONS
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Type guard checking whether a parsed JSON object is an EncryptedBackupEnvelope.
 */
export function isEncryptedEnvelope(data: unknown): data is EncryptedBackupEnvelope {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return (
    obj.encrypted === true &&
    obj.algorithm === 'AES-GCM-256' &&
    obj.kdf === 'PBKDF2-SHA256' &&
    typeof obj.salt === 'string' &&
    typeof obj.iv === 'string' &&
    typeof obj.ciphertext === 'string'
  );
}

/**
 * Encrypts a UTF-8 plaintext string into an Authenticated Encryption (AES-GCM-256) envelope.
 */
export async function encryptPayload(
  plaintext: string,
  passphrase: string
): Promise<EncryptedBackupEnvelope> {
  if (!passphrase || passphrase.trim().length === 0) {
    throw new Error('Encryption passphrase cannot be empty.');
  }

  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTE_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTE_LENGTH));
  const key = await deriveAesGcmKey(passphrase, salt, PBKDF2_ITERATIONS);

  const encodedPlaintext = new TextEncoder().encode(plaintext);
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
    },
    key,
    encodedPlaintext
  );

  return {
    encrypted: true,
    version: 1,
    algorithm: 'AES-GCM-256',
    kdf: 'PBKDF2-SHA256',
    iterations: PBKDF2_ITERATIONS,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(encryptedBuffer)),
    createdAt: new Date().toISOString(),
  };
}

/**
 * Decrypts and authenticates an EncryptedBackupEnvelope using the provided passphrase.
 * Throws an error if the passphrase is wrong or the ciphertext/auth-tag was tampered with.
 */
export async function decryptPayload(
  envelope: EncryptedBackupEnvelope,
  passphrase: string
): Promise<string> {
  if (!isEncryptedEnvelope(envelope)) {
    throw new Error('Invalid encrypted backup envelope format.');
  }
  if (!passphrase || passphrase.trim().length === 0) {
    throw new Error('A passphrase is required to decrypt this backup.');
  }

  const salt = base64ToBytes(envelope.salt);
  const iv = base64ToBytes(envelope.iv);
  const ciphertext = base64ToBytes(envelope.ciphertext);
  const iterations =
    typeof envelope.iterations === 'number' && envelope.iterations >= 10_000
      ? envelope.iterations
      : PBKDF2_ITERATIONS;

  const key = await deriveAesGcmKey(passphrase, salt, iterations);

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as unknown as BufferSource,
      },
      key,
      ciphertext as unknown as BufferSource
    );
    return new TextDecoder().decode(decryptedBuffer);
  } catch {
    throw new Error('Decryption failed: Invalid passphrase or corrupted backup file.');
  }
}

export const cryptoService = {
  encryptPayload,
  decryptPayload,
  isEncryptedEnvelope,
};
