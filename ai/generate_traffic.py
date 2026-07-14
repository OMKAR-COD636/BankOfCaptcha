import requests
import time
import random

BASE_URL = "http://localhost:8080/api"

def login(username, password="password"):
    try:
        resp = requests.post(f"{BASE_URL}/auth/login", json={"username": username, "password": password})
        if resp.status_code == 200:
            return resp.json().get("token")
        else:
            print(f"Failed to login as {username}")
    except requests.exceptions.RequestException:
        print("Error connecting to backend. Is it running?")
    return None

def fetch_accounts(token):
    requests.get(f"{BASE_URL}/accounts", headers={"Authorization": f"Bearer {token}"})

def fetch_kyc_queue(token):
    requests.get(f"{BASE_URL}/kyc/queue", headers={"Authorization": f"Bearer {token}"})

def submit_transfer(token):
    payload = {"sourceAccountNumber": "ACC-123", "destAccountNumber": "ACC-456", "amount": 10}
    requests.post(f"{BASE_URL}/transactions/transfer", json=payload, headers={"Authorization": f"Bearer {token}"})

def apply_kyc(token):
    payload = {"fullName": "Test", "email": "test@test.com", "aadhaarNumber": "123412341234"}
    # The AI matches the substring "POST /api/kyc", so this triggers action index 4.
    requests.post(f"{BASE_URL}/kyc/apply/1", json=payload, headers={"Authorization": f"Bearer {token}"})

def fetch_transfer_requests(token):
    requests.get(f"{BASE_URL}/transactions/requests", headers={"Authorization": f"Bearer {token}"})

def approve_transfer(token):
    requests.post(f"{BASE_URL}/transactions/requests/1/approve", headers={"Authorization": f"Bearer {token}"})

def generate_sequence(token, actions, length=8):
    for idx in actions[:length]:
        if idx == 1: fetch_accounts(token)
        elif idx == 2: fetch_kyc_queue(token)
        elif idx == 3: submit_transfer(token)
        elif idx == 4: apply_kyc(token)
        elif idx == 5: fetch_transfer_requests(token)
        elif idx == 6: approve_transfer(token)
        time.sleep(0.1)

def main():
    print("--- Simulating Traffic for CERT-Inspired AI Model ---\n")
    
    # 1. Normal Customer Traffic
    # The AI expects customers to mostly do: 1 (Accounts) and 3 (Transfer)
    cust_token = login("customer")
    if cust_token:
        print("Simulating Normal Customer (ID: customer)...")
        generate_sequence(cust_token, [1, 1, 3, 1, 1])
        print("-> Generated: Accounts, Accounts, Transfer, Accounts, Accounts\n")

    # 2. Normal Teller Traffic
    # The AI expects tellers to do: 1 (Accounts), 2 (KYC Queue), 3 (Transfer), 4 (Apply KYC)
    teller_token = login("teller")
    if teller_token:
        print("Simulating Normal Teller (ID: teller)...")
        generate_sequence(teller_token, [2, 1, 4, 1, 2, 3])
        print("-> Generated: KYC Queue, Accounts, Apply KYC, Accounts, KYC Queue, Transfer\n")

    # 3. Normal Branch Manager Traffic
    # The AI expects managers to do: 1 (Accounts), 5 (Transfer Reqs), 6 (Approve), 3 (Transfer)
    mgr_token = login("branch_manager")
    if mgr_token:
        print("Simulating Normal Manager (ID: branch_manager)...")
        generate_sequence(mgr_token, [5, 1, 6, 5, 3])
        print("-> Generated: Transfer Reqs, Accounts, Approve, Transfer Reqs, Transfer\n")

    # 4. Anomalous Traffic (Insider Threat / Compromised Account)
    # A customer suddenly accessing teller/manager APIs rapidly (High reconstruction error expected)
    if cust_token:
        print("Simulating HIGHLY Anomalous Behavior on Customer Account...")
        # A sequence completely out of distribution (spamming manager approval and teller KYC queue)
        generate_sequence(cust_token, [6, 2, 6, 2, 6, 2, 6, 2, 6, 2], length=10)
        print("-> Generated: 10x Alternating Approve Transfer and KYC Queue\n")

    print("All traffic generated successfully. Check AI engine logs for anomaly detections!")

if __name__ == "__main__":
    main()
