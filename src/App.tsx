import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { AppShell } from './components/layout/AppShell';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { TasksPage } from './pages/TasksPage';
import { NotesPage } from './pages/NotesPage';
import { HabitsPage } from './pages/HabitsPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { SnippetsPage } from './pages/SnippetsPage';
import { SwissKnifePage } from './pages/SwissKnifePage';
import { DropZonePage } from './pages/DropZonePage';
import { ShortlinksPage } from './pages/ShortlinksPage';
import { RedirectHandlerPage } from './pages/RedirectHandlerPage';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Standalone Shortlink Redirect Handler */}
            <Route path="/r/:slug" element={<RedirectHandlerPage />} />

            {/* Main Application Shell with Navigation */}
            <Route path="/" element={<AppShell />}>
              <Route index element={<DashboardPage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="notes" element={<NotesPage />} />
              <Route path="habits" element={<HabitsPage />} />
              <Route path="expenses" element={<ExpensesPage />} />
              <Route path="snippets" element={<SnippetsPage />} />
              <Route path="swissknife" element={<SwissKnifePage />} />
              <Route path="dropzone" element={<DropZonePage />} />
              <Route path="shortlinks" element={<ShortlinksPage />} />
              {/* Catch-all redirect to Dashboard */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
