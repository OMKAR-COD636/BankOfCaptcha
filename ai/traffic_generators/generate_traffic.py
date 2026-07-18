"""
Traffic simulator for the Dual-Signal AI Anomaly Detection Engine.

Generates realistic traffic patterns against the live backend to:
1. Build a "normal" baseline for the LSTM and Statistical Profiler
2. Inject known attack patterns to validate anomaly detection

Usage:
    python generate_traffic.py              # Run against localhost:8080
    JAVA_BACKEND_URL=http://backend:8080/api python generate_traffic.py
"""
import requests
import time
import random
import os
import sys

BASE_URL = os.environ.get("JAVA_BACKEND_URL", "http://localhost:8080/api")

# ---------------------------------------------------------------------------
# Authentication & Helpers
# ---------------------------------------------------------------------------
def login(username, password="password"):
    try:
        resp = requests.post(f"{BASE_URL}/auth/login", json={"username": username, "password": password})
        if resp.status_code == 200:
            token = resp.json().get("token")
            if token:
                return token
        print(f"  [!] Failed to login as {username} (HTTP {resp.status_code})")
    except requests.exceptions.RequestException as e:
        print(f"  [!] Error connecting to backend: {e}")
    return None


def auth_header(token):
    return {"Authorization": f"Bearer {token}"}


def discover_accounts(token):
    """Fetch real account numbers from the backend for this user."""
    try:
        resp = requests.get(f"{BASE_URL}/accounts", headers=auth_header(token))
        if resp.status_code == 200:
            accounts = resp.json()
            if accounts:
                return [acc.get("accountNumber") for acc in accounts if acc.get("accountNumber")]
    except Exception:
        pass
    return []


def discover_branches(token):
    """Fetch available branch IDs."""
    try:
        resp = requests.get(f"{BASE_URL}/branches", headers=auth_header(token))
        if resp.status_code == 200:
            branches = resp.json()
            if branches:
                return [b.get("branchId") for b in branches if b.get("branchId")]
    except Exception:
        pass
    return []


# ---------------------------------------------------------------------------
# Individual Actions (matching the action_registry.json patterns)
# ---------------------------------------------------------------------------
def do_fetch_accounts(token):
    """GET /api/accounts"""
    requests.get(f"{BASE_URL}/accounts", headers=auth_header(token))


def do_fetch_kyc_queue(token):
    """GET /api/kyc/queue"""
    requests.get(f"{BASE_URL}/kyc/queue", headers=auth_header(token))


def do_transfer(token, source_acc, dest_acc, amount):
    """POST /api/transactions/transfer"""
    payload = {"sourceAccountNumber": source_acc, "destAccountNumber": dest_acc, "amount": str(amount)}
    requests.post(f"{BASE_URL}/transactions/transfer", json=payload, headers=auth_header(token))


def do_kyc_apply(token, branch_id):
    """POST /api/kyc/apply/{branchId}"""
    payload = {
        "fullName": f"Test User {random.randint(1000,9999)}",
        "email": f"test{random.randint(1,999)}@example.com",
        "aadhaarNumber": f"{random.randint(100000000000, 999999999999)}",
        "mobileNumber": f"9{random.randint(100000000, 999999999)}"
    }
    requests.post(f"{BASE_URL}/kyc/apply/{branch_id}", json=payload, headers=auth_header(token))


def do_fetch_transfer_requests(token):
    """GET /api/transactions/requests"""
    requests.get(f"{BASE_URL}/transactions/requests", headers=auth_header(token))


def do_approve_transfer(token, request_id):
    """POST /api/transactions/requests/{id}/approve"""
    requests.post(f"{BASE_URL}/transactions/requests/{request_id}/approve", headers=auth_header(token))


def do_fetch_audit_logs(token):
    """GET /api/audit/logs"""
    requests.get(f"{BASE_URL}/audit/logs", headers=auth_header(token))


def do_fetch_staff(token):
    """GET /api/admin/staff — admin only"""
    requests.get(f"{BASE_URL}/admin/staff", headers=auth_header(token))


def do_fetch_ai_alerts(token):
    """GET /api/ai/alerts"""
    requests.get(f"{BASE_URL}/ai/alerts", headers=auth_header(token))


