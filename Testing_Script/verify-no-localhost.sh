#!/bin/bash

# Script to verify no hardcoded localhost references in production code

echo "🔍 Checking for hardcoded localhost references in production code..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ISSUES_FOUND=0

# Check frontend source files (excluding test files)
echo "📁 Checking frontend/src (excluding tests)..."
FRONTEND_LOCALHOST=$(grep -r "localhost:5000" frontend/src --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --exclude-dir="__tests__" 2>/dev/null || true)

if [ -n "$FRONTEND_LOCALHOST" ]; then
    echo -e "${RED}❌ Found hardcoded localhost:5000 in frontend source:${NC}"
    echo "$FRONTEND_LOCALHOST"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✅ No hardcoded localhost:5000 found in frontend source${NC}"
fi

echo ""

# Check backend source files (excluding test files)
echo "📁 Checking backend/src (excluding tests)..."
BACKEND_LOCALHOST=$(grep -r "localhost:5173\|localhost:3000" backend/src --include="*.ts" --include="*.js" --exclude-dir="__tests__" 2>/dev/null | grep -v "corsOrigins\|socketCorsOrigins\|connectSrc" || true)

if [ -n "$BACKEND_LOCALHOST" ]; then
    echo -e "${YELLOW}⚠️  Found localhost references in backend (check if they're in CORS config):${NC}"
    echo "$BACKEND_LOCALHOST"
else
    echo -e "${GREEN}✅ No problematic localhost references in backend source${NC}"
fi

echo ""

# Check for environment variable usage
echo "📁 Checking if services use environment variables..."

# Check frontend services
FRONTEND_ENV_USAGE=$(grep -r "import.meta.env.VITE_API_BASE_URL\|VITE_API_BASE_URL" frontend/src/services --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)

if [ "$FRONTEND_ENV_USAGE" -gt 0 ]; then
    echo -e "${GREEN}✅ Frontend services use environment variables ($FRONTEND_ENV_USAGE files)${NC}"
else
    echo -e "${RED}❌ Frontend services may not be using environment variables${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

echo ""

# Check frontend .env file
echo "📁 Checking frontend/.env configuration..."
if [ -f "frontend/.env" ]; then
    FRONTEND_API_URL=$(grep "VITE_API_BASE_URL" frontend/.env | cut -d'=' -f2)
    if [[ "$FRONTEND_API_URL" == *"PharmaPilot-nttq.onrender.com"* ]]; then
        echo -e "${GREEN}✅ Frontend .env configured for production: $FRONTEND_API_URL${NC}"
    else
        echo -e "${RED}❌ Frontend .env not configured for production: $FRONTEND_API_URL${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
else
    echo -e "${RED}❌ frontend/.env file not found${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

echo ""

# Check backend .env file
echo "📁 Checking backend/.env configuration..."
if [ -f "backend/.env" ]; then
    BACKEND_FRONTEND_URL=$(grep "^FRONTEND_URL=" backend/.env | cut -d'=' -f2)
    BACKEND_CORS=$(grep "^CORS_ORIGINS=" backend/.env | cut -d'=' -f2)
    
    if [[ "$BACKEND_FRONTEND_URL" == *"PharmaPilot-nttq.onrender.com"* ]]; then
        echo -e "${GREEN}✅ Backend FRONTEND_URL configured for production: $BACKEND_FRONTEND_URL${NC}"
    else
        echo -e "${YELLOW}⚠️  Backend FRONTEND_URL: $BACKEND_FRONTEND_URL${NC}"
    fi
    
    if [[ "$BACKEND_CORS" == *"PharmaPilot-nttq.onrender.com"* ]]; then
        echo -e "${GREEN}✅ Backend CORS_ORIGINS includes production URL${NC}"
    else
        echo -e "${RED}❌ Backend CORS_ORIGINS missing production URL: $BACKEND_CORS${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
else
    echo -e "${RED}❌ backend/.env file not found${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

echo ""

# Check backend .env.production file
echo "📁 Checking backend/.env.production configuration..."
if [ -f "backend/.env.production" ]; then
    PROD_FRONTEND_URL=$(grep "^FRONTEND_URL=" backend/.env.production | cut -d'=' -f2)
    PROD_CORS=$(grep "^CORS_ORIGINS=" backend/.env.production | cut -d'=' -f2)
    
    if [[ "$PROD_FRONTEND_URL" == *"PharmaPilot-nttq.onrender.com"* ]]; then
        echo -e "${GREEN}✅ Production FRONTEND_URL configured correctly: $PROD_FRONTEND_URL${NC}"
    else
        echo -e "${RED}❌ Production FRONTEND_URL not configured: $PROD_FRONTEND_URL${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
    
    if [[ "$PROD_CORS" == *"PharmaPilot-nttq.onrender.com"* ]]; then
        echo -e "${GREEN}✅ Production CORS_ORIGINS configured correctly${NC}"
    else
        echo -e "${RED}❌ Production CORS_ORIGINS not configured: $PROD_CORS${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
else
    echo -e "${YELLOW}⚠️  backend/.env.production file not found (optional)${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! No hardcoded localhost references found.${NC}"
    echo -e "${GREEN}✅ Configuration is ready for production deployment.${NC}"
    exit 0
else
    echo -e "${RED}❌ Found $ISSUES_FOUND issue(s) that need to be fixed before deployment.${NC}"
    echo ""
    echo "Please review the issues above and fix them before deploying to production."
    exit 1
fi
