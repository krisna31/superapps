# Superapps Workspace

[![Deploy Superapps](https://img.shields.io/badge/Deploy-GitHub%20Pages-blue?logo=github)](https://apps.k31.my.id)
[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-61dafb?logo=react)](https://react.dev/)
[![Styling](https://img.shields.io/badge/Styling-Tailwind%20CSS-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Backend](https://img.shields.io/badge/Backend-Firebase%20Spark%20(100%25%20Free)-ffca28?logo=firebase)](https://firebase.google.com/)
[![PWA](https://img.shields.io/badge/PWA-Installable%20%26%20Offline-emerald?logo=pwa)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

**Superapps** is an all-in-one, 100% free-tier modern productivity and developer workspace built as an installable Progressive Web App (PWA). It combines 8 essential tools into a single, cohesive desktop and mobile workspace hosted on **GitHub Pages** with custom domain support (`apps.k31.my.id`) and backed by **Firebase Spark** (Firestore, Firebase Auth, and Firebase Storage).

---

## 🚀 Highlights & Features

- **100% Free Tier Forever**: Zero server hosting costs. Static files served via GitHub Pages with free SSL; data and auth managed via Firebase Spark (no credit card required).
- **Custom Domain Ready**: Preconfigured with `apps.k31.my.id` via `public/CNAME` and SPA 404 client-side redirect routing.
- **Progressive Web App (PWA)**: Installable natively on macOS, Windows, Linux, Android, and iOS with full offline caching via Service Worker.
- **Raycast / Linear UI Aesthetic**: High-contrast modern dark mode with system theme auto-detection, keyboard shortcuts, and `Ctrl + K` / `Cmd + K` Command Palette.
- **Direct Cloud & Local-First Sync**: Powered by Cloud Firestore with persistent IndexedDB multi-tab cache and graceful offline/guest fallback.

---

## 🛠️ Integrated Modules (8-in-1 Workspace)

| # | Module | Description |
|---|---|---|
| 1 | **Overview Dashboard** | Hub with pending task counters, habit streak tracker, net balance summary, and quick password tool. |
| 2 | **Tasks & Kanban Matrix** | Multi-column Kanban board (To Do, In Progress, Review, Done) with priority badges (Urgent, High, Medium, Low), search, and due dates. |
| 3 | **Notes Vault** | Markdown note-taking vault with live preview split, tag management, pinned notes, and instant search. |
| 4 | **Daily Habit Tracker** | Habit consistency tracker with streak calculations, 7-day rolling completion grid, and daily goal progress bar. |
| 5 | **Expenses & Personal Budget** | Cashflow ledger tracking income vs expense, category breakdown, and net financial balance. |
| 6 | **Code Snippets Vault** | Multi-language code snippet manager with syntax display, 1-click clipboard copy, and language filtering. |
| 7 | **SwissKnife Developer Tools** | Offline developer utilities: Password Generator, JSON Formatter & Minifier, Base64 Converter, UUID v4 Batch Generator, Web Crypto SHA-256/SHA-1 Hash Digest, and Regex Tester. |
| 8 | **Dropzone File Sharing** | Drag-and-drop file uploader interfacing with Firebase Storage (5 GB free tier) with instant download link generator. |
| 9 | **URL Shortlinks & Redirection** | Custom short link generator (`/r/:slug`) with click tracking analytics and instant client-side redirection. |

---

## 📂 Project Topology

```text
superapps/
├── public/                  # Static assets & GitHub Pages configs
│   ├── CNAME                # Custom domain configuration (apps.k31.my.id)
│   ├── 404.html             # SPA redirection script for clean BrowserRouter URLs
│   ├── logo.svg             # Vector brand logo
│   ├── pwa-192x192.svg      # PWA icon asset
│   └── pwa-512x512.svg      # PWA high-res icon asset
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── auth/            # AuthModal (Google, Email, Guest)
│   │   ├── layout/          # AppShell, Navbar, Sidebar
│   │   └── palette/         # CommandPaletteModal (Ctrl+K)
│   ├── context/             # Global React Contexts (ThemeContext, AuthContext)
│   ├── firebase/            # Firebase SDK setup with persistentLocalCache
│   ├── pages/               # 8 Module Page views & RedirectHandler
│   ├── services/            # dataService (Firestore + localStorage abstraction)
│   ├── test/                # Vitest & Testing Library test suites
│   ├── types/               # TypeScript interfaces
│   ├── App.tsx              # React Router tree
│   └── main.tsx             # React 19 root & PWA Service Worker register
├── deploy/
│   └── deploy.yml           # GitHub Actions workflow for automated deployment
├── docs/                    # Architecture & AI Developer specs
│   ├── DEVELOPER_GUIDE.md   # Comprehensive developer guidelines
│   └── AI_DEVELOPER_AGENT_SPEC.md # Instructions for Agentic AI pair programming
├── firestore.rules          # Security rules for Cloud Firestore
├── storage.rules            # Security rules for Firebase Storage
├── tailwind.config.js       # Tailwind CSS design system config
├── vite.config.ts           # Vite + PWA + Vitest bundler config
└── package.json             # NPM dependencies & scripts
```

---

## 🏃 Getting Started (Local Development)

### 1. Prerequisites
- **Node.js**: v20 or newer (tested with v24).
- **npm**: v10 or newer.

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/krisna31/superapps.git
cd superapps

# Install dependencies
npm install
```

### 3. Environment Setup (Optional for Local Offline Mode)
Superapps runs **immediately** in offline/guest mode with full features saved to local storage even without Firebase keys!

To connect to your own Firebase Spark project:
1. Create a project at [Firebase Console](https://console.firebase.google.com/).
2. Enable **Authentication** (Google, Email/Password, Anonymous).
3. Create a **Cloud Firestore** database.
4. Enable **Firebase Storage**.
5. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
6. Fill in your project credentials in `.env`.

### 4. Running the Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 5. Running Tests & Production Build
```bash
# Run unit & component tests
npm run test

# Run TypeScript check and production bundle
npm run build
```

---

## 🌐 Custom Domain & GitHub Pages Setup

### 1. DNS Configuration for `apps.k31.my.id`
In your domain DNS manager (e.g. Cloudflare, Niagahoster, Namecheap), add:
- **Type**: `CNAME`
- **Name / Host**: `apps`
- **Target / Value**: `<your-github-username>.github.io`
- **Proxy Status**: DNS Only (or Cloudflare Proxied with SSL mode `Full`).

### 2. GitHub Pages Settings
1. Go to your repository on GitHub -> **Settings** -> **Pages**.
2. Under **Build and deployment**:
   - **Source**: Deploy from a branch (e.g. `gh-pages`) OR **GitHub Actions**.
3. Under **Custom domain**:
   - Ensure `apps.k31.my.id` is listed and click **Save**.
   - Check **Enforce HTTPS**.

### 3. Automated CI/CD Deployment
A production-ready GitHub Actions workflow is provided in `deploy/deploy.yml`.
To enable automatic deployment on push:
1. Copy `deploy/deploy.yml` into `.github/workflows/deploy.yml`.
2. Add your `VITE_FIREBASE_*` credentials in GitHub Repository -> **Settings** -> **Secrets and variables** -> **Actions**.

---

## 🎯 Milestone-Driven Development Roadmap

Superapps is developed iteratively using structured milestones designed for human and **Agentic AI** pair-programming.

- [x] **Milestone 1: Core Foundation & 8 Essential Modules**
  - Modern React 19 + Vite + Tailwind CSS scaffolding.
  - PWA offline caching & Web App Manifest.
  - GitHub Pages CNAME & SPA 404 router.
  - Firebase Spark Auth, Firestore multi-tab cache, and Storage integration.
  - Full implementations of Tasks, Notes, Habits, Expenses, Snippets, SwissKnife, Dropzone, and Shortlinks.
  - Comprehensive Vitest test suite.

- [ ] **Milestone 2: Cloud Sync & Enhanced Authentication**
  - Real-time Firestore snapshot listeners for live multi-tab updates.
  - Link anonymous guest accounts to Google accounts without losing offline data.
  - User profile avatar and cloud sync status indicator.

- [ ] **Milestone 3: Advanced Productivity & Interaction Upgrades**
  - Native HTML5 Drag-and-Drop for Kanban task cards between columns.
  - Full WYSIWYG / rich markdown toolbar for Notes Vault.
  - Habit streak calendar heatmap and interactive expense monthly charts.

- [ ] **Milestone 4: Data Portability & Backup Center**
  - 1-click JSON / CSV export and import for all user collections.
  - AES-256 client-side encryption for sensitive notes and password vault.
  - Local database snapshot management.

- [ ] **Milestone 5: Native PWA Superpowers & Web APIs**
  - Web Share Target API: share text/links directly into Superapps Notes or Shortlinks.
  - File System Access API for local file sync.
  - Push notifications for habit reminders and due tasks.

---

## 🤝 Agentic AI Development Guidelines

This codebase is optimized for autonomous and pair-programming AI coding agents (such as Google Antigravity, Claude Code, Cursor, Copilot).
Read the comprehensive [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md) and [docs/AI_DEVELOPER_AGENT_SPEC.md](docs/AI_DEVELOPER_AGENT_SPEC.md) for architectural guidelines, coding conventions, and testing instructions.

---

## 📄 License
MIT License © 2026 krisna31.
