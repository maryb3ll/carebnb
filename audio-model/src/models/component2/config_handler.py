import sys
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

def get_model_id():
    """Read KEYWORD_EXTRACTOR_MODEL_ID from src/models/config.py"""
    try:
        from src.models import config
        return getattr(config, 'KEYWORD_EXTRACTOR_MODEL_ID', None)
    except (ImportError, AttributeError):
        return None

def save_model_id(model_id: str):
    """Save model ID to src/models/config.py"""
    config_path = PROJECT_ROOT / 'src' / 'models' / 'config.py'

    # Read current content
    try:
        with open(config_path, 'r') as f:
            content = f.read()
    except FileNotFoundError:
        content = ""

    # Update or add model ID
    if 'KEYWORD_EXTRACTOR_MODEL_ID' in content:
        # Replace existing
        import re
        content = re.sub(
            r'KEYWORD_EXTRACTOR_MODEL_ID\s*=\s*.*',
            f'KEYWORD_EXTRACTOR_MODEL_ID = "{model_id}"',
            content
        )
    else:
        # Add new
        content += f'\n# Fine-tuned model configuration\nKEYWORD_EXTRACTOR_MODEL_ID = "{model_id}"\n'

    with open(config_path, 'w') as f:
        f.write(content)

def model_exists():
    """Check if fine-tuned model already exists"""
    model_id = get_model_id()
    return model_id is not None and model_id != "" and model_id != "None"
