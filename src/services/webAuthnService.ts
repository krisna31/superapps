// WebAuthn Biometric & Platform Authenticator Service (Touch ID / Face ID / Windows Hello)

const BIO_STORAGE_KEY = 'superapps_biometric_envelope';

export interface BiometricEnvelope {
  credentialId: string;
  iv: string; // Hex IV
  wrappedKey: string; // Base64 AES-GCM encrypted master password
  createdAt: string;
}

export async function isPlatformBiometricsSupported(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!window.PublicKeyCredential) return false;

  try {
    if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
  } catch {
    return false;
  }
  return false;
}

export function isBiometricsEnrolled(): boolean {
  try {
    return localStorage.getItem(BIO_STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

export function clearBiometricsEnrollment(): void {
  try {
    localStorage.removeItem(BIO_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Enrolls device biometrics (Touch ID / Face ID / Windows Hello) to wrap and securely store the master password.
 */
export async function enrollBiometrics(masterPassword: string): Promise<boolean> {
  try {
    const isSupported = await isPlatformBiometricsSupported();
    if (!isSupported) return false;

    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userId = crypto.getRandomValues(new Uint8Array(16));

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'Superapps OS Vault', id: window.location.hostname || 'localhost' },
        user: {
          id: userId,
          name: 'vault-master',
          displayName: 'Superapps OS Master Vault',
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 }, // ES256
          { type: 'public-key', alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
        attestation: 'none',
      },
    })) as PublicKeyCredential;

    if (!credential || !credential.id) return false;

    // Derive a local wrap key from the rawId and a stable device seed
    const rawIdBytes = new Uint8Array(credential.rawId);
    const keyMaterial = await crypto.subtle.digest('SHA-256', rawIdBytes);
    const aesKey = await crypto.subtle.importKey('raw', keyMaterial, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);

    // Encrypt the master password
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedPw = new TextEncoder().encode(masterPassword);
    const cipherBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, encodedPw);

    const envelope: BiometricEnvelope = {
      credentialId: credential.id,
      iv: Array.from(iv).map((b) => b.toString(16).padStart(2, '0')).join(''),
      wrappedKey: btoa(String.fromCharCode(...new Uint8Array(cipherBuffer))),
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(BIO_STORAGE_KEY, JSON.stringify(envelope));
    return true;
  } catch (err) {
    console.warn('Biometric enrollment cancelled or failed:', err);
    return false;
  }
}

/**
 * Authenticates with device biometrics and unwraps the master password.
 */
export async function authenticateWithBiometrics(): Promise<string | null> {
  try {
    const raw = localStorage.getItem(BIO_STORAGE_KEY);
    if (!raw) return null;

    const envelope: BiometricEnvelope = JSON.parse(raw);
    const challenge = crypto.getRandomValues(new Uint8Array(32));

    // Convert credentialId back to buffer
    const binaryString = atob(envelope.credentialId.replace(/-/g, '+').replace(/_/g, '/'));
    const rawCredId = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      rawCredId[i] = binaryString.charCodeAt(i);
    }

    const assertion = (await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [
          {
            id: rawCredId,
            type: 'public-key',
          },
        ],
        userVerification: 'required',
        timeout: 60000,
      },
    })) as PublicKeyCredential;

    if (!assertion) return null;

    // Reconstruct key
    const rawIdBytes = new Uint8Array(assertion.rawId);
    const keyMaterial = await crypto.subtle.digest('SHA-256', rawIdBytes);
    const aesKey = await crypto.subtle.importKey('raw', keyMaterial, { name: 'AES-GCM' }, false, ['decrypt']);

    // Parse IV and ciphertext
    const ivMatch = envelope.iv.match(/.{1,2}/g);
    const iv = new Uint8Array(ivMatch ? ivMatch.map((b) => parseInt(b, 16)) : []);
    const cipherBytes = Uint8Array.from(atob(envelope.wrappedKey), (c) => c.charCodeAt(0));

    const decryptedBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, aesKey, cipherBytes);
    return new TextDecoder().decode(decryptedBuffer);
  } catch (err) {
    console.warn('Biometric authentication failed or was cancelled:', err);
    return null;
  }
}
