#!/bin/bash

# MYXCROW Mobile App - Build & Submit Helper
# This script helps you build and submit your app to App Store and Play Store

set -e

echo "🚀 MYXCROW Mobile App - Build & Submit"
echo "======================================"
echo ""

# Navigate to mobile directory
cd "$(dirname "$0")/apps/mobile"

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "📦 EAS CLI not found. Installing..."
    npm install -g eas-cli
    echo "✅ EAS CLI installed!"
    echo ""
fi

echo "📱 What would you like to do?"
echo ""
echo "1) Test on iOS Simulator (Quick)"
echo "2) Test on Android Emulator (Quick)"
echo "3) Build for iOS App Store"
echo "4) Build for Android Play Store"
echo "5) Build for Both Platforms"
echo "6) Submit to iOS App Store"
echo "7) Submit to Android Play Store"
echo "8) Check Build Status"
echo ""
read -p "Enter your choice (1-8): " choice

case $choice in
    1)
        echo ""
        echo "🍎 Starting iOS Simulator..."
        echo ""
        pnpm ios
        ;;
    2)
        echo ""
        echo "🤖 Starting Android Emulator..."
        echo ""
        echo "⚠️  Make sure Android emulator is running first!"
        echo "   Open Android Studio → Device Manager → Start an emulator"
        echo ""
        read -p "Press Enter when emulator is ready..."
        pnpm android
        ;;
    3)
        echo ""
        echo "🍎 Building for iOS App Store..."
        echo ""
        echo "⚠️  This will take 15-20 minutes"
        echo "⚠️  You'll need Apple Developer Account credentials"
        echo ""
        read -p "Continue? (y/n): " confirm
        if [ "$confirm" = "y" ]; then
            eas build --platform ios --profile production
        fi
        ;;
    4)
        echo ""
        echo "🤖 Building for Android Play Store..."
        echo ""
        echo "⚠️  This will take 10-15 minutes"
        echo ""
        read -p "Continue? (y/n): " confirm
        if [ "$confirm" = "y" ]; then
            eas build --platform android --profile production
        fi
        ;;
    5)
        echo ""
        echo "📱 Building for Both Platforms..."
        echo ""
        echo "⚠️  This will take 25-35 minutes"
        echo "⚠️  You'll need both Apple and Google credentials"
        echo ""
        read -p "Continue? (y/n): " confirm
        if [ "$confirm" = "y" ]; then
            eas build --platform all --profile production
        fi
        ;;
    6)
        echo ""
        echo "🍎 Submitting to iOS App Store..."
        echo ""
        echo "⚠️  Make sure you have a successful iOS build first"
        echo ""
        read -p "Continue? (y/n): " confirm
        if [ "$confirm" = "y" ]; then
            eas submit --platform ios
        fi
        ;;
    7)
        echo ""
        echo "🤖 Submitting to Android Play Store..."
        echo ""
        echo "⚠️  Make sure you have a successful Android build first"
        echo ""
        read -p "Continue? (y/n): " confirm
        if [ "$confirm" = "y" ]; then
            eas submit --platform android
        fi
        ;;
    8)
        echo ""
        echo "📊 Recent Builds:"
        echo ""
        eas build:list
        ;;
    *)
        echo "❌ Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "✅ Done!"
echo ""
echo "📚 For more help, see: APP_STORE_SUBMISSION_GUIDE.md"
