# BankOfCaptcha - Project Setup and Status Guide

## 1. What Has Changed (Recent Updates)
Our project has been upgraded from a basic Spring Boot demo to a secure, competition-ready prototype with Post-Quantum Cryptography (PQC) and a persistent database.

**Key Additions and Changes:**
*   **Database Migration:** Moved from an ephemeral in-memory H2 database to a persistent **PostgreSQL 16** database running via Docker Compose. It's configured to run on host port `5433` to avoid conflicts with any existing local PostgreSQL instances. This setup works universally across Windows, macOS, and Linux.
*   **Post-Quantum Cryptography (PQC):** 
    *   Integrated **Bouncy Castle PQC**.
    *   **ML-DSA-65** is used to digitally sign every audit event, ensuring tamper evidence.
    *   **ML-KEM-768** is used to securely derive an encryption key to encrypt the audit logs (AES-256-GCM) against future quantum threats.
*   **Enhanced Security:**
    *   Previously public endpoints for AI integration and Audit Logs are now secured.
    *   Audit logs require compliance/admin roles.
    *   AI endpoints expect an `X-AI-Service-Key` for access.
*   **AI & Containment Foundations:** Added models and controllers for AI Alerts (`AiAlert`), allowing external AI services to securely submit anomalies, and super-admins to contain/suspend users.
*   **Bug Fixes:** Resolved an issue where PostgreSQL failed to handle PQC Base64 strings correctly by changing `@Lob` annotations to standard `TEXT` columns.

---

## 2. Prerequisites (Cross-Platform)
To run this project on your machine (Windows, macOS, or Linux), ensure you have the following installed:
1.  **Docker & Docker Compose:**
    *   **Windows & macOS:** Install [Docker Desktop](https://www.docker.com/products/docker-desktop/). Make sure the Docker application is open and running in the background before proceeding.
    *   **Linux:** Install Docker Engine and Docker Compose (e.g., `sudo apt install docker.io docker-compose-v2`).
2.  **Java 17** & **Maven** (Available on PATH)
3.  **API Testing Tool:** Ensure you have a terminal capable of running `curl`, or download a graphical API client like [Postman](https://www.postman.com/) or [Insomnia](https://insomnia.rest/) for easier endpoint testing.

---

## 3. How to Set Up and Run the Project

Since the database schema was recently updated, you must reset any old Docker volumes first to apply the new schema.

### Step 1: Start the PostgreSQL Database
Open your terminal (Command Prompt/PowerShell on Windows, Terminal on macOS/Linux) in the root `BankOfCaptcha` directory and run:

```bash
# 1. Stop any running instances and remove the old incorrect database volume
docker compose down -v

# 2. Start the PostgreSQL database in the background
docker compose up -d postgres

# 3. Verify it's running (Look for port mapping to 5433)
docker compose ps
```

### Step 2: Start the Spring Boot Backend
Open a second terminal window, navigate to the `backend` directory, and start the application:

```bash
cd backend
mvn spring-boot:run
```
*Wait until you see `Started ApiApplication` in the terminal logs.*

### Step 3: Test the Setup
Once the backend is running, verify that the authentication and audit logs are working correctly. 
*Note for Windows users: You can use these `curl` commands in Git Bash, or translate them into Postman/PowerShell if curl is acting up.*

**1. Log in and get a JWT token:**
```bash
curl -sS -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"compliance\",\"password\":\"password\"}"
```
*Copy the `token` string from the JSON response.*

**2. Access the protected audit logs using the token:**
*Replace `YOUR_TOKEN_HERE` with the token copied from the previous step.*
```bash
curl -i http://localhost:8080/api/audit/logs \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Outcome:** You should receive an `HTTP/1.1 200 OK` response followed by a JSON array of the audit logs, proving that the database schema is correct and role-based access is working.

---

## 4. What's Next?
According to the original plan, the next steps for the backend should involve:
1.  **Testing the PQC Verification:** Using the `GET /api/audit/logs/{id}/verify` endpoint to prove the integrity of the audit events.
2.  **Risk-Based Access Control:** Implementing the logic where sensitive actions (like viewing all accounts or transferring money) are evaluated based on user behavior and assigned a risk score.
3.  **Real-Time Anomaly Integration:** Connecting the risk engine to actually use the data submitted by the Python AI script.
