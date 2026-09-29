# ⚡ Superapps OS

> **100% Client-Side • Zero-Knowledge Encryption • In-Browser SQLite WASM • Hosted on GitHub Pages**

[![Deploy Superapps OS to GitHub Pages](https://github.com/krisna31/superapps/actions/workflows/deploy.yml/badge.svg)](https://github.com/krisna31/superapps/actions/workflows/deploy.yml)

**Superapps OS** is a fully client-side, zero-backend personal daily operating system built specifically for static hosting on **GitHub Pages**. All data runs in an in-browser SQLite WebAssembly engine, is persisted locally in IndexedDB, and is locked with **AES-256-GCM** Zero-Knowledge encryption derived from your Master Password.

Zero servers. Zero monthly hosting fees. Zero telemetry.

---

## 🚀 Live Demo & Hosting

- **Live URL**: [https://krisna31.github.io/superapps/](https://krisna31.github.io/superapps/)

---

## 💡 Key Architectural Pillars

### 1. 🗄️ In-Browser SQLite WASM (`sql.js` + IndexedDB VFS)
* Real relational database running entirely in WebAssembly inside your browser tab.
* Standard SQL queries (`SELECT`, `INSERT`, `UPDATE`, `CREATE TABLE`).
* Relational tables for shortlinks, notes, expenses, habits, scratch stash, and upload records.
* Automatically debounces and persists the SQLite binary `.sqlite3` into browser IndexedDB so changes survive page refreshes and browser restarts.

### 2. 🔐 Zero-Knowledge Master Vault Encryption
* When launching the `/app` dashboard, you set a **Master Vault Password**.
* Uses native browser **Web Crypto API**:
  * **PBKDF2** key derivation with 100,000 SHA-256 iterations and a cryptographically secure random 16-byte salt.
  * **AES-256-GCM** encryption with unique 12-byte initialization vectors (IV).
* Configurable auto-lock inactivity timer (5m, 15m, 30m, never) and instant one-click lock.
* Your password is never sent to any server. Without your password, the data is unreadable cipher text.

### 3. 💾 Encrypted Backup & Import Special Page
* **Password-Protected Export (`.vault`)**: Encrypts your full SQLite binary with AES-256-GCM using your backup password and downloads a portable `.vault` backup file.
* **Password-Protected Import (`.vault`)**: Upload your `.vault` file, supply your password, verify the SQLite header, and restore your database instantly.
* **Raw `.sqlite3` Binary Export**: Download an unencrypted `.sqlite3` file to query in external tools like DBeaver, TablePlus, or DB Browser for SQLite.
* **Interactive SQL Console**: Run raw SQL statements directly in the browser with live table results and schema inspection.

---

## 📱 Integrated Daily Superapps Suite

| App | Highlights | Storage |
| :--- | :--- | :--- |
| 🔗 **Shortlink & Quick Launcher** | Personal jump shortcuts (`go/gh`, `go/mail`), click counters, tags + **Stateless Public Redirect Generator** (URL payload compression that works for anyone without a server) + QR Code generator. | SQLite WASM |
| 📦 **DropZone (File Sharing & Stash)** | **Wormhole-Style WebRTC P2P Transfer** (direct browser-to-browser streaming with 0 bytes on server) + **Ephemeral Auto-Expiring Upload** (1h, 12h, 24h, 72h via Litterbox) + **Local Scratch Stash**. | WebRTC / IndexedDB |
| 📝 **Encrypted Notes Vault** | Distraction-free Markdown editor with live preview, category tags, pinned notes, full-text search, word count, and `.md` file export. | SQLite WASM (AES Encrypted) |
| 💰 **Expense & Budget Flow** | Track income & expenses, category breakdown with visual progress bars, monthly net balance calculation, and CSV export. | SQLite WASM |
| 🛠️ **Dev & Daily Swiss Knife** | JSON Studio (beautify, minify, validate), JWT Inspector (claims and expiry check), Base64/Hex encoder, Hasher (SHA-256, SHA-512, MD5, UUID v4), Regex tester. | In-Memory / Client |
| ⏱️ **Focus & Habit Streaks** | Pomodoro focus timer with Web Audio synthesized chimes (25m focus / 5m break) + Daily habit tracker with streak counters. | SQLite WASM |
| ⚡ **Command Palette & Omni-Search** | Spotlight/Raycast-style global launcher (`Ctrl+K` / `Cmd+K`), live relational search across SQLite tables, global shortcuts (`Ctrl+Shift+L` to lock, `Ctrl+Shift+N` for notes). | In-Memory / SQLite |

---

## 🛠️ Local Development & Running

### Prerequisites
- Node.js 18+ (tested on Node v20 and v24)
- npm 10+

### Setup
```bash
# Clone the repository
git clone https://github.com/krisna31/superapps.git
cd superapps

# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build
```bash
# Type check and bundle for static hosting
npm run build

# Preview static build locally
npm run preview
```

---

## 🚢 Deployment to GitHub Pages

This repository comes preconfigured with a GitHub Actions workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

1. Push your changes to GitHub:
   ```bash
   git add .
   git commit -m "feat: complete client-side superapps suite"
   git push origin main
   ```
2. In your GitHub repository settings:
   - Navigate to **Settings > Pages**.
   - Under **Build and deployment > Source**, select **GitHub Actions**.
3. Every commit to `main` will automatically build and publish the site!
---

## 📖 Documentation & Guides

Comprehensive guides are available both inside the running application and in the codebase repository:

- 🖥️ **Interactive In-App User Guide**: Navigate to `/#/guide` or click **User Guide** in the navigation menu. Includes interactive walkthroughs of every app, zero-knowledge vault setup, WebRTC file transfers, and troubleshooting FAQs.
- 📚 **Developer Guide ([`docs/DEVELOPER_GUIDE.md`](docs/DEVELOPER_GUIDE.md))**: Detailed environment setup, architecture map, and a step-by-step tutorial on adding new mini-apps.
- 🏛️ **System Architecture ([`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md))**: Client-side execution model, SQLite WASM + IndexedDB persistence lifecycle, and WebRTC streaming.
- 🔐 **Cryptographic Specification ([`docs/CRYPTOGRAPHY.md`](docs/CRYPTOGRAPHY.md))**: PBKDF2 (100k rounds) + AES-256-GCM specs, `.vault` format, and threat model.
- 🗄️ **Database Schema Reference ([`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md))**: SQLite DDL, tables, indexes, and SQL console queries.

---

## 📄 License
MIT License. Free to use, modify, and self-host anywhere.
