# WebView Gold Project — What to Include

The **MYXCROW monorepo is web-only** — there is no native mobile app in this repository (`WEB_ONLY_NOTICE.md`).

If you have a **separate WebView Gold project** (Android/iOS app that wraps the MYXCROW website in a native shell), you must add it here for a complete registration submission that covers mobile distribution.

---

## What is WebView Gold?

WebView Gold is a commercial template that wraps a website URL in a native Android/iOS app shell. It typically provides:
- Full-screen WebView loading your MYXCROW URL
- App icon and splash screen
- Push notifications (optional)
- In-app payment WebView (Paystack)
- Play Store / App Store distribution

This is a **separate codebase** from the `myxcrow` monorepo.

---

## Files to copy into `webview-gold-project/`

### Source code (required)
- [ ] Full Android Studio project folder (or Xcode project for iOS)
- [ ] `README.md` from that project explaining build steps
- [ ] Configuration file showing MYXCROW URL (e.g. `Config.java` or `WebViewGold.json`)
- [ ] App icons and splash screen assets
- [ ] `google-services.json` (Android) — **redact API keys** or use test project
- [ ] `GoogleService-Info.plist` (iOS) — redact if needed

### Executables (required)
- [ ] **Android:** `MYXCROW.apk` (debug or release build)
- [ ] **iOS (if applicable):** `MYXCROW.ipa` or note that iOS build requires Apple Developer account

### Documentation (recommended)
- [ ] App version number and bundle ID (e.g. `com.myxcrow.app`)
- [ ] Which MYXCROW URL it loads (production vs staging)
- [ ] Screenshot of app on phone showing MYXCROW login screen

---

## How to get the files from WebView Gold

1. **Locate your WebView Gold project** on your development machine (separate folder from `myxcrow`)
2. **Zip the source:**
   ```bash
   zip -r MYXCROW-webview-gold-source.zip /path/to/WebViewGoldProject \
     -x "*/build/*" -x "*/.gradle/*" -x "*/Pods/*"
   ```
3. **Build APK (Android):**
   - Open project in Android Studio
   - Build → Build Bundle(s) / APK(s) → Build APK(s)
   - Find APK in `app/build/outputs/apk/`
4. **Copy to pen drives:**
   ```
   pen-drive-*/06-webview-gold-project/
   ├── MYXCROW-webview-gold-source.zip
   ├── MYXCROW-android.apk
   ├── README.txt          # URL, version, build instructions
   └── screenshots/
       └── app-login.png
   ```

---

## If you do NOT have WebView Gold

You can still register MYXCROW as a **web application**:

1. On the pen drive cover letter, state clearly:
   > "MYXCROW v1.0.0 is delivered as a web application (Next.js). It is mobile-first and PWA-ready. No separate native mobile binary is included."
2. The screen recording should show the web app on desktop **and** mobile browser (resize window or record from phone browser)
3. Skip `06-webview-gold-project/` or leave a `README.txt` explaining web-only delivery

---

## Relationship between projects

```
┌─────────────────────────────┐
│  WebView Gold (optional)    │  ← Native shell, APK/IPA
│  Loads URL in WebView       │
└──────────────┬──────────────┘
               │ HTTPS
               ▼
┌─────────────────────────────┐
│  apps/web (this repo)       │  ← Next.js frontend (SOURCE INCLUDED)
└──────────────┬──────────────┘
               │ REST API
               ▼
┌─────────────────────────────┐
│  services/api (this repo)   │  ← NestJS backend (SOURCE INCLUDED)
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  PostgreSQL (schema incl.)  │  ← DATABASE SCHEMA INCLUDED
└─────────────────────────────┘
```

---

## Checklist before adding to pen drive

- [ ] Source zip created and tested (project opens in Android Studio)
- [ ] APK installs and loads MYXCROW login page
- [ ] No production secrets in source zip
- [ ] Version number matches web app (1.0.0)
- [ ] README explains relationship to main MYXCROW repo
