import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface CommandPaletteContextType {
  isOpen: boolean;
  openPalette: () => void;
  closePalette: () => void;
  togglePalette: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextType | null>(null);

export const CommandPaletteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { lockVault, isUnlocked } = useAuth();

  const openPalette = useCallback(() => setIsOpen(true), []);
  const closePalette = useCallback(() => setIsOpen(false), []);
  const togglePalette = useCallback(() => setIsOpen((prev) => !prev), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      // 1. Toggle Command Palette: Cmd/Ctrl + K
      if (isCmdOrCtrl && key === 'k') {
        e.preventDefault();
        togglePalette();
        return;
      }

      // Check if user is typing in an input/textarea/editable
      const target = e.target as HTMLElement;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if (isInput && !isOpen) return;

      // 2. Close on Escape
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        closePalette();
        return;
      }

      // If vault is not unlocked, ignore app shortcuts
      if (!isUnlocked) return;

      // 3. Quick Lock Vault: Cmd/Ctrl + Shift + L
      if (isCmdOrCtrl && e.shiftKey && key === 'l') {
        e.preventDefault();
        closePalette();
        lockVault();
        return;
      }

      // 4. Quick New Note: Cmd/Ctrl + Shift + N
      if (isCmdOrCtrl && e.shiftKey && key === 'n') {
        e.preventDefault();
        closePalette();
        navigate('/app/notes?action=new');
        return;
      }

      // 5. Quick New Shortlink: Cmd/Ctrl + Shift + S
      if (isCmdOrCtrl && e.shiftKey && key === 's') {
        e.preventDefault();
        closePalette();
        navigate('/app/shortlinks?action=new');
        return;
      }

      // 6. Quick New Task: Cmd/Ctrl + Shift + T
      if (isCmdOrCtrl && e.shiftKey && key === 't') {
        e.preventDefault();
        closePalette();
        navigate('/app/tasks?action=new');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isUnlocked, togglePalette, closePalette, lockVault, navigate]);

  return (
    <CommandPaletteContext.Provider
      value={{
        isOpen,
        openPalette,
        closePalette,
        togglePalette,
      }}
    >
      {children}
    </CommandPaletteContext.Provider>
  );
};

export const useCommandPalette = (): CommandPaletteContextType => {
  const context = useContext(CommandPaletteContext);
  if (!context) {
    throw new Error('useCommandPalette must be used within a CommandPaletteProvider');
  }
  return context;
};
