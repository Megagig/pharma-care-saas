#!/bin/bash

echo "🔄 Restarting Frontend Development Server"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Find and kill existing Vite processes
echo "1️⃣  Stopping existing Vite processes..."
VITE_PIDS=$(ps aux | grep 'vite --force --port 5173' | grep -v grep | awk '{print $2}')

if [ -z "$VITE_PIDS" ]; then
    echo -e "${YELLOW}⚠${NC} No Vite process found running"
else
    for PID in $VITE_PIDS; do
        echo -e "${GREEN}✓${NC} Killing Vite process: $PID"
        kill $PID 2>/dev/null || kill -9 $PID 2>/dev/null
    done
    sleep 2
fi
echo ""

# Check if frontend directory exists
if [ ! -d "frontend" ]; then
    echo -e "${RED}✗${NC} frontend directory not found"
    echo "   Run this script from the project root"
    exit 1
fi

echo "2️⃣  Starting Vite development server..."
echo ""
echo -e "${YELLOW}📝 Note: This will start the server in the background${NC}"
echo -e "${YELLOW}   To see logs, check the terminal or run: cd frontend && npm run dev${NC}"
echo ""

cd frontend

# Start Vite in the background
nohup npm run dev > ../vite-dev.log 2>&1 &
VITE_PID=$!

echo -e "${GREEN}✓${NC} Vite started with PID: $VITE_PID"
echo ""

# Wait a moment for server to start
echo "3️⃣  Waiting for server to start..."
sleep 3

# Check if server is responding
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Frontend server is running on http://localhost:5173"
else
    echo -e "${RED}✗${NC} Frontend server may not have started correctly"
    echo "   Check vite-dev.log for errors"
fi

echo ""
echo "=========================================="
echo ""
echo -e "${GREEN}✅ Frontend restart complete!${NC}"
echo ""
echo "📋 Next steps:"
echo "1. Open browser to http://localhost:5173"
echo "2. Hard refresh: Ctrl+Shift+R or Cmd+Shift+R"
echo "3. Login as super admin"
echo "4. Check console for API request logs"
echo ""
echo "📝 Logs are being written to: vite-dev.log"
echo "   View logs: tail -f vite-dev.log"
echo ""
echo "🛑 To stop the server:"
echo "   kill $VITE_PID"
echo ""
