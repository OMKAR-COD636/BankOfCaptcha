# Bank Of Captcha - Startup Guide

This document provides a step-by-step guide to starting both the backend and frontend of the Bank Of Captcha application.

## Prerequisites
- **Java Development Kit (JDK) 17** must be installed on your system.
- **Node.js (v18+)** and **npm** must be installed.
- **Maven** is provided via the Maven Wrapper (`mvnw`), but we downloaded a standalone binary `apache-maven-3.9.6` for the backend in case the wrapper isn't configured for Windows perfectly.
- **Docker Desktop** is recommended for the PostgreSQL database. Alternatively, use a local PostgreSQL 16+ server with the same connection values.

## Step 0: Start PostgreSQL

1. Open a terminal in the `BankOfCaptcha` directory.
2. Optionally copy `.env.example` to `.env` and change the development password.
3. Start the database:
   ```cmd
   docker compose up -d postgres
   ```
4. Confirm it is ready:
   ```cmd
   docker compose ps
   ```

The default development database is `bankofcaptcha` on `localhost:5433`. Spring Boot creates or updates its tables automatically when the backend starts. The container itself still uses PostgreSQL's standard port `5432`; `5433` avoids conflicting with a locally installed PostgreSQL server.

If you change `POSTGRES_PASSWORD` or `POSTGRES_PORT`, set the matching values in the terminal that starts Spring Boot:
```cmd
set DB_PASSWORD=your-password
set DB_PORT=5433
set PQC_MASTER_KEY=a-long-random-secret-for-your-demo
```
On macOS/Linux, use `export` instead of `set`. `PQC_MASTER_KEY` wraps the stored prototype PQC private keys; do not use the development default in a deployed environment.

## Step 1: Start the Backend (Java Spring Boot)

1. Open a new terminal window.
2. Navigate to the backend directory:
   ```cmd
   cd d:\finspark26\BankOfCaptcha\backend
   ```
3. Run the Spring Boot application using the provided maven distribution:
   ```cmd
   ..\apache-maven-3.9.6\bin\mvn spring-boot:run
   ```
4. Wait until you see the log message indicating the application has started (e.g., `Started ApiApplication in X seconds`). The backend will run on `http://localhost:8080`.

## Step 2: Start the Frontend (React + Vite)

1. Open a second, new terminal window.
2. Navigate to the frontend directory:
   ```cmd
   cd d:\finspark26\BankOfCaptcha\frontend
   ```
3. Start the Vite development server:
   ```cmd
   npm run dev
   ```
4. The terminal will display the local URL for the frontend, typically `http://localhost:5173`.

## Step 3: Start the AI Misuse Detection Module (Python)

1. Open a third terminal window.
2. Navigate to the AI module directory:
   ```cmd
   cd d:\finspark26\BankOfCaptcha\ai
   ```
3. Install dependencies (you must have Python installed):
   ```cmd
   pip install -r requirements.txt
   ```
4. Set the AI service key used to call the protected integration API (use the same value as `AI_SERVICE_KEY` for Spring Boot):
   ```cmd
   set AI_SERVICE_KEY=bankofcaptcha-local-ai-service-key-change-before-deployment
   ```
5. Run the AI engine:
   ```cmd
   python main.py
   ```
6. The engine will run in the background, analyzing protected audit-event metadata for misuse every minute.

## Step 4: Access the Application

1. Open your web browser and navigate to `http://localhost:5173`.
2. You should see the **BANK OF CAPTCHA** login screen.

## Demo Credentials
The backend uses an in-memory database and pre-populates these demo accounts on startup:
- **Customer Account**: `customer` / `password`
- **Teller Account**: `teller` / `password`
- **Branch Manager**: `branch_manager` / `password`
- **Compliance Officer**: `compliance` / `password`
- **IT Admin**: `it_admin` / `password`
- **Super Admin Account**: `superadmin` / `password`

## Shutting Down
To stop the servers, return to their respective terminal windows and press `Ctrl + C`.

>> test_pqc.py is just for testing, if i am getting response or not and whether they are being signed and encrypted
