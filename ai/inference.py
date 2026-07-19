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
    role_id_map = {k: v for k, v in registry.get("role_id_map", {}).items() if not k.startswith("_")}
    num_roles = registry.get("num_roles", 6)

    # Build pattern -> {id, risk_weight, category} mapping
    action_map = {}
    for pattern, meta in actions.items():
        action_map[pattern] = meta

    return action_map, vocab_size, role_permissions, role_id_map, num_roles

def load_ai_config():
    return load_json_config("ai_config.json")

ACTION_MAP, VOCAB_SIZE, ROLE_PERMISSIONS, ROLE_ID_MAP, NUM_ROLES = load_action_registry()
AI_CONFIG = load_ai_config()

JAVA_BACKEND_URL = os.getenv("JAVA_BACKEND_URL", "http://localhost:8080/api")
AI_SERVICE_KEY = os.getenv("AI_SERVICE_KEY", "bankofcaptcha-local-ai-service-key-change-before-deployment")

def ai_headers():
    return {"X-AI-Service-Key": AI_SERVICE_KEY}


# ---------------------------------------------------------------------------
# LSTM Architecture — Role-Conditioned Behavioral Anomaly Detector
# ---------------------------------------------------------------------------
class InsiderThreatLSTM(nn.Module):
    """Role-conditioned LSTM Autoencoder for behavioral sequence anomaly detection.
    
    Key differences from the old LSTMAutoencoder:
    1. Role conditioning — the model learns what sequences are normal *per role*,
       so a teller doing admin actions gets flagged by the model itself.
    2. Embedding-space reconstruction (MSE) — instead of cross-entropy over a tiny
       vocabulary, the model reconstructs continuous embedding vectors. This gives
       a nuanced, proportional error signal instead of binary right/wrong.
    3. Positional encoding — enables the model to distinguish action ordering,
       critical for detecting kill-chain patterns (recon → escalation → exfiltration).
    """
    def __init__(self, seq_len, vocab_size, num_roles,
                 embedding_dim=16, hidden_dim=64, num_layers=2):
        super(InsiderThreatLSTM, self).__init__()
        self.seq_len = seq_len
        self.embedding_dim = embedding_dim

        # Learnable embeddings
        self.action_embedding = nn.Embedding(vocab_size, embedding_dim, padding_idx=0)
        self.role_embedding = nn.Embedding(num_roles + 1, embedding_dim // 2)  # +1 for UNKNOWN (id=0)

        # Learnable positional encoding for sequence order awareness
        self.pos_encoding = nn.Parameter(torch.randn(1, seq_len, embedding_dim // 4))

        input_dim = embedding_dim + (embedding_dim // 2) + (embedding_dim // 4)

        self.encoder_lstm = nn.LSTM(
            input_dim, hidden_dim, num_layers=num_layers,
            batch_first=True, dropout=0.2 if num_layers > 1 else 0
        )
        self.decoder_lstm = nn.LSTM(
            hidden_dim, hidden_dim, num_layers=num_layers,
            batch_first=True, dropout=0.2 if num_layers > 1 else 0
        )
        # Reconstruct back to embedding space (continuous), not vocab space (discrete)
        self.output_layer = nn.Linear(hidden_dim, embedding_dim)

    def forward(self, action_seq, role_id):
        """
        Args:
            action_seq: (batch, seq_len) — integer action IDs
            role_id:    (batch,) — integer role IDs
        Returns:
            reconstructed: (batch, seq_len, embedding_dim) — reconstructed embeddings
            target_emb:    (batch, seq_len, embedding_dim) — target action embeddings
        """
        batch_size = action_seq.size(0)

        # Embed actions
        action_emb = self.action_embedding(action_seq)  # (B, T, E)

        # Embed role and broadcast across sequence
        role_emb = self.role_embedding(role_id)  # (B, E/2)
        role_emb = role_emb.unsqueeze(1).expand(-1, self.seq_len, -1)  # (B, T, E/2)

        # Positional encoding broadcast across batch
        pos_emb = self.pos_encoding.expand(batch_size, -1, -1)  # (B, T, E/4)

        # Concatenate all input features
        combined = torch.cat([action_emb, role_emb, pos_emb], dim=-1)  # (B, T, input_dim)

        # Encode
        _, (hidden, cell) = self.encoder_lstm(combined)

        # Decode — start from the encoder's final state
        top_hidden = hidden[-1]
        decoder_input = top_hidden.unsqueeze(1).repeat(1, self.seq_len, 1)
        decoder_output, _ = self.decoder_lstm(decoder_input, (hidden, cell))

        # Reconstruct to embedding space
        reconstructed = self.output_layer(decoder_output)  # (B, T, E)

        return reconstructed, action_emb.detach()  # Target is the original action embedding


# Keep the old class available for backward compatibility during model migration
class LSTMAutoencoder(nn.Module):
    """Legacy LSTM Autoencoder — kept only for loading old checkpoints during migration."""
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
        top_hidden = hidden[-1]
        decoder_input = top_hidden.unsqueeze(1).repeat(1, self.seq_len, 1)
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
MODEL_PATH = os.path.join(MODEL_DIR, "model_state.pt")


def load_model():
    global GLOBAL_MODEL, GLOBAL_THRESHOLD
    lstm_cfg = AI_CONFIG["lstm"]

    if not os.path.exists(MODEL_PATH):
        print("Model file not found. Please train the model first.")
        return False

    checkpoint = torch.load(MODEL_PATH, weights_only=False)

    # Check if this is the new architecture or legacy
    if checkpoint.get('architecture') == 'InsiderThreatLSTM':
        GLOBAL_MODEL = InsiderThreatLSTM(
            seq_len=lstm_cfg["sequence_length"],
            vocab_size=VOCAB_SIZE,
            num_roles=NUM_ROLES,
            embedding_dim=lstm_cfg["embedding_dim"],
            hidden_dim=lstm_cfg["hidden_dim"],
            num_layers=lstm_cfg["num_layers"]
        )
        GLOBAL_MODEL.load_state_dict(checkpoint['model_state_dict'])
        GLOBAL_THRESHOLD = checkpoint['threshold']
        GLOBAL_MODEL.eval()
        print(f"4-Signal InsiderThreatLSTM loaded. Dynamic Threshold: {GLOBAL_THRESHOLD:.4f}")
        return True
    else:
        # Legacy model detected — cannot use, need retrain
        print("Legacy LSTMAutoencoder checkpoint detected. Architecture incompatible.")
        print("Please delete data/model_state.pt and retrain with the new architecture.")
        print("Run: python train.py")
        return False


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


def role_to_id(role_str):
    """Map a role string to its integer ID for the LSTM embedding."""
    return ROLE_ID_MAP.get(role_str, 0)  # 0 = UNKNOWN


# ---------------------------------------------------------------------------
# Signal 2: Role-Action Violation Scorer (Independent Signal)
# ---------------------------------------------------------------------------
def compute_role_violation_score(actions, role):
    """Independent signal: what fraction of recent actions are outside this
    role's permitted categories?
    
    This was previously buried as a multiplier on the LSTM error. Now it's
    an independent signal in the 4-signal fusion, so role violations are
    always detected regardless of whether the LSTM reconstruction error
    is high or low.
    
    Returns:
        score: float [0.0, 1.0]
        explanation: str or None
    """
    permitted = ROLE_PERMISSIONS.get(role, [])
    if not permitted or not actions:
        return 0.0, None

    violations = 0
    violation_categories = defaultdict(int)

    for action in actions:
        cat = get_action_category(action)
        if cat not in permitted and cat != "unknown":
            violations += 1
            violation_categories[cat] += 1

    if violations == 0:
        return 0.0, None

    # Score scales with ratio — a user doing 2/3 admin actions is worse than 2/20
    ratio = violations / len(actions)
    score = min(1.0, ratio * 2.0)  # 50%+ violations = max score

    cat_detail = ", ".join(f"{cat}×{count}" for cat, count in violation_categories.items())
    explanation = f"{violations}/{len(actions)} actions outside permitted categories for {role} [{cat_detail}]"
    return score, explanation


# ---------------------------------------------------------------------------
# Signal 3: Statistical Transaction Profiler (kept from v2)
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

    def analyze(self, username, role, transactions_df, user_audit_df):
        """Analyze a user's transactions and audit logs and return an anomaly score [0.0, 1.0] with explanation."""
        anomaly_score = 0.0
        explanations = []
        
        # --- Signal 3a: Z-Score on Amount (Requires transactions_df) ---
        user_txs = pd.DataFrame()
        if not transactions_df.empty:
            user_txs = transactions_df[transactions_df['sourceUsername'] == username].copy()
            
        if not user_txs.empty:
            user_txs['amount'] = pd.to_numeric(user_txs['amount'], errors='coerce')
            amounts = user_txs['amount'].dropna().values
            if len(amounts) >= self.min_history:
                history_amt = amounts[10:] if len(amounts) > 15 else amounts[len(amounts)//2:]
                recent_amts = amounts[:10] if len(amounts) > 15 else amounts[:len(amounts)//2]
                if len(history_amt) == 0:
                    history_amt = amounts
                mean_amt = np.mean(history_amt)
                std_amt = np.std(history_amt)
                if std_amt > 0:
                    max_recent_amt = np.max(recent_amts)
                    z_score = (max_recent_amt - mean_amt) / std_amt
                    if z_score > self.z_threshold:
                        amount_score = min(1.0, 0.3 + 0.7 * ((z_score - self.z_threshold) / (self.z_threshold * 2)))
                        if amount_score > anomaly_score:
                            anomaly_score = amount_score
                            explanations.append(f"Transfer of ${max_recent_amt:,.2f} is {z_score:.1f} std deviations above historical mean")
            else:
                max_recent = np.max(amounts)
                if max_recent >= 100000:
                    anomaly_score = 0.9
                    explanations.append(f"Massive transaction of ${max_recent:,.2f} detected with insufficient history")

        # --- Signal 3b: Frequency Burst Detection (Using Audit Logs!) ---
        # By using audit logs, we correctly track the INITIATOR of the action, catching
        # rogue Tellers/Managers who are manipulating other people's accounts.
        now = pd.Timestamp.now(tz='UTC')
        freq_cutoff = now - pd.Timedelta(minutes=5)
        
        # Filter audit logs to high-risk actions (financial or write) in the last 5 minutes
        if not user_audit_df.empty:
            # First, ensure timestamp is a datetime object
            user_audit_df['timestamp'] = pd.to_datetime(user_audit_df['timestamp'])
            
            if user_audit_df['timestamp'].dt.tz is None:
                user_audit_df['timestamp'] = user_audit_df['timestamp'].dt.tz_localize('UTC')
                
            recent_audit = user_audit_df[user_audit_df['timestamp'] >= freq_cutoff]
            # Count actions that are financial or write
            burst_actions = recent_audit[recent_audit['action'].apply(lambda x: get_action_category(x) in ['financial', 'write'])]
            recent_burst_count = len(burst_actions)
            
            # Threshold for insider threat bursts
            if recent_burst_count > 5:
                freq_score = min(1.0, 0.3 + 0.7 * ((recent_burst_count - 5) / 10.0))
                if freq_score > anomaly_score:
                    anomaly_score = freq_score
                    explanations.append(f"Insider Burst: {recent_burst_count} high-risk actions in <5 minutes")

        explanation = " | ".join(explanations) if explanations else None
        return anomaly_score, explanation


# ---------------------------------------------------------------------------
# Signal 4: Temporal Anomaly Detector (NEW)
# ---------------------------------------------------------------------------
class TemporalAnalyzer:
    """Detects insider threat patterns invisible to the LSTM and stat profiler:
    
    1. After-hours access: Flags activity outside business hours. Compromised
       accounts or malicious insiders often operate when oversight is minimal.
    2. Action diversity shift: If a user who normally uses 3 distinct action
       types suddenly uses 8 different types, they may be in the reconnaissance
       phase of an insider attack.
    """

    def __init__(self):
        self.config = AI_CONFIG.get("temporal_analyzer", {})
        self.business_hours = (
            self.config.get("business_hour_start", 9),
            self.config.get("business_hour_end", 18)
        )
        self.after_hours_threshold = self.config.get("after_hours_ratio_threshold", 0.3)
        self.diversity_multiplier = self.config.get("diversity_spike_multiplier", 2.0)

    def analyze(self, username, user_audit_df):
        """Analyze temporal patterns and return an anomaly score [0.0, 1.0] with explanation."""
        score = 0.0
        explanations = []

        if user_audit_df.empty:
            return 0.0, None

        audit_copy = user_audit_df.copy()
        audit_copy['timestamp'] = pd.to_datetime(audit_copy['timestamp'])

        # --- Sub-signal 4a: After-hours access ---
        if audit_copy['timestamp'].dt.tz is not None:
            hours = audit_copy['timestamp'].dt.hour
        else:
            hours = audit_copy['timestamp'].dt.hour

        after_hours_mask = (hours < self.business_hours[0]) | (hours >= self.business_hours[1])
        after_hours_count = after_hours_mask.sum()

        if after_hours_count > 0:
            after_hours_ratio = after_hours_count / len(audit_copy)
            if after_hours_ratio > self.after_hours_threshold:
                ah_score = min(1.0, 0.3 + after_hours_ratio)
                if ah_score > score:
                    score = ah_score
                    explanations.append(
                        f"{after_hours_count}/{len(audit_copy)} actions outside "
                        f"business hours ({self.business_hours[0]}:00-{self.business_hours[1]}:00)"
                    )

        # --- Sub-signal 4b: Action diversity spike ---
        if len(audit_copy) > 10:
            recent_actions = audit_copy['action'].tail(10).tolist()
            historical_actions = audit_copy['action'].iloc[:-10].tolist()

            recent_diversity = len(set(recent_actions)) / max(len(recent_actions), 1)
            historical_diversity = len(set(historical_actions)) / max(len(historical_actions), 1)

            if historical_diversity > 0 and recent_diversity > historical_diversity * self.diversity_multiplier:
                div_score = min(1.0, 0.4 + (recent_diversity - historical_diversity))
                if div_score > score:
                    score = div_score
                    explanations.append(
                        f"Action diversity spike: {recent_diversity:.0%} recent vs "
                        f"{historical_diversity:.0%} historical"
                    )

        explanation = " | ".join(explanations) if explanations else None
        return score, explanation


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
# 4-Signal Risk Fusion Engine
# ---------------------------------------------------------------------------
def fuse_risk_scores(lstm_score, role_violation_score, stat_score, temporal_score):
    """Combine all four signals into a unified risk score [0.0, 1.0].
    
    Each signal is weighted according to ai_config.json signal_weights.
    Automatic escalation: if ANY single signal exceeds the threshold,
    the fused score is floored at 0.7 (MEDIUM) regardless of other signals.
    """
    weights = AI_CONFIG["signal_weights"]

    fused = (weights["lstm"] * lstm_score +
             weights["role_violation"] * role_violation_score +
             weights["statistical"] * stat_score +
             weights["temporal"] * temporal_score)

    # Automatic escalation for critical single-signal detections
    escalation_threshold = weights.get("single_signal_escalation_threshold", 0.85)
    max_single = max(lstm_score, role_violation_score, stat_score, temporal_score)
    if max_single >= escalation_threshold:
        fused = max(fused, 0.7)

    return min(1.0, fused)


def normalize_lstm_error(reconstruction_error, threshold):
    """Normalize raw LSTM MSE reconstruction error to [0.0, 1.0].
    
    At threshold: 0.5 (borderline normal)
    At 2x threshold: 1.0 (fully anomalous)
    Below threshold: proportional 0.0-0.5
    """
    if threshold <= 0:
        return 0.0

    if reconstruction_error <= threshold:
        return (reconstruction_error / threshold) * 0.5
    else:
        return min(1.0, 0.5 + ((reconstruction_error - threshold) / threshold) * 0.5)


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
# Core Analysis Loop — 4-Signal Pipeline
# ---------------------------------------------------------------------------
def analyze_logs():
    global LAST_SEEN_LOG_ID, GLOBAL_MODEL, GLOBAL_THRESHOLD
    if GLOBAL_MODEL is None:
        print("Model is not loaded. Skipping inference.")
        return

    print(f"\n[{datetime.now()}] Running 4-Signal Insider Threat Analysis...")

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

    # Initialize signal analyzers
    profiler = TransactionProfiler()
    temporal_analyzer = TemporalAnalyzer()

    df = df.sort_values(by=['username', 'timestamp'])

    lstm_cfg = AI_CONFIG["lstm"]
    seq_len = lstm_cfg["sequence_length"]

    for username in users_to_evaluate:
        group = df[df['username'] == username]
        user_role = group.iloc[0].get('role', 'UNKNOWN') if 'role' in group.columns else 'UNKNOWN'
        actions = group['action'].tolist()
        recent_actions = actions[-seq_len:]

        # --- Signal 1: LSTM Sequence Anomaly (Role-Conditioned) ---
        seq = [0] * seq_len
        for i, a in enumerate(recent_actions):
            seq[i] = action_to_idx(a)

        seq_tensor = torch.tensor([seq], dtype=torch.long)
        role_tensor = torch.tensor([role_to_id(user_role)], dtype=torch.long)

        with torch.no_grad():
            reconstructed, target_emb = GLOBAL_MODEL(seq_tensor, role_tensor)
            # MSE over non-padding positions
            mask = (seq_tensor != 0).unsqueeze(-1).float()  # (1, T, 1)
            mse_per_pos = ((reconstructed - target_emb) ** 2).mean(dim=-1)  # (1, T)
            masked_mse = (mse_per_pos * mask.squeeze(-1)).sum() / mask.sum().clamp(min=1)
            reconstruction_error = masked_mse.item()

        valid_elements = sum(1 for s in seq if s != 0)
        lstm_normalized = normalize_lstm_error(reconstruction_error, GLOBAL_THRESHOLD)

        # --- Signal 2: Role-Action Violation (Independent) ---
        role_violation_score, role_violation_explanation = compute_role_violation_score(recent_actions, user_role)

        # --- Signal 3: Statistical Transaction Profiler ---
        user_audit_df = df[df['username'] == username].copy()
        stat_score, stat_explanation = profiler.analyze(username, user_role, tx_df, user_audit_df)

        # --- Signal 4: Temporal Anomaly Detector ---
        temporal_score, temporal_explanation = temporal_analyzer.analyze(username, user_audit_df)

        # --- Fuse All 4 Signals ---
        fused_score = fuse_risk_scores(lstm_normalized, role_violation_score, stat_score, temporal_score)
        severity = score_to_severity(fused_score)

        if severity is not None and valid_elements >= 3:
            # Build enriched multi-signal description
            desc_parts = [f"4-Signal Insider Threat Detection — Fused Risk: {fused_score:.2f}"]

            desc_parts.append(f"S1 LSTM: {lstm_normalized:.2f} (MSE: {reconstruction_error:.4f}, Threshold: {GLOBAL_THRESHOLD:.4f})")

            if role_violation_explanation:
                desc_parts.append(f"S2 Role-Violation: {role_violation_score:.2f} — {role_violation_explanation}")

            if stat_explanation:
                desc_parts.append(f"S3 Statistical: {stat_score:.2f} — {stat_explanation}")

            if temporal_explanation:
                desc_parts.append(f"S4 Temporal: {temporal_score:.2f} — {temporal_explanation}")

            full_desc = " | ".join(desc_parts)

            print(f"[!] THREAT DETECTED: {username} ({user_role}) - Severity: {severity} - Fused: {fused_score:.2f}")
            print(f"    S1 LSTM:           {lstm_normalized:.2f} (raw MSE: {reconstruction_error:.4f})")
            print(f"    S2 Role-Violation:  {role_violation_score:.2f}" + (f" — {role_violation_explanation}" if role_violation_explanation else ""))
            print(f"    S3 Statistical:     {stat_score:.2f}" + (f" — {stat_explanation}" if stat_explanation else ""))
            print(f"    S4 Temporal:        {temporal_score:.2f}" + (f" — {temporal_explanation}" if temporal_explanation else ""))

            send_alert(username, full_desc, severity, risk_score=fused_score)
        else:
            print(f"[+] Normal: {username} ({user_role}) - S1:{lstm_normalized:.2f} S2:{role_violation_score:.2f} S3:{stat_score:.2f} S4:{temporal_score:.2f} -> Fused:{fused_score:.2f}")


def poll_training():
    """Poll the backend to see if adaptive training has been triggered."""
    try:
        resp = requests.get(f"{JAVA_BACKEND_URL}/ai/training/status", headers=ai_headers())
        if resp.status_code == 200:
            data = resp.json()
            if data.get("status") == "TRAIN_REQUESTED":
                print(f"[{datetime.now()}] Adaptive Training Triggered by Admin!")
                # Import here to avoid circular imports
                from train import train_model
                train_model(adaptive=True)
                # After training, reload the model
                global GLOBAL_MODEL, GLOBAL_THRESHOLD
                load_model()
    except Exception as e:
        print(f"Failed to poll training status: {e}")

def run_scheduler():
    from apscheduler.schedulers.blocking import BlockingScheduler
    interval = AI_CONFIG["scheduler"]["polling_interval_seconds"]
    scheduler = BlockingScheduler()
    scheduler.add_job(analyze_logs, 'interval', seconds=interval)
    scheduler.add_job(poll_training, 'interval', seconds=max(5, interval)) # Check for training frequently
    print(f"4-Signal Insider Threat Scheduler Started. Polling every {interval} seconds.")
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        pass