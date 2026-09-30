import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthLockPage } from '../pages/AuthLockPage';
import { AuthProvider } from '../context/AuthContext';

describe('AuthLockPage Component', () => {
  it('renders vault setup view when vault is uninitialized', () => {
    localStorage.clear();

    render(
      <AuthProvider>
        <AuthLockPage />
      </AuthProvider>
    );

    expect(screen.getByText(/Setup Zero-Knowledge Vault/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter a strong master password.../i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Repeat your master password.../i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Initialize Secure Vault/i })).toBeInTheDocument();
  });

  it('shows error when passwords do not match', async () => {
    localStorage.clear();

    render(
      <AuthProvider>
        <AuthLockPage />
      </AuthProvider>
    );

    const passInput = screen.getByPlaceholderText(/Enter a strong master password.../i);
    const confirmInput = screen.getByPlaceholderText(/Repeat your master password.../i);
    const submitBtn = screen.getByRole('button', { name: /Initialize Secure Vault/i });

    fireEvent.change(passInput, { target: { value: 'password123' } });
    fireEvent.change(confirmInput, { target: { value: 'different123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('shows error when password is too short', async () => {
    localStorage.clear();

    render(
      <AuthProvider>
        <AuthLockPage />
      </AuthProvider>
    );

    const passInput = screen.getByPlaceholderText(/Enter a strong master password.../i);
    const confirmInput = screen.getByPlaceholderText(/Repeat your master password.../i);
    const submitBtn = screen.getByRole('button', { name: /Initialize Secure Vault/i });

    fireEvent.change(passInput, { target: { value: '123' } });
    fireEvent.change(confirmInput, { target: { value: '123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Password must be at least 6 characters long/i)).toBeInTheDocument();
    });
  });
});
