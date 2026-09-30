# Superapps Developer Guide

This guide provides technical specifications, architectural decisions, and development conventions for developers and AI coding agents working on **Superapps**.

---

## 1. Architectural Principles

### 1.1 100% Free-Tier & Zero Server Footprint
- **Static Hosting**: Served via GitHub Pages over HTTPS with zero infrastructure management costs.
- **Backend as a Service (BaaS)**: Powered by Google Firebase Spark (free tier):
  - **Firebase Authentication**: Up to 50,000 monthly active users for free.
  - **Cloud Firestore**: 1 GiB stored data, 50,000 reads/day, 20,000 writes/day.
  - **Firebase Storage**: 5 GB storage, 1 GB/day bandwidth download.
- **No Cloud Functions / Server Required**: All business logic runs directly on the client side using secure Firestore and Storage security rules.

### 1.2 GitHub Pages SPA Routing Mechanism
Because GitHub Pages is a static file host, visiting a path like `https://apps.k31.my.id/tasks` or refreshing a route directly would return a HTTP 404 error if not handled.
We use the canonical SPA redirect pattern:
1. When GitHub Pages encounters a route not found as a static file, it serves `public/404.html`.
2. `public/404.html` takes the path and query string, encodes it into a query parameter `?/...`, and redirects to `index.html`.
3. In `index.html`, a lightweight script decodes the query and restores the browser history using `window.history.replaceState(...)`.
4. `react-router-dom` (`BrowserRouter`) receives the restored URL seamlessly without ugly hash fragments (`/#/`).

### 1.3 Local-First & Dual Persistence Pattern
All data access is encapsulated through `src/services/dataService.ts`.
- **When online & Firebase configured**: Operations interact with Cloud Firestore with `persistentLocalCache` enabled. Mutations update the local cache immediately and sync to the cloud in the background.
- **When offline, guest mode, or keys not configured**: Data is persisted in browser `localStorage` keyed by user ID (`superapps_${collection}_${userId}`).
- **Zero Configuration Friction**: A developer or guest can clone and run `npm run dev` immediately without needing to configure Firebase keys first.

---

## 2. Codebase Organization & Topology

```text
src/
├── components/
│   ├── auth/
│   │   └── AuthModal.tsx             # Sign in with Google, Email/Password, Guest mode
│   ├── layout/
│   │   ├── AppShell.tsx              # Master layout container (Sidebar + Navbar + Outlet)
│   │   ├── Navbar.tsx                # Top navigation, Command Palette trigger, theme switcher
│   │   └── Sidebar.tsx               # Collapsible navigation drawer with PWA install button
│   └── palette/
│       └── CommandPaletteModal.tsx   # Global Ctrl+K / Cmd+K fuzzy action search
├── context/
│   ├── AuthContext.tsx               # Firebase Auth state & guest session provider
│   └── ThemeContext.tsx              # Light / Dark / System theme provider
├── firebase/
│   └── config.ts                     # Firebase app, auth, db, and storage initialization
├── pages/
│   ├── DashboardPage.tsx             # Overview stats & quick action widgets
│   ├── TasksPage.tsx                 # Kanban Task Matrix with priority tags
│   ├── NotesPage.tsx                 # Markdown notes vault with live preview
│   ├── HabitsPage.tsx                # Daily habits & consecutive streak tracker
│   ├── ExpensesPage.tsx              # Personal financial cashflow ledger
│   ├── SnippetsPage.tsx              # Multi-language code snippet repository
│   ├── SwissKnifePage.tsx            # Offline dev utilities (JSON, Base64, UUID, Hash, Regex, Passwords)
│   ├── DropZonePage.tsx              # File uploader backed by Firebase Storage
│   ├── ShortlinksPage.tsx            # Short URL generator & click analytics
│   └── RedirectHandlerPage.tsx       # Route handler for /r/:slug browser redirection
├── services/
│   └── dataService.ts                # Unified data access layer for all entities
├── test/
│   ├── setup.ts                      # Vitest environment setup and mocks
│   ├── App.test.tsx                  # UI component integration test
│   └── dataService.test.ts           # Service CRUD & click tracking unit tests
├── types/
│   └── index.ts                      # TypeScript interface definitions
├── App.tsx                           # Route declarations
└── main.tsx                          # Application entry point & PWA registration
```