def do_contain_alert(token, alert_id):
    """POST /api/admin/alerts/{id}/contain — admin only"""
    requests.post(f"{BASE_URL}/admin/alerts/{alert_id}/contain", headers=auth_header(token))


# ---------------------------------------------------------------------------
# Traffic Scenarios
# ---------------------------------------------------------------------------
def simulate_normal_customer(token, accounts, dest_accounts):
    """Normal customer: mostly checks accounts, occasional small transfer."""
    print("  Simulating Normal Customer (ID: customer)...")
    src = accounts[0] if accounts else None
    dst = dest_accounts[0] if dest_accounts else None

    for _ in range(3):
        do_fetch_accounts(token)
        time.sleep(0.2)

    if src and dst:
        # Several small, realistic transfers to build a baseline
        for amount in [50, 120, 80, 200, 150]:
            do_transfer(token, src, dst, amount)
            time.sleep(0.3)
            do_fetch_accounts(token)
            time.sleep(0.2)

    print("  -> Generated: Account checks + 5 small transfers ($50-$200 range)\n")


def simulate_normal_teller(token, branch_id):
    """Normal teller: KYC queue review, account lookups, small transfers."""
    print("  Simulating Normal Teller (ID: teller)...")

    for _ in range(3):
        do_fetch_kyc_queue(token)
        time.sleep(0.2)
        do_fetch_accounts(token)
        time.sleep(0.2)

    if branch_id:
        do_kyc_apply(token, branch_id)
        time.sleep(0.2)

    do_fetch_accounts(token)
    time.sleep(0.1)

    print("  -> Generated: KYC queue checks, account lookups, KYC processing\n")


def simulate_normal_manager(token):
    """Normal manager: reviews transfer requests, checks accounts."""
    print("  Simulating Normal Manager (ID: branch_manager)...")

    for _ in range(3):
        do_fetch_transfer_requests(token)
        time.sleep(0.2)
        do_fetch_accounts(token)
        time.sleep(0.2)

    print("  -> Generated: Transfer request reviews, account lookups\n")


def simulate_normal_admin(token):
    """Normal super admin: audit logs, AI alerts, staff management."""
    print("  Simulating Normal Super Admin (ID: superadmin)...")

    do_fetch_accounts(token)
    time.sleep(0.2)
    do_fetch_audit_logs(token)
    time.sleep(0.2)
    do_fetch_ai_alerts(token)
    time.sleep(0.2)
    do_fetch_staff(token)
    time.sleep(0.2)
    do_fetch_audit_logs(token)
    time.sleep(0.1)

    print("  -> Generated: Audit log checks, AI alert review, staff list\n")


def simulate_anomalous_customer(token, accounts, dest_accounts):
    """ANOMALOUS: Customer performs suspicious behavior.
    
    Attack vectors:
    1. Abnormally large transfer (triggers Statistical Profiler Z-score)
    2. Rapid burst of transfers (triggers frequency detection)
    3. Accessing admin endpoints (triggers LSTM role-category violations)
    """
    src = accounts[0] if accounts else None
    dst = dest_accounts[0] if dest_accounts else None

    print("  [ATTACK 1] Abnormally Large Transfer...")
    if src and dst:
        # This should be flagged by the Statistical Profiler — way above the
        # $50-$200 baseline established in the normal scenario
        do_transfer(token, src, dst, 500000)
        time.sleep(0.2)
    print("  -> Sent $500,000 transfer (baseline was $50-$200)\n")

    print("  [ATTACK 2] Rapid Transfer Burst (Smurfing Pattern)...")
    if src and dst:
        for _ in range(8):
            do_transfer(token, src, dst, random.randint(90, 110))
            time.sleep(0.05)  # Extremely fast — burst detection trigger
    print("  -> 8 rapid transfers in <1 second\n")

    print("  [ATTACK 3] Privilege Escalation (Customer accessing admin routes)...")
    # These will be 403 Forbidden, but the AuditInterceptor still logs the attempt
    do_fetch_staff(token)
    time.sleep(0.1)
    do_fetch_audit_logs(token)
    time.sleep(0.1)
    do_fetch_ai_alerts(token)
    time.sleep(0.1)
    do_contain_alert(token, 1)
    time.sleep(0.1)
    do_fetch_staff(token)
    time.sleep(0.1)
    print("  -> 5 admin-category requests from a CUSTOMER role\n")


