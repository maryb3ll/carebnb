import pandas as pd
import json
from . import config

def prepare_dataset():
    """Convert CSV to JSONL format for fine-tuning."""
    # Load dataset
    df = pd.read_csv(config.DATASET_CSV)

    # Filter valid rows (non-null required fields)
    df_clean = df.dropna(subset=['transcription', 'keywords', 'description'])

    # Shuffle and split 80/20
    df_shuffled = df_clean.sample(frac=1, random_state=42)
    split_idx = int(len(df_shuffled) * 0.8)
    train_df = df_shuffled[:split_idx]
    val_df = df_shuffled[split_idx:]

    # Convert to JSONL
    def create_training_example(row):
        return {
            "messages": [
                {"role": "system", "content": "You are a medical transcription analyzer that extracts keywords and creates concise descriptions."},
                {"role": "user", "content": row['transcription']},
                {"role": "assistant", "content": f"Keywords: {row['keywords']}\nDescription: {row['description']}"}
            ]
        }

    # Write training JSONL
    with open(config.TRAINING_JSONL, 'w') as f:
        for _, row in train_df.iterrows():
            f.write(json.dumps(create_training_example(row)) + '\n')

    # Write validation JSONL
    with open(config.VALIDATION_JSONL, 'w') as f:
        for _, row in val_df.iterrows():
            f.write(json.dumps(create_training_example(row)) + '\n')

    print(f"✓ Training examples: {len(train_df)}")
    print(f"✓ Validation examples: {len(val_df)}")
    print(f"✓ Saved to {config.OUTPUT_DIR}")

    return len(train_df), len(val_df)
