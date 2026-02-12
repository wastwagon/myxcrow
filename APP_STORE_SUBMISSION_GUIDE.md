# Building & Submitting Mobile Apps - Complete Guide

**Date:** February 12, 2026  
**Goal:** Test on iOS/Android and submit to App Store/Play Store

---

## 🎯 Your Goal

1. ✅ Test iOS version on Xcode Simulator
2. ✅ Test Android version on Android Studio Emulator
3. ✅ Submit to Apple App Store
4. ✅ Submit to Google Play Store

---

## 📋 Prerequisites

### Required Accounts:
- ✅ Apple Developer Account ($99/year) - https://developer.apple.com
- ✅ Google Play Console Account ($25 one-time) - https://play.google.com/console
- ✅ Expo Account (free) - https://expo.dev

### Required Software (You Have):
- ✅ Xcode (for iOS)
- ✅ Android Studio (for Android)
- ✅ Node.js & pnpm

---

## 🚀 Quick Start: Testing on Simulators

### Step 1: Install Expo CLI & EAS CLI

```bash
# Install globally
npm install -g expo-cli eas-cli

# Login to Expo
eas login
```

### Step 2: Test on iOS Simulator (Fastest)

```bash
cd /Users/OceanCyber/Downloads/myxcrow/apps/mobile

# Start Expo and open iOS simulator
pnpm ios
```

This will:
1. Start Metro bundler
2. Open iOS Simulator automatically
3. Install Expo Go on simulator
4. Load your app

**No build required!** Just instant testing.

### Step 3: Test on Android Emulator

```bash
# Make sure Android emulator is running first
# Open Android Studio → Device Manager → Start an emulator

# Then run:
cd /Users/OceanCyber/Downloads/myxcrow/apps/mobile
pnpm android
```

This will:
1. Start Metro bundler
2. Detect running emulator
3. Install Expo Go on emulator
4. Load your app

---

## 📦 Building for App Store Submission

For actual App Store/Play Store submission, you need **production builds**.

### Step 1: Configure EAS Build

```bash
cd /Users/OceanCyber/Downloads/myxcrow/apps/mobile

# Initialize EAS
eas build:configure
```

This creates `eas.json` with build configurations.

### Step 2: Update app.json Configuration

Before building, update these in `app.json`:

```json
{
  "expo": {
    "name": "MYXCROW",
    "slug": "myxcrow-mobile",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.myxcrow.app",
      "buildNumber": "1",
      "supportsTablet": true
    },
    "android": {
      "package": "com.myxcrow.app",
      "versionCode": 1
    },
    "extra": {
      "eas": {
        "projectId": "YOUR_PROJECT_ID"
      }
    }
  }
}
```

**Get your Project ID:**
```bash
eas project:init
```

---

## 🍎 iOS Build & Submission

### Step 1: Build for iOS

```bash
cd /Users/OceanCyber/Downloads/myxcrow/apps/mobile

# Build for iOS App Store
eas build --platform ios --profile production
```

**What happens:**
1. EAS uploads your code to Expo servers
2. Builds .ipa file in the cloud
3. Takes ~15-20 minutes
4. Downloads .ipa when complete

**You'll need:**
- Apple Developer Account credentials
- App Store Connect API Key (EAS will guide you)

### Step 2: Submit to App Store

**Option A: Automatic Submission (Recommended)**
```bash
eas submit --platform ios
```

**Option B: Manual Upload**
1. Download .ipa from EAS
2. Open Xcode → Window → Organizer
3. Drag .ipa to Organizer
4. Click "Distribute App"
5. Follow wizard

### Step 3: App Store Connect Setup

1. Go to https://appstoreconnect.apple.com
2. Click "My Apps" → "+" → "New App"
3. Fill in app information:
   - **Name:** MYXCROW
   - **Bundle ID:** com.myxcrow.app
   - **SKU:** myxcrow-001
   - **Primary Language:** English
4. Add screenshots (required)
5. Add app description
6. Submit for review

---

## 🤖 Android Build & Submission

### Step 1: Build for Android

```bash
cd /Users/OceanCyber/Downloads/myxcrow/apps/mobile

# Build AAB for Play Store
eas build --platform android --profile production
```

**What happens:**
1. EAS uploads your code
2. Builds .aab file (Android App Bundle)
3. Takes ~10-15 minutes
4. Downloads .aab when complete

### Step 2: Submit to Play Store

**Option A: Automatic Submission (Recommended)**
```bash
eas submit --platform android
```

**Option B: Manual Upload**
1. Go to https://play.google.com/console
2. Create new app
3. Upload .aab file
4. Fill in store listing
5. Submit for review

### Step 3: Play Console Setup

1. Go to https://play.google.com/console
2. Click "Create app"
3. Fill in app details:
   - **App name:** MYXCROW
   - **Default language:** English
   - **App or game:** App
   - **Free or paid:** Free
4. Complete store listing:
   - Short description
   - Full description
   - Screenshots (required)
   - Feature graphic
5. Set up content rating
6. Submit for review

---

## 📸 Required Assets

### iOS App Store Requirements:

**App Icon:**
- 1024x1024 PNG (no transparency)

**Screenshots (iPhone):**
- 6.7" Display: 1290 x 2796 pixels (at least 1)
- 6.5" Display: 1284 x 2778 pixels
- 5.5" Display: 1242 x 2208 pixels

**Optional:**
- iPad screenshots
- App preview video

### Android Play Store Requirements:

**App Icon:**
- 512x512 PNG (32-bit with alpha)

