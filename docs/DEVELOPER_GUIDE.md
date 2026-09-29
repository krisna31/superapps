# Superapps OS — Developer Guide

This guide provides everything you need to develop, test, extend, and deploy **Superapps OS**.

---

## 🛠️ 1. Prerequisites & Environment Setup

### Requirements
- **Node.js**: `v18.0.0` or higher (Node 20+ recommended)
- **npm**: `v9.0.0` or higher
- **Modern Web Browser**: Chrome, Brave, Edge, Firefox, or Safari with Web Crypto API and WebAssembly support.

### Local Development Setup

```bash
# 1. Clone repository
git clone https://github.com/krisna31/superapps.git
cd superapps

# 2. Install dependencies
npm install

# 3. Start local development server (Vite)
npm run dev
```

The Vite dev server will launch at: `http://localhost:5173/`

---

## 📁 2. Directory Layout & Architecture Map

```text
superapps/
├── docs/                      # Developer & architectural documentation
│   ├── README.md              # Documentation index
│   ├── DEVELOPER_GUIDE.md     # This file
│   ├── ARCHITECTURE.md        # Technical architecture & data flows
│   ├── CRYPTOGRAPHY.md        # Cryptographic specifications & threat model
│   └── DATABASE_SCHEMA.md     # SQLite schemas & queries
├── e2e/                       # Playwright browser end-to-end test suite
│   ├── superapps.spec.ts      # Core user journey tests
│   └── playwright.config.ts   # E2E configuration & browsers
├── public/                    # Static assets served as-is
│   ├── sql-wasm.wasm          # SQLite WebAssembly binary
│   └── sql-wasm.js            # SQLite WASM loader glue
├── src/                       # Application TypeScript source
│   ├── components/            # Reusable UI & layout components
│   │   ├── auth/              # Lock screen & vault setup modal
│   │   ├── brand/             # SuperappsLogo SVG vector component
│   │   ├── layout/            # AppShell, Navbar, Sidebar
│   │   └── palette/           # CommandPaletteModal & omni-search
│   ├── context/               # React Context Providers
│   │   ├── AuthContext.tsx    # Vault state, key derivation, auto-lock
│   │   ├── DbContext.tsx      # SQLite WASM instance & query runner
│   │   └── CommandPaletteContext.tsx # Global Cmd+K palette & hotkeys
│   ├── hooks/                 # Custom React hooks (useActionQuery)
│   ├── pages/                 # Full-page route views
│   │   ├── LandingPage.tsx    # Public marketing & feature overview
│   │   ├── DashboardPage.tsx  # Metrics & quick launchpad
│   │   ├── ShortlinksPage.tsx # Shortlink hub & stateless link generator
│   │   ├── RedirectHandlerPage.tsx # Public stateless client redirector
│   │   ├── DropZonePage.tsx   # P2P WebRTC & ephemeral transfers
│   │   ├── NotesPage.tsx      # Markdown editor & notes vault
│   │   ├── ExpensesPage.tsx   # Budget & expense tracking
│   │   ├── SwissKnifePage.tsx # 6 Developer utilities
│   │   ├── HabitsPage.tsx     # Focus Pomodoro & habit streaks
│   │   ├── BackupCenterPage.tsx # .vault export/import & SQL console
│   │   └── UserGuidePage.tsx  # Interactive in-app documentation
│   ├── services/              # Pure business logic & browser APIs
│   │   ├── cryptoService.ts   # PBKDF2 & AES-256-GCM Web Crypto API
│   │   ├── sqliteService.ts   # sql.js engine & IndexedDB VFS persistence
│   │   ├── statelessLinkService.ts # LZ-String URL fragment compression
│   │   ├── ephemeralUploadService.ts # Litterbox API integration
│   │   └── peerService.ts     # PeerJS WebRTC P2P DataChannel wrapper
│   ├── test/                  # Vitest unit & integration test suites
│   ├── types/                 # Shared TypeScript interfaces & types
│   ├── App.tsx                # HashRouter route configuration
│   ├── main.tsx               # React DOM entrypoint
│   └── index.css              # Tailwind CSS styles & glassmorphism utilities
├── package.json               # Scripts & dependencies
├── tailwind.config.js         # Tailwind configuration
├── tsconfig.json              # TypeScript compilation config
├── vite.config.ts             # Vite build configuration (base: './')
└── vitest.config.ts           # Vitest unit test runner config
```

---

## 🧩 3. Core Architectural Concepts

### A. 100% Client-Side Execution
There is **no backend server**. The application is compiled into static HTML, JS, CSS, and WASM files deployed directly to GitHub Pages. All computations, cryptographic key generation, database queries, and storage persistence occur exclusively inside the client's web browser.

### B. SQLite WASM + IndexedDB Persistence
Instead of raw `localStorage` key-value pairs (limited to ~5MB and lacking relational queries), Superapps OS boots a full SQLite C-library compiled to WebAssembly via `sql.js`.
- The database is manipulated in-memory for instant read/write latency.
- Any mutations automatically trigger a debounced flush to browser **IndexedDB** (`superapps_sqlite_v1`), ensuring data survives browser restarts and offline usage.

### C. Zero-Knowledge Cryptographic Vault
Data security is enforced using standard **Web Crypto API**:
1. When creating a vault, the user sets a master password.
2. A random 16-byte salt is generated.
3. The password is fed through **PBKDF2** (HMAC-SHA256, 100,000 rounds) to derive an AES-256 key.
4. An authentication verification token is encrypted with **AES-256-GCM** to validate unlock attempts.
5. In-memory keys are zeroized upon manual lock or after auto-lock inactivity timeout.

