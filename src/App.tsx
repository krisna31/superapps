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
import { TasksPage } from './pages/TasksPage';
import { SnippetsPage } from './pages/SnippetsPage';
import { UserGuidePage } from './pages/UserGuidePage';
import { ThemeProvider } from './context/ThemeContext';
import { CommandPaletteProvider } from './context/CommandPaletteContext';
import { CommandPaletteModal } from './components/palette/CommandPaletteModal';

export const App: React.FC = () => {
  return (
    <HashRouter>
      <ThemeProvider>
        <AuthProvider>
          <DbProvider>
            <CommandPaletteProvider>
            <Routes>
            {/* Public Landing Page */}
            <Route path="/" element={<LandingPage />} />

            {/* Public User Guide (Accessible without unlocking vault) */}
            <Route path="/guide" element={<UserGuidePage standalone />} />

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
              <Route path="tasks" element={<TasksPage />} />
              <Route path="snippets" element={<SnippetsPage />} />
              <Route path="backup" element={<BackupCenterPage />} />
              <Route path="guide" element={<UserGuidePage />} />
            </Route>

            {/* 404 Catch-All */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <CommandPaletteModal />
        </CommandPaletteProvider>
      </DbProvider>
    </AuthProvider>
  </ThemeProvider>
</HashRouter>
  );
};

export default App;
