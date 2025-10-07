#!/bin/bash

# Development startup script for PharmacyCopilotSaaS
echo "🚀 Starting PharmacyCopilotSaaS Development Environment..."

# Check if .env files exist
echo "📋 Checking environment configuration..."

if [ ! -f "./backend/.env" ]; then
    echo "⚠️  Backend .env file not found. Creating from example..."
    cp ./backend/.env.example ./backend/.env
    echo "✅ Created backend/.env file. Please update with your actual values."
fi

if [ ! -f "./frontend/.env" ]; then
    echo "⚠️  Frontend .env file not found. Creating basic config..."
    cat > ./frontend/.env << EOL
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=PharmacyCopilotSaaS
VITE_APP_VERSION=1.0.0
EOL
    echo "✅ Created frontend/.env file."
fi

# Install dependencies if node_modules don't exist
echo "📦 Installing dependencies..."

if [ ! -d "./backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

if [ ! -d "./frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

echo "🔧 Dependencies installed successfully!"

# Start the applications
echo "🚀 Starting applications..."
echo "📊 Backend will run on: http://localhost:5000"
echo "🎨 Frontend will run on: http://localhost:5173"
echo ""
echo "To start the applications, run:"
echo "  Backend:  cd backend && npm run dev"
echo "  Frontend: cd frontend && npm run dev"
echo ""
echo "📚 Don't forget to:"
echo "  1. Update your .env files with actual values"
echo "  2. Start your MongoDB database"
echo "  3. Configure Nomba API credentials (optional for development)"
echo ""
echo "✅ Setup complete! Happy coding! 🎉"
