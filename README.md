# BankOfCaptcha

BankOfCaptcha is a demo-ready banking portal that combines customer onboarding, branch operations, audit logging, and AI-assisted anomaly detection in a single workspace. The project is built as a full-stack application with a Java Spring Boot backend, a React/Vite frontend, a PostgreSQL database, and a Python-based AI monitoring module.

## Project overview

This application demonstrates:
- A secure login experience for customers and staff
- Role-based access for customer, teller, branch manager, compliance officer, IT admin, and super admin users
- KYC application handling for account creation
- Transfer and maker-checker workflows for branch-level operations
- Audit logging with tamper-evident verification using post-quantum cryptography primitives
- AI-driven alert ingestion and containment for suspicious activity

## Tech stack

### Backend
- Java 17
- Spring Boot 3.2.4
- Spring Security
- Spring Data JPA
- PostgreSQL
- JWT-based authentication
- Bouncy Castle post-quantum cryptography support

### Frontend
- React 19
- Vite
- React Router
- Lucide icons

### AI module
- Python 3
- Requests
- scikit-learn
- pandas
- APScheduler

## Project structure

- backend/: Spring Boot API and business logic
- backend/src/main/java/: controllers, services, repositories, models, security configuration
- backend/src/main/resources/application.properties: backend configuration
- frontend/: React dashboard and login UI
- ai/: Python service for misuse detection and AI alerting
- docker-compose.yml: PostgreSQL container setup
- test_pqc.py, test_maker_checker.py, test_risk_engine.py: validation and demo scripts

## Prerequisites

Make sure the following tools are installed:
- Docker Desktop or Docker Engine with Compose
- Java 17 and Maven
- Node.js 18+ and npm
- Python 3.10+ and pip

## Quick start

### 1. Start the database

From the project root, start PostgreSQL:

```bash
docker compose down -v
docker compose up -d postgres
docker compose ps
```

The default development database is available at localhost:5433.

### 2. Start the backend

```bash
cd backend
mvn spring-boot:run
```

The backend runs on http://localhost:8080.

### 3. Start the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on http://localhost:5173.

### 4. Start the AI monitoring module

In a third terminal:

```bash
cd ai
pip install -r requirements.txt
```

Set the shared AI service key before launching the module:

```bash
set AI_SERVICE_KEY=bankofcaptcha-local-ai-service-key-change-before-deployment
```

On macOS/Linux, use export instead of set.

```bash
python main.py
```

## Demo accounts

The backend seeds the following demo users on first startup:

| Role | Username | Password |
| --- | --- | --- |
| Customer | customer | password |
| Teller | teller | password |
| Branch Manager | branch_manager | password |
| Compliance Officer | compliance | password |
| IT Admin | it_admin | password |
| Super Admin | superadmin | password |

## Key features in the current implementation

- Login and registration flow with KYC submission
- Customer account dashboard with balance view
- Teller workflow for transfer submissions and KYC approval
- Branch manager workflow for transfer request approval and rejection
- Super admin dashboard for AI alerts, branch management, staff assignment, and audit logs
- Compliance and admin access to audit logs and integrity verification
- AI integration endpoints protected with an X-AI-Service-Key header
- PQC-backed audit signing and verification flow

## Important environment variables

The backend reads configuration from backend/src/main/resources/application.properties. The most relevant variables are:

- DB_URL, DB_USERNAME, DB_PASSWORD, DB_PORT
- PQC_MASTER_KEY
- AI_SERVICE_KEY

These default to local development values, but they should be changed before any non-demo deployment.

## API highlights

The backend exposes the following main API groups:

- /api/auth/login and /api/auth/register
- /api/accounts
- /api/transactions/transfer and /api/transactions/requests
- /api/audit/logs and /api/audit/logs/{id}/verify
- /api/ai/audit-events and /api/ai/alerts
- /api/admin/staff and /api/admin/alerts/{id}/contain

## Notes for development and testing

- If you need to reset the database, run docker compose down -v before starting it again.
- The frontend currently targets the backend at http://localhost:8080.
- test_pqc.py is intended to confirm that PQC signing and encryption flows are working.
- test_maker_checker.py and test_risk_engine.py are lightweight validation scripts for the transfer and risk evaluation workflows.

## Getting started in the browser

Open http://localhost:5173 after the frontend and backend are running. Use the login form to sign in with one of the seeded demo accounts.
