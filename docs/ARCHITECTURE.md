# Superapps OS — Architectural Specification

This document details the architectural blueprints, data flow diagrams, and internal engineering decisions powering **Superapps OS**.

---

## 🏛️ 1. System Topology & Static Hosting Architecture

Superapps OS runs exclusively within the user's web browser. There is **no persistent backend, no remote microservices, and no server-side telemetry**.

```mermaid
graph TD
    User([User Browser])
    
    subgraph GitHubPages ["Static CDN (GitHub Pages)"]
        HTML[index.html]
        Bundle[React 18 + Tailwind Assets]
        WasmBin[sql-wasm.wasm]
    end

    subgraph BrowserRuntime ["Browser Execution Sandbox"]
        ReactApp["React Application & Hooks"]
        WebCrypto["Web Crypto API (SubtleCrypto)"]
        SqliteEngine["sql.js C-Engine (WebAssembly)"]
        MemDB[("In-Memory SQLite DB (Fast I/O)")]
        IndexedDB[("IndexedDB (VFS Persistence)")]
        LocalStorage[("LocalStorage (Vault Metadata)")]
    end

    User -->|Visits URL| HTML
    HTML --> Bundle
    HTML --> WasmBin
    Bundle --> ReactApp

    ReactApp <--> WebCrypto
    ReactApp <--> SqliteEngine
    SqliteEngine <--> MemDB
    MemDB -.->|Debounced Flush 300ms| IndexedDB
    ReactApp <--> LocalStorage
```

### Static Hosting Constraints & Solutions

| Constraint | Architectural Solution |
| :--- | :--- |
| **No server routing (Deep links return 404)** | Adopted `HashRouter` (`/#/...`). The hash fragment is handled entirely on the client, avoiding server route resolution errors. |
| **No server database (MySQL/PostgreSQL)** | Embedded C-SQLite compiled to WebAssembly (`sql.js`). Executes real relational queries entirely inside browser RAM. |
| **Data loss on browser tab refresh** | Implemented an IndexedDB Virtual File System (VFS) bridge that saves the SQLite binary Uint8Array into IndexedDB upon mutation. |
| **No server-side link shortening service** | Implemented Stateless Shortlinks: URL destinations are compressed into the hash fragment via LZ-String (`/#/r?d=...`). |
| **No file hosting server for sharing** | Implemented direct browser-to-browser WebRTC DataChannel streaming with PeerJS signaling. |

---

## 💾 2. In-Browser SQLite Engine & Persistence Lifecycle

Superapps OS uses `sql.js` (SQLite 3.x compiled with Emscripten into WebAssembly).

### The In-Memory + IndexedDB VFS Sync Cycle

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant React as React UI Component
    participant Context as DbContext
    participant WASM as SQLite WASM (In-Memory)
    participant IDB as IndexedDB ("superapps_sqlite_v1")

    Note over Context,WASM: Application Boot
    Context->>IDB: Read stored "db_bytes"
    alt Stored DB found
        IDB-->>Context: Return Uint8Array
        Context->>WASM: initSqlJs().Database(bytes)
    else First run (No DB found)
        Context->>WASM: initSqlJs().Database()
        Context->>WASM: Execute INIT_SCHEMA
    end

    Note over User,IDB: User Action (e.g. Save Note)
    User->>React: Click "Save Note"
    React->>Context: execute("INSERT INTO notes ...", params)
    Context->>WASM: db.run(sql, params)
    WASM-->>Context: Execution Success
    Context->>React: Trigger `refreshSignal` (re-renders UI)

    Note over Context,IDB: Debounced Asynchronous Persistence
    Context->>Context: Start 300ms Debounce Timer
    Context->>WASM: db.export() -> Uint8Array
    Context->>IDB: put("db_bytes", exportedBytes)
    IDB-->>Context: Stored Successfully
