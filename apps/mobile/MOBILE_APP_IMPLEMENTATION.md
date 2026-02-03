# Mobile App Implementation Guide

**Date:** January 2026  
**Status:** Phase 2 - In Progress  
**Technology:** React Native with Expo

---

## 📱 Overview

The MYXCROW mobile app is a React Native application built with Expo, providing iOS and Android support for the escrow platform.

## ✅ Completed Features

### 1. Project Setup ✅
- React Native with Expo
- TypeScript configuration
- Navigation structure (Expo Router)
- API client with authentication
- Context providers (Auth, Query)

### 2. Authentication ✅
- Login screen
- Register screen (KYC upload ready)
- Auth context with token management
- Secure token storage (SecureStore)
- Automatic token refresh

### 3. Core Screens ✅
- Dashboard with stats
- Escrows list
- Wallet overview
- Profile screen

### 4. Infrastructure ✅
- API client with interceptors
- React Query integration
- Error handling
- Loading states

---

## 🚧 In Progress / To Implement

### 1. Registration with KYC Upload
- [ ] Camera integration for document capture
- [ ] Image picker for gallery selection
- [ ] Multi-step registration form
- [ ] File upload to backend

### 2. Escrow Management
- [ ] Create escrow screen
- [ ] Escrow details screen
- [ ] Fund escrow
- [ ] Ship/Deliver actions
- [ ] Release funds
- [ ] Dispute creation

### 3. Wallet Features
- [ ] Top-up screen (Paystack integration)
- [ ] Withdrawal request
- [ ] Transaction history details

### 4. Profile Features
- [ ] KYC update screen
- [ ] Settings screen
- [ ] Transaction history screen

### 5. Push Notifications
- [ ] Expo Notifications setup
- [ ] Notification handlers
- [ ] In-app notification center

### 6. Biometric Authentication
- [ ] Face ID / Touch ID integration
- [ ] Quick login option

---

## 🏗️ Architecture

### Project Structure
```
apps/mobile/
├── app/                    # Expo Router pages
│   ├── (auth)/            # Auth screens
│   └── (tabs)/            # Main app (tab navigation)
├── src/
│   ├── lib/               # Utilities
│   │   ├── api-client.ts  # API client
│   │   ├── auth.ts        # Auth helpers
│   │   └── constants.ts   # Constants
│   ├── contexts/          # React contexts
│   │   └── AuthContext.tsx
│   └── hooks/             # Custom hooks
│       ├── useQuery.ts
│       └── useMutation.ts
└── assets/                # Images, fonts
```

### Key Technologies
- **Expo**: React Native framework
- **Expo Router**: File-based routing
- **React Query**: Server state management
- **React Hook Form + Zod**: Form validation
- **SecureStore**: Secure token storage
- **AsyncStorage**: User data storage

---

## 🔐 Authentication Flow

1. User enters credentials
2. API call to `/auth/login`
3. Tokens stored in SecureStore
4. User data stored in AsyncStorage
5. Auth context updates
6. Navigation to dashboard

### Token Management
- Access tokens stored securely in SecureStore
- Automatic refresh on 401 errors
- Queue system for concurrent requests during refresh

---

## 📡 API Integration

### Base Configuration
- Base URL: `EXPO_PUBLIC_API_BASE_URL` (env variable)
- Default: `http://localhost:4000/api`
- Production: `https://api.myxcrow.com/api`

### API Client Features
- Automatic token injection
- Request/response interceptors
- Error handling
- Token refresh logic
- Timeout configuration (30s)

---

## 🎨 UI/UX Guidelines

### Design System
- Primary color: `#3b82f6` (Blue)
- Error color: `#ef4444` (Red)
- Success color: `#059669` (Green)
- Background: `#f5f5f5` (Light gray)
- Card background: `#ffffff` (White)

### Components
- Consistent spacing (8px, 16px, 20px, 24px)
- Border radius: 8px for cards, 6px for buttons
- Typography: System fonts (San Francisco on iOS, Roboto on Android)

---

## 📦 Building for Production

### Prerequisites
1. Expo account
2. EAS CLI: `npm install -g eas-cli`
3. App Store Connect account (iOS)
4. Google Play Console account (Android)

### Build Commands

#### iOS
```bash
cd apps/mobile
eas build --platform ios
```

#### Android
```bash
cd apps/mobile
eas build --platform android
```

### Configuration
- Update `app.json` with proper bundle identifiers
- Add app icons and splash screens
- Configure push notification certificates
- Set up environment variables in EAS

---

## 🧪 Testing

### Development
```bash
# Start Expo dev server
pnpm start

# Run on iOS simulator
pnpm ios

# Run on Android emulator
pnpm android
```

### Type Checking
```bash
pnpm type-check
```

### Linting
```bash
pnpm lint
```

---

## 🔔 Push Notifications Setup

### iOS
1. Generate APNs certificate in Apple Developer
2. Upload to Expo
3. Configure in `app.json`

### Android
1. Firebase project setup
2. Google Services JSON
3. Configure in `app.json`

### Implementation
```typescript
import * as Notifications from 'expo-notifications';

// Request permissions
const { status } = await Notifications.requestPermissionsAsync();

// Register for push notifications
const token = await Notifications.getExpoPushTokenAsync();
```

---

## 📝 Next Steps

1. **Complete Registration Flow**
   - Implement camera/image picker
   - Multi-step form
   - File upload

2. **Escrow Management**
   - Create escrow form
   - Detail screens
   - Action buttons

3. **Paystack Integration**
   - Payment flow
   - WebView for payment
   - Callback handling

4. **Push Notifications**
   - Setup Expo Notifications
   - Handle notifications
   - Update UI

5. **Testing & Polish**
   - Test on real devices
   - Performance optimization
   - UI/UX improvements

---

## 🐛 Known Issues

- Tab bar icons are placeholders (need proper icon library)
- Some navigation routes not yet implemented
- Push notifications not yet configured
- Paystack integration pending

---

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [React Query Documentation](https://tanstack.com/query/latest)

---

**Last Updated:** January 2026
