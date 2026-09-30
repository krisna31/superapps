import { describe, it, expect, beforeEach } from 'vitest';
import {
  isPlatformBiometricsSupported,
  isBiometricsEnrolled,
  clearBiometricsEnrollment,
} from '../services/webAuthnService';

describe('webAuthnService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('detects platform biometrics support safely without throwing', async () => {
    const supported = await isPlatformBiometricsSupported();
    expect(typeof supported).toBe('boolean');
  });

  it('manages biometric enrollment status in storage', () => {
    expect(isBiometricsEnrolled()).toBe(false);

    localStorage.setItem(
      'superapps_biometric_envelope',
      JSON.stringify({
        credentialId: 'test-cred-id',
        iv: '0102030405060708090a0b0c',
        wrappedKey: 'dummy-wrapped-key',
        createdAt: new Date().toISOString(),
      })
    );

    expect(isBiometricsEnrolled()).toBe(true);

    clearBiometricsEnrollment();
    expect(isBiometricsEnrolled()).toBe(false);
  });
});