---

## 3. Design System & Styling Conventions

### 3.1 Design Language
- **Aesthetic**: Minimalist dark-first UI inspired by **Linear**, **Raycast**, and **Notion**.
- **Color Palette**:
  - Dark background: `#090d16` (deep obsidian)
  - Card background: `#0f172a` (slate-900)
  - Card borders: `#1e293b` (slate-800)
  - Brand accents: Emerald (`#22c55e`), Sky (`#0ea5e9`), Indigo (`#6366f1`)
- **Typography**:
  - Sans-serif: `Inter, system-ui, sans-serif`
  - Monospace: `JetBrains Mono, Fira Code, monospace` (used for code blocks, hashes, UUIDs, passwords, and slugs).

### 3.2 Adding a New Command to the Command Palette
To register a new quick action or navigation shortcut, edit `src/components/palette/CommandPaletteModal.tsx` and add an entry to the `commands` array:
```typescript
{
  id: 'unique-command-id',
  title: 'Action Display Name',
  category: 'Navigation' | 'Actions' | 'Tools',
  icon: LucideIconComponent,
  action: () => {
    // Perform action or navigate
  },
  keywords: ['keyword1', 'search_term']
}
```

---

## 4. State & Data Layer Guidelines

### 4.1 TypeScript Types
All data structures must be defined in `src/types/index.ts`. Every persistent entity must include:
- `id: string`
- `userId: string`
- `createdAt: number` (Unix timestamp)

### 4.2 dataService Methods
When adding new data operations:
1. Define the method in `src/services/dataService.ts`.
2. Check `if (isFirebaseConfigured && db && !userId.startsWith('guest-'))` to perform Firestore operations.
3. Fall back to `localStorage` operations for offline or guest mode.
4. Add unit test coverage in `src/test/dataService.test.ts`.

---

## 5. Testing & Quality Assurance

### 5.1 Test Execution
- **Run Unit Tests**: `npm run test`
- **TypeScript Check & Build**: `npm run build`

### 5.2 Test Conventions
- Tests are colocated in `src/test/`.
- Mock external browser APIs (such as `matchMedia` or `window.crypto.randomUUID`) in `src/test/setup.ts`.
- Ensure clean tear-down using `beforeEach(() => localStorage.clear())`.

---

## 6. Milestone-Driven Roadmap

### Milestone 1: Core Foundation (COMPLETED)
- [x] React 19 + Vite + TypeScript + Tailwind CSS setup.
- [x] PWA offline caching with `vite-plugin-pwa`.
- [x] Custom domain `apps.k31.my.id` with `public/CNAME` and SPA 404 redirect.
- [x] Firebase Spark Auth, Firestore multi-tab cache, and Storage integration.
- [x] 8 Core Modules: Tasks, Notes, Habits, Expenses, Snippets, SwissKnife, Dropzone, Shortlinks.
- [x] Vitest test suites (100% pass) and production build validation.

### Milestone 2: Cloud Sync & Account Linking
- [ ] Add Firestore `onSnapshot` real-time listeners for instant synchronization across multiple open browser tabs.
- [ ] Implement `linkWithCredential` allowing anonymous guest users to link their Google account without losing local data.
- [ ] Display real-time Cloud Sync indicator badge in the top navbar.

### Milestone 3: Rich Interaction Upgrades
- [ ] HTML5 Drag-and-Drop for Kanban tasks between status columns.
- [ ] Rich Markdown formatting toolbar (bold, italic, checklist, heading insertion) in Notes Vault.
- [ ] Yearly contribution heatmap calendar for Daily Habits.
- [ ] Monthly interactive bar/pie chart for Expenses breakdown.

### Milestone 4: Data Portability & Backup Center
- [ ] Full JSON backup export: downloads all tasks, notes, habits, expenses, and snippets into an encrypted or plain JSON file.
- [ ] JSON backup import & restore tool.
- [ ] Client-side AES-GCM encryption for private notes vault.

### Milestone 5: Native PWA Superpowers
- [ ] Web Share Target API: allow other apps or mobile browsers to share links and text directly into Superapps.
- [ ] File System Access API: sync markdown notes directly to a local directory on desktop.
- [ ] Push Notifications for due tasks and habit reminders.
