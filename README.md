# 🏦 BankOfCaptcha

<div align="center">
  <h3>The Quantum-Resistant, AI-Self-Analysing Core Banking Platform</h3>
</div>

BankOfCaptcha is a next-generation banking prototype that unifies customer onboarding, branch operations, audit logging, and AI-assisted anomaly detection into a single, highly secure workspace. 

Designed to defend against both today's **Insider Threats** and tomorrow's **Quantum Decryption (Q-Day)**, this platform combines a PyTorch LSTM Autoencoder with NIST-standardized Post-Quantum Cryptography (PQC).

---

## 🏗 Architecture & Tech Stack

BankOfCaptcha is built on a modern, decoupled microservices architecture designed for extreme security and ease of maintenance.

### The Three Pillars
1. **Frontend (React 19 / Vite):** A blazing fast, role-adaptive dashboard serving 6 distinct user roles (from Customer to Super Admin) through a single responsive interface.
2. **Backend (Java 17 / Spring Boot):** A robust REST API layer handling RBAC, Maker-Checker compliance workflows, and executing Post-Quantum cryptographic sealing on every transaction.
3. **AI Engine (Python / PyTorch):** A stateless LSTM Autoencoder that acts as a continuous behavioral biometric monitor, capable of auto-freezing compromised accounts in real-time.

**Database:** PostgreSQL 16
**Deployment:** Fully Containerized (Docker Compose)

---

## ✨ Key Features

### 🛡️ Quantum-Proof Audit Trails (Q-PAT)
Every single API request that mutates data (transfers, approvals, user creations) is intercepted globally. The system uses **Bouncy Castle PQC** to cryptographically seal the audit logs:
*   **ML-DSA-65:** Used to digitally sign every audit event, guaranteeing mathematically that logs have never been tampered with.
*   **ML-KEM-768:** Used to securely encrypt the audit logs (AES-256-GCM) against future "Harvest Now, Decrypt Later" quantum attacks.

### 🧠 Zero-Trust Behavioral AI Containment
Instead of static rules (e.g., "flag if > ₹50,000"), the PyTorch LSTM Autoencoder learns the normal baseline behavior of every user. If a teller or customer begins acting suspiciously (e.g., a smurfing attack or bulk data exfiltration), the AI engine instantly detects the anomaly and automatically suspends the account, sending an alert to the Super Admin Dashboard.

### 👥 Native Compliance & RBAC
Built-in support for 6 distinct user roles:
*   **Customer:** Can view accounts and balances.
*   **Teller:** Can initiate transfers and approve KYC queues.
*   **Branch Manager:** Maker-Checker approval. Automatically receives alerts for high-value transfers initiated by tellers.
*   **Compliance Officer / IT Admin:** Can verify the cryptographic integrity of the system audit logs.
*   **Super Admin:** Has access to the Risk Intelligence Center (Heatmaps, 90-day activity calendars) to resolve AI alerts and manage global branch/staff assignments.

---

## 🚀 Quick Start (Running the App)

We have drastically simplified the local development environment. You do not need Java, Node.js, or Python installed on your machine if you use the recommended Docker method!

### Option A: Full Docker Deployment (Recommended)
This method runs the entire 4-tier stack (PostgreSQL, Java Backend, React Frontend, and Python AI Engine) in isolated, pre-configured containers.

1. Ensure [Docker Desktop](https://www.docker.com/products/docker-desktop/) is installed and running.
2. Open your terminal in the root `BankOfCaptcha` directory and run:
   ```bash
   docker compose -f docker-compose.full.yml up --build
   ```
3. Once the build is complete and the containers start, open your browser and navigate to:
   👉 **http://localhost:5173**

*(To stop the containers, simply press `Ctrl+C`)*

---

### Option B: The Native Bash Script (For Active Developers)
If you are actively modifying the code and prefer hot-reloading (without waiting for Docker image rebuilds), use the native startup script. 

*Prerequisites: Java 17, Node.js 18+, and a Python Conda environment named `FinSpark`.*

1. Open your terminal in the root directory.
2. Make the script executable (only needed once):
   ```bash
   chmod +x start_all.sh
   ```
3. Run all services:
   ```bash
   ./start_all.sh
   ```
4. Navigate to: 👉 **http://localhost:5173**

*(To stop all services and cleanly kill background processes, press `Ctrl+C`)*

---

## 🔑 Demo Accounts

On the very first startup, the Java backend automatically seeds the database with the following demo users so you can test the different role dashboards immediately:

| Role | Username | Password |
| :--- | :--- | :--- |
| **Customer** | `customer` | `password` |
| **Teller** | `teller` | `password` |
| **Branch Manager** | `branch_manager` | `password` |
| **Compliance Officer** | `compliance` | `password` |
| **IT Admin** | `it_admin` | `password` |
| **Super Admin** | `superadmin` | `password` |

---

## 📁 Directory Structure
*   `/backend` - Java Spring Boot API and business logic.
*   `/frontend` - React 19 UI, Dashboard, and Login portal.
*   `/ai` - PyTorch LSTM Autoencoder and traffic generation scripts.
*   `/diagrams` - Draw.io architecture, user flow, and business model diagrams.

---
*Developed for the post-quantum, AI-driven future of banking.*