```

### Why this design?
1. **Zero-Latency Reads and Writes**: Queries run against C-speed WebAssembly memory. There is zero asynchronous wait time when querying lists or sorting transactions.
2. **Crash-Resilience**: Debouncing disk writes (300ms) guarantees that rapid-fire typing in the Markdown editor does not bottleneck the IndexedDB transactional queue while guaranteeing prompt persistence.

---

## 🔗 3. Stateless Public Link Architecture

Traditional shortlink systems (Bitly, TinyURL) store pairs `(slug, long_url)` in a centralized SQL database. Superapps OS introduces **Stateless Shortlinks** that require zero database records:

```mermaid
flowchart LR
    LongURL["Long Target URL"] --> Compress["LZ-String CompressToBase64()"]
    Compress --> OptionalEncrypt["(Optional) AES-256-GCM Encrypt"]
    OptionalEncrypt --> URL["https://host/#/r?d=COMPRESSED_PAYLOAD"]

    URL --> Recipient["Recipient Opens URL"]
    Recipient --> HashRouter["/#/r Route (RedirectHandlerPage)"]
    HashRouter --> Decompress["LZ-String DecompressFromBase64()"]
    Decompress --> Navigate["window.location.replace(TargetURL)"]
```

### URL Structure

```text
https://krisna31.github.io/superapps/#/r?d=NoIg7glgzgPgLgUwgXwFAEsD2BXA9gGzACcIAXAT1QAcAnAbgG0QAaEHfPRAW1oAYAlEgw4A7qR78APABUARvQCGAGz71mAExEBXbACtEAO2Z88AWk4AhAEz0Avs1A
```

- **Zero Cloud Storage**: The entire destination information resides in the URI fragment.
- **Privacy**: The fragment identifier (`#/...`) is never sent to the HTTP server in HTTP request headers.
- **Self-Contained**: Works even if GitHub Pages is completely disconnected or private.

---

## 🌐 4. WebRTC Peer-to-Peer File Transfer Architecture

For transferring large files (videos, zip archives, disk images) without cloud size restrictions:

```mermaid
sequenceDiagram
    autonumber
    actor Alice as Sender (Alice)
    participant Signaling as PeerJS Cloud Signaling
    actor Bob as Receiver (Bob)

    Alice->>Signaling: Connect & register Room ID (e.g. "A7X9K2")
    Bob->>Signaling: Connect & request connection to "A7X9K2"
    Signaling-->>Alice: Bob's SDP Offer
    Alice-->>Signaling: Alice's SDP Answer
    Note over Alice,Bob: WebRTC Direct P2P Channel Established (Signaling disconnected)
    
    Alice->>Alice: Slice File into 16KB ArrayBuffer Chunks
    loop Direct Stream
        Alice->>Bob: dataChannel.send(Chunk)
        Bob->>Bob: Append chunk to ArrayBuffer stream
        Bob->>Alice: ACK progress
    end
    Bob->>Bob: Assemble Blob and trigger auto-download
```

- **0-Byte Server Footprint**: The actual file content never touches any server.
- **LAN Acceleration**: If Alice and Bob are on the same Wi-Fi network, WebRTC transfers data locally at full LAN speed.

---

## 🔒 5. Storage Hierarchy & Threat Boundaries

| Storage Layer | Medium | Volatility | Contents |
| :--- | :--- | :--- | :--- |
| **Application RAM** | JS Heap | Volatile (Lost on close/lock) | Plaintext master password, derived AES-256 CryptoKey, unencrypted in-memory SQLite tables. |
| **Browser IndexedDB** | Disk VFS | Non-Volatile (Survives reload) | Binary SQLite database file (`superapps_sqlite_v1`). |
| **Browser LocalStorage** | Disk Key-Value | Non-Volatile | Vault metadata: Salt (hex), PBKDF2 iterations, auto-lock timeout, verification ciphertext, wrapped WebAuthn envelope, active theme. |
| **Exported Files** | User Local Filesystem | Non-Volatile | Encrypted `.vault` container file (AES-256-GCM) or raw `.sqlite3` binary. |

