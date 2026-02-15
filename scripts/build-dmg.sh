#!/bin/bash
# Build script for Tabl Viz macOS DMG
# Run this on your Mac: ./scripts/build-dmg.sh

set -e

echo "🔧 Tabl Viz DMG Builder"
echo "========================"

# Check we're on macOS
if [[ "$(uname)" != "Darwin" ]]; then
    echo "❌ This script must be run on macOS"
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required. Install from https://nodejs.org"
    exit 1
fi

echo "📦 Node.js $(node -v)"
echo "📦 npm $(npm -v)"

# Install dependencies
echo ""
echo "📥 Installing dependencies..."
npm install

# Build React app
echo ""
echo "🏗️  Building React production app..."
npm run build

# Build Electron DMG
echo ""
echo "📀 Building macOS DMG..."
npx electron-builder --mac dmg

echo ""
echo "✅ Build complete!"
echo "📁 DMG file is in the dist/ directory"
ls -lh dist/*.dmg 2>/dev/null || echo "Check dist/ for the output file"
