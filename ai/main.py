import time
import requests
import pandas as pd
from sklearn.ensemble import IsolationForest
from datetime import datetime

JAVA_BACKEND_URL = "http://localhost:8080/api"

def fetch_audit_logs():
    try:
        response = requests.get(f"{JAVA_BACKEND_URL}/audit/logs")
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        print(f"Error fetching logs: {e}")
    return []

def send_alert(username, description, severity):
    alert_payload = {
        "flaggedUsername": username,
        "description": description,
        "severity": severity
    }
    try:
        requests.post(f"{JAVA_BACKEND_URL}/ai/alerts", json=alert_payload)
        print(f"Sent alert for {username}: {description}")
    except Exception as e:
        print(f"Error sending alert: {e}")

def analyze_logs():
    print(f"[{datetime.now()}] Analyzing logs for privileged account misuse...")
    logs = fetch_audit_logs()
    if not logs or len(logs) < 10:
        print("Not enough logs to run ML analysis. Skipping.")
        return

    # Convert to DataFrame
    df = pd.DataFrame(logs)
    
    # Feature Engineering: 
    # Let's count the number of actions per user and number of distinct endpoints they hit
    user_stats = df.groupby('username').agg(
        total_actions=('action', 'count'),
        unique_endpoints=('action', 'nunique')
    ).reset_index()

    # We use Isolation Forest for anomaly detection
    features = user_stats[['total_actions', 'unique_endpoints']]
    
    # In real world, we'd need much more data and features.
    model = IsolationForest(contamination=0.1, random_state=42)
    user_stats['anomaly'] = model.fit_predict(features)
    
    # -1 means anomaly, 1 means normal
    anomalies = user_stats[user_stats['anomaly'] == -1]
    
    for _, row in anomalies.iterrows():
        username = row['username']
        actions_count = row['total_actions']
        endpoints_count = row['unique_endpoints']
        
        description = f"ML Analysis detected unusual behavior: {actions_count} total actions across {endpoints_count} unique endpoints."
        send_alert(username, description, "HIGH")

def run_scheduler():
    from apscheduler.schedulers.blocking import BlockingScheduler
    scheduler = BlockingScheduler()
    # Run analysis every 1 minute for demonstration purposes
    scheduler.add_job(analyze_logs, 'interval', minutes=1)
    print("Starting AI Misuse Detection Module...")
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        pass

if __name__ == "__main__":
    # Run once immediately, then start scheduler
    analyze_logs()
    run_scheduler()
