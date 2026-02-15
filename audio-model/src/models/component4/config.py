import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()
root_env = Path(__file__).resolve().parent.parent.parent.parent.parent / ".env.local"
if root_env.exists():
    load_dotenv(root_env)

# API Configuration (OPENAI_KEY from root .env.local also supported)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY") or os.getenv("OPENAI_KEY")
MODEL = 'gpt-4o'  # GPT-4o for chain-of-thought reasoning

# Paths
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
OUTPUT_DIR = PROJECT_ROOT / 'data' / 'components' / 'component4'
FINAL_OUTPUT_DIR = PROJECT_ROOT / 'output'
ITERATION_TRACKER = PROJECT_ROOT / 'data' / 'components' / 'iteration_tracker.txt'
ERROR_LOG = PROJECT_ROOT / 'logs' / 'errors.log'

# Component 2 and 3 input directories
COMPONENT2_DIR = PROJECT_ROOT / 'data' / 'components' / 'component2'
COMPONENT3_DIR = PROJECT_ROOT / 'data' / 'components' / 'component3'

# Ensure output directories exist
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
FINAL_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
