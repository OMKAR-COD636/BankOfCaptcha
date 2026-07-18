import requests

BASE_URL = "http://localhost:8080/api"

print("1. Logging in...")
login_res = requests.post(f"{BASE_URL}/auth/login", json={"username":"compliance", "password":"password"})
if login_res.status_code != 200:
    print("Login failed:", login_res.text)
    exit(1)

token = login_res.json().get("token")
headers = {"Authorization": f"Bearer {token}"}
print("Login successful.")

print("\n2. Fetching audit logs (This action itself will generate a new audit log protected by PQC)...")
logs_res = requests.get(f"{BASE_URL}/audit/logs", headers=headers)
if logs_res.status_code != 200:
    print("Failed to fetch logs:", logs_res.text)
    exit(1)

logs = logs_res.json()
print(f"Fetched {len(logs)} logs.")

if len(logs) == 0:
    print("No logs found.")
    exit(1)

latest_log = logs[-1] # Assuming the latest is appended at the end
log_id = latest_log.get("id")
print(f"\n3. Verifying the latest log with ID: {log_id}")
verify_res = requests.get(f"{BASE_URL}/audit/logs/{log_id}/verify", headers=headers)

if verify_res.status_code == 200:
    print("Verification response:")
    print(verify_res.json())
else:
    print("Verification failed:", verify_res.status_code, verify_res.text)
