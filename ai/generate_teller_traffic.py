import os
import time
import random
from generate_traffic import login, discover_accounts, do_transfer, do_fetch_accounts, do_kyc_apply

BASE_URL = os.environ.get("JAVA_BACKEND_URL", "http://localhost:8080/api")

def main():
    print("=" * 50)
    print("  Insider Threat Simulator: Rogue Teller")
    print("=" * 50)
    
    token = login("teller")
    if not token:
        print("Failed to login as Teller.")
        return

    accounts = discover_accounts(token)
    if not accounts:
        print("No accounts available for the teller to attack.")
        return
        
    src = accounts[0]
    dst = accounts[1] if len(accounts) > 1 else accounts[0]

    print("\n[ATTACK 1] Teller Smurfing Attack (Frequency Anomaly)")
    print("Simulating a rogue teller siphoning small amounts rapidly...")
    # 15 rapid transfers will trigger a massive statistical frequency penalty
    # and the LSTM sequence anomaly (unexpected repetitive transfers)
    for _ in range(15):
        do_transfer(token, src, dst, random.randint(10, 50))
        time.sleep(0.05)
    
    print("\n[ATTACK 2] Spamming KYC Approvals")
    print("Simulating a rogue teller pushing fake KYC forms...")
    # This highly repetitive, unnatural sequence triggers the LSTM
    for _ in range(10):
        do_kyc_apply(token, 1)
        time.sleep(0.05)

    print("\n[✓] Teller Insider Threat Simulation Complete.")
    print("Check your terminal running the AI Engine; you should see HIGH severity alerts!")

if __name__ == "__main__":
    main()
