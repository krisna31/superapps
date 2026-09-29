import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { VaultMeta } from '../types';
import {
  initializeVaultCredentials,
  verifyPasswordAndDeriveKey,
  isPlatformBiometricsAvailable,
} from '../services/cryptoService';
import {
  enrollBiometrics,
  authenticateWithBiometrics,
  isBiometricsEnrolled as checkBiometricsEnrolled,
  clearBiometricsEnrollment,
} from '../services/webAuthnService';

interface AuthContextType {
  isConfigured: boolean;
  isUnlocked: boolean;
  vaultMeta: VaultMeta | null;
  activeKey: CryptoKey | null;
  setupVault: (password: string, autoLockMinutes?: number) => Promise<boolean>;
  unlockVault: (password: string) => Promise<boolean>;
  unlockWithBiometrics: () => Promise<boolean>;
  enableBiometrics: (password: string) => Promise<boolean>;
  disableBiometrics: () => void;
  isBiometricEnrolled: boolean;
  lockVault: () => void;
  resetVault: () => void;
  updateAutoLock: (minutes: number) => void;
  biometricsAvailable: boolean;
}

const VAULT_STORAGE_KEY = 'superapps_vault_meta_v1';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vaultMeta, setVaultMeta] = useState<VaultMeta | null>(null);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [activeKey, setActiveKey] = useState<CryptoKey | null>(null);
  const [biometricsAvailable, setBiometricsAvailable] = useState<boolean>(false);
  const [isBiometricEnrolled, setIsBiometricEnrolled] = useState<boolean>(() => checkBiometricsEnrolled());

  // Load vault configuration on start
  useEffect(() => {
    const raw = localStorage.getItem(VAULT_STORAGE_KEY);
    if (raw) {
      try {
        const meta = JSON.parse(raw) as VaultMeta;
        setVaultMeta(meta);
      } catch (err) {
        console.error('Failed to parse vault meta', err);
      }
    }

    isPlatformBiometricsAvailable().then(setBiometricsAvailable);
    setIsBiometricEnrolled(checkBiometricsEnrolled());
  }, []);

  const lockVault = useCallback(() => {
    setActiveKey(null);
    setIsUnlocked(false);
  }, []);

  // Auto-lock inactivity listener
  useEffect(() => {
    if (!isUnlocked || !vaultMeta || vaultMeta.autoLockMinutes <= 0) return;

    let timeoutId: any;
    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        lockVault();
      }, vaultMeta.autoLockMinutes * 60 * 1000);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((ev) => window.addEventListener(ev, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, [isUnlocked, vaultMeta, lockVault]);

  const setupVault = async (password: string, autoLockMinutes = 15): Promise<boolean> => {
    try {
      const { saltBase64, verifierCipherBase64, verifierIvBase64, key } =
        await initializeVaultCredentials(password);

      const newMeta: VaultMeta = {
        isInitialized: true,
        salt: saltBase64,
        verifierCipher: verifierCipherBase64,
        verifierIv: verifierIvBase64,
        autoLockMinutes,
        lastUnlockedAt: Date.now(),
      };

      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(newMeta));
      setVaultMeta(newMeta);
      setActiveKey(key);
      setIsUnlocked(true);
      return true;
    } catch (err) {
      console.error('Vault setup failed', err);
      return false;
    }
  };

  const unlockVault = async (password: string): Promise<boolean> => {
    if (!vaultMeta) return false;

    const { isValid, key } = await verifyPasswordAndDeriveKey(
      password,
      vaultMeta.salt,
      vaultMeta.verifierCipher,
      vaultMeta.verifierIv
    );

    if (isValid && key) {
      setActiveKey(key);
      setIsUnlocked(true);
      const updatedMeta = { ...vaultMeta, lastUnlockedAt: Date.now() };
      setVaultMeta(updatedMeta);
      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(updatedMeta));
      return true;
    }
    return false;
  };

  const unlockWithBiometrics = async (): Promise<boolean> => {
    try {
      const password = await authenticateWithBiometrics();
      if (!password) return false;
      return await unlockVault(password);
    } catch (err) {
      console.error('Biometric unlock failed', err);
      return false;
    }
  };

  const enableBiometrics = async (password: string): Promise<boolean> => {
    try {
      const ok = await enrollBiometrics(password);
      if (ok) {
        setIsBiometricEnrolled(true);
      }
      return ok;
    } catch (err) {
      console.error('Failed to enable biometrics', err);
      return false;
    }
  };

  const disableBiometrics = () => {
    clearBiometricsEnrollment();
    setIsBiometricEnrolled(false);
  };

  const resetVault = () => {
    clearBiometricsEnrollment();
    setIsBiometricEnrolled(false);
    localStorage.removeItem(VAULT_STORAGE_KEY);
    setVaultMeta(null);
    setActiveKey(null);
    setIsUnlocked(false);
  };

  const updateAutoLock = (minutes: number) => {
    if (!vaultMeta) return;
    const updated = { ...vaultMeta, autoLockMinutes: minutes };
    setVaultMeta(updated);
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        isConfigured: !!vaultMeta?.isInitialized,
        isUnlocked,
        vaultMeta,
        activeKey,
        setupVault,
        unlockVault,
        unlockWithBiometrics,
        enableBiometrics,
        disableBiometrics,
        isBiometricEnrolled,
        lockVault,
        resetVault,
        updateAutoLock,
        biometricsAvailable,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
