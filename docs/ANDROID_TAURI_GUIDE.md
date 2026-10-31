# Superapps Android App Guide: Tauri Mobile (v2)

This guide documents the architecture, automated build pipeline, and developer setup for running and packaging **Superapps** as a native Android application using **Tauri Mobile (v2)**.

---

## 1. Architectural Philosophy

- **Unified Monorepo**: One single codebase powers both the GitHub Pages web application ([apps.k31.my.id](https://apps.k31.my.id)) and the native Android APK.
- **Zero Frontend Rewrites**: All 8 productivity modules (Tasks, Notes, Habits, Expenses, Snippets, Swiss Knife, Dropzone, Shortlinks) and the Media Downloader execute directly inside the native Android System WebView.
- **Ultra-Lightweight (<5MB)**: Unlike traditional hybrid frameworks that bundle heavy node/browser runtimes, Tauri Mobile relies on the host OS WebView and a minimal Rust binary, resulting in an APK size under 5MB.
- **Native Android Upgrades**:
  - **Hardware Back Button**: Pressing the Android back button or gesture navigation closes active mobile drawers/modals first, or navigates back in React Router history without accidentally exiting the app.
  - **Safe Area Insets**: Viewport configured with `viewport-fit=cover` and CSS `env(safe-area-inset-top)` / `env(safe-area-inset-bottom)` to prevent cutouts by camera notches or bottom gesture bars.
  - **Native Plugins**: Includes `@tauri-apps/plugin-notification`, `@tauri-apps/plugin-dialog`, and `@tauri-apps/plugin-fs`.

---

## 2. Option A: Automated Cloud Build via GitHub Actions (Recommended)

You do **not** need to install 15GB of Android NDK or Rust toolchains on your local machine to get an installable Android APK. GitHub Actions builds and signs the APK automatically on Ubuntu cloud runners.

### How to trigger an APK build on GitHub:
1. Push your changes to GitHub repository `krisna31/superapps`.
2. Go to the **Actions** tab on your GitHub repository.
3. Select **"Android Tauri Build & Release"** on the left sidebar.
4. Click **"Run workflow"**, choose `debug` or `release`, and click the green button.
5. Once completed (~5 minutes), download the zipped `.apk` file from the **Artifacts** section at the bottom of the workflow run.
6. Transfer the `.apk` to your phone or send via WhatsApp/Telegram to install directly.

### Automatic Release on Version Tags:
Whenever you tag a commit with a version tag:
```bash
git tag v1.0.0
git push origin v1.0.0
```
GitHub Actions will automatically build a production release APK and attach it directly to the GitHub Releases page.

---

## 3. Option B: Local Android Setup & Debugging on Windows

If you want to live-debug the app on an Android phone connected via USB or an Android Studio Emulator, follow these setup steps:

### Prerequisites (Windows):
1. **Rust Toolchain**:
   ```powershell
   winget install Rustlang.Rustup
   rustup default stable
   rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android
   ```
2. **Java JDK 17**:
   ```powershell
   winget install Microsoft.OpenJDK.17
   ```
3. **Android Studio**:
   - Install Android Studio from [developer.android.com/studio](https://developer.android.com/studio).
   - In Android Studio, open **SDK Manager** (`Tools -> SDK Manager`):
     - **SDK Platforms**: Check `Android 14.0 ("UpsideDownCake")` (API 34).
     - **SDK Tools**: Check `Android SDK Build-Tools 34.0.0`, `NDK (Side by side) 26.1.10909125`, and `Android SDK Command-line Tools`.
4. **Environment Variables**:
   Add the following to your System Environment Variables (replace `<User>` with your Windows username):
   ```powershell
   [System.Environment]::SetEnvironmentVariable('JAVA_HOME', 'C:\Program Files\Microsoft\jdk-17', 'User')
   [System.Environment]::SetEnvironmentVariable('ANDROID_HOME', "C:\Users\<User>\AppData\Local\Android\Sdk", 'User')
   [System.Environment]::SetEnvironmentVariable('NDK_HOME', "C:\Users\<User>\AppData\Local\Android\Sdk\ndk\26.1.10909125", 'User')
   ```

---

## 4. Local Build & Development Commands

From the root project directory:

```bash
# 1. Initialize the Android project structure
npm run tauri:android:init

# 2. Run live hot-reload development on a connected USB Android phone or emulator
npm run tauri:android:dev

# 3. Compile a standalone Android APK locally
npm run tauri:android:build -- --apk
```

The resulting local APK will be generated at:
`src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk`

---

## 5. Security & Signing for Production Distribution

For direct sideloading or internal distribution, debug APKs install without additional keystores.
To generate a release signing key for Google Play Store or APK distribution:

```powershell
keytool -genkey -v -keystore superapps-release.keystore -alias superapps -keyalg RSA -keysize 2048 -validity 10000
```

Store `superapps-release.keystore` securely and add keystore credentials to GitHub Secrets (`KEYSTORE_BASE64`, `KEY_ALIAS`, `KEY_PASSWORD`, `KEYSTORE_PASSWORD`) if publishing to Google Play.
