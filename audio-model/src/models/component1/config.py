import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# API Configuration
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
WHISPER_MODEL = 'whisper-1'  # OpenAI Whisper model

# Paths
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
OUTPUT_DIR = PROJECT_ROOT / 'data' / 'components' / 'component1'
ITERATION_TRACKER = PROJECT_ROOT / 'data' / 'components' / 'iteration_tracker.txt'
ERROR_LOG = PROJECT_ROOT / 'logs' / 'errors.log'

# Ensure output directory exists
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
