#!/bin/bash
set -e

echo "========================================"
echo "   JARVIS Mission Control — Starting"
echo "========================================"

# Load .env if present
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Backend
echo "[1/3] Installing Python dependencies..."
cd backend
pip install -r requirements.txt -q
cd ..

# Frontend
echo "[2/3] Installing Node dependencies..."
cd frontend
npm install --silent
cd ..

echo "[3/3] Launching services..."
echo ""
echo "  Backend  → http://localhost:8000"
echo "  Frontend → http://localhost:5173"
echo "  API Docs → http://localhost:8000/docs"
echo ""

# Start backend in background
cd backend
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd ..

# Start frontend
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "Press Ctrl+C to stop all services."
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped.'" EXIT
wait