def simulate_anomalous_teller(token):
    print("  Simulating Anomalous Teller (ID: teller)...")
    print("  [ATTACK] Privilege Escalation (Teller accessing superadmin routes)...")
    for _ in range(5):
        do_fetch_ai_alerts(token)
        time.sleep(0.1)
    print("  -> Generated: Teller attempting to view AI alerts\n")


def simulate_anomalous_manager(token):
    print("  Simulating Anomalous Branch Manager (ID: branch_manager)...")
    print("  [ATTACK] Privilege Escalation (Manager containing users)...")
    for _ in range(5):
        do_contain_alert(token, 1)
        time.sleep(0.1)
    print("  -> Generated: Manager attempting unauthorized AI alert containments\n")


def simulate_anomalous_admin(token, accounts, dest_accounts):
    print("  Simulating Anomalous Super Admin (ID: superadmin)...")
    print("  [ATTACK] Insider Threat (Admin performing massive transfer)...")
    src = accounts[0] if accounts else None
    dst = dest_accounts[0] if dest_accounts else None
    if src and dst:
        do_transfer(token, src, dst, 1000000)
    print("  -> Generated: Super Admin initiating a massive $1M financial transfer\n")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    print("=" * 60)
    print("  BankOfCaptcha — Dual-Signal AI Traffic Simulator")
    print("=" * 60)
    print(f"  Backend: {BASE_URL}")
    print()

    # --- Login all users ---
    print("[Phase 0] Logging in demo users...")
    tokens = {}
    for user in ["customer", "teller", "branch_manager", "superadmin"]:
        tok = login(user)
        if tok:
            tokens[user] = tok
            print(f"  ✓ {user}")
        else:
            print(f"  ✗ {user} — skipping their scenarios")

    if not tokens:
        print("\n[!] No successful logins. Is the backend running?")
        sys.exit(1)

    # --- Discover real account numbers ---
    print("\n[Phase 1] Discovering accounts and branches...")
    customer_accounts = discover_accounts(tokens.get("customer", "")) if "customer" in tokens else []
    teller_accounts = discover_accounts(tokens.get("teller", "")) if "teller" in tokens else []
    branches = discover_branches(tokens.get("teller", "")) if "teller" in tokens else []

    # For transfers, we need a destination account. Use teller-visible accounts as pool.
    dest_pool = teller_accounts if teller_accounts else customer_accounts
    print(f"  Customer accounts: {customer_accounts}")
    print(f"  Destination pool:  {dest_pool[:3]}{'...' if len(dest_pool) > 3 else ''}")
    print(f"  Branches:          {branches}")

    # --- Phase 2: Normal traffic (builds the baseline) ---
    print("\n[Phase 2] Generating NORMAL traffic baseline...\n")

    if "customer" in tokens and customer_accounts:
        simulate_normal_customer(tokens["customer"], customer_accounts,
                                 [a for a in dest_pool if a not in customer_accounts] or dest_pool)

    if "teller" in tokens:
        simulate_normal_teller(tokens["teller"], branches[0] if branches else None)

    if "branch_manager" in tokens:
        simulate_normal_manager(tokens["branch_manager"])

    if "superadmin" in tokens:
        simulate_normal_admin(tokens["superadmin"])

    # --- Phase 3: Anomalous traffic (should trigger alerts) ---
    print("[Phase 3] Injecting ANOMALOUS traffic...\n")

    if "customer" in tokens:
        simulate_anomalous_customer(tokens["customer"], customer_accounts,
                                    [a for a in dest_pool if a not in customer_accounts] or dest_pool)

    if "teller" in tokens:
        simulate_anomalous_teller(tokens["teller"])

    if "branch_manager" in tokens:
        simulate_anomalous_manager(tokens["branch_manager"])

    if "superadmin" in tokens:
        simulate_anomalous_admin(tokens["superadmin"], customer_accounts,
                                 [a for a in dest_pool if a not in customer_accounts] or dest_pool)

    # --- Done ---
    print("=" * 60)
    print("  Traffic generation complete!")
    print("  Check AI engine logs for anomaly detections.")
    print("  Check Super Admin dashboard for alerts.")
    print("=" * 60)


if __name__ == "__main__":
    main()
