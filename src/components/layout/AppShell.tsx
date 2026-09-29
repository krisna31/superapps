import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { AuthLockPage } from '../../pages/AuthLockPage';
import { Menu, X } from 'lucide-react';

export const AppShell: React.FC = () => {
  const { isConfigured, isUnlocked } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // If vault is not set up or locked, display Auth lock screen
  if (!isConfigured || !isUnlocked) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <AuthLockPage />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      {/* Mobile sidebar toggle button */}
      <div className="md:hidden flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="flex items-center gap-2 text-xs font-medium text-slate-300 bg-slate-800 px-3 py-1.5 rounded-lg"
        >
          {mobileSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          <span>{mobileSidebarOpen ? 'Close Menu' : 'Apps Navigation'}</span>
        </button>
      </div>

      <div className="flex-1 flex">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Mobile Sidebar overlay */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden bg-black/60 backdrop-blur-sm flex">
            <div className="w-72 bg-slate-900 h-full shadow-2xl">
              <Sidebar onCloseMobile={() => setMobileSidebarOpen(false)} />
            </div>
            <div className="flex-1" onClick={() => setMobileSidebarOpen(false)} />
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
