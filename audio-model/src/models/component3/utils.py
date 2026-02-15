from datetime import datetime
from . import config

def get_current_iteration() -> int:
    """Read global iteration from tracker file."""
    try:
        with open(config.ITERATION_TRACKER, 'r') as f:
            content = f.read().strip()
            if '=' in content:
                return int(content.split('=')[1])
            return 0
    except (FileNotFoundError, ValueError):
        return 0

def get_component2_output(iteration: int):
    """Get Component 2 output file path for current iteration."""
    return config.COMPONENT2_DIR / f"{iteration}_2_output.json"

def log_error(component_num: int, error_msg: str):
    """Log error to ClaudeInfo/errors_fixes.MD."""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    error_entry = f"\n## Component {component_num}\n**Timestamp:** {timestamp}\n**Error:** {error_msg}\n"

    with open(config.ERROR_LOG, 'a') as f:
        f.write(error_entry)
