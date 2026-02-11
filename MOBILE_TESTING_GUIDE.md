# Mobile App Testing Guide - Android & iOS

**Date:** February 11, 2026  
**Platform:** Expo React Native  
**Your Setup:** Android Studio + Xcode installed ✅

---

## 🎯 Quick Start (Recommended for Testing)

### Option 1: Expo Go App (Fastest - No Build Required)

This is the **easiest way** to test your app immediately:

1. **Install Expo Go on your phone:**
   - iOS: [App Store - Expo Go](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Play Store - Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Start the development server:**
   ```bash
   cd /Users/OceanCyber/Downloads/myxcrow/apps/mobile
   pnpm install  # if not already done
   pnpm start
   ```

3. **Scan the QR code:**
   - iOS: Use Camera app to scan QR code
   - Android: Use Expo Go app to scan QR code

4. **App loads instantly!** 🎉

---

## 📱 Option 2: iOS Simulator (Xcode Required)

### Prerequisites
- ✅ Xcode installed (you have this)
- ✅ Xcode Command Line Tools

### Setup Xcode Command Line Tools
```bash
# Check if installed
xcode-select -p

# If not installed, run:
xcode-select --install
```

### Run on iOS Simulator

1. **Navigate to mobile app:**
   ```bash
   cd /Users/OceanCyber/Downloads/myxcrow/apps/mobile
   ```

2. **Install dependencies (if not done):**
   ```bash
   pnpm install
   ```

3. **Start Expo and open iOS simulator:**
   ```bash
   pnpm ios
   ```
   
   Or manually:
   ```bash
   pnpm start
   # Then press 'i' in the terminal
   ```

4. **First time setup:**
   - Expo will automatically install Expo Go on the simulator
   - The app will launch automatically
   - Subsequent runs are faster

### Troubleshooting iOS

**Simulator not found:**
```bash
# List available simulators
xcrun simctl list devices

# Boot a specific simulator
xcrun simctl boot "iPhone 15 Pro"
```

**Port already in use:**
```bash
# Kill process on port 8081
lsof -ti:8081 | xargs kill -9
```

---

## 🤖 Option 3: Android Emulator (Android Studio Required)

### Prerequisites
- ✅ Android Studio installed (you have this)
- ✅ Android SDK
- ✅ Android Emulator (AVD)

### Setup Android Studio

1. **Open Android Studio**

2. **Install Android SDK:**
   - Go to: `Android Studio` → `Settings` → `Appearance & Behavior` → `System Settings` → `Android SDK`
   - Install:
     - Android 13.0 (API 33) or higher
     - Android SDK Build-Tools
     - Android SDK Platform-Tools
     - Android Emulator

3. **Add to PATH (if not already):**
   ```bash
   # Add to ~/.zshrc or ~/.bash_profile
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   
   # Reload shell
   source ~/.zshrc
   ```

4. **Verify installation:**
   ```bash
   adb --version
   emulator -list-avds
   ```

### Create Android Virtual Device (AVD)

1. **Open Android Studio**
2. **Go to:** `Tools` → `Device Manager`
3. **Click:** `Create Device`
4. **Select:** Pixel 7 or Pixel 8 (recommended)
5. **System Image:** Android 13 (API 33) or higher
6. **Finish** and note the AVD name

### Run on Android Emulator

1. **Start the emulator first:**
   ```bash
   # List available AVDs
   emulator -list-avds
   
   # Start specific AVD (replace with your AVD name)
   emulator -avd Pixel_7_API_33 &
   ```

2. **Navigate to mobile app:**
   ```bash
   cd /Users/OceanCyber/Downloads/myxcrow/apps/mobile
   ```

3. **Start Expo and open Android:**
   ```bash
   pnpm android
   ```
   
   Or manually:
   ```bash
   pnpm start
   # Then press 'a' in the terminal
   ```

4. **First time setup:**
   - Expo will install Expo Go on the emulator
   - The app will launch automatically

### Troubleshooting Android

**Emulator not detected:**
```bash
# Check if adb can see the device
adb devices

# Restart adb server
adb kill-server
adb start-server
```

**Build fails:**
```bash
# Clear cache
cd apps/mobile
rm -rf node_modules
pnpm install
```

**Metro bundler issues:**
```bash
# Clear Metro cache
pnpm start --clear
```

---

## 🏗️ Option 4: Build Standalone Apps (Production-Like)

### For iOS (Requires Apple Developer Account)

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```

3. **Configure project:**
   ```bash
   cd /Users/OceanCyber/Downloads/myxcrow/apps/mobile
   eas build:configure
   ```

4. **Build for iOS:**
   ```bash
   # Development build (can run on simulator)
   eas build --platform ios --profile development
   
   # Production build (for App Store)
   eas build --platform ios --profile production
   ```

5. **Install on simulator:**
   ```bash
   # After build completes, download .app file
   # Drag and drop onto simulator
   ```

### For Android

1. **Build APK (for testing):**
   ```bash
   cd /Users/OceanCyber/Downloads/myxcrow/apps/mobile
   eas build --platform android --profile preview
   ```

2. **Build AAB (for Play Store):**
   ```bash
   eas build --platform android --profile production
   ```

3. **Install APK on emulator:**
   ```bash
   # After build completes, download APK
   adb install path/to/your-app.apk
   ```

---

## 🔧 Configuration for Testing

### 1. Update API URL

Edit `/Users/OceanCyber/Downloads/myxcrow/apps/mobile/.env`:

```bash
# For testing with production API
EXPO_PUBLIC_API_BASE_URL=https://myxcrow-bp-api.onrender.com/api

# For testing with local API
# EXPO_PUBLIC_API_BASE_URL=http://localhost:4000/api

# For testing with local API from physical device
# EXPO_PUBLIC_API_BASE_URL=http://YOUR_COMPUTER_IP:4000/api
```

**To find your computer's IP:**
```bash
# On Mac
ifconfig | grep "inet " | grep -v 127.0.0.1
```

### 2. Restart after changing .env

```bash
# Stop the server (Ctrl+C)
# Clear cache and restart
pnpm start --clear
```

---

## 📋 Testing Checklist

### Basic Functionality
- [ ] App launches successfully
- [ ] Registration works
- [ ] Login works
- [ ] Dashboard loads
- [ ] Can create escrow
- [ ] Can view escrows
- [ ] Wallet top-up flow works
- [ ] Profile loads

### Platform-Specific
- [ ] iOS: Face ID/Touch ID works (if enabled)
- [ ] Android: Fingerprint works (if enabled)
- [ ] Camera permissions work
- [ ] Photo library access works
- [ ] Push notifications work

### UI/UX
- [ ] Navigation is smooth
- [ ] Forms validate correctly
- [ ] Loading states show
- [ ] Error messages display
- [ ] Toast notifications appear

---

## 🚀 Recommended Testing Flow

### Day 1: Quick Testing (Expo Go)
1. Use Expo Go on your physical phone
2. Test core flows: register, login, create escrow
3. Identify any critical bugs

### Day 2: Simulator Testing
1. Test on iOS Simulator (iPhone 15 Pro)
2. Test on Android Emulator (Pixel 7)
3. Test all features thoroughly
4. Fix any platform-specific issues

### Day 3: Build Testing
1. Build development builds for both platforms
2. Test on real devices
3. Performance testing
4. Final polish

---

## 🐛 Common Issues & Solutions

### Issue: "Unable to resolve module"
```bash
cd apps/mobile
rm -rf node_modules
pnpm install
pnpm start --clear
```

### Issue: "Port 8081 already in use"
```bash
lsof -ti:8081 | xargs kill -9
```

### Issue: "Android emulator not found"
```bash
# Make sure emulator is running
emulator -list-avds
emulator -avd YOUR_AVD_NAME &

# Wait for it to fully boot, then
pnpm android
```

### Issue: "iOS simulator not found"
```bash
# Open Xcode
# Go to: Xcode → Open Developer Tool → Simulator
# Then run: pnpm ios
```

### Issue: "API connection failed"
- Check `.env` file has correct API URL
- If using localhost, use your computer's IP address
- Restart Expo: `pnpm start --clear`

---

## 📱 Physical Device Testing

### iOS (via Expo Go)
1. Install Expo Go from App Store
2. Make sure phone and computer are on same WiFi
3. Scan QR code from terminal
4. App loads on your phone

### Android (via Expo Go)
1. Install Expo Go from Play Store
2. Make sure phone and computer are on same WiFi
3. Scan QR code from Expo Go app
4. App loads on your phone

### For Production Testing (without Expo Go)
- Use EAS Build to create development builds
- Install via TestFlight (iOS) or direct APK (Android)

---

## 🎯 Next Steps

1. **Start with Expo Go** (easiest, fastest)
2. **Test on simulators** (iOS + Android)
3. **Fix any bugs** found during testing
4. **Build standalone apps** when ready for production
5. **Submit to App Store** and **Play Store**

---

## 📚 Useful Commands

```bash
# Start development server
pnpm start

# Start with cache cleared
pnpm start --clear

# Run on iOS simulator
pnpm ios

# Run on Android emulator
pnpm android

# Type check
pnpm type-check

# Lint code
pnpm lint

# Install dependencies
pnpm install
```

---

## 🆘 Need Help?

- **Expo Docs:** https://docs.expo.dev
- **React Native Docs:** https://reactnative.dev
- **EAS Build:** https://docs.expo.dev/build/introduction/

---

**Ready to test!** Start with `pnpm start` and press `i` for iOS or `a` for Android! 🚀
