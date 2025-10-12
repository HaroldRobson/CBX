#!/bin/bash

echo "🚀 Starting CBX Portals..."
echo ""
echo "📊 Buyer Portal: http://localhost:3000"
echo "🏪 Seller Portal: http://localhost:3002"
echo ""

# Start buyer portal in background
echo "Starting Buyer Portal on port 3000..."
npm run dev &
BUYER_PID=$!

# Wait a moment
sleep 3

# Start seller portal in background 
echo "Starting Seller Portal on port 3002..."
cd seller-portal && npm run dev &
SELLER_PID=$!

# Function to kill both processes on script exit
cleanup() {
    echo ""
    echo "🛑 Stopping both portals..."
    kill $BUYER_PID 2>/dev/null
    kill $SELLER_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

echo ""
echo "✅ Both portals are starting up..."
echo "📊 Buyer Portal: http://localhost:3000 (or next available port)"
echo "🏪 Seller Portal: http://localhost:3002"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait 