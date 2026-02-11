# Mobile App Testing - Quick Reference

**Status:** ✅ Ready to Test  
**Platform:** Expo React Native  
**API:** Connected to production (https://myxcrow-bp-api.onrender.com/api)

---

## 🚀 Fastest Way to Test (Recommended)

### Option 1: Use the Quick Start Script

```bash
cd /Users/OceanCyber/Downloads/myxcrow
./test-mobile.sh
```

This interactive script will:
1. Install dependencies (if needed)
2. Create .env file (if needed)
3. Let you choose: iOS, Android, or Expo Go
4. Start the app automatically

### Option 2: Manual Commands

```bash
cd /Users/OceanCyber/Downloads/myxcrow/apps/mobile

# Install dependencies (first time only)
pnpm install

# Start development server
pnpm start

# Then press:
# 'i' for iOS Simulator
# 'a' for Android Emulator
# Or scan QR code with Expo Go app
```

---

## 📱 Testing Options

### 1. Expo Go (Easiest - No Build Required) ⭐ RECOMMENDED

**Setup:**
1. Install Expo Go on your phone:
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Run:
   ```bash
   cd /Users/OceanCyber/Downloads/myxcrow/apps/mobile
   pnpm start
   ```

3. Scan QR code with:
   - iOS: Camera app
   - Android: Expo Go app

**Pros:**
- ✅ Instant testing
- ✅ No build required
- ✅ Hot reload
- ✅ Works on real device

---

### 2. iOS Simulator (Requires Xcode)

**Setup:**
```bash
# Check Xcode Command Line Tools
xcode-select -p

# If not installed:
xcode-select --install
```

**Run:**
```bash
cd /Users/OceanCyber/Downloads/myxcrow/apps/mobile
pnpm ios
```

**Pros:**
- ✅ Test iOS-specific features
- ✅ Fast iteration
- ✅ Debug tools

---

### 3. Android Emulator (Requires Android Studio)

**Setup:**
1. Open Android Studio
2. Go to: Tools → Device Manager
3. Create a device (e.g., Pixel 7)
4. Start the emulator

**Run:**
```bash
# Start emulator first
emulator -list-avds
emulator -avd Pixel_7_API_33 &

# Then run app
cd /Users/OceanCyber/Downloads/myxcrow/apps/mobile
pnpm android
```

**Pros:**
- ✅ Test Android-specific features
- ✅ Fast iteration
- ✅ Debug tools

---

## 🔧 Configuration

### API Connection

The app is configured to use **production API** by default:
```
EXPO_PUBLIC_API_BASE_URL=https://myxcrow-bp-api.onrender.com/api
```

**To change API URL:**
1. Edit `/Users/OceanCyber/Downloads/myxcrow/apps/mobile/.env`
2. Restart Expo: `pnpm start --clear`

**For local testing:**
```bash
# Find your computer's IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# Update .env
EXPO_PUBLIC_API_BASE_URL=http://YOUR_IP:4000/api
```

---

## ✅ What to Test

### Core Features
- [ ] Registration (simplified - no KYC)
- [ ] Login
- [ ] Dashboard loads
- [ ] Create escrow
- [ ] View escrows
- [ ] Wallet top-up
- [ ] Profile view

### Admin Features (if admin user)
- [ ] Admin dashboard
- [ ] KYC review
- [ ] Withdrawal approvals
- [ ] User management
- [ ] Wallet operations

### UI/UX
- [ ] Navigation works
- [ ] Forms validate
- [ ] Loading states show
- [ ] Error messages display
- [ ] Toast notifications work

---

## 🐛 Troubleshooting

### "Unable to resolve module"
```bash
cd /Users/OceanCyber/Downloads/myxcrow/apps/mobile
rm -rf node_modules
pnpm install
pnpm start --clear
```

### "Port 8081 already in use"
```bash
lsof -ti:8081 | xargs kill -9
```

### "Cannot connect to API"
- Check `.env` file
- Verify API URL is correct
- Restart Expo: `pnpm start --clear`

### iOS Simulator not found
```bash
# Open Xcode first
open -a Simulator

# Then run
pnpm ios
```

### Android Emulator not found
```bash
# Make sure emulator is running
adb devices

# If empty, start emulator
emulator -avd YOUR_AVD_NAME &
```

---

## 📚 Useful Commands

```bash
# Start development server
pnpm start

# Clear cache and start
pnpm start --clear

# Run on iOS
pnpm ios

# Run on Android
pnpm android

# Type check
pnpm type-check

# Lint
pnpm lint
```

---

## 📖 Full Documentation

For detailed instructions, see:
- **MOBILE_TESTING_GUIDE.md** - Complete testing guide
- **apps/mobile/README.md** - Mobile app documentation
- **MOBILE_IMPLEMENTATION_COMPLETE.md** - Feature list

---

## 🎯 Recommended Testing Flow

1. **Day 1:** Test with Expo Go on your phone
2. **Day 2:** Test on iOS Simulator
3. **Day 3:** Test on Android Emulator
4. **Day 4:** Fix bugs and polish

---

## 🚀 Quick Start (TL;DR)

```bash
# Easiest way - use the script
cd /Users/OceanCyber/Downloads/myxcrow
./test-mobile.sh

# Or manually
cd apps/mobile
pnpm install
pnpm start
# Then press 'i' for iOS or 'a' for Android
```

---

**Ready to test!** 🎉

Start with Expo Go on your phone for the fastest testing experience!
