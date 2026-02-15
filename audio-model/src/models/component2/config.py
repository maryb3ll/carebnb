import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# API Configuration
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
BASE_MODEL = 'gpt-4o-mini-2024-07-18'  # Specific snapshot required for fine-tuning

# Paths
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
OUTPUT_DIR = PROJECT_ROOT / 'data' / 'components' / 'component2'
ITERATION_TRACKER = PROJECT_ROOT / 'data' / 'components' / 'iteration_tracker.txt'
ERROR_LOG = PROJECT_ROOT / 'logs' / 'errors.log'

# Dataset paths
DATASET_CSV = PROJECT_ROOT / 'data' / 'medical-transcriptions' / 'mtsamples.csv'
TRAINING_JSONL = OUTPUT_DIR / 'training_data.jsonl'
VALIDATION_JSONL = OUTPUT_DIR / 'validation_data.jsonl'

# Component 1 input
COMPONENT1_DIR = PROJECT_ROOT / 'data' / 'components' / 'component1'

# Ensure output directory exists
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
