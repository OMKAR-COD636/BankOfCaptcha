import os
from inference import load_model, run_scheduler, MODEL_PATH
from train import train_model

def main():
    print("=" * 60)
    print("  BankOfCaptcha AI Engine (v3 — 4-Signal Architecture)")
    print("=" * 60)
    print("  S1: LSTM Behavioral Sequence Anomaly (Role-Conditioned)")
    print("  S2: Role-Action Violation Detector")
    print("  S3: Statistical Transaction Profiler")
    print("  S4: Temporal Anomaly Analyzer")
    print()

    # Initialize the model only if it doesn't already exist
    if not os.path.exists(MODEL_PATH):
        print(f"Model not found at {MODEL_PATH}. Running initial training...")
        train_model()
    else:
        print(f"Model found at {MODEL_PATH}. Bypassing training.")

    # Load the model into the inference engine
    success = load_model()
    if not success:
        print("Failed to start AI service. Exiting.")
        return

    # Start the continuous monitoring loop
    run_scheduler()

if __name__ == "__main__":
    main()
