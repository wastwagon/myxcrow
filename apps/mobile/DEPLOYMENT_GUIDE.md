# MYXCROW Mobile – Device Testing & Production Deployment

Guide for testing on real devices (iOS/Android) and publishing to app stores.

---

## Prerequisites

- ✅ Android Studio installed
- ✅ Xcode installed (Mac only, for iOS)
- Node.js ≥ 20, pnpm ≥ 9

---

## 1. Environment Setup

Create `apps/mobile/.env` (or `.env.local`):

```env
# For local device testing (phone on same WiFi as your computer)
EXPO_PUBLIC_API_BASE_URL=http://YOUR_COMPUTER_IP:4000/api
EXPO_PUBLIC_WEB_BASE_URL=http://YOUR_COMPUTER_IP:3000

# For production (replace with your real URLs)
# EXPO_PUBLIC_API_BASE_URL=https://api.myxcrow.com/api
# EXPO_PUBLIC_WEB_BASE_URL=https://myxcrow.com
```

**Important:** For device testing, use your computer's local IP (e.g. `192.168.1.100`) instead of `localhost`. The phone cannot reach `localhost` on your computer.

---

## 2. Test on Real Device – Quick Path (Expo Go)

**Fastest way to run on a physical device:**

1. Install **Expo Go** on your phone:
   - [Android Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)

2. Start the dev server:
   ```bash
   cd apps/mobile
   pnpm start
   ```

3. Ensure API and web are running:
   ```bash
   # In another terminal – start API (from project root)
   cd services/api && pnpm run start:dev

   # And web (if needed for topup callback)
   cd apps/web && pnpm dev
   ```

4. Scan the QR code:
   - **Android:** Expo Go app → Scan QR
   - **iOS:** Camera app → scan QR → open in Expo Go

5. If the app can’t reach the API, update `.env` with your computer’s IP and restart.

**Limitation:** Expo Go may not support all native modules. For full testing, use development builds (Section 3).

---

## 3. Test on Real Device – Development Build (Full Native)

Builds a custom app with all native code. Uses Android Studio / Xcode.

### Android

1. Connect an Android device (USB debugging on) or start an emulator.

2. Run:
   ```bash
   cd apps/mobile
   pnpm exec expo run:android
   ```

3. First run will run `expo prebuild` and create the `android/` folder. Then it builds and installs on the device/emulator.

### iOS (Mac + Xcode only)

1. Connect an iPhone or use the iOS Simulator.

2. Run:
   ```bash
   cd apps/mobile
   pnpm exec expo run:ios
   ```

3. First run creates `ios/` and builds. For a physical device, you may need to:
   - Open `ios/myxcrowmobile.xcworkspace` in Xcode
   - Select your device
   - Set your Apple ID under Signing & Capabilities
   - Build and run from Xcode

---

## 4. Production Builds with EAS (Expo Application Services)

EAS Build creates store-ready builds in the cloud.

### 4.1 Install EAS CLI

```bash
pnpm add -g eas-cli
# or: npm install -g eas-cli
```

### 4.2 Log in to Expo

```bash
eas login
```

Create an Expo account if needed: https://expo.dev/signup

### 4.3 Configure EAS

Create `apps/mobile/eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_API_BASE_URL": "https://api.myxcrow.com/api",
        "EXPO_PUBLIC_WEB_BASE_URL": "https://myxcrow.com"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_API_BASE_URL": "https://api.myxcrow.com/api",
        "EXPO_PUBLIC_WEB_BASE_URL": "https://myxcrow.com"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json"
      },
      "ios": {
        "appleId": "<your Apple ID email>",
        "ascAppId": "<App Store Connect app ID>"
      }
    }
  }
}
```

**Before submit:** Add the submit section to `eas.json` (see `eas-submit.example.json`). Fill:
- `appleId`: Your Apple ID email (for App Store Connect)
- `ascAppId`: App ID from App Store Connect (e.g. `1234567890`)
- `serviceAccountKeyPath`: Path to Google Play service account JSON (create in Play Console)

### 4.4 Link EAS project

```bash
cd apps/mobile
npx eas-cli init
```

If you see "Invalid UUID appId" or "Project already linked (ID: your-project-id)", remove the invalid `extra.eas.projectId` from `app.json` first, then run `npx eas-cli init` again. This creates the project on Expo and adds a real `projectId` to `app.json`.

### 4.5 Build for production

**Android (AAB for Play Store):**
```bash
eas build --platform android --profile production
```

**iOS (for App Store):**
```bash
eas build --platform ios --profile production
```

**Both:**
```bash
eas build --platform all --profile production
```

Builds run in the cloud. Download links appear in the terminal and in the Expo dashboard.

---

## 5. App Store / Play Store Setup

### Android (Google Play)

1. Create a [Google Play Developer account](https://play.google.com/console) ($25 one-time).
2. Create an app in Play Console.
3. For EAS Submit, create a [service account](https://docs.expo.dev/submit/android/#credentials) and save as `google-service-account.json`.
4. Submit:
   ```bash
   eas submit --platform android --profile production
   ```

### iOS (App Store)

1. Enroll in [Apple Developer Program](https://developer.apple.com/programs/) ($99/year).
2. Create an app in [App Store Connect](https://appstoreconnect.apple.com).
3. Configure signing in EAS (or let EAS manage it).
4. Submit:
   ```bash
   eas submit --platform ios --profile production
   ```

---

## 6. Checklist Before Production

- [ ] Run `npx eas-cli init` to link project (adds `projectId` to `app.json`)
- [ ] Update `app.json`: version, buildNumber (iOS), versionCode (Android)
- [ ] Verify `eas.json` production env: `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_WEB_BASE_URL` point to your live URLs
- [ ] **Before submit:** Add submit section to `eas.json` (see `eas-submit.example.json`) with real `appleId`, `ascAppId`, `serviceAccountKeyPath`
- [ ] Add app icons and splash screen (already in `./assets/`)
- [ ] Test Paystack topup with production/sandbox keys
- [ ] Test on physical Android and iOS devices
- [ ] Run through: Register → Escrow → Fund → Ship → Deliver → Release
- [ ] Test admin flows: withdrawals, KYC, users, wallet

---

## 7. Quick Reference

| Task              | Command                          |
|-------------------|-----------------------------------|
| Start dev server  | `cd apps/mobile && pnpm start`    |
| Run on Android    | `cd apps/mobile && pnpm exec expo run:android` |
| Run on iOS        | `cd apps/mobile && pnpm exec expo run:ios`     |
| EAS build Android | `eas build -p android --profile production`    |
| EAS build iOS     | `eas build -p ios --profile production`        |
| EAS submit        | `eas submit -p android` or `eas submit -p ios` |

---

## Troubleshooting

**"Unable to connect to API" on device**
- Use your computer’s IP in `EXPO_PUBLIC_API_BASE_URL`, not `localhost`.
- Ensure phone and computer are on the same network.
- Check firewall allows port 4000.

**iOS build fails**
- Open Xcode and accept license if prompted.
- Ensure a valid Apple ID is set for signing.
- For physical device: enable Developer Mode in Settings.

**Android build fails**
- Ensure Android Studio and SDK are installed.
- Run `pnpm exec expo prebuild --clean` and try again.
