#!/bin/bash

# Script to remove debug console.log statements from MTR files
# Keeps console.error and console.warn for production error handling

echo "🧹 Cleaning up console.log debug statements..."

# Backend files
echo "📦 Cleaning backend files..."

# Frontend files - Remove console.log but keep console.error and console.warn
echo "🎨 Cleaning frontend mtrService.ts..."
sed -i "/console\.log(/d" frontend/src/services/mtrService.ts

echo "🏪 Cleaning frontend mtrStore.ts..."
sed -i "/console\.log(/d" frontend/src/stores/mtrStore.ts

echo "🔧 Cleaning frontend apiHelpers.ts..."
sed -i "/console\.log(/d" frontend/src/utils/apiHelpers.ts

echo "✅ Cleanup complete!"
echo "ℹ️  Note: console.error and console.warn statements have been preserved for production error handling."
