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

We have drastically simplified the local development environment. You now have two ways to run the entire stack (PostgreSQL, Java Backend, React Frontend, and Python AI Engine).

### Option A: Full Docker Containerization (Recommended)
This runs everything in completely isolated, pre-configured containers, meaning you don't even need Java, Node.js, or Conda installed on your host machine.

Open your terminal in the root `BankOfCaptcha` directory and run:

```bash
docker compose -f docker-compose.full.yml up --build
```
*Note: Ensure you are using `docker compose` (with a space) and not `docker-compose` (with a hyphen) to utilize Docker Compose V2.*

Once built, you can access the frontend instantly at:
👉 **http://localhost:5173**

*(To stop the containers, press `Ctrl+C`)*

### Option B: The Native Bash Script (Best for Active Development)
If you are actively editing the code and prefer running it natively on your machine, you can use the startup script. This will only run PostgreSQL in Docker, while running the Frontend, Backend, and AI natively in the background.

Make sure you have Java 17, Node.js, and your Python `FinSpark` Conda environment ready.

```bash
# Make the script executable (only needed once)
chmod +x start_all.sh

# Run all services
./start_all.sh
```

Once running, navigate to:
👉 **http://localhost:5173**

*(To stop all services, press `Ctrl+C`. The script will cleanly kill all background processes for you).*

---

## 4. What's Next?
According to the original plan, the next steps for the backend should involve:
1.  **Testing the PQC Verification:** Using the `GET /api/audit/logs/{id}/verify` endpoint to prove the integrity of the audit events.
2.  **Risk-Based Access Control:** Implementing the logic where sensitive actions (like viewing all accounts or transferring money) are evaluated based on user behavior and assigned a risk score.
3.  **Real-Time Anomaly Integration:** Connecting the risk engine to actually use the data submitted by the Python AI script.
