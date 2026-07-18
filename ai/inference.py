import os
import json
import requests
import pandas as pd
import numpy as np
from datetime import datetime
from collections import defaultdict
import torch
import torch.nn as nn

# ---------------------------------------------------------------------------
# Configuration Loading
# ---------------------------------------------------------------------------
CONFIG_DIR = os.path.join(os.path.dirname(__file__), "config")

def load_json_config(filename):
    path = os.path.join(CONFIG_DIR, filename)
    with open(path, "r") as f:
        return json.load(f)

def load_action_registry():
    """Load the action registry and build lookup structures."""
    registry = load_json_config("action_registry.json")
    actions = registry["actions"]
    vocab_size = registry["vocabulary_size"]
    role_permissions = registry.get("role_permitted_categories", {})

    # Build pattern -> {id, risk_weight, category} mapping
    action_map = {}
    for pattern, meta in actions.items():
        action_map[pattern] = meta

    return action_map, vocab_size, role_permissions

def load_ai_config():
    return load_json_config("ai_config.json")

ACTION_MAP, VOCAB_SIZE, ROLE_PERMISSIONS = load_action_registry()
AI_CONFIG = load_ai_config()

JAVA_BACKEND_URL = os.getenv("JAVA_BACKEND_URL", "http://localhost:8080/api")
AI_SERVICE_KEY = os.getenv("AI_SERVICE_KEY", "bankofcaptcha-local-ai-service-key-change-before-deployment")

def ai_headers():
    return {"X-AI-Service-Key": AI_SERVICE_KEY}


# ---------------------------------------------------------------------------
# LSTM Architecture (unchanged core, updated to use config-driven vocab size)
# ---------------------------------------------------------------------------
class LSTMAutoencoder(nn.Module):
    def __init__(self, seq_len, n_features, embedding_dim=16, hidden_dim=64, num_layers=2):
        super(LSTMAutoencoder, self).__init__()
        self.seq_len = seq_len
        self.n_features = n_features
        self.embedding = nn.Embedding(n_features, embedding_dim, padding_idx=0)
        self.encoder_lstm = nn.LSTM(embedding_dim, hidden_dim, num_layers=num_layers, batch_first=True, dropout=0.2 if num_layers > 1 else 0)
        self.decoder_lstm = nn.LSTM(hidden_dim, hidden_dim, num_layers=num_layers, batch_first=True, dropout=0.2 if num_layers > 1 else 0)
        self.output_layer = nn.Linear(hidden_dim, n_features)

    def forward(self, x):
        embedded = self.embedding(x)
        _, (hidden, cell) = self.encoder_lstm(embedded)

        # Take the top layer's hidden state, expand and repeat for the sequence length
        top_hidden = hidden[-1]
        decoder_input = top_hidden.unsqueeze(1).repeat(1, self.seq_len, 1)

        # Pass the full state (hidden, cell) to decoder so it starts where encoder left off
        decoder_output, _ = self.decoder_lstm(decoder_input, (hidden, cell))
        out = self.output_layer(decoder_output)
        return out


# ---------------------------------------------------------------------------
# Global State
# ---------------------------------------------------------------------------
GLOBAL_MODEL = None
GLOBAL_THRESHOLD = 0.8
LAST_SEEN_LOG_ID = 0
MODEL_DIR = os.path.join(os.path.dirname(__file__), "data")
MODEL_PATH = os.path.join(MODEL_DIR, "model_state.pth")


def load_model():
    global GLOBAL_MODEL, GLOBAL_THRESHOLD
    lstm_cfg = AI_CONFIG["lstm"]
    if not os.path.exists(MODEL_PATH):
        print("Model file not found. Please train the model first.")
        return False

    GLOBAL_MODEL = LSTMAutoencoder(
        seq_len=lstm_cfg["sequence_length"],
        n_features=VOCAB_SIZE,
        embedding_dim=lstm_cfg["embedding_dim"],
        hidden_dim=lstm_cfg["hidden_dim"],
        num_layers=lstm_cfg["num_layers"]
    )
    checkpoint = torch.load(MODEL_PATH, weights_only=False)
    GLOBAL_MODEL.load_state_dict(checkpoint['model_state_dict'])
    GLOBAL_THRESHOLD = checkpoint['threshold']
    GLOBAL_MODEL.eval()
    print(f"Model loaded successfully. Dynamic Alert Threshold: {GLOBAL_THRESHOLD:.2f}")
    return True


