import os
import random
import torch
import torch.nn as nn
import requests
from inference import (
    InsiderThreatLSTM, load_action_registry, load_ai_config, JAVA_BACKEND_URL, ai_headers, action_to_idx, role_to_id
)

ACTION_MAP, VOCAB_SIZE, ROLE_PERMISSIONS, ROLE_ID_MAP, NUM_ROLES = load_action_registry()
AI_CONFIG = load_ai_config()

MODEL_DIR = os.path.join(os.path.dirname(__file__), "data")
MODEL_PATH = os.path.join(MODEL_DIR, "model_state.pt")


# ---------------------------------------------------------------------------
# Role-Specific Markov Chain Data Generator (Role-Conditioned)
# ---------------------------------------------------------------------------
# Instead of hardcoding action probabilities, we derive them automatically from
# the action registry. Each role's permitted categories determine which actions
# it can perform, and the risk weights influence the transition probabilities
# (lower risk actions are more frequent in normal behavior).

def _build_role_action_distributions():
    """Build per-role action probability distributions from the action registry.
    
    Returns a dict of {role_name: [(action_id, probability), ...]}
    Actions in the role's permitted categories get probability proportional to
    (1 - risk_weight), so low-risk actions are most common in normal behavior.
    """
    distributions = {}

    for role, permitted_cats in ROLE_PERMISSIONS.items():
        actions_for_role = []
        for pattern, meta in ACTION_MAP.items():
            if meta["category"] in permitted_cats:
                # Weight inversely to risk: safe actions are more frequent in normal behavior
                weight = max(0.05, 1.0 - meta["risk_weight"])
                actions_for_role.append((meta["id"], weight))

        if not actions_for_role:
            continue

        # Normalize weights to probabilities
        total_weight = sum(w for _, w in actions_for_role)
        distributions[role] = [
            (action_id, weight / total_weight) for action_id, weight in actions_for_role
        ]

    return distributions


ROLE_DISTRIBUTIONS = _build_role_action_distributions()


def generate_synthetic_data(num_samples=None, seq_len=None):
    """
    Generates role-aware stochastic Markov-chain sequences to simulate
    realistic normal banking behavior. Each sequence is generated for a
    randomly chosen role, using that role's learned action distribution.
    
    Returns:
        action_sequences: (num_samples, seq_len) tensor of action IDs
        role_ids: (num_samples,) tensor of role IDs
    
    The distributions are automatically derived from the action_registry.json,
    so adding new actions or roles requires zero code changes.
    """
    train_cfg = AI_CONFIG["training"]
    if num_samples is None:
        num_samples = train_cfg["num_samples"]
    if seq_len is None:
        seq_len = AI_CONFIG["lstm"]["sequence_length"]

    action_data = []
    role_data = []
    roles = list(ROLE_DISTRIBUTIONS.keys())

    for _ in range(num_samples):
        seq = [0] * seq_len
        actual_len = random.randint(2, seq_len)
        role = random.choice(roles)
        role_id = ROLE_ID_MAP.get(role, 0)
        role_actions, role_weights = zip(*ROLE_DISTRIBUTIONS[role])

        for i in range(actual_len):
            # 5% chance of "noise" — any action from any role (simulates edge cases)
            if random.random() < 0.05:
                all_action_ids = [m["id"] for m in ACTION_MAP.values()]
                seq[i] = random.choice(all_action_ids)
            else:
                seq[i] = random.choices(role_actions, weights=role_weights, k=1)[0]

        action_data.append(seq)
        role_data.append(role_id)

    return torch.tensor(action_data, dtype=torch.long), torch.tensor(role_data, dtype=torch.long)