---

## 📱 6. Progressive Web App (PWA) & Offline Cache Architecture

Superapps OS complies with the modern Progressive Web App (PWA) specification, enabling users to install it as an operating-system level desktop application (macOS dock, Windows taskbar/Start, Linux) or mobile home screen app.

```mermaid
graph TD
    Request([Fetch Event]) --> SW{Service Worker Cache?}
    SW -->|Cache Hit| ReturnCached[Return Precached Asset from CacheStorage]
    SW -->|Cache Miss| FetchNet[Network Fetch]
    FetchNet --> SaveCache[Store in CacheStorage & Return]
    FetchNet -.->|Offline / No Net| OfflineFallback[Offline Fallback Mode]
```

### PWA Components
1. **Web App Manifest (`public/manifest.json`)**: Configures display mode (`standalone`), theme color (`#0b0f19`), responsive high-res vector icons (`512x512` & `192x192`), and application metadata.
2. **Service Worker (`public/sw.js`)**: Employs a Cache-First strategy for core static scripts, CSS bundles, vector logos, and the WebAssembly SQLite binary (`sql-wasm.wasm`), ensuring 100% offline functionality.
3. **Storage Persistence API**: Automatically invokes `navigator.storage.persist()` upon initialization to prevent the browser from automatically clearing IndexedDB under storage pressure.
4. **Custom Install Prompt Handler (`src/services/pwaService.ts`)**: Intercepts `beforeinstallprompt` to offer a seamless, one-click in-app install button within the top navigation bar and command palette.

---

## 🔐 7. WebAuthn Hardware Authenticator & Biometrics Architecture

To eliminate the friction of typing a complex master password while retaining high security, Superapps OS implements a local hardware biometric envelope leveraging the W3C Web Authentication standard (`navigator.credentials`).

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant App as Superapps Client
    participant WebAuthn as Platform Authenticator (Touch ID / Windows Hello)
    participant LocalStore as LocalStorage

    Note over User,WebAuthn: Enrollment Flow
    User->>App: Enable Biometrics with Master Password
    App->>WebAuthn: navigator.credentials.create({authenticatorAttachment: 'platform'})
    WebAuthn-->>App: Credential (rawId)
    App->>App: Derive AES-GCM wrap key from SHA-256(rawId)
    App->>App: Encrypt Master Password with wrap key
    App->>LocalStore: Save {credentialId, iv, wrappedKey}

    Note over User,WebAuthn: Unlock Flow
    User->>App: Click "Unlock with Touch ID"
    App->>WebAuthn: navigator.credentials.get({allowCredentials: [credentialId]})
    WebAuthn->>User: Hardware Biometric Prompt (Fingerprint / Face ID)
    WebAuthn-->>App: Assertion with rawId
    App->>App: Derive wrap key from SHA-256(rawId)
    App->>App: Decrypt Master Password from wrappedKey
    App->>App: Derive AES-256-GCM Vault Key & Unlock SQLite DB
```

---

## 🎨 8. Theme Studio & Synthesized Web Audio Soundscapes

### Multi-Theme Engine
The theme engine operates dynamically without requiring page reloads:
- `cyber`: Electric cobalt, deep slate, and violet glow.
- `oled`: Pure pitch-black `#000000` with high-contrast neon accents, optimized for battery preservation on OLED screens.
- `nord`: Arctic Scandinavian muted slates and crisp cyan highlights.
- `emerald`: Cyberpunk phosphor matrix green with telemetry amber.

### Web Audio Synthesizer
Rather than streaming large external MP3/WAV audio files, `src/services/soundService.ts` procedurally generates micro-interaction acoustics using the browser's native `AudioContext` and oscillator nodes (sine/triangle waves with exponential gain ramp envelopes). It introduces zero external asset weight and works completely offline.

