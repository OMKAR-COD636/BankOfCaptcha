import requests

BASE_URL = "http://localhost:8080/api"

def print_step(step_num, title):
    print(f"\n[{step_num}] {title}")
    print("-" * 50)

# 1. Logins
print_step(1, "Logging in as 'teller' and 'branch_manager'")
teller_token = requests.post(f"{BASE_URL}/auth/login", json={"username": "teller", "password": "password"}).json().get("token")
manager_token = requests.post(f"{BASE_URL}/auth/login", json={"username": "branch_manager", "password": "password"}).json().get("token")
print("Tokens acquired successfully.")

# 2. Teller tries to transfer $5,000 (Below threshold)
print_step(2, "Teller initiates $5,000 transfer (Below $10,000 Threshold)")
payload_low = {"sourceAccountNumber": "1000000001", "destAccountNumber": "1000000002", "amount": "5000.00"}
res = requests.post(f"{BASE_URL}/transactions/transfer", json=payload_low, headers={"Authorization": f"Bearer {teller_token}"})
print(f"Teller Response: {res.text}")

# 3. Teller tries to transfer $15,000 (Above threshold)
print_step(3, "Teller initiates $15,000 transfer (Above $10,000 Threshold)")
payload_high = {"sourceAccountNumber": "1000000001", "destAccountNumber": "1000000002", "amount": "15000.00"}
res = requests.post(f"{BASE_URL}/transactions/transfer", json=payload_high, headers={"Authorization": f"Bearer {teller_token}"})
print(f"Teller Response: {res.text}")

# 4. Manager views pending requests
print_step(4, "Branch Manager viewing their pending approval queue")
manager_headers = {"Authorization": f"Bearer {manager_token}"}
res = requests.get(f"{BASE_URL}/transactions/requests", headers=manager_headers)
requests_list = res.json()
print(f"Pending Requests Found: {len(requests_list)}")

# 5. Manager approves the request
if len(requests_list) > 0:
    req_id = requests_list[0]['id']
    print_step(5, f"Branch Manager approving request #{req_id}")
    res = requests.post(f"{BASE_URL}/transactions/requests/{req_id}/approve", headers=manager_headers)
    print(f"Manager Response: {res.text}")
