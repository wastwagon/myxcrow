# Quick Start: Test & Submit Mobile Apps

**Goal:** Test on iOS/Android simulators, then submit to App Store/Play Store

---

## 🚀 Step-by-Step Guide

### Step 1: Test on iOS Simulator (5 minutes)

```bash
cd /Users/OceanCyber/Downloads/myxcrow/apps/mobile

# Start iOS simulator
pnpm ios
```

**What happens:**
- Metro bundler starts
- iOS Simulator opens automatically
- App loads in simulator
- Test all features!

**Test checklist:**
- [ ] Register new account
- [ ] Login
- [ ] Create escrow
- [ ] **Top-up wallet (Paystack)**
- [ ] Release funds
- [ ] Open dispute
- [ ] Admin features (if admin)

---

### Step 2: Test on Android Emulator (5 minutes)

**First, start Android emulator:**
1. Open Android Studio
2. Click "Device Manager" (phone icon)
3. Click ▶️ on any emulator to start it
4. Wait for emulator to boot

**Then run:**
```bash
cd /Users/OceanCyber/Downloads/myxcrow/apps/mobile

# Start Android app
pnpm android
```

**Test the same checklist as iOS above.**

---

### Step 3: Install EAS CLI (One-time setup)

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo
eas login
# Enter your Expo credentials

# Initialize EAS project
cd /Users/OceanCyber/Downloads/myxcrow/apps/mobile
eas project:init
```

This will update `app.json` with your project ID.

---

### Step 4: Build for iOS App Store (15-20 minutes)

```bash
cd /Users/OceanCyber/Downloads/myxcrow/apps/mobile

# Build for iOS
eas build --platform ios --profile production
```

**You'll be asked:**
1. **Apple ID:** Your Apple Developer account email
2. **App-specific password:** Create one at appleid.apple.com
3. **Bundle identifier:** Use `com.myxcrow.app` (already set)

**EAS will:**
- Upload your code to Expo servers
- Build .ipa file in the cloud
- Take ~15-20 minutes
- Download .ipa when complete

**Monitor progress:**
```bash
# Check build status
eas build:list
```

---

### Step 5: Build for Android Play Store (10-15 minutes)

```bash
cd /Users/OceanCyber/Downloads/myxcrow/apps/mobile

# Build for Android
eas build --platform android --profile production
```

**EAS will:**
- Upload your code
- Build .aab file (Android App Bundle)
- Take ~10-15 minutes
- Download .aab when complete

---

### Step 6: Submit to iOS App Store

```bash
cd /Users/OceanCyber/Downloads/myxcrow/apps/mobile

# Submit to App Store
eas submit --platform ios
```

**You'll need:**
- Apple Developer account ($99/year)
- App Store Connect access

**Then:**
1. Go to https://appstoreconnect.apple.com
2. Click "My Apps" → "+" → "New App"
3. Fill in app details
4. Add screenshots (required)
5. Submit for review

---

### Step 7: Submit to Android Play Store

```bash
cd /Users/OceanCyber/Downloads/myxcrow/apps/mobile

# Submit to Play Store
eas submit --platform android
```

**You'll need:**
- Google Play Console account ($25 one-time)

**Then:**
1. Go to https://play.google.com/console
2. Click "Create app"
3. Fill in app details
4. Add screenshots (required)
5. Submit for review

---

## 🎯 Using the Helper Script

I've created an interactive script to make this easier:

```bash
cd /Users/OceanCyber/Downloads/myxcrow

# Run the helper script
./build-mobile.sh
```

**Menu options:**
1. Test on iOS Simulator
2. Test on Android Emulator
3. Build for iOS App Store
4. Build for Android Play Store
5. Build for Both Platforms
6. Submit to iOS App Store
7. Submit to Android Play Store
8. Check Build Status

---

## 📸 Required Screenshots

### For iOS App Store:

**Minimum required:**
- 1 screenshot for 6.7" display (1290 x 2796 pixels)

**Recommended:**
- 3-5 screenshots showing key features
- Use iPhone 14 Pro Max simulator
- Capture: Dashboard, Escrow, Wallet, Admin

**How to capture:**
1. Run app in simulator
2. Navigate to screen
3. Press `Cmd + S` to save screenshot
4. Screenshots saved to Desktop

### For Android Play Store:

**Minimum required:**
- 2 screenshots (1080 x 1920 pixels recommended)

**How to capture:**
1. Run app in emulator
2. Navigate to screen
3. Click camera icon in emulator toolbar
4. Screenshots saved to Desktop

---

## ⏱️ Timeline

### Today (Testing):
- **9:00 AM** - Test iOS simulator (30 min)
- **9:30 AM** - Test Android emulator (30 min)
- **10:00 AM** - Fix any bugs found (1-2 hours)

### Today (Building):
- **12:00 PM** - Start iOS build (20 min)
- **12:30 PM** - Start Android build (15 min)
- **1:00 PM** - Builds complete

### Today (Submission):
- **2:00 PM** - Submit to iOS App Store (30 min)
- **2:30 PM** - Submit to Android Play Store (30 min)
- **3:00 PM** - Complete store listings (2 hours)
- **5:00 PM** - All submitted!

### Next 3-7 Days:
- Apps in review
- Respond to any reviewer questions
- Apps go live! 🎉

---

## 🐛 Common Issues

### "Command not found: eas"
```bash
npm install -g eas-cli
```

### "No Android emulator running"
1. Open Android Studio
2. Device Manager → Start emulator
3. Wait for it to boot
4. Try again

### "iOS build failed"
```bash
# View detailed logs
eas build:view [BUILD_ID]
```

### "Need Apple Developer account"
- Sign up at https://developer.apple.com
- Cost: $99/year
- Required for App Store submission

### "Need Google Play account"
- Sign up at https://play.google.com/console
- Cost: $25 one-time
- Required for Play Store submission

---

## ✅ Pre-Submission Checklist

### Before Building:
- [ ] Tested on iOS simulator
- [ ] Tested on Android emulator
- [ ] All features working
- [ ] Paystack payment tested
- [ ] No console errors
- [ ] App icon looks good
- [ ] Splash screen displays

### Before Submitting:
- [ ] iOS build successful
- [ ] Android build successful
- [ ] Screenshots captured (3-5 for each)
- [ ] App description written
- [ ] Privacy policy URL ready
- [ ] Support URL ready

### Store Listings:
- [ ] App name: MYXCROW
- [ ] Short description (80 chars)
- [ ] Full description (4000 chars)
- [ ] Keywords/tags
- [ ] Category: Finance
- [ ] Content rating completed

---

## 📞 Support

**If you need help:**

1. Check build logs: `eas build:view [BUILD_ID]`
2. Check Expo docs: https://docs.expo.dev
3. Check our guide: `APP_STORE_SUBMISSION_GUIDE.md`

---

## 🎯 Quick Commands

```bash
# Test iOS
pnpm ios

# Test Android
pnpm android

# Build iOS
eas build --platform ios --profile production

# Build Android
eas build --platform android --profile production

# Submit iOS
eas submit --platform ios

# Submit Android
eas submit --platform android

# Check status
eas build:list
```

---

## 🚀 Ready to Start?

**Let's test on iOS first:**

```bash
cd /Users/OceanCyber/Downloads/myxcrow/apps/mobile
pnpm ios
```

**Good luck! 🎉**
