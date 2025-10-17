#!/bin/bash

echo "🔄 Restarting Backend Server"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Find and kill existing backend processes
echo "1️⃣  Stopping existing backend processes..."
BACKEND_PIDS=$(ps aux | grep -E "node.*backend|ts-node.*server" | grep -v grep | awk '{print $2}')

if [ -z "$BACKEND_PIDS" ]; then
    echo -e "${YELLOW}⚠${NC} No backend process found running"
else
    for PID in $BACKEND_PIDS; do
        echo -e "${GREEN}✓${NC} Killing backend process: $PID"
        kill $PID 2>/dev/null || kill -9 $PID 2>/dev/null
    done
    sleep 2
fi
echo ""

# Check if backend directory exists
if [ ! -d "backend" ]; then
    echo -e "${RED}✗${NC} backend directory not found"
    echo "   Run this script from the project root"
    exit 1
fi

echo "2️⃣  Building backend..."
cd backend
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}✗${NC} Build failed"
    exit 1
fi
echo ""

echo "3️⃣  Starting backend server..."
echo ""
echo -e "${YELLOW}📝 Note: This will start the server in the background${NC}"
echo -e "${YELLOW}   To see logs, check backend-startup.log${NC}"
echo ""

# Start backend in the background
nohup npm run dev > ../backend-startup.log 2>&1 &
BACKEND_PID=$!

echo -e "${GREEN}✓${NC} Backend started with PID: $BACKEND_PID"
echo ""

# Wait a moment for server to start
echo "4️⃣  Waiting for server to start..."
sleep 5

# Check if server is responding
if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Backend server is running on http://localhost:5000"
else
    echo -e "${RED}✗${NC} Backend server may not have started correctly"
    echo "   Check backend-startup.log for errors"
fi

echo ""
echo "=========================================="
echo ""
echo -e "${GREEN}✅ Backend restart complete!${NC}"
echo ""
echo "📋 Next steps:"
echo "1. Check API health: curl http://localhost:5000/api/health"
echo "2. Monitor logs: tail -f backend-startup.log"
echo ""
echo "🛑 To stop the server:"
echo "   kill $BACKEND_PID"
echo ""
