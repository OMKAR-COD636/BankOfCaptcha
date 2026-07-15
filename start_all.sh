#!/bin/bash

# BankOfCaptcha Local Startup Script
# This script starts the Database, Backend, Frontend, and AI Module concurrently.

echo "========================================="
echo " Starting Bank of Captcha Local Services "
echo "========================================="

# 1. Start PostgreSQL via Docker Compose V2
echo "[1/4] Starting PostgreSQL Database..."
docker compose up -d postgres
echo "Waiting 5 seconds for Database to initialize..."
sleep 5

# 2. Start Spring Boot Backend
echo "[2/4] Starting Spring Boot Backend (Java 17)..."
cd backend
mvn spring-boot:run > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..
echo "Backend started (PID: $BACKEND_PID). Logs at backend.log"

# 3. Start React Frontend
echo "[3/4] Starting React Frontend (Vite)..."
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
echo "Frontend started (PID: $FRONTEND_PID). Logs at frontend.log"

# 4. Start Python AI Module
echo "[4/4] Starting Python AI Module (LSTM)..."
echo "Waiting 15 seconds for Backend to be fully ready before starting AI..."
sleep 15
cd ai
# Try to activate conda if available
eval "$(conda shell.bash hook 2>/dev/null)" || true
conda activate FinSpark 2>/dev/null || true
python3 main.py > ../ai.log 2>&1 &
AI_PID=$!
cd ..
echo "AI Module started (PID: $AI_PID). Logs at ai.log"

echo "========================================="
echo " ALL SERVICES RUNNING!"
echo " Frontend: http://localhost:5173"
echo " Backend API: http://localhost:8080"
echo " Database: localhost:5433"
echo ""
echo " Press Ctrl+C to stop all services and exit."
echo "========================================="

# Trap Ctrl+C to cleanly kill background processes
trap "echo -e '\nStopping all services...'; kill $BACKEND_PID $FRONTEND_PID $AI_PID 2>/dev/null; docker compose stop postgres; echo 'Done.'; exit" SIGINT

# Keep the script running
wait
