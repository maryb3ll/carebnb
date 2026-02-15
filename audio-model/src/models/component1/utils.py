from datetime import datetime
from pathlib import Path
from . import config

def get_current_iteration() -> int:
    """Read global iteration from tracker file."""
    try:
        with open(config.ITERATION_TRACKER, 'r') as f:
            content = f.read().strip()
            # Parse: iteration=N
            if '=' in content:
                return int(content.split('=')[1])
            return 0
    except (FileNotFoundError, ValueError):
        return 0

def log_error(component_num: int, error_msg: str):
    """Log error to ClaudeInfo/errors_fixes.MD."""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    # Read existing content
    try:
        with open(config.ERROR_LOG, 'r') as f:
            content = f.read()
    except FileNotFoundError:
        content = ""

    # Append new error under component section
    error_entry = f"\n## Component {component_num}\n**Timestamp:** {timestamp}\n**Error:** {error_msg}\n"

    with open(config.ERROR_LOG, 'a') as f:
        f.write(error_entry)