# ---------------------------------------------------------------------------
# Action Mapping (config-driven, scalable)
# ---------------------------------------------------------------------------
def action_to_idx(action_str):
    """Map an action string (e.g. 'POST /api/transactions/transfer') to its integer ID.
    Uses longest-prefix matching against the action registry to handle parameterized routes
    like 'POST /api/admin/alerts/5/contain' -> matches 'POST /api/admin/alerts'.
    """
    best_match_id = 0
    best_match_len = 0

    for pattern, meta in ACTION_MAP.items():
        if action_str.startswith(pattern) or pattern in action_str:
            if len(pattern) > best_match_len:
                best_match_len = len(pattern)
                best_match_id = meta["id"]

    return best_match_id


def get_action_risk_weight(action_str):
    """Get the risk weight for an action string."""
    best_weight = 0.0
    best_match_len = 0

    for pattern, meta in ACTION_MAP.items():
        if action_str.startswith(pattern) or pattern in action_str:
            if len(pattern) > best_match_len:
                best_match_len = len(pattern)
                best_weight = meta["risk_weight"]

    return best_weight


def get_action_category(action_str):
    """Get the category for an action string."""
    best_category = "unknown"
    best_match_len = 0

    for pattern, meta in ACTION_MAP.items():
        if action_str.startswith(pattern) or pattern in action_str:
            if len(pattern) > best_match_len:
                best_match_len = len(pattern)
                best_category = meta["category"]

    return best_category


# ---------------------------------------------------------------------------
# Statistical Transaction Profiler
# ---------------------------------------------------------------------------
class TransactionProfiler:
    """Per-user statistical profiler for financial magnitude anomaly detection.
    
    Maintains rolling statistics (mean, std, max, count, frequency) per user
    and flags Z-score outliers. Role-aware but NOT hardcoded — thresholds are
    derived from the user's own behavioral history, making it automatically
    adaptive and scalable to new roles.
    """

    def __init__(self):
        self.config = AI_CONFIG["statistical_profiler"]
        self.z_threshold = self.config["z_score_threshold"]
        self.min_history = self.config["min_history_for_stats"]
        self.freq_window = self.config["frequency_window_minutes"]

    def analyze(self, username, role, transactions_df):
        """Analyze a user's transactions and return an anomaly score [0.0, 1.0] with explanation."""
        if transactions_df.empty:
            return 0.0, None

        # Filter to this user's outgoing transactions
        user_txs = transactions_df[transactions_df['sourceUsername'] == username].copy()
        if user_txs.empty:
            return 0.0, None

        user_txs['amount'] = pd.to_numeric(user_txs['amount'], errors='coerce')
        user_txs['timestamp'] = pd.to_datetime(user_txs['timestamp'], errors='coerce')
        user_txs = user_txs.dropna(subset=['amount', 'timestamp'])

        if len(user_txs) < self.min_history:
            return 0.0, None  # Not enough history to profile

        amounts = user_txs['amount'].values
        mean_amt = np.mean(amounts[:-1]) if len(amounts) > 1 else amounts[0]
        std_amt = np.std(amounts[:-1]) if len(amounts) > 1 else 0.0
        max_amt = np.max(amounts[:-1]) if len(amounts) > 1 else amounts[0]
        latest_amt = amounts[0]  # Newest first

        anomaly_score = 0.0
        explanations = []

        # --- Signal 1: Z-Score on Amount ---
        if std_amt > 0:
            z_score = (latest_amt - mean_amt) / std_amt
            if z_score > self.z_threshold:
                # Normalize to [0, 1] range: z_threshold maps to 0.3, z_threshold*3 maps to 1.0
                amount_score = min(1.0, 0.3 + 0.7 * ((z_score - self.z_threshold) / (self.z_threshold * 2)))
                anomaly_score = max(anomaly_score, amount_score)
                explanations.append(
                    f"Transfer of ${latest_amt:,.2f} is {z_score:.1f} std deviations above their mean of ${mean_amt:,.2f} (max historical: ${max_amt:,.2f})"
                )

        # --- Signal 2: Frequency Burst Detection ---
        now = user_txs['timestamp'].max()
        freq_cutoff = now - pd.Timedelta(minutes=self.freq_window)
        recent_count = len(user_txs[user_txs['timestamp'] >= freq_cutoff])
        total_count = len(user_txs)
        expected_rate = total_count / max(1, (user_txs['timestamp'].max() - user_txs['timestamp'].min()).total_seconds() / (self.freq_window * 60))

        if expected_rate > 0 and recent_count > expected_rate * 3:
            freq_score = min(1.0, 0.3 + 0.7 * ((recent_count / expected_rate - 3) / 5))
            if freq_score > anomaly_score:
                anomaly_score = freq_score
                explanations.append(
                    f"Burst detected: {recent_count} transactions in the last {self.freq_window}min (expected ~{expected_rate:.1f})"
                )

        # --- Signal 3: Role-Inappropriate Category Penalty ---
        # (This is handled by the LSTM side via category permissions, not here)

        explanation = " | ".join(explanations) if explanations else None
        return anomaly_score, explanation