def generate_adversarial_sequences(num_per_pattern=100, seq_len=None):
    """
    Generates known attack patterns for validation. These should produce HIGH
    reconstruction errors in a well-trained role-conditioned model.
    
    Patterns (now role-conditioned — the model sees the WRONG role for the actions):
    1. Privilege Escalation — admin actions conditioned on ROLE_CUSTOMER
    2. Smurfing — rapid repeated transfers conditioned on ROLE_CUSTOMER
    3. Data Exfiltration — bulk reads conditioned on ROLE_CUSTOMER
    4. Cross-role chaos — random mix of all action categories
    5. Insider Teller Attack — admin actions conditioned on ROLE_TELLER
    6. Insider Manager Attack — financial burst conditioned on ROLE_BRANCH_MANAGER
    
    Returns:
        action_sequences: (num_total, seq_len) tensor
        role_ids: (num_total,) tensor
    """
    if seq_len is None:
        seq_len = AI_CONFIG["lstm"]["sequence_length"]

    admin_actions = [m["id"] for p, m in ACTION_MAP.items() if m["category"] == "admin"]
    financial_actions = [m["id"] for p, m in ACTION_MAP.items() if m["category"] == "financial"]
    read_actions = [m["id"] for p, m in ACTION_MAP.items() if m["category"] == "read"]
    all_actions = [m["id"] for m in ACTION_MAP.values()]

    adversarial_seqs = []
    adversarial_roles = []

    customer_id = ROLE_ID_MAP.get("ROLE_CUSTOMER", 1)
    teller_id = ROLE_ID_MAP.get("ROLE_TELLER", 2)
    manager_id = ROLE_ID_MAP.get("ROLE_BRANCH_MANAGER", 3)

    # Pattern 1: Privilege Escalation (customer doing admin stuff)
    for _ in range(num_per_pattern):
        seq = [0] * seq_len
        for i in range(seq_len):
            if i < 2:
                seq[i] = random.choice(read_actions) if read_actions else 1
            else:
                seq[i] = random.choice(admin_actions) if admin_actions else random.choice(all_actions)
        adversarial_seqs.append(seq)
        adversarial_roles.append(customer_id)

    # Pattern 2: Smurfing (rapid repeated transfers — customer)
    transfer_id = ACTION_MAP.get("POST /api/transactions/transfer", {}).get("id", 3)
    for _ in range(num_per_pattern):
        seq = [transfer_id] * seq_len
        adversarial_seqs.append(seq)
        adversarial_roles.append(customer_id)

    # Pattern 3: Data Exfiltration (bulk reads — customer)
    for _ in range(num_per_pattern):
        seq = [0] * seq_len
        for i in range(seq_len):
            seq[i] = random.choice(read_actions) if read_actions else 1
        adversarial_seqs.append(seq)
        adversarial_roles.append(customer_id)

    # Pattern 4: Cross-role chaos (random role)
    for _ in range(num_per_pattern):
        seq = [0] * seq_len
        for i in range(seq_len):
            seq[i] = random.choice(all_actions)
        adversarial_seqs.append(seq)
        adversarial_roles.append(random.choice(list(ROLE_ID_MAP.values())))

    # Pattern 5: Insider Teller Attack — teller doing admin actions
    for _ in range(num_per_pattern):
        seq = [0] * seq_len
        for i in range(seq_len):
            if i < 3:
                # Start with normal teller actions (KYC, reads)
                teller_actions = [m["id"] for p, m in ACTION_MAP.items()
                                  if m["category"] in ["read", "write"]]
                seq[i] = random.choice(teller_actions) if teller_actions else 1
            else:
                seq[i] = random.choice(admin_actions) if admin_actions else random.choice(all_actions)
        adversarial_seqs.append(seq)
        adversarial_roles.append(teller_id)

    # Pattern 6: Insider Manager Attack — manager doing rapid financial burst
    for _ in range(num_per_pattern):
        seq = [0] * seq_len
        for i in range(seq_len):
            seq[i] = random.choice(financial_actions) if financial_actions else random.choice(all_actions)
        adversarial_seqs.append(seq)
        adversarial_roles.append(manager_id)

    return (torch.tensor(adversarial_seqs, dtype=torch.long),
            torch.tensor(adversarial_roles, dtype=torch.long))


