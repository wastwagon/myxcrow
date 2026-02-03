# MYXCROW Mobile App

React Native mobile application for the MYXCROW escrow platform.

## 🚀 Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for iOS development) or Android Studio (for Android development)

### Installation

1. Install dependencies:
```bash
cd apps/mobile
pnpm install
```

2. Configure environment variables:
Create a `.env` file in `apps/mobile/`:
```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000/api
# Optional: web app URL for Terms, Privacy, Support links (default: https://myxcrow.com)
# EXPO_PUBLIC_WEB_BASE_URL=http://localhost:3005
```

3. Start the development server:
```bash
pnpm start
```

4. Run on your device/simulator:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your physical device

## 📱 Features

### ✅ Implemented (MVP)

- **Authentication**
  - Login/Register
  - Biometric authentication (Face ID / Touch ID)
  - KYC upload (camera integration)
  
- **Transactions**
  - Create escrow
  - View escrows
  - Approve/release funds
  - Dispute management

- **Payments**
  - Wallet top-up (via Paystack)
  - Payment history
  - Transaction status

- **Notifications**
  - Push notifications
  - SMS notifications (via backend)
  - In-app notifications

- **Profile**
  - View profile
  - Update KYC
  - Transaction history

## 🏗️ Project Structure

```
apps/mobile/
├── app/                    # Expo Router pages
│   ├── (auth)/            # Authentication screens
│   │   ├── login.tsx
│   │   └── register.tsx
│   └── (tabs)/            # Main app screens
│       ├── dashboard.tsx
│       ├── escrows.tsx
│       ├── wallet.tsx
│       └── profile.tsx
├── src/
│   ├── lib/               # Utilities
│   │   ├── api-client.ts  # API client with interceptors
│   │   ├── auth.ts        # Auth utilities
│   │   └── constants.ts   # Constants and helpers
│   ├── contexts/          # React contexts
│   │   └── AuthContext.tsx
│   └── hooks/             # Custom hooks
│       ├── useQuery.ts
│       └── useMutation.ts
├── assets/                # Images, fonts, etc.
├── app.json              # Expo configuration
├── package.json
└── tsconfig.json
```

## 🔐 Authentication

The app uses:
- **SecureStore** (Expo) for storing JWT tokens securely
- **AsyncStorage** for user data
- **JWT tokens** with automatic refresh
- **Biometric authentication** (Face ID / Touch ID) for quick login

## 📡 API Integration

The app connects to the same backend API as the web app:
- Base URL: `EXPO_PUBLIC_API_BASE_URL` (default: `http://localhost:4000/api`)
- Authentication: Bearer token in Authorization header
- Automatic token refresh on 401 errors

## 🎨 UI/UX

- Native iOS and Android components
- Responsive design
- Loading states and error handling
- Toast notifications
- Form validation with React Hook Form + Zod

## 🔔 Push Notifications

Push notifications are configured via Expo Notifications:
- iOS: Requires APNs certificate
- Android: Uses FCM (Firebase Cloud Messaging)

## 📦 Building for Production

### iOS

1. Configure in `app.json`:
   - Update `bundleIdentifier`
   - Add app icons and splash screens

2. Build:
```bash
eas build --platform ios
```

### Android

1. Configure in `app.json`:
   - Update `package`
   - Add app icons and splash screens

2. Build:
```bash
eas build --platform android
```

## 🧪 Testing

```bash
# Type checking
pnpm type-check

# Linting
pnpm lint
```

## 📝 Notes

- The app uses Expo Router for file-based routing
- All API calls are made through the centralized `apiClient`
- State management uses React Query for server state
- Forms use React Hook Form with Zod validation

## 🚧 Roadmap

- [ ] Complete all escrow management screens
- [ ] Implement Paystack payment flow
- [ ] Add push notification handling
- [ ] Implement dispute management UI
- [ ] Add offline support
- [ ] Performance optimizations
- [ ] App Store and Play Store submission

---

**Part of the MYXCROW platform project**
