#!/bin/bash

echo "🔧 Rebuilding Frontend with License Upload Fix..."
echo ""

cd frontend

echo "1. Building frontend..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "2. Restarting dev server..."
    echo "   Press Ctrl+C to stop the current server, then run:"
    echo "   npm run dev"
    echo ""
    echo "3. After restarting, test the fix:"
    echo "   - Login as pharmacist"
    echo "   - Click 'Clinical Notes'"
    echo "   - Click 'View License Status'"
    echo "   - You should see the upload form!"
    echo ""
else
    echo "❌ Build failed! Check the errors above."
    exit 1
fi
