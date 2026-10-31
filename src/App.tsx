import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { AppShell } from './components/layout/AppShell';

// Dynamic route-based code-splitting
const DashboardPage = React.lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const TasksPage = React.lazy(() => import('./pages/TasksPage').then((m) => ({ default: m.TasksPage })));
const NotesPage = React.lazy(() => import('./pages/NotesPage').then((m) => ({ default: m.NotesPage })));
const HabitsPage = React.lazy(() => import('./pages/HabitsPage').then((m) => ({ default: m.HabitsPage })));
const ExpensesPage = React.lazy(() => import('./pages/ExpensesPage').then((m) => ({ default: m.ExpensesPage })));
const SnippetsPage = React.lazy(() => import('./pages/SnippetsPage').then((m) => ({ default: m.SnippetsPage })));
const SwissKnifePage = React.lazy(() => import('./pages/SwissKnifePage').then((m) => ({ default: m.SwissKnifePage })));
const DropZonePage = React.lazy(() => import('./pages/DropZonePage').then((m) => ({ default: m.DropZonePage })));
const ShortlinksPage = React.lazy(() => import('./pages/ShortlinksPage').then((m) => ({ default: m.ShortlinksPage })));
const MediaDownloaderPage = React.lazy(() => import('./pages/MediaDownloaderPage').then((m) => ({ default: m.MediaDownloaderPage })));
const RedirectHandlerPage = React.lazy(() => import('./pages/RedirectHandlerPage').then((m) => ({ default: m.RedirectHandlerPage })));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));

const PageFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-[40vh] text-slate-400 font-mono text-xs">
    <div className="flex items-center space-x-2">
      <div className="w-3.5 h-3.5 border-2 border-slate-300 dark:border-slate-700 border-t-slate-800 dark:border-t-white rounded-full animate-spin" />
      <span>Loading module...</span>
    </div>
  </div>
);

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Suspense fallback={<PageFallback />}>
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
                <Route path="downloader" element={<MediaDownloaderPage />} />
                <Route path="settings" element={<SettingsPage />} />
                {/* Catch-all redirect to Dashboard */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
