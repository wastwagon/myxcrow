#!/bin/bash

# MYXCROW Mobile App - Automated Setup & Test
# This script will set up everything and launch the iOS simulator for you

set -e

echo "🚀 MYXCROW Mobile App - Automated Setup"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -d "apps/mobile" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📦 Step 1: Installing pnpm (you may need to enter your password)..."
echo ""
if ! command -v pnpm &> /dev/null; then
    sudo npm install -g pnpm
    echo "✅ pnpm installed!"
else
    echo "✅ pnpm already installed!"
fi
echo ""

echo "📦 Step 2: Installing mobile app dependencies..."
echo "   (This may take 2-3 minutes...)"
echo ""
cd apps/mobile
pnpm install
echo "✅ Dependencies installed!"
echo ""

echo "📱 Step 3: Starting iOS Simulator..."
echo "   (The simulator will open automatically)"
echo ""
echo "⏳ Please wait while the app builds and loads..."
echo "   This may take 1-2 minutes on first run."
echo ""
echo "📝 What to test:"
echo "   1. Register a new account"
echo "   2. Login"
echo "   3. Create an escrow"
echo "   4. Top-up wallet (Paystack)"
echo "   5. Release funds"
echo "   6. Open a dispute"
echo ""
echo "Press Ctrl+C to stop the app when done testing."
echo ""
echo "Starting in 3 seconds..."
sleep 3

# Start the iOS app
pnpm ios
