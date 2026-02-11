#!/bin/bash

# MYXCROW Mobile App - Quick Test Script
# This script helps you quickly start testing the mobile app

set -e

echo "🚀 MYXCROW Mobile App - Quick Test"
echo "=================================="
echo ""

# Navigate to mobile directory
cd "$(dirname "$0")/apps/mobile"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
    echo "✅ Dependencies installed!"
    echo ""
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Creating one..."
    cat > .env << 'EOF'
# Production API
EXPO_PUBLIC_API_BASE_URL=https://myxcrow-bp-api.onrender.com/api
EXPO_PUBLIC_WEB_BASE_URL=https://www.myxcrow.com
EOF
    echo "✅ .env file created!"
    echo ""
fi

echo "📱 Choose your testing platform:"
echo ""
echo "1) iOS Simulator (requires Xcode)"
echo "2) Android Emulator (requires Android Studio)"
echo "3) Expo Go (scan QR code with phone)"
echo "4) Just start server (manual selection)"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "🍎 Starting iOS Simulator..."
        pnpm ios
        ;;
    2)
        echo ""
        echo "🤖 Starting Android Emulator..."
        echo "⚠️  Make sure Android emulator is running first!"
        echo "   Run: emulator -list-avds"
        echo "   Then: emulator -avd YOUR_AVD_NAME &"
        echo ""
        read -p "Press Enter when emulator is ready..."
        pnpm android
        ;;
    3)
        echo ""
        echo "📱 Starting Expo Development Server..."
        echo ""
        echo "📲 Install Expo Go on your phone:"
        echo "   iOS: https://apps.apple.com/app/expo-go/id982107779"
        echo "   Android: https://play.google.com/store/apps/details?id=host.exp.exponent"
        echo ""
        echo "Then scan the QR code that appears..."
        echo ""
        pnpm start
        ;;
    4)
        echo ""
        echo "🎯 Starting development server..."
        echo ""
        echo "Press 'i' for iOS simulator"
        echo "Press 'a' for Android emulator"
        echo "Press 'w' for web browser"
        echo "Press 'r' to reload"
        echo "Press 'c' to clear cache"
        echo ""
        pnpm start
        ;;
    *)
        echo "❌ Invalid choice. Exiting."
        exit 1
        ;;
esac