**Feature Graphic:**
- 1024 x 500 pixels

**Screenshots:**
- At least 2 screenshots
- Min: 320px
- Max: 3840px
- Recommended: 1080 x 1920 pixels (portrait)

---

## 🛠️ Complete Build & Submit Workflow

### For iOS:

```bash
# 1. Test on simulator first
cd /Users/OceanCyber/Downloads/myxcrow/apps/mobile
pnpm ios

# 2. Once tested, build for App Store
eas build --platform ios --profile production

# 3. Wait for build to complete (~15-20 min)

# 4. Submit to App Store
eas submit --platform ios

# 5. Go to App Store Connect and complete listing
# https://appstoreconnect.apple.com
```

### For Android:

```bash
# 1. Test on emulator first
cd /Users/OceanCyber/Downloads/myxcrow/apps/mobile
pnpm android

# 2. Once tested, build for Play Store
eas build --platform android --profile production

# 3. Wait for build to complete (~10-15 min)

# 4. Submit to Play Store
eas submit --platform android

# 5. Go to Play Console and complete listing
# https://play.google.com/console
```

---

## 📝 EAS Configuration (eas.json)

Create this file if it doesn't exist:

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
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "buildConfiguration": "Release"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## 🔐 Environment Variables for Production

Update your `.env` in mobile app:

```bash
# Production API
EXPO_PUBLIC_API_BASE_URL=https://myxcrow-bp-api.onrender.com/api

# Production Web URL
EXPO_PUBLIC_WEB_BASE_URL=https://www.myxcrow.com

# App Info
EXPO_PUBLIC_APP_NAME=MYXCROW
EXPO_PUBLIC_APP_VERSION=1.0.0
```

---

## ⚡ Quick Commands Reference

```bash
# Test on iOS Simulator
pnpm ios

# Test on Android Emulator
pnpm android

# Build for iOS App Store
eas build --platform ios --profile production

# Build for Android Play Store
eas build --platform android --profile production

# Submit to iOS App Store
eas submit --platform ios

# Submit to Android Play Store
eas submit --platform android

# Build both platforms
eas build --platform all --profile production

# Check build status
eas build:list

# View build logs
eas build:view [BUILD_ID]
```

---

## 🐛 Troubleshooting

### iOS Build Issues:

**"No valid code signing identity"**
```bash
# EAS will guide you to create certificates
# Just follow the prompts
eas build --platform ios --profile production
```

**"Bundle identifier already exists"**
- Change `bundleIdentifier` in `app.json`
- Use: `com.yourcompany.myxcrow`

### Android Build Issues:

**"Package name already exists"**
- Change `package` in `app.json`
- Use: `com.yourcompany.myxcrow`

**"Build failed"**
```bash
# View detailed logs
eas build:view [BUILD_ID]
```

---

## 📱 Testing Checklist

### Before Submitting:

#### iOS:
- [ ] Test on iPhone simulator
- [ ] Test on iPad simulator (if supporting)
- [ ] Test all core flows
- [ ] Test Paystack payment
- [ ] Check app icon displays correctly
- [ ] Check splash screen
- [ ] Test push notifications (if enabled)

#### Android:
- [ ] Test on Android emulator
- [ ] Test on different screen sizes
- [ ] Test all core flows
- [ ] Test Paystack payment
- [ ] Check app icon displays correctly
- [ ] Check splash screen
- [ ] Test push notifications (if enabled)

---

## 📊 Timeline Estimate

### Testing Phase:
- iOS Simulator setup: 5 minutes
- Android Emulator setup: 5 minutes
- Testing all features: 1-2 hours

### Build Phase:
- iOS build: 15-20 minutes
- Android build: 10-15 minutes
- Total: ~30-35 minutes

### Submission Phase:
- iOS submission: 10 minutes
- Android submission: 10 minutes
- Store listing setup: 1-2 hours
- Total: ~2-3 hours

### Review Phase:
- iOS App Store review: 1-3 days
- Google Play review: 1-7 days

**Total time to live apps:** 2-7 days after submission

---

## 🎯 Recommended Workflow

### Day 1: Testing
```bash
# Morning: Test iOS
pnpm ios
# Test all features thoroughly

# Afternoon: Test Android
pnpm android
# Test all features thoroughly

# Fix any bugs found
```

### Day 2: Building
```bash
# Morning: Build iOS
eas build --platform ios --profile production

# Afternoon: Build Android
eas build --platform android --profile production
```

### Day 3: Submission
```bash
# Morning: Submit iOS
eas submit --platform ios
# Complete App Store Connect listing

# Afternoon: Submit Android
eas submit --platform android
# Complete Play Console listing
```

### Day 4-10: Review & Launch
- Monitor review status
- Respond to any reviewer questions
- Apps go live!

---

## 📚 Helpful Resources

- **Expo Docs:** https://docs.expo.dev
- **EAS Build:** https://docs.expo.dev/build/introduction/
- **EAS Submit:** https://docs.expo.dev/submit/introduction/
- **App Store Guidelines:** https://developer.apple.com/app-store/review/guidelines/
- **Play Store Guidelines:** https://play.google.com/about/developer-content-policy/

---

## 🆘 Need Help?

If you encounter issues:

1. Check EAS build logs: `eas build:view [BUILD_ID]`
2. Check Expo forums: https://forums.expo.dev
3. Check our documentation in the project

---

**Ready to start?** Let's begin with testing on simulators! 🚀

```bash
cd /Users/OceanCyber/Downloads/myxcrow/apps/mobile
pnpm ios
```
