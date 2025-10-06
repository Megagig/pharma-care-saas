#!/bin/bash

echo "==================================="
echo "Environment Verification Script"
echo "==================================="
echo ""

# Check if .env.local exists
if [ -f "frontend/.env.local" ]; then
    echo "✅ frontend/.env.local exists"
    echo "Contents:"
    cat frontend/.env.local
else
    echo "❌ frontend/.env.local does NOT exist"
    echo "Creating it now..."
    cat > frontend/.env.local << 'EOF'
# Local Development Environment Variables
VITE_API_BASE_URL=http://localhost:5000/api
VITE_API_URL=http://localhost:5000
VITE_FRONTEND_URL=http://localhost:5173
EOF
    echo "✅ Created frontend/.env.local"
fi

echo ""
echo "==================================="
echo "Backend Health Check"
echo "==================================="
BACKEND_HEALTH=$(curl -s http://localhost:5000/api/health 2>&1)
if [ $? -eq 0 ]; then
    echo "✅ Backend is running"
    echo "Response: $BACKEND_HEALTH"
else
    echo "❌ Backend is NOT running"
    echo "Please start it with: cd backend && npm run dev"
fi

echo ""
echo "==================================="
echo "Auth Route Check"
echo "==================================="
AUTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{"email":"test","password":"test"}')
if [ "$AUTH_CHECK" = "401" ]; then
    echo "✅ Auth route is working (401 = route exists, credentials invalid)"
elif [ "$AUTH_CHECK" = "404" ]; then
    echo "❌ Auth route NOT FOUND (404)"
else
    echo "⚠️  Auth route returned: $AUTH_CHECK"
fi

echo ""
echo "==================================="
echo "Next Steps"
echo "==================================="
echo "1. Stop frontend (Ctrl+C)"
echo "2. Start frontend: cd frontend && npm run dev"
echo "3. Clear browser cache (F12 → Application → Clear site data)"
echo "4. Try logging in at http://localhost:5173/login"
echo ""
echo "In browser console, verify:"
echo "  console.log(import.meta.env.VITE_API_BASE_URL)"
echo "  Should show: http://localhost:5000/api"
echo "==================================="
