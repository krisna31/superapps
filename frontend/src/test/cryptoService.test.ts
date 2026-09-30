import { describe, it, expect } from 'vitest';
import {
  bufferToBase64,
  base64ToBuffer,
  deriveKeyFromPassword,
  encryptBytes,
  decryptBytes,
  encryptText,
  decryptText,
  initializeVaultCredentials,
  verifyPasswordAndDeriveKey,
  exportEncryptedPayload,
  importEncryptedPayload,
} from '../services/cryptoService';

describe('Zero-Knowledge Cryptography Service', () => {
  it('should accurately convert between Buffer and Base64', () => {
    const original = new Uint8Array([1, 2, 3, 4, 5, 250, 255]);
    const b64 = bufferToBase64(original);
    const decoded = base64ToBuffer(b64);
    expect(decoded).toEqual(original);
  });

  it('should encrypt and decrypt plaintext using AES-256-GCM', async () => {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const key = await deriveKeyFromPassword('my-secret-vault-pass', salt);

    const secretMessage = 'Superapps 100% Client-Side Private Vault!';
    const { cipherBase64, ivBase64 } = await encryptText(secretMessage, key);

    expect(cipherBase64).not.toBe(secretMessage);

    const decrypted = await decryptText(cipherBase64, ivBase64, key);
    expect(decrypted).toBe(secretMessage);
  });

  it('should initialize vault credentials and verify correct password', async () => {
    const password = 'SuperSecurePassword123!';
    const creds = await initializeVaultCredentials(password);

    expect(creds.saltBase64).toBeDefined();
    expect(creds.verifierCipherBase64).toBeDefined();
    expect(creds.verifierIvBase64).toBeDefined();

    // Verify with valid password
    const result = await verifyPasswordAndDeriveKey(
      password,
      creds.saltBase64,
      creds.verifierCipherBase64,
      creds.verifierIvBase64
    );

    expect(result.isValid).toBe(true);
    expect(result.key).toBeDefined();
  });

  it('should reject verification when given incorrect password', async () => {
    const creds = await initializeVaultCredentials('CorrectPassword!');

    const result = await verifyPasswordAndDeriveKey(
      'WrongPassword!',
      creds.saltBase64,
      creds.verifierCipherBase64,
      creds.verifierIvBase64
    );

    expect(result.isValid).toBe(false);
    expect(result.key).toBeUndefined();
  });

  it('should export encrypted backup payload and restore with password', async () => {
    const mockDbBytes = new TextEncoder().encode('SQLite format 3\0\mock_database_content');
    const backupPassword = 'BackupMasterPassword99';

    // 1. Export with password
    const vaultJson = await exportEncryptedPayload(mockDbBytes, backupPassword);
    const parsed = JSON.parse(vaultJson);

    expect(parsed.app).toBe('Superapps OS');
    expect(parsed.version).toBe(1);
    expect(parsed.salt).toBeDefined();
    expect(parsed.payload).toBeDefined();

    // 2. Import with correct password
    const restoredBytes = await importEncryptedPayload(vaultJson, backupPassword);
    expect(Array.from(restoredBytes)).toEqual(Array.from(mockDbBytes));

    // 3. Import with incorrect password must fail
    await expect(importEncryptedPayload(vaultJson, 'WrongPassword')).rejects.toThrow();
  });

  it('should reject malformed backup container format', async () => {
    const invalidJson = JSON.stringify({ invalid: true });
    await expect(importEncryptedPayload(invalidJson, 'pass')).rejects.toThrow(
      'Invalid Superapps backup file format.'
    );
  });
});
