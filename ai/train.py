import os
import random
import torch
import torch.nn as nn
from inference import LSTMAutoencoder, load_action_registry, load_ai_config

ACTION_MAP, VOCAB_SIZE, ROLE_PERMISSIONS = load_action_registry()
AI_CONFIG = load_ai_config()

MODEL_DIR = os.path.join(os.path.dirname(__file__), "data")
MODEL_PATH = os.path.join(MODEL_DIR, "model_state.pt")


# ---------------------------------------------------------------------------
# Role-Specific Markov Chain Data Generator
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
    
    The distributions are automatically derived from the action_registry.json,
    so adding new actions or roles requires zero code changes.
    """
    train_cfg = AI_CONFIG["training"]
    if num_samples is None:
        num_samples = train_cfg["num_samples"]
    if seq_len is None:
        seq_len = AI_CONFIG["lstm"]["sequence_length"]

    data = []
    roles = list(ROLE_DISTRIBUTIONS.keys())

    for _ in range(num_samples):
        seq = [0] * seq_len
        actual_len = random.randint(2, seq_len)
        role = random.choice(roles)
        role_actions, role_weights = zip(*ROLE_DISTRIBUTIONS[role])

        for i in range(actual_len):
            # 5% chance of "noise" — any action from any role (simulates edge cases)
            if random.random() < 0.05:
                all_action_ids = [m["id"] for m in ACTION_MAP.values()]
                seq[i] = random.choice(all_action_ids)
            else:
                seq[i] = random.choices(role_actions, weights=role_weights, k=1)[0]

        data.append(seq)

    return torch.tensor(data, dtype=torch.long)


def generate_adversarial_sequences(num_per_pattern=100, seq_len=None):
    """
    Generates known attack patterns for validation. These should produce HIGH
    reconstruction errors in a well-trained model.
    
    Patterns:
    1. Privilege Escalation — customer performing admin actions
    2. Smurfing — rapid repeated small transfers
    3. Data Exfiltration — bulk GET requests in rapid succession
    4. Cross-role chaos — random mix of all action categories
    """
    if seq_len is None:
        seq_len = AI_CONFIG["lstm"]["sequence_length"]

    admin_actions = [m["id"] for p, m in ACTION_MAP.items() if m["category"] == "admin"]
    financial_actions = [m["id"] for p, m in ACTION_MAP.items() if m["category"] == "financial"]
    read_actions = [m["id"] for p, m in ACTION_MAP.items() if m["category"] == "read"]
    all_actions = [m["id"] for m in ACTION_MAP.values()]

    adversarial = []

    # Pattern 1: Privilege Escalation (customer doing admin stuff)
    for _ in range(num_per_pattern):
        seq = [0] * seq_len
        for i in range(seq_len):
            if i < 2:
                seq[i] = random.choice(read_actions) if read_actions else 1
            else:
                seq[i] = random.choice(admin_actions) if admin_actions else random.choice(all_actions)
        adversarial.append(seq)

    # Pattern 2: Smurfing (rapid repeated transfers)
    transfer_id = ACTION_MAP.get("POST /api/transactions/transfer", {}).get("id", 3)
    for _ in range(num_per_pattern):
        seq = [transfer_id] * seq_len
        adversarial.append(seq)

    # Pattern 3: Data Exfiltration (bulk reads)
    for _ in range(num_per_pattern):
        seq = [0] * seq_len
        for i in range(seq_len):
            seq[i] = random.choice(read_actions) if read_actions else 1
        adversarial.append(seq)

    # Pattern 4: Cross-role chaos
    for _ in range(num_per_pattern):
        seq = [0] * seq_len
        for i in range(seq_len):
            seq[i] = random.choice(all_actions)
        adversarial.append(seq)

    return torch.tensor(adversarial, dtype=torch.long)


def train_model():
    """
    Trains the LSTM Autoencoder model using role-aware synthetic data.
    The model learns what "normal" action sequences look like per role,
    and the dynamic threshold is calibrated from the training distribution.
    
    Adversarial sequences are used for validation (not training) to verify
    that the model correctly flags known attack patterns.
    """
    os.makedirs(MODEL_DIR, exist_ok=True)
    train_cfg = AI_CONFIG["training"]
    lstm_cfg = AI_CONFIG["lstm"]

    print("Initializing CERT-Inspired Insider Threat AI (v2 — Dual Signal)...")
    print(f"Action vocabulary: {len(ACTION_MAP)} actions, {VOCAB_SIZE} total IDs")
    print(f"Roles learned: {list(ROLE_DISTRIBUTIONS.keys())}")
    print(f"Generating {train_cfg['num_samples']:,} synthetic role-aware sequences...")

    X_train = generate_synthetic_data()

    model = LSTMAutoencoder(
        seq_len=lstm_cfg["sequence_length"],
        n_features=VOCAB_SIZE,
        embedding_dim=lstm_cfg["embedding_dim"],
        hidden_dim=lstm_cfg["hidden_dim"],
        num_layers=lstm_cfg["num_layers"]
    )

    criterion = nn.CrossEntropyLoss(ignore_index=0, reduction='none')
    optimizer = torch.optim.Adam(model.parameters(), lr=train_cfg["learning_rate"])

    print(f"Training PyTorch LSTM Autoencoder ({train_cfg['epochs']} Epochs)...")
    model.train()
    for epoch in range(train_cfg["epochs"]):
        optimizer.zero_grad()
        output = model(X_train)

        loss = criterion(output.view(-1, VOCAB_SIZE), X_train.view(-1))
        loss_matrix = loss.view(-1, lstm_cfg["sequence_length"])
        mask = (X_train != 0).float()
        seq_losses = (loss_matrix * mask).sum(dim=1) / (mask.sum(dim=1) + 1e-8)

        batch_loss = seq_losses.mean()
        batch_loss.backward()
        optimizer.step()

        if (epoch + 1) % 5 == 0:
            print(f"Epoch {epoch+1}/{train_cfg['epochs']} - Loss: {batch_loss.item():.4f}")

    # Calculate Dynamic Threshold based on configurable percentile
    model.eval()
    with torch.no_grad():
        output = model(X_train)
        loss = criterion(output.view(-1, VOCAB_SIZE), X_train.view(-1))
        loss_matrix = loss.view(-1, lstm_cfg["sequence_length"])
        mask = (X_train != 0).float()
        seq_losses = (loss_matrix * mask).sum(dim=1) / (mask.sum(dim=1) + 1e-8)

        threshold = torch.quantile(seq_losses[seq_losses > 0], train_cfg["threshold_percentile"]).item()

    print(f"Training complete! Dynamic Alert Threshold: {threshold:.2f}")

    # --- Adversarial Validation ---
    print("\n--- Adversarial Validation ---")
    X_attack = generate_adversarial_sequences()
    with torch.no_grad():
        output = model(X_attack)
        loss = criterion(output.view(-1, VOCAB_SIZE), X_attack.view(-1))
        loss_matrix = loss.view(-1, lstm_cfg["sequence_length"])
        mask = (X_attack != 0).float()
        attack_losses = (loss_matrix * mask).sum(dim=1) / (mask.sum(dim=1) + 1e-8)

        detected = (attack_losses > threshold).sum().item()
        total = len(attack_losses)
        print(f"Attack detection rate: {detected}/{total} ({100*detected/total:.1f}%) flagged above threshold {threshold:.2f}")
        print(f"Mean attack error: {attack_losses.mean().item():.2f} vs normal threshold: {threshold:.2f}")

    # Save the model state and threshold
    torch.save({
        'model_state_dict': model.state_dict(),
        'threshold': threshold
    }, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")


if __name__ == "__main__":
    train_model()
