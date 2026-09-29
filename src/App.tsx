import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DbProvider } from './context/DbContext';

// Layout & Pages
import { AppShell } from './components/layout/AppShell';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ShortlinksPage } from './pages/ShortlinksPage';
import { RedirectHandlerPage } from './pages/RedirectHandlerPage';
import { DropZonePage } from './pages/DropZonePage';
import { NotesPage } from './pages/NotesPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { SwissKnifePage } from './pages/SwissKnifePage';
import { HabitsPage } from './pages/HabitsPage';
import { BackupCenterPage } from './pages/BackupCenterPage';

export const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <DbProvider>
          <Routes>
            {/* Public Landing Page */}
            <Route path="/" element={<LandingPage />} />

            {/* Public Stateless Redirect Handler (Zero server, zero DB) */}
            <Route path="/r" element={<RedirectHandlerPage />} />

            {/* Authenticated Superapps Suite */}
            <Route path="/app" element={<AppShell />}>
              <Route index element={<DashboardPage />} />
              <Route path="shortlinks" element={<ShortlinksPage />} />
              <Route path="dropzone" element={<DropZonePage />} />
              <Route path="notes" element={<NotesPage />} />
              <Route path="expenses" element={<ExpensesPage />} />
              <Route path="tools" element={<SwissKnifePage />} />
              <Route path="habits" element={<HabitsPage />} />
              <Route path="backup" element={<BackupCenterPage />} />
            </Route>

            {/* 404 Catch-All */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DbProvider>
      </AuthProvider>
    </HashRouter>
  );
};

export default App;
