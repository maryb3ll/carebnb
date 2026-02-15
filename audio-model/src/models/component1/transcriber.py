import json
from pathlib import Path
from datetime import datetime
from typing import Optional
from openai import OpenAI
from . import config
from .utils import get_current_iteration, log_error

def transcribe_audio(
    audio_file_path: str = None,
    audio_path: Path = None,
    audio_data: bytes = None,
    format: str = 'm4a',
    iteration: int = None,
    session_id: str = None
) -> dict:
    """
    Transcribe audio file using OpenAI Whisper API.

    Args:
        audio_file_path: Path to audio file (legacy, string)
        audio_path: Path to audio file (Path object)
        audio_data: Audio file as bytes (for API mode)
        format: Audio format ('m4a', 'wav', 'mp3', etc.)
        iteration: Iteration number (for CLI mode)
        session_id: Session ID (for API mode)

    Returns:
        dict: Transcription results with metadata

    Raises:
        FileNotFoundError: If audio file doesn't exist
        Exception: For API or processing errors
    """
    try:
        # Determine mode and setup paths
        if session_id:
            # API mode: session-based
            from src.models.session_manager import get_session_path

            # If audio_data provided, save to session input
            if audio_data:
                input_path = get_session_path(session_id) / 'input' / f'audio.{format}'
                input_path.parent.mkdir(parents=True, exist_ok=True)
                with open(input_path, 'wb') as f:
                    f.write(audio_data)
                audio_path = input_path
            elif audio_path is None and audio_file_path:
                audio_path = Path(audio_file_path)

            output_path = get_session_path(session_id, component=1) / 'transcript.json'
            current_iteration = None  # Not used in session mode
        else:
            # CLI mode: iteration-based
            if iteration is None:
                current_iteration = get_current_iteration()
            else:
                current_iteration = iteration

            if audio_path is None:
                audio_path = Path(audio_file_path)

            output_filename = f"{current_iteration}_1_output.json"
            output_path = config.OUTPUT_DIR / output_filename

        # Validate audio file exists
        if not audio_path.exists():
            error_msg = f"Audio file not found: {audio_path}"
            log_error(1, error_msg)
            raise FileNotFoundError(error_msg)

        # Initialize OpenAI client
        client = OpenAI(api_key=config.OPENAI_API_KEY)

        # Call Whisper API
        with open(audio_path, 'rb') as audio_file:
            response = client.audio.transcriptions.create(
                model=config.WHISPER_MODEL,
                file=audio_file,
                response_format='verbose_json'
            )

        # Format output
        result = {
            'component': 1,
            'audio_file': audio_path.name,
            'timestamp': datetime.now().isoformat(),
            'transcript': response.text,
            'metadata': {
                'duration': getattr(response, 'duration', 'unknown'),
                'model': config.WHISPER_MODEL,
                'language': getattr(response, 'language', 'en')
            }
        }

        # Add mode-specific fields
        if session_id:
            result['session_id'] = session_id
        else:
            result['iteration'] = current_iteration

        # Save to output file
        with open(output_path, 'w') as f:
            json.dump(result, f, indent=2)

        if session_id:
            print(f"✓ Transcription complete: session {session_id}")
        else:
            print(f"✓ Transcription complete: {output_path.name}")
            print(f"✓ Using iteration: {current_iteration} (will increment after Component 4)")

        return result

    except Exception as e:
        error_msg = f"Transcription failed: {str(e)}"
        log_error(1, error_msg)
        raise
