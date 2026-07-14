import os
import requests
import pandas as pd
from datetime import datetime
import torch
import torch.nn as nn
import numpy as np

JAVA_BACKEND_URL = "http://localhost:8080/api"
AI_SERVICE_KEY = os.getenv("AI_SERVICE_KEY", "bankofcaptcha-local-ai-service-key-change-before-deployment")

def ai_headers():
    return {"X-AI-Service-Key": AI_SERVICE_KEY}

# --- 1. LSTM Architecture ---
class LSTMAutoencoder(nn.Module):
    def __init__(self, seq_len, n_features, embedding_dim=16, hidden_dim=32):
        super(LSTMAutoencoder, self).__init__()
        self.seq_len = seq_len
        self.n_features = n_features
        self.embedding = nn.Embedding(n_features, embedding_dim, padding_idx=0)
        self.encoder_lstm = nn.LSTM(embedding_dim, hidden_dim, batch_first=True)
        self.decoder_lstm = nn.LSTM(hidden_dim, hidden_dim, batch_first=True)
        self.output_layer = nn.Linear(hidden_dim, n_features)

    def forward(self, x):
        embedded = self.embedding(x)
        _, (hidden, cell) = self.encoder_lstm(embedded)
        # Repeat hidden state for seq_len to decode
        decoder_input = hidden[-1].unsqueeze(1).repeat(1, self.seq_len, 1)
        decoder_output, _ = self.decoder_lstm(decoder_input, (hidden, cell))
        out = self.output_layer(decoder_output)
        return out

# --- 2. Synthetic Data Generator ---
def generate_synthetic_data(num_samples=20000, seq_len=10):
    """
    Generates stochastic Markov-chain sequences to simulate realistic normal banking behavior.
    """
    import random
    data = []
    # 1: Accounts, 2: KYC Queue, 3: Transfer, 4: KYC Approve, 5: Transfer Reqs, 6: Transfer Approve
    actions = [1, 2, 3, 4, 5, 6]
    
    for _ in range(num_samples):
        seq = [0] * seq_len
        # Pick a random length for the sequence (2 to 10)
        actual_len = random.randint(2, seq_len)
        
        # Decide the user "persona"
        persona = random.choice(['customer', 'teller', 'manager'])
        
        for i in range(actual_len):
            # 10% chance for random "noise" (misclick or out-of-order action)
            if random.random() < 0.10:
                seq[i] = random.choice(actions)
                continue
                
            if persona == 'customer':
                seq[i] = random.choices([1, 3], weights=[0.8, 0.2])[0]
            elif persona == 'teller':
                seq[i] = random.choices([1, 2, 3, 4], weights=[0.4, 0.3, 0.1, 0.2])[0]
            elif persona == 'manager':
                seq[i] = random.choices([1, 5, 6, 3], weights=[0.4, 0.3, 0.2, 0.1])[0]
                
        data.append(seq)
    return torch.tensor(data, dtype=torch.long)

# --- 3. Model Pre-Training ---
GLOBAL_MODEL = None
GLOBAL_THRESHOLD = 0.8

def initialize_ai():
    global GLOBAL_MODEL, GLOBAL_THRESHOLD
    print("Initializing CERT-Inspired Insider Threat AI...")
    print("Generating 20,000 synthetic stochastic sequences...")
    X_train = generate_synthetic_data()
    
    GLOBAL_MODEL = LSTMAutoencoder(seq_len=10, n_features=10)
    criterion = nn.CrossEntropyLoss(ignore_index=0, reduction='none')
    optimizer = torch.optim.Adam(GLOBAL_MODEL.parameters(), lr=0.005)
    
    print("Training PyTorch LSTM Autoencoder (20 Epochs)...")
    GLOBAL_MODEL.train()
    for epoch in range(20):
        optimizer.zero_grad()
        output = GLOBAL_MODEL(X_train)
        
        loss = criterion(output.view(-1, 10), X_train.view(-1))
        # Compute mean loss per sequence for training
        loss_matrix = loss.view(-1, 10)
        mask = (X_train != 0).float()
        seq_losses = (loss_matrix * mask).sum(dim=1) / (mask.sum(dim=1) + 1e-8)
        
        batch_loss = seq_losses.mean()
        batch_loss.backward()
        optimizer.step()
        
        if (epoch + 1) % 5 == 0:
            print(f"Epoch {epoch+1}/20 - Loss: {batch_loss.item():.4f}")
            
    # Calculate Dynamic Threshold based on 99th percentile of training data
    GLOBAL_MODEL.eval()
    with torch.no_grad():
        output = GLOBAL_MODEL(X_train)
        loss = criterion(output.view(-1, 10), X_train.view(-1))
        loss_matrix = loss.view(-1, 10)
        mask = (X_train != 0).float()
        seq_losses = (loss_matrix * mask).sum(dim=1) / (mask.sum(dim=1) + 1e-8)
        
        # Use 99th percentile to tolerate normal variations but catch true anomalies
        GLOBAL_THRESHOLD = torch.quantile(seq_losses[seq_losses > 0], 0.99).item()
        
    print(f"Training complete! Dynamic Alert Threshold set to: {GLOBAL_THRESHOLD:.2f}")
    print("Stateless Inference Engine Ready.")

