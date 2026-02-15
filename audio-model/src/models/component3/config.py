import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()
root_env = Path(__file__).resolve().parent.parent.parent.parent.parent / ".env.local"
if root_env.exists():
    load_dotenv(root_env)

# API Configuration (ANTHROPIC_API_KEY from root .env.local also loaded above)
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
CLAUDE_MODEL = 'claude-opus-4-20250514'  # Claude 4 Opus

# Agent Settings
ADAPTIVE_THINKING = True
EFFORT = 'medium'
MAX_TURNS = 4

# PubMed Settings
MAX_SEARCH_RESULTS = 10  # Search for 10 articles, get abstracts
TOP_SOURCES_TO_DOWNLOAD = 3  # Download PDFs for top 3 selected

# Paths
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
OUTPUT_DIR = PROJECT_ROOT / 'data' / 'components' / 'component3'
ITERATION_TRACKER = PROJECT_ROOT / 'data' / 'components' / 'iteration_tracker.txt'
ERROR_LOG = PROJECT_ROOT / 'logs' / 'errors.log'

# Component 2 input
COMPONENT2_DIR = PROJECT_ROOT / 'data' / 'components' / 'component2'

# Ensure output directory exists
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