# ---------------------------------------------------------------------------
# Data Fetching (clamped: min of last N days, last M requests per user)
# ---------------------------------------------------------------------------
def fetch_audit_logs():
    """Fetch audit logs with clamped time/count window from the backend."""
    clamp = AI_CONFIG["clamp"]
    try:
        params = {
            "maxDays": clamp["max_days"],
            "maxRequests": clamp["max_requests_per_user"]
        }
        response = requests.get(f"{JAVA_BACKEND_URL}/ai/audit-events", headers=ai_headers(), params=params)
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        print(f"Error fetching logs: {e}")
    return []


def fetch_transaction_summary():
    """Fetch recent transaction data with amounts for the statistical profiler."""
    clamp = AI_CONFIG["clamp"]
    try:
        params = {"maxDays": clamp["max_days"]}
        response = requests.get(f"{JAVA_BACKEND_URL}/ai/transaction-summary", headers=ai_headers(), params=params)
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        print(f"Error fetching transaction summary: {e}")
    return []


def send_alert(username, description, severity, risk_score=None):
    alert_payload = {
        "flaggedUsername": username,
        "description": description,
        "severity": severity
    }
    if risk_score is not None:
        alert_payload["riskScore"] = int(risk_score * 100)
    try:
        requests.post(f"{JAVA_BACKEND_URL}/ai/alerts", json=alert_payload, headers=ai_headers())
        print(f"*** ALERT SENT FOR {username} (Severity: {severity}) ***")
    except Exception as e:
        print(f"Error sending alert: {e}")


# ---------------------------------------------------------------------------
# Risk Score Fusion
# ---------------------------------------------------------------------------
def fuse_risk_scores(lstm_error, lstm_threshold, stat_score):
    """Combine LSTM reconstruction error and statistical anomaly score into a
    unified risk score [0.0, 1.0].
    
    The LSTM anomaly is normalized relative to its threshold, then weighted
    according to ai_config.json. This makes the system automatically adaptive —
    no hardcoded role thresholds needed.
    """
    lstm_weight = AI_CONFIG["lstm"]["anomaly_weight"]
    stat_weight = AI_CONFIG["statistical_profiler"]["anomaly_weight"]

    # Normalize LSTM error: threshold maps to ~0.5, 2*threshold maps to ~1.0
    if lstm_threshold > 0:
        lstm_normalized = min(1.0, lstm_error / (2.0 * lstm_threshold))
    else:
        lstm_normalized = 0.0

    fused = (lstm_weight * lstm_normalized) + (stat_weight * stat_score)
    return min(1.0, fused)


def score_to_severity(fused_score):
    """Map a fused risk score to a severity level using config thresholds."""
    thresholds = AI_CONFIG["alerting"]
    if fused_score >= thresholds["fused_score_threshold_high"]:
        return "HIGH"
    elif fused_score >= thresholds["fused_score_threshold_medium"]:
        return "MEDIUM"
    elif fused_score >= thresholds["fused_score_threshold_low"]:
        return "LOW"
    return None  # Below threshold, no alert


