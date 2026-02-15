"""
Session Management Utilities

Handles session-based storage for web API mode.
"""

import uuid
import json
import shutil
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional, Dict, List
from pipeline_config import PipelineConfig


def create_session(session_id: str = None) -> str:
    """
    Create a new session directory structure.

    Args:
        session_id: Optional session ID. If not provided, generates a UUID.

    Returns:
        The session ID (either provided or generated)
    """
    if session_id is None:
        session_id = str(uuid.uuid4())

    session_path = PipelineConfig.SESSIONS_DIR / session_id

    # Create session directory structure
    (session_path / 'input').mkdir(parents=True, exist_ok=True)
    (session_path / 'component1').mkdir(parents=True, exist_ok=True)
    (session_path / 'component2').mkdir(parents=True, exist_ok=True)
    (session_path / 'component3').mkdir(parents=True, exist_ok=True)
    (session_path / 'component4').mkdir(parents=True, exist_ok=True)

    # Create metadata file
    metadata = {
        'session_id': session_id,
        'created_at': datetime.now().isoformat(),
        'status': 'initialized'
    }

    with open(session_path / 'metadata.json', 'w') as f:
        json.dump(metadata, f, indent=2)

    return session_id


def get_session_path(session_id: str, component: int = None) -> Path:
    """
    Get the path for a session or a specific component within a session.

    Args:
        session_id: The session ID
        component: Optional component number (1-4)

    Returns:
        Path to the session or component directory
    """
    session_path = PipelineConfig.SESSIONS_DIR / session_id

    if component is None:
        return session_path
    else:
        return session_path / f'component{component}'


def session_exists(session_id: str) -> bool:
    """Check if a session exists"""
    return (PipelineConfig.SESSIONS_DIR / session_id).exists()


def get_session_metadata(session_id: str) -> Dict:
    """
    Get metadata for a session.

    Args:
        session_id: The session ID

    Returns:
        Dictionary with session metadata
    """
    metadata_path = PipelineConfig.SESSIONS_DIR / session_id / 'metadata.json'

    if not metadata_path.exists():
        return {'session_id': session_id, 'status': 'not_found'}

    with open(metadata_path, 'r') as f:
        return json.load(f)


def update_session_metadata(session_id: str, updates: Dict):
    """
    Update session metadata.

    Args:
        session_id: The session ID
        updates: Dictionary of updates to apply
    """
    metadata_path = PipelineConfig.SESSIONS_DIR / session_id / 'metadata.json'

    # Read current metadata
    if metadata_path.exists():
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
    else:
        metadata = {'session_id': session_id}

    # Apply updates
    metadata.update(updates)
    metadata['updated_at'] = datetime.now().isoformat()

    # Write back
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)


def cleanup_session(session_id: str):
    """
    Delete all files for a session.

    Args:
        session_id: The session ID to delete
    """
    session_path = PipelineConfig.SESSIONS_DIR / session_id

    if session_path.exists():
        shutil.rmtree(session_path)


def cleanup_old_sessions(days: int = None):
    """
    Delete sessions older than the specified number of days.

    Args:
        days: Number of days. Defaults to SESSION_RETENTION_DAYS from config.

    Returns:
        Number of sessions deleted
    """
    if days is None:
        days = PipelineConfig.SESSION_RETENTION_DAYS

    cutoff_date = datetime.now() - timedelta(days=days)
    deleted_count = 0

    for session_path in PipelineConfig.SESSIONS_DIR.iterdir():
        if not session_path.is_dir():
            continue

        metadata_path = session_path / 'metadata.json'
        if not metadata_path.exists():
            continue

        try:
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)

            created_at = datetime.fromisoformat(metadata['created_at'])

            if created_at < cutoff_date:
                shutil.rmtree(session_path)
                deleted_count += 1

        except (KeyError, ValueError, json.JSONDecodeError):
            # Skip sessions with invalid metadata
            continue

    return deleted_count


def list_sessions(status: str = None) -> List[Dict]:
    """
    List all sessions, optionally filtered by status.

    Args:
        status: Optional status filter ('initialized', 'processing', 'completed', 'failed')

    Returns:
        List of session metadata dictionaries
    """
    sessions = []

    for session_path in PipelineConfig.SESSIONS_DIR.iterdir():
        if not session_path.is_dir():
            continue

        metadata_path = session_path / 'metadata.json'
        if not metadata_path.exists():
            continue

        try:
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)

            if status is None or metadata.get('status') == status:
                sessions.append(metadata)

        except (json.JSONDecodeError, KeyError):
            continue

    return sorted(sessions, key=lambda x: x.get('created_at', ''), reverse=True)


def get_session_files(session_id: str) -> Dict[str, Path]:
    """
    Get paths to all output files for a session.

    Args:
        session_id: The session ID

    Returns:
        Dictionary mapping file types to paths
    """
    session_path = PipelineConfig.SESSIONS_DIR / session_id
    files = {}

    # Component outputs
    component1_path = session_path / 'component1' / 'transcript.json'
    if component1_path.exists():
        files['transcript'] = component1_path

    component2_path = session_path / 'component2' / 'keywords.json'
    if component2_path.exists():
        files['keywords'] = component2_path

    # Component 3 sources
    component3_path = session_path / 'component3'
    source_files = []
    for i in range(1, 10):  # Check for up to 9 sources
        source_path = component3_path / f'source_{i}.pdf'
        if source_path.exists():
            source_files.append(source_path)
    if source_files:
        files['sources'] = source_files

    # Component 4 outputs
    component4_path = session_path / 'component4'

    summary_pdf = component4_path / 'summary.pdf'
    if summary_pdf.exists():
        files['summary_pdf'] = summary_pdf

    final_zip = component4_path / 'final.zip'
    if final_zip.exists():
        files['final_zip'] = final_zip

    # Highlighted sources
    highlighted_files = []
    for i in range(1, 10):
        highlighted_path = component4_path / f'source_{i}_highlighted.pdf'
        if highlighted_path.exists():
            highlighted_files.append(highlighted_path)
    if highlighted_files:
        files['highlighted_sources'] = highlighted_files

    return files
