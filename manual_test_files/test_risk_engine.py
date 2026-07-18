import requests
import time

BASE_URL = "http://localhost:8080/api"

def print_step(step_num, title):
    print(f"\n[{step_num}] {title}")
    print("-" * 50)

# 1. Log in as a customer
print_step(1, "Logging in as 'customer' (Normal User)")
res = requests.post(f"{BASE_URL}/auth/login", json={"username": "customer", "password": "password"})
customer_token = res.json().get("token")
print("Login successful! Token acquired.")

# 2. Log in as a teller
print_step(2, "Logging in as 'teller' (Bank Employee)")
res = requests.post(f"{BASE_URL}/auth/login", json={"username": "teller", "password": "password"})
teller_token = res.json().get("token")
print("Login successful! Token acquired.")

# 3. Customer tries to transfer money from an account they DO NOT own (Insider Threat)
print_step(3, "Customer attempting to steal money from another account (Account 999999999)")
headers = {"Authorization": f"Bearer {customer_token}"}
payload = {
    "sourceAccountNumber": "999999999", # They don't own this!
    "destAccountNumber": "1000000001",
    "amount": "500.00"
}
res = requests.post(f"{BASE_URL}/transactions/transfer", json=payload, headers=headers)
print(f"Response ({res.status_code}): {res.text}")

# 4. Customer tries to transfer $50,000 from their OWN account (Risk Engine should block)
print_step(4, "Customer attempting to transfer an unusually large amount ($50,000)")
payload = {
    "sourceAccountNumber": "1000000001",
    "destAccountNumber": "999999999",
    "amount": "50000.00"
}
res = requests.post(f"{BASE_URL}/transactions/transfer", json=payload, headers=headers)
print(f"Response ({res.status_code}): {res.text}")

# 5. Teller views all accounts (Normal Business)
print_step(5, "Teller fetching the global account registry (Allowed by default)")
headers = {"Authorization": f"Bearer {teller_token}"}
res = requests.get(f"{BASE_URL}/accounts", headers=headers)
print(f"Response ({res.status_code}): Success, fetched {len(res.json()) if res.status_code == 200 else 0} accounts.")

# 6. Teller becomes compromised! An AI alert is raised against them.
print_step(6, "AI Model detects anomaly and raises a HIGH risk alert against the 'teller'")
headers = {"X-AI-Service-Key": "replace-this-with-a-separate-long-random-secret"}
payload = {
    "flaggedUsername": "teller",
    "description": "Teller logged in from unexpected geographic location (Anomalous IP).",
    "severity": "HIGH",
    "riskScore": 95
}
res = requests.post(f"{BASE_URL}/ai/alerts", json=payload, headers=headers)
print(f"Alert Created! Response: {res.status_code}")

# 7. Compromised Teller tries to view all accounts again (Risk Engine should block!)
print_step(7, "Compromised teller attempts to fetch global account registry AGAIN")
headers = {"Authorization": f"Bearer {teller_token}"}
res = requests.get(f"{BASE_URL}/accounts", headers=headers)
print(f"Response ({res.status_code}): {res.text}")
