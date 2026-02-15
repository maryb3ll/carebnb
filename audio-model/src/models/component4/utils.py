from datetime import datetime
from pathlib import Path
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

def increment_and_save_iteration() -> int:
    """
    Increment global iteration and save to tracker.

    ONLY Component 4 should call this function - after successful completion.
    """
    current = get_current_iteration()
    new_iteration = current + 1

    with open(config.ITERATION_TRACKER, 'w') as f:
        f.write(f'iteration={new_iteration}\n')

    print(f"✓ Iteration tracker updated: {current} → {new_iteration}")
    return new_iteration

def get_component2_output(iteration: int) -> Path:
    """Get Component 2 output file path for current iteration."""
    path = config.COMPONENT2_DIR / f"{iteration}_2_output.json"
    if not path.exists():
        raise FileNotFoundError(f"Component 2 output not found: {path}")
    return path

def get_component3_sources(iteration: int) -> tuple:
    """
    Get Component 3 output file paths for current iteration.

    Returns:
        tuple: (metadata_path, list of available source paths)
    """
    metadata_path = config.COMPONENT3_DIR / f"{iteration}_3_metadata.json"

    # Check for available sources (1-3)
    available_sources = []
    for i in range(1, 4):
        source_path = config.COMPONENT3_DIR / f"{iteration}_3_{i}.pdf"
        if source_path.exists():
            available_sources.append(source_path)

    if not available_sources:
        raise FileNotFoundError(f"No Component 3 sources found for iteration {iteration}")

    return metadata_path, available_sources

def log_error(component_num: int, error_msg: str):
    """Log error to ClaudeInfo/errors_fixes.MD."""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    error_entry = f"\n## Component {component_num}\n**Timestamp:** {timestamp}\n**Error:** {error_msg}\n"

    with open(config.ERROR_LOG, 'a') as f:
        f.write(error_entry)
