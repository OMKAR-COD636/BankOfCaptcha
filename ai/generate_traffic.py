import requests
import time

BASE_URL = "http://localhost:8080/api"

def login(username, password):
    resp = requests.post(f"{BASE_URL}/auth/login", json={"username": username, "password": password})
    if resp.status_code == 200:
        return resp.json().get("token")
    return None

def fetch_accounts(token):
    requests.get(f"{BASE_URL}/accounts", headers={"Authorization": f"Bearer {token}"})

def fetch_audit_logs(token):
    requests.get(f"{BASE_URL}/audit/logs", headers={"Authorization": f"Bearer {token}"})

def main():
    print("Simulating normal customer behavior...")
    cust_token = login("customer", "password")
    if cust_token:
        for _ in range(3):
            fetch_accounts(cust_token)
            time.sleep(0.1)

    print("Simulating anomalous teller behavior...")
    teller_token = login("teller", "password")
    if teller_token:
        for _ in range(25):
            fetch_accounts(teller_token)
            # Tellers wouldn't normally fetch audit logs, let's make them do something weird
            fetch_audit_logs(teller_token)
            time.sleep(0.05)
            
    print("Traffic generated.")

if __name__ == "__main__":
    main()