def train_model(adaptive=False):
    """
    Trains the InsiderThreatLSTM using role-conditioned synthetic data.
    If adaptive=True, fetches false positives from the backend and includes them in training data.
    """
    os.makedirs(MODEL_DIR, exist_ok=True)
    train_cfg = AI_CONFIG["training"]
    lstm_cfg = AI_CONFIG["lstm"]

    print("=" * 60)
    print("  Initializing 4-Signal Insider Threat AI (v3)")
    print("=" * 60)
    print(f"  Action vocabulary: {len(ACTION_MAP)} actions, {VOCAB_SIZE} total IDs")
    print(f"  Roles: {list(ROLE_DISTRIBUTIONS.keys())}")
    print(f"  Role ID map: {ROLE_ID_MAP}")
    print(f"  Architecture: InsiderThreatLSTM (role-conditioned, MSE, positional encoding)")
    print(f"  Generating {train_cfg['num_samples']:,} synthetic role-aware sequences...")

    X_train_synth, R_train_synth = generate_synthetic_data()
    
    # Adaptive training: inject false positive sequences
    X_fp = []
    R_fp = []
    if adaptive:
        print("  [Adaptive] Fetching false positive sequences from backend...")
        try:
            resp = requests.get(f"{JAVA_BACKEND_URL}/ai/false-positives", headers=ai_headers())
            if resp.status_code == 200:
                fp_data = resp.json()
                for seq_obj in fp_data:
                    events = seq_obj.get("events", [])
                    role = events[0].get("role", "UNKNOWN") if events else "UNKNOWN"
                    role_id = role_to_id(role)
                    seq = [0] * lstm_cfg["sequence_length"]
                    actions = [e.get("action") for e in events]
                    recent = actions[-lstm_cfg["sequence_length"]:]
                    for i, a in enumerate(recent):
                        seq[i] = action_to_idx(a)
                    # Duplicate these multiple times so the model heavily weights them as normal
                    for _ in range(100):
                        X_fp.append(seq)
                        R_fp.append(role_id)
                print(f"  [Adaptive] Injected {len(fp_data)} unique false positive sequences (duplicated for weighting).")
        except Exception as e:
            print(f"  [Adaptive] Failed to fetch false positives: {e}")

    if X_fp:
        X_train = torch.cat([X_train_synth, torch.tensor(X_fp, dtype=torch.long)])
        R_train = torch.cat([R_train_synth, torch.tensor(R_fp, dtype=torch.long)])
    else:
        X_train = X_train_synth
        R_train = R_train_synth

    model = InsiderThreatLSTM(
        seq_len=lstm_cfg["sequence_length"],
        vocab_size=VOCAB_SIZE,
        num_roles=NUM_ROLES,
        embedding_dim=lstm_cfg["embedding_dim"],
        hidden_dim=lstm_cfg["hidden_dim"],
        num_layers=lstm_cfg["num_layers"]
    )

    optimizer = torch.optim.Adam(model.parameters(), lr=train_cfg["learning_rate"])

    print(f"\n  Training ({train_cfg['epochs']} Epochs, MSE Loss)...\n")
    model.train()
    for epoch in range(train_cfg["epochs"]):
        optimizer.zero_grad()

        reconstructed, target_emb = model(X_train, R_train)

        # MSE loss over non-padding positions
        mask = (X_train != 0).unsqueeze(-1).float()  # (B, T, 1)
        mse_per_sample = ((reconstructed - target_emb) ** 2 * mask).sum(dim=(1, 2)) / mask.sum(dim=(1, 2)).clamp(min=1)

        batch_loss = mse_per_sample.mean()
        batch_loss.backward()
        optimizer.step()

        if (epoch + 1) % 5 == 0:
            print(f"  Epoch {epoch+1}/{train_cfg['epochs']} — MSE Loss: {batch_loss.item():.6f}")

    # --- Calculate Dynamic Threshold ---
    model.eval()
    with torch.no_grad():
        reconstructed, target_emb = model(X_train, R_train)
        mask = (X_train != 0).unsqueeze(-1).float()
        mse_per_sample = ((reconstructed - target_emb) ** 2 * mask).sum(dim=(1, 2)) / mask.sum(dim=(1, 2)).clamp(min=1)

        # Use only non-zero errors for threshold calculation
        valid_errors = mse_per_sample[mse_per_sample > 0]
        threshold = torch.quantile(valid_errors, train_cfg["threshold_percentile"]).item()

    print(f"\n  Training complete! Dynamic MSE Threshold: {threshold:.6f}")
    print(f"  (Sequences with MSE > {threshold:.6f} are anomalous)")

    # --- Adversarial Validation ---
    print("\n" + "=" * 60)
    print("  Adversarial Validation (6 attack patterns)")
    print("=" * 60)

    X_attack, R_attack = generate_adversarial_sequences()
    pattern_names = [
        "Privilege Escalation (customer→admin)",
        "Smurfing (repeated transfers)",
        "Data Exfiltration (bulk reads)",
        "Cross-role chaos",
        "Insider Teller (teller→admin)",
        "Insider Manager (financial burst)"
    ]
    num_per_pattern = 100

    with torch.no_grad():
        reconstructed, target_emb = model(X_attack, R_attack)
        mask = (X_attack != 0).unsqueeze(-1).float()
        attack_mse = ((reconstructed - target_emb) ** 2 * mask).sum(dim=(1, 2)) / mask.sum(dim=(1, 2)).clamp(min=1)

        # Overall stats
        detected = (attack_mse > threshold).sum().item()
        total = len(attack_mse)
        print(f"\n  Overall detection rate: {detected}/{total} ({100*detected/total:.1f}%) above threshold {threshold:.6f}")
        print(f"  Mean attack MSE: {attack_mse.mean().item():.6f} vs threshold: {threshold:.6f}\n")

        # Per-pattern breakdown
        for i, name in enumerate(pattern_names):
            start = i * num_per_pattern
            end = start + num_per_pattern
            pattern_errors = attack_mse[start:end]
            pattern_detected = (pattern_errors > threshold).sum().item()
            pattern_mean = pattern_errors.mean().item()
            print(f"  [{i+1}] {name}")
            print(f"      Detection: {pattern_detected}/{num_per_pattern} ({100*pattern_detected/num_per_pattern:.0f}%)  Mean MSE: {pattern_mean:.6f}")

    # --- Save Model ---
    torch.save({
        'architecture': 'InsiderThreatLSTM',
        'model_state_dict': model.state_dict(),
        'threshold': threshold,
        'role_id_map': ROLE_ID_MAP,
        'vocab_size': VOCAB_SIZE,
        'num_roles': NUM_ROLES
    }, MODEL_PATH)
    print(f"\n  Model saved to {MODEL_PATH}")

    # --- Push Metrics to Backend ---
    try:
        metrics = {
            "threshold": threshold,
            "mseLoss": batch_loss.item(),
            "overallDetectionRate": detected / total
        }
        requests.post(f"{JAVA_BACKEND_URL}/ai/training/metrics", json=metrics, headers=ai_headers())
        print("  Metrics pushed to backend.")
    except Exception as e:
        print(f"  Failed to push metrics to backend: {e}")

if __name__ == "__main__":
    train_model()