### D. Global Command Palette & Keyboard Shortcut Engine
A Raycast/Spotlight-style omni-search modal mounted at the root (`App.tsx`):
- Accessible anywhere via `Ctrl+K` / `Cmd+K` or the Navbar search bar.
- Runs live SQLite queries across `shortlinks`, `notes`, `expenses`, and `habits`.
- Dispatches deep-link actions (`?action=new`) consumed via the `useActionQuery` hook without router coupling.
- Global hotkeys: `Ctrl+Shift+L` (Lock), `Ctrl+Shift+N` (New Note), `Ctrl+Shift+S` (New Shortlink).

---

## 🚀 4. Tutorial: How to Add a New Mini-App

Follow this step-by-step recipe to add a brand new mini-app (e.g., a "Bookmarks Bookmarklet" or "Password Generator") to Superapps OS:

### Step 1: Define the Database Table in `src/services/sqliteService.ts`
Open [src/services/sqliteService.ts](file:///c:/Users/krisn/GitHub/superapps/src/services/sqliteService.ts) and add your table to `INIT_SCHEMA`:

```sql
CREATE TABLE IF NOT EXISTS bookmarks (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  folder TEXT DEFAULT 'General',
  createdAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_bookmarks_folder ON bookmarks(folder);
```

### Step 2: Create the Page Component in `src/pages/`
Create `src/pages/BookmarksPage.tsx`:

```tsx
import React, { useState, useEffect } from 'react';
import { useDb } from '../context/DbContext';
import { Bookmark, Plus, Trash2 } from 'lucide-react';

export const BookmarksPage: React.FC = () => {
  const { runQuery, execute, refreshSignal } = useDb();
  const [bookmarks, setBookmarks] = useState<any[]>([]);

  useEffect(() => {
    const res = runQuery('SELECT id, url, title, folder FROM bookmarks ORDER BY createdAt DESC;');
    setBookmarks(res.values.map(v => ({ id: v[0], url: v[1], title: v[2], folder: v[3] })));
  }, [runQuery, refreshSignal]);

  const addBookmark = (url: string, title: string) => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    execute('INSERT INTO bookmarks (id, url, title, folder, createdAt) VALUES (?, ?, ?, ?, ?);', [
      id, url, title, 'General', now
    ]);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Bookmarks Manager</h1>
      {/* Render bookmark UI */}
    </div>
  );
};
```

### Step 3: Register the Route in `src/App.tsx`
Import your page and add the nested route inside `<Route path="/app" element={<AppShell />}>`:

```tsx
import { BookmarksPage } from './pages/BookmarksPage';

// Inside App.tsx:
<Route path="/app" element={<AppShell />}>
  ...
  <Route path="bookmarks" element={<BookmarksPage />} />
</Route>
```

### Step 4: Add Navigation Link in `src/components/layout/Sidebar.tsx`
Add an entry to the `navItems` array:

```tsx
{ to: '/app/bookmarks', label: 'Bookmarks', icon: Bookmark },
```

### Step 5: Write Tests
Create `src/test/BookmarksPage.test.tsx` using Vitest and React Testing Library:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import { BookmarksPage } from '../pages/BookmarksPage';

describe('BookmarksPage', () => {
  it('renders bookmarks title', () => {
    render(<HashRouter><BookmarksPage /></HashRouter>);
    expect(screen.getByText(/Bookmarks Manager/i)).toBeInTheDocument();
  });
});
```

---

## 🧪 5. Testing & Quality Assurance

### A. Unit & Feature Testing (Vitest)
Unit and component tests use **Vitest** configured with `@testing-library/react` and `jsdom`.

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npx vitest

# Run a specific test file
npx vitest run src/test/UserGuidePage.test.tsx
```

> **Note on Test Isolation**: Playwright E2E files (`e2e/**/*.spec.ts`) are excluded from Vitest in `vitest.config.ts` to prevent collisions.

### B. End-to-End Testing (Playwright)
E2E tests run in headless Chromium/Firefox/WebKit against the local production or dev build:

```bash
# Run Playwright E2E suite
npm run test:e2e

# Run Playwright in UI mode for interactive debugging
npx playwright test --ui
```

---

## 📦 6. Building & Deployment to GitHub Pages

### A. Production Build
```bash
npm run build
```
Vite generates optimized static assets into the `dist/` directory:
- Assets are referenced via relative paths (`base: './'`).
- The SQLite WASM binary (`sql-wasm.wasm`) is packaged with proper MIME type.

### B. HashRouter Rationale for GitHub Pages
GitHub Pages serves files statically and returns `404 Not Found` if a user directly navigates to a deep route like `https://krisna31.github.io/superapps/app/notes` when using standard HTML5 pushState routing (`BrowserRouter`).

To ensure 100% reliable deep linking, bookmarking, and link sharing on static hosting without server redirection rules, **HashRouter** (`/#/...`) is used.
- `/#/app/notes` resolves to the root `index.html` static file.
- The client-side router parses the hash fragment and renders the target page.

---

## ⚠️ 7. Common Gotchas & Troubleshooting

1. **WASM MIME Type Error in Dev:**
   Ensure `sql-wasm.wasm` and `sql-wasm.js` exist in `public/`. Vite automatically serves static files from `public/` at the root URL.
2. **IndexedDB Quota Exceeded:**
   Modern desktop browsers allocate upwards of 10GB+ to IndexedDB. If storing very large files in *Local Stash*, encourage users to use *WebRTC P2P direct streaming* instead of storing multi-gigabyte blobs in browser memory.
3. **WebRTC Direct P2P NAT Traversal:**
   WebRTC direct streaming uses standard Google STUN servers (`stun:stun.l.google.com:19302`) for peer discovery. On symmetric corporate NATs where direct connections fail, the app gracefully falls back to *Ephemeral Auto-Expiring Uploads* via Litterbox.