# --- 4. Stateless Inference Engine ---
def action_to_idx(action_str):
    # Map Java backend audit logs to numerical features
    if "GET /api/accounts" in action_str: return 1
    if "GET /api/kyc/queue" in action_str: return 2
    if "POST /api/transactions/transfer" in action_str: return 3
    if "POST /api/kyc" in action_str: return 4
    if "GET /api/transactions/requests" in action_str: return 5
    if "POST /api/transactions/requests" in action_str: return 6
    return 0

def fetch_audit_logs():
    try:
        response = requests.get(f"{JAVA_BACKEND_URL}/ai/audit-events", headers=ai_headers())
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
        requests.post(f"{JAVA_BACKEND_URL}/ai/alerts", json=alert_payload, headers=ai_headers())
        print(f"*** ALERT SENT FOR {username} ***")
    except Exception as e:
        print(f"Error sending alert: {e}")

LAST_SEEN_LOG_ID = 0

def analyze_logs():
    global LAST_SEEN_LOG_ID
    print(f"\n[{datetime.now()}] Running Stateless Sequence Inference...")
    logs = fetch_audit_logs()
    if not logs:
        return
        
    df = pd.DataFrame(logs)
    if df.empty: return
    
    # Ensure ID is treated as a numeric integer to avoid string comparison bugs
    df['id'] = pd.to_numeric(df['id'])
    
    # Find which users have new activity since our last check
    new_logs = df[df['id'] > LAST_SEEN_LOG_ID]
    if new_logs.empty:
        return
    
    users_to_evaluate = new_logs['username'].unique()
    LAST_SEEN_LOG_ID = int(df['id'].max())
    
    df = df.sort_values(by=['username', 'timestamp'])
    
    GLOBAL_MODEL.eval()
    criterion = nn.CrossEntropyLoss(reduction='none', ignore_index=0)
    
    # Partition sequences by username (Prevents memory intertwining pollution)
    for username in users_to_evaluate:
        group = df[df['username'] == username]
        actions = group['action'].tolist()
        recent_actions = actions[-10:] # Take up to last 10
        
        # Zeroed memory initialization is implicitly handled by PyTorch when feeding a new batch
        seq = [0] * 10
        for i, a in enumerate(recent_actions):
            seq[i] = action_to_idx(a)
            
        seq_tensor = torch.tensor([seq], dtype=torch.long)
        
        with torch.no_grad():
            output = GLOBAL_MODEL(seq_tensor)
            loss = criterion(output.view(-1, 10), seq_tensor.view(-1))
            valid_elements = (loss > 0).sum().item()
            avg_reconstruction_error = loss.sum().item() / valid_elements if valid_elements > 0 else 0
            
            # If a user spams actions or does weird sequences, it won't reconstruct well
            if avg_reconstruction_error > GLOBAL_THRESHOLD and valid_elements >= 3:
                desc = f"LSTM Autoencoder detected anomalous behavioral sequence. Reconstruction Error: {avg_reconstruction_error:.2f} (Threshold: {GLOBAL_THRESHOLD:.2f})"
                print(f"[!] THREAT DETECTED: {username} - {desc}")
                send_alert(username, desc, "CRITICAL")
            else:
                print(f"[+] Normal sequence for {username}. Error: {avg_reconstruction_error:.2f} (Threshold: {GLOBAL_THRESHOLD:.2f})")

def run_scheduler():
    from apscheduler.schedulers.blocking import BlockingScheduler
    scheduler = BlockingScheduler()
    scheduler.add_job(analyze_logs, 'interval', seconds=30)
    print("Sequence Inference Scheduler Started. Polling every 30 seconds.")
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        pass

if __name__ == "__main__":
    initialize_ai()
    analyze_logs()
    run_scheduler()