# ---------------------------------------------------------------------------
# Core Analysis Loop
# ---------------------------------------------------------------------------
def analyze_logs():
    global LAST_SEEN_LOG_ID, GLOBAL_MODEL, GLOBAL_THRESHOLD
    if GLOBAL_MODEL is None:
        print("Model is not loaded. Skipping inference.")
        return

    print(f"\n[{datetime.now()}] Running Dual-Signal Anomaly Analysis...")

    # --- Fetch Data ---
    logs = fetch_audit_logs()
    if not logs:
        return

    df = pd.DataFrame(logs)
    if df.empty:
        return

    df['id'] = pd.to_numeric(df['id'])

    new_logs = df[df['id'] > LAST_SEEN_LOG_ID]
    if new_logs.empty:
        return

    users_to_evaluate = new_logs['username'].unique()
    LAST_SEEN_LOG_ID = int(df['id'].max())

    # Fetch transaction data for the statistical profiler
    tx_data = fetch_transaction_summary()
    tx_df = pd.DataFrame(tx_data) if tx_data else pd.DataFrame()

    # Initialize the statistical profiler
    profiler = TransactionProfiler()

    df = df.sort_values(by=['username', 'timestamp'])

    lstm_cfg = AI_CONFIG["lstm"]
    seq_len = lstm_cfg["sequence_length"]
    criterion = nn.CrossEntropyLoss(reduction='none', ignore_index=0)

    for username in users_to_evaluate:
        group = df[df['username'] == username]
        user_role = group.iloc[0].get('role', 'UNKNOWN') if 'role' in group.columns else 'UNKNOWN'
        actions = group['action'].tolist()
        recent_actions = actions[-seq_len:]

        # --- Signal 1: LSTM Sequence Anomaly ---
        seq = [0] * seq_len
        risk_weighted_actions = []
        category_violations = 0
        permitted = ROLE_PERMISSIONS.get(user_role, [])

        for i, a in enumerate(recent_actions):
            seq[i] = action_to_idx(a)
            risk_weighted_actions.append(get_action_risk_weight(a))
            cat = get_action_category(a)
            if cat not in permitted and cat != "unknown":
                category_violations += 1

        seq_tensor = torch.tensor([seq], dtype=torch.long)

        with torch.no_grad():
            output = GLOBAL_MODEL(seq_tensor)
            loss = criterion(output.view(-1, VOCAB_SIZE), seq_tensor.view(-1))
            valid_elements = (loss > 0).sum().item()
            avg_reconstruction_error = loss.sum().item() / valid_elements if valid_elements > 0 else 0

        # Boost LSTM error if role-inappropriate categories were detected
        if category_violations > 0:
            violation_boost = 1.0 + (0.3 * category_violations)
            avg_reconstruction_error *= violation_boost

        # --- Signal 2: Statistical Transaction Profiler ---
        stat_score, stat_explanation = profiler.analyze(username, user_role, tx_df)

        # --- Fuse Signals ---
        fused_score = fuse_risk_scores(avg_reconstruction_error, GLOBAL_THRESHOLD, stat_score)
        severity = score_to_severity(fused_score)

        if severity is not None and valid_elements >= 3:
            # Build enriched description
            desc_parts = [f"Dual-Signal Anomaly Detection — Fused Risk Score: {fused_score:.2f}"]
            desc_parts.append(f"LSTM Reconstruction Error: {avg_reconstruction_error:.2f} (Threshold: {GLOBAL_THRESHOLD:.2f})")
            if category_violations > 0:
                desc_parts.append(f"Role violations: {category_violations} actions outside permitted categories for {user_role}")
            if stat_explanation:
                desc_parts.append(f"Statistical: {stat_explanation}")

            full_desc = " | ".join(desc_parts)
            print(f"[!] THREAT DETECTED: {username} ({user_role}) - Severity: {severity} - Fused Score: {fused_score:.2f}")
            if stat_explanation:
                print(f"    Statistical detail: {stat_explanation}")
            send_alert(username, full_desc, severity, risk_score=fused_score)
        else:
            print(f"[+] Normal: {username} ({user_role}) - LSTM: {avg_reconstruction_error:.2f} | Stat: {stat_score:.2f} | Fused: {fused_score:.2f}")


def run_scheduler():
    from apscheduler.schedulers.blocking import BlockingScheduler
    interval = AI_CONFIG["scheduler"]["polling_interval_seconds"]
    scheduler = BlockingScheduler()
    scheduler.add_job(analyze_logs, 'interval', seconds=interval)
    print(f"Dual-Signal Anomaly Scheduler Started. Polling every {interval} seconds.")
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        pass
