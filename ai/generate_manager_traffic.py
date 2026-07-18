import os
import time
import random
from generate_traffic import login, discover_accounts, do_approve_transfer, do_fetch_transfer_requests, do_transfer

BASE_URL = os.environ.get("JAVA_BACKEND_URL", "http://localhost:8080/api")

def main():
    print("=" * 50)
    print("  Insider Threat Simulator: Rogue Manager")
    print("=" * 50)
    
    token = login("branch_manager")
    if not token:
        print("Failed to login as Manager.")
        return
        
    accounts = discover_accounts(token)
    src = accounts[0] if accounts else "10000001"
    dst = accounts[1] if len(accounts) > 1 else "10000002"

    print("\n[ATTACK 1] Unilateral Massive Transfer (Bypassing Limits)")
    print("Simulating a rogue manager initiating a massive $1M transfer...")
    # The statistical profiler will flag this single massive transaction heavily.
    do_transfer(token, src, dst, 1000000)
    time.sleep(0.5)

    print("\n[ATTACK 2] Blind Mass Approvals")
    print("Simulating a rogue manager approving every request in sight without checking details...")
    # This highly repetitive unnatural sequence triggers the LSTM
    for _ in range(8):
        do_approve_transfer(token, 1)
        do_approve_transfer(token, 2)
        time.sleep(0.05)

    print("\n[✓] Manager Insider Threat Simulation Complete.")
    print("Check your terminal running the AI Engine; you should see HIGH severity alerts!")

if __name__ == "__main__":
    main()
