"""
Pipeline Configuration

Centralized configuration for both CLI and API modes.
"""

from pathlib import Path

class PipelineConfig:
    """Configuration settings for the AI pipeline"""

    # Paths
    PROJECT_ROOT = Path(__file__).parent
    DATA_DIR = PROJECT_ROOT / 'data'
    SESSIONS_DIR = DATA_DIR / 'sessions'
    COMPONENTS_DIR = DATA_DIR / 'components'  # Legacy iteration-based
    OUTPUT_DIR = PROJECT_ROOT / 'output'

    # Session settings
    SESSION_RETENTION_DAYS = 7  # Auto-cleanup sessions older than this
    MAX_AUDIO_SIZE_MB = 100     # Maximum audio file size in MB
    MAX_TEXT_LENGTH = 50000     # Maximum text input length in characters

    # Supported formats
    AUDIO_FORMATS = {'m4a', 'wav', 'mp3', 'flac', 'aac', 'ogg', 'wma', 'aiff'}
    TEXT_FORMATS = {'txt'}

    # Mode
    USE_SESSIONS = True  # If False, use legacy iteration mode

    # Paths - Logs
    LOGS_DIR = PROJECT_ROOT / 'logs'

    # Ensure directories exist
    @classmethod
    def ensure_directories(cls):
        """Create necessary directories if they don't exist"""
        cls.DATA_DIR.mkdir(exist_ok=True)
        cls.SESSIONS_DIR.mkdir(exist_ok=True)
        cls.COMPONENTS_DIR.mkdir(exist_ok=True)
        cls.OUTPUT_DIR.mkdir(exist_ok=True)
        cls.LOGS_DIR.mkdir(exist_ok=True)

# Initialize directories on import
PipelineConfig.ensure_directories()
