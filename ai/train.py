import os
import torch
import torch.nn as nn
from inference import LSTMAutoencoder

MODEL_DIR = os.path.join(os.path.dirname(__file__), "data")
MODEL_PATH = os.path.join(MODEL_DIR, "model_state.pth")

# --- Synthetic Data Generator ---
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
        actual_len = random.randint(2, seq_len)
        persona = random.choice(['customer', 'teller', 'manager'])
        
        for i in range(actual_len):
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

def train_model():
    """
    Trains the LSTM Autoencoder model.
    Note: For now, this is triggered only on first initialization or manually.
    Later, we will add adaptive feedback-based training to the AI so it can learn 
    continuously from false positives/negatives in production.
    """
    os.makedirs(MODEL_DIR, exist_ok=True)
    
    print("Initializing CERT-Inspired Insider Threat AI...")
    print("Generating 20,000 synthetic stochastic sequences...")
    X_train = generate_synthetic_data()
    
    model = LSTMAutoencoder(seq_len=10, n_features=10)
    
    # If we wanted to continue training an existing model, we could load it here first
    # if os.path.exists(MODEL_PATH):
    #     checkpoint = torch.load(MODEL_PATH)
    #     model.load_state_dict(checkpoint['model_state_dict'])
    
    criterion = nn.CrossEntropyLoss(ignore_index=0, reduction='none')
    optimizer = torch.optim.Adam(model.parameters(), lr=0.005)
    
    print("Training PyTorch LSTM Autoencoder (30 Epochs)...")
    model.train()
    for epoch in range(30):
        optimizer.zero_grad()
        output = model(X_train)
        
        loss = criterion(output.view(-1, 10), X_train.view(-1))
        loss_matrix = loss.view(-1, 10)
        mask = (X_train != 0).float()
        seq_losses = (loss_matrix * mask).sum(dim=1) / (mask.sum(dim=1) + 1e-8)
        
        batch_loss = seq_losses.mean()
        batch_loss.backward()
        optimizer.step()
        
        if (epoch + 1) % 5 == 0:
            print(f"Epoch {epoch+1}/30 - Loss: {batch_loss.item():.4f}")
            
    # Calculate Dynamic Threshold based on 90th percentile of training data
    model.eval()
    with torch.no_grad():
        output = model(X_train)
        loss = criterion(output.view(-1, 10), X_train.view(-1))
        loss_matrix = loss.view(-1, 10)
        mask = (X_train != 0).float()
        seq_losses = (loss_matrix * mask).sum(dim=1) / (mask.sum(dim=1) + 1e-8)
        
        threshold = torch.quantile(seq_losses[seq_losses > 0], 0.90).item()
        
    print(f"Training complete! Dynamic Alert Threshold set to: {threshold:.2f}")
    
    # Save the model state and threshold
    torch.save({
        'model_state_dict': model.state_dict(),
        'threshold': threshold
    }, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")

if __name__ == "__main__":
    train_model()
