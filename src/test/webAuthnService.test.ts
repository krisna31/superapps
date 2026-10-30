import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isPlatformBiometricsSupported,
  isBiometricsEnrolled,
  clearBiometricsEnrollment,
  enrollBiometrics,
  authenticateWithBiometrics,
} from '@/services/webAuthnService';

describe('webAuthnService Biometric Platform Authenticator Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('reports false when PublicKeyCredential is not available in browser environment', async () => {
    (window as any).PublicKeyCredential = undefined;
    const supported = await isPlatformBiometricsSupported();
    expect(supported).toBe(false);
  });

  it('reports false for enrollment when storage is empty', () => {
    expect(isBiometricsEnrolled()).toBe(false);
  });

  it('correctly clears enrolled biometric envelope from storage', () => {
    localStorage.setItem(
      'superapps_biometric_envelope',
      JSON.stringify({
        credentialId: 'test-cred-id',
        iv: '0102030405060708090a0b0c',
        wrappedKey: 'base64ciphertext',
        createdAt: new Date().toISOString(),
      })
    );
    expect(isBiometricsEnrolled()).toBe(true);

    clearBiometricsEnrollment();
    expect(isBiometricsEnrolled()).toBe(false);
  });

  it('enrolls biometrics and unwraps master password using mock WebAuthn platform APIs', async () => {
    // Mock PublicKeyCredential
    (window as any).PublicKeyCredential = {
      isUserVerifyingPlatformAuthenticatorAvailable: vi.fn().mockResolvedValue(true),
    };

    const mockRawId = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
    const mockCredId = 'mock-cred-123';

    // Mock navigator.credentials.create and get
    Object.defineProperty(navigator, 'credentials', {
      writable: true,
      value: {
        create: vi.fn().mockResolvedValue({
          id: mockCredId,
          rawId: mockRawId.buffer,
          type: 'public-key',
        }),
        get: vi.fn().mockResolvedValue({
          id: mockCredId,
          rawId: mockRawId.buffer,
          type: 'public-key',
        }),
      },
    });

    const masterPassword = 'superapps-secret-vault-password';
    const enrolled = await enrollBiometrics(masterPassword);
    expect(enrolled).toBe(true);
    expect(isBiometricsEnrolled()).toBe(true);

    const unwrappedPassword = await authenticateWithBiometrics();
    expect(unwrappedPassword).toBe(masterPassword);
  });
});
