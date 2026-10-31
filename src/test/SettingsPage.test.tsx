import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { SettingsPage } from '@/pages/SettingsPage';
import { dataService } from '@/services/dataService';

const renderSettingsPage = () => {
  return render(
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <SettingsPage />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

describe('SettingsPage Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders access denied message for non-superadmin user', async () => {
    localStorage.setItem(
      'superapps_local_user',
      JSON.stringify({
        uid: 'user-regular',
        email: 'regular@k31.my.id',
        displayName: 'Regular User',
        role: 'user',
        isAnonymous: false,
      })
    );

    await act(async () => {
      renderSettingsPage();
    });

    expect(screen.getByText('Administrator Access Required')).toBeInTheDocument();
    expect(screen.getByText(/restricted exclusively to the workspace Superadmin/i)).toBeInTheDocument();
  });

  it('renders admin toggles and system info for superadmin user', async () => {
    localStorage.setItem(
      'superapps_local_user',
      JSON.stringify({
        uid: 'local-superadmin',
        email: 'jelvinkrisnaputra31@gmail.com',
        displayName: 'Superadmin',
        role: 'superadmin',
        isAnonymous: false,
      })
    );

    await act(async () => {
      renderSettingsPage();
    });

    expect(screen.getByText('System Administration & Security')).toBeInTheDocument();
    expect(screen.getByText('Guest Mode Access')).toBeInTheDocument();
    expect(screen.getByText('User Registration')).toBeInTheDocument();
    expect(screen.getByText('Primary Superadmin Designation')).toBeInTheDocument();
    expect(screen.getByText('apps.k31.my.id')).toBeInTheDocument();
  });

  it('allows superadmin to toggle guest access and registration', async () => {
    localStorage.setItem(
      'superapps_local_user',
      JSON.stringify({
        uid: 'local-superadmin',
        email: 'jelvinkrisnaputra31@gmail.com',
        displayName: 'Superadmin',
        role: 'superadmin',
        isAnonymous: false,
      })
    );

    await act(async () => {
      renderSettingsPage();
    });

    const switches = screen.getAllByRole('switch');
    expect(switches.length).toBe(2);

    // Initial default state: both are off (false) as per strict access policy
    expect(switches[0]).toHaveAttribute('aria-checked', 'false');
    expect(switches[1]).toHaveAttribute('aria-checked', 'false');

    // Toggle guest access switch to enabled
    await act(async () => {
      fireEvent.click(switches[0]);
    });

    const updatedSettings = await dataService.getSystemSettings();
    expect(updatedSettings.allowGuestAccess).toBe(true);
  });

  it('displays superadmin email as read-only and shows server-side rules enforcement notice', async () => {
    localStorage.setItem(
      'superapps_local_user',
      JSON.stringify({
        uid: 'local-superadmin',
        email: 'jelvinkrisnaputra31@gmail.com',
        displayName: 'Superadmin',
        role: 'superadmin',
        isAnonymous: false,
      })
    );

    await act(async () => {
      renderSettingsPage();
    });

    const emailInput = screen.getByDisplayValue('jelvinkrisnaputra31@gmail.com') as HTMLInputElement;
    expect(emailInput).toHaveAttribute('readonly');
    expect(emailInput.value).toBe('jelvinkrisnaputra31@gmail.com');
    expect(screen.getByText('Enforced in Security Rules')).toBeInTheDocument();
    expect(screen.getByText(/cryptographically verified in/i)).toBeInTheDocument();
  });
});
