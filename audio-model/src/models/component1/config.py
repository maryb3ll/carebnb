import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables (audio-model/.env and project root .env.local)
load_dotenv()
root_env = Path(__file__).resolve().parent.parent.parent.parent.parent / ".env.local"
if root_env.exists():
    load_dotenv(root_env)

# API Configuration (OPENAI_KEY from root .env.local also supported)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY") or os.getenv("OPENAI_KEY")
WHISPER_MODEL = 'whisper-1'  # OpenAI Whisper model

# Paths
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
OUTPUT_DIR = PROJECT_ROOT / 'data' / 'components' / 'component1'
ITERATION_TRACKER = PROJECT_ROOT / 'data' / 'components' / 'iteration_tracker.txt'
ERROR_LOG = PROJECT_ROOT / 'logs' / 'errors.log'

# Ensure output directory exists
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
