#!/bin/bash

# Bible Study App Startup Script

echo "🚀 Starting Bible Study App..."
echo ""

# Check if we're in the correct directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Load environment variables from .env file
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
    echo "✅ Loaded .env file"
else
    echo "⚠️  Warning: .env file not found"
fi

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Start backend
echo "📡 Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "🎨 Starting frontend server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Servers started!"
echo ""
echo "📖 Study Page (Public):  http://localhost:5173/"
echo "✏️  Edit Page (Protected): http://localhost:5173/edit"
echo "    Password: ${AUTH_PASSWORD:-[Check .env file]}"
echo ""
echo "🔧 API Server: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for background processes
wait
