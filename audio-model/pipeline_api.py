"""
Pipeline API - Plug-and-Play Interface for Web Integration

Easy-to-use Python API for processing audio or text through the AI pipeline.
Returns PDF data that web frameworks can serve directly.

Example Usage:
    from pipeline_api import PipelineAPI

    api = PipelineAPI()

    # Process audio
    result = api.process_audio(audio_bytes, format='m4a')

    # Process text
    result = api.process_text("Patient has fever and swollen lymph nodes...")

    # Access results
    print(result.session_id)
    print(result.keywords)
    pdf_data = result.summary_pdf_data
"""

import json
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict, Union
from dataclasses import dataclass

from pipeline_config import PipelineConfig
from src.models.session_manager import (
    create_session,
    get_session_path,
    update_session_metadata,
    get_session_metadata,
    get_session_files
)


@dataclass
class PipelineResult:
    """Result object from pipeline processing"""

    # Session info
    session_id: str
    status: str  # 'completed' | 'failed'
    error: Optional[str] = None

    # Paths (for direct file access)
    summary_pdf_path: Optional[Path] = None
    final_zip_path: Optional[Path] = None
    highlighted_sources_paths: Optional[List[Path]] = None

    # Data (for serving via web)
    summary_pdf_data: Optional[bytes] = None
    final_zip_data: Optional[bytes] = None

    # Extracted information
    keywords: Optional[List[str]] = None
    description: Optional[str] = None
    transcript: Optional[str] = None

    # Timing
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[float] = None

    # Component outputs (for debugging)
    component1_output: Optional[Dict] = None
    component2_output: Optional[Dict] = None
    component3_output: Optional[Dict] = None
    component4_output: Optional[Dict] = None


class PipelineAPI:
    """Main API wrapper for the AI pipeline"""

    def __init__(self):
        """Initialize the Pipeline API"""
        PipelineConfig.ensure_directories()

    def process_audio(
        self,
        audio_data: bytes,
        format: str = 'm4a',
        session_id: Optional[str] = None
    ) -> PipelineResult:
        """
        Process audio data through the full pipeline.

        Args:
            audio_data: Audio file as bytes
            format: Audio format ('m4a', 'wav', 'mp3', etc.)
            session_id: Optional session ID (auto-generated if not provided)

        Returns:
            PipelineResult object with all outputs
        """
        started_at = datetime.now()

        # Validate format
        if format not in PipelineConfig.AUDIO_FORMATS:
            return PipelineResult(
                session_id=session_id or 'invalid',
                status='failed',
                error=f"Unsupported audio format: {format}. Supported: {PipelineConfig.AUDIO_FORMATS}"
            )

        # Validate size
        size_mb = len(audio_data) / (1024 * 1024)
        if size_mb > PipelineConfig.MAX_AUDIO_SIZE_MB:
            return PipelineResult(
                session_id=session_id or 'invalid',
                status='failed',
                error=f"Audio file too large: {size_mb:.1f}MB (max: {PipelineConfig.MAX_AUDIO_SIZE_MB}MB)"
            )

        try:
            # Create session
            session_id = create_session(session_id)
            update_session_metadata(session_id, {
                'status': 'processing',
                'input_type': 'audio',
                'input_format': format,
                'input_size_mb': size_mb
            })

            # Save audio to session input directory
            audio_path = get_session_path(session_id) / 'input' / f'audio.{format}'
            with open(audio_path, 'wb') as f:
                f.write(audio_data)

            # Import components (lazy import to avoid circular dependencies)
            from src.models.component1.transcriber import transcribe_audio
            from src.models.component2.extractor import extract_keywords
            from src.models.component3.agent import run_medical_rag
            from src.models.component4.cot_agent import run_cot_summarizer

            # Run Component 1: Transcription
            result1 = transcribe_audio(
                audio_path=audio_path,
                audio_data=audio_data,
                format=format,
                session_id=session_id
            )

            # Run Component 2: Keyword Extraction
            result2 = extract_keywords(session_id=session_id)

            # Run Component 3: Medical RAG
            result3 = run_medical_rag(session_id=session_id)

            # Run Component 4: CoT Summarizer
            result4 = run_cot_summarizer(session_id=session_id)

            # Mark as completed
            completed_at = datetime.now()
            duration = (completed_at - started_at).total_seconds()

            update_session_metadata(session_id, {
                'status': 'completed',
                'completed_at': completed_at.isoformat(),
                'duration_seconds': duration
            })

            # Build result object
            return self._build_result(
                session_id=session_id,
                status='completed',
                started_at=started_at,
                completed_at=completed_at,
                duration_seconds=duration,
                component1_output=result1,
                component2_output=result2,
                component3_output=result3,
                component4_output=result4
            )

        except Exception as e:
            # Log error
            update_session_metadata(session_id or 'unknown', {
                'status': 'failed',
                'error': str(e),
                'failed_at': datetime.now().isoformat()
            })

            return PipelineResult(
                session_id=session_id or 'unknown',
                status='failed',
                error=str(e),
                started_at=started_at
            )

    def process_text(
        self,
        text: str,
        session_id: Optional[str] = None
    ) -> PipelineResult:
        """
        Process text data through the pipeline (skips Component 1).

        Args:
            text: Transcript text as string
            session_id: Optional session ID (auto-generated if not provided)

        Returns:
            PipelineResult object with all outputs
        """
        started_at = datetime.now()

        # Validate length
        if len(text) > PipelineConfig.MAX_TEXT_LENGTH:
            return PipelineResult(
                session_id=session_id or 'invalid',
                status='failed',
                error=f"Text too long: {len(text)} chars (max: {PipelineConfig.MAX_TEXT_LENGTH})"
            )

        if len(text.strip()) == 0:
            return PipelineResult(
                session_id=session_id or 'invalid',
                status='failed',
                error="Text cannot be empty"
            )

        try:
            # Create session
            session_id = create_session(session_id)
            update_session_metadata(session_id, {
                'status': 'processing',
                'input_type': 'text',
                'input_length': len(text)
            })

            # Save text to session input directory
            text_path = get_session_path(session_id) / 'input' / 'transcript.txt'
            with open(text_path, 'w') as f:
                f.write(text)

            # Create Component 1 output manually (since we're skipping transcription)
            component1_output = {
                'session_id': session_id,
                'component': 1,
                'timestamp': datetime.now().isoformat(),
                'transcript': text,
                'input_type': 'text',
                'metadata': {
                    'source': 'text_input',
                    'length': len(text)
                }
            }

            # Save Component 1 output
            component1_path = get_session_path(session_id, component=1) / 'transcript.json'
            with open(component1_path, 'w') as f:
                json.dump(component1_output, f, indent=2)

            # Import components (lazy import)
            from src.models.component2.extractor import extract_keywords
            from src.models.component3.agent import run_medical_rag
            from src.models.component4.cot_agent import run_cot_summarizer

            # Run Component 2: Keyword Extraction
            result2 = extract_keywords(session_id=session_id)

            # Run Component 3: Medical RAG
            result3 = run_medical_rag(session_id=session_id)

            # Run Component 4: CoT Summarizer
            result4 = run_cot_summarizer(session_id=session_id)

            # Mark as completed
            completed_at = datetime.now()
            duration = (completed_at - started_at).total_seconds()

            update_session_metadata(session_id, {
                'status': 'completed',
                'completed_at': completed_at.isoformat(),
                'duration_seconds': duration
            })

            # Build result object
            return self._build_result(
                session_id=session_id,
                status='completed',
                started_at=started_at,
                completed_at=completed_at,
                duration_seconds=duration,
                component1_output=component1_output,
                component2_output=result2,
                component3_output=result3,
                component4_output=result4
            )

        except Exception as e:
            # Log error
            update_session_metadata(session_id or 'unknown', {
                'status': 'failed',
                'error': str(e),
                'failed_at': datetime.now().isoformat()
            })

            return PipelineResult(
                session_id=session_id or 'unknown',
                status='failed',
                error=str(e),
                started_at=started_at
            )

    def get_result(self, session_id: str) -> PipelineResult:
        """
        Retrieve results from a completed session.

        Args:
            session_id: The session ID to retrieve

        Returns:
            PipelineResult object
        """
        try:
            # Get session metadata
            metadata = get_session_metadata(session_id)

            if metadata.get('status') == 'not_found':
                return PipelineResult(
                    session_id=session_id,
                    status='failed',
                    error='Session not found'
                )

            # Load component outputs
            component_outputs = {}
            for i in range(1, 5):
                component_path = get_session_path(session_id, component=i)

                # Try different possible output files
                possible_files = [
                    component_path / 'transcript.json',  # Component 1
                    component_path / 'keywords.json',     # Component 2
                    component_path / 'metadata.json',     # Component 3
                    component_path / 'analysis.json'      # Component 4
                ]

                for file_path in possible_files:
                    if file_path.exists():
                        with open(file_path, 'r') as f:
                            component_outputs[f'component{i}'] = json.load(f)
                        break

            # Build result
            return self._build_result(
                session_id=session_id,
                status=metadata.get('status', 'unknown'),
                started_at=datetime.fromisoformat(metadata['created_at']) if 'created_at' in metadata else None,
                completed_at=datetime.fromisoformat(metadata['completed_at']) if 'completed_at' in metadata else None,
                duration_seconds=metadata.get('duration_seconds'),
                component1_output=component_outputs.get('component1'),
                component2_output=component_outputs.get('component2'),
                component3_output=component_outputs.get('component3'),
                component4_output=component_outputs.get('component4')
            )

        except Exception as e:
            return PipelineResult(
                session_id=session_id,
                status='failed',
                error=str(e)
            )

    def _build_result(
        self,
        session_id: str,
        status: str,
        started_at: Optional[datetime] = None,
        completed_at: Optional[datetime] = None,
        duration_seconds: Optional[float] = None,
        component1_output: Optional[Dict] = None,
        component2_output: Optional[Dict] = None,
        component3_output: Optional[Dict] = None,
        component4_output: Optional[Dict] = None
    ) -> PipelineResult:
        """Build a complete PipelineResult from component outputs"""

        # Get file paths
        files = get_session_files(session_id)

        # Extract data
        keywords = component2_output.get('keywords', []) if component2_output else []
        description = component2_output.get('description', '') if component2_output else ''
        transcript = component1_output.get('transcript', '') if component1_output else ''

        # Load file data
        summary_pdf_data = None
        final_zip_data = None

        if 'summary_pdf' in files:
            with open(files['summary_pdf'], 'rb') as f:
                summary_pdf_data = f.read()

        if 'final_zip' in files:
            with open(files['final_zip'], 'rb') as f:
                final_zip_data = f.read()

        return PipelineResult(
            session_id=session_id,
            status=status,
            summary_pdf_path=files.get('summary_pdf'),
            final_zip_path=files.get('final_zip'),
            highlighted_sources_paths=files.get('highlighted_sources', []),
            summary_pdf_data=summary_pdf_data,
            final_zip_data=final_zip_data,
            keywords=keywords,
            description=description,
            transcript=transcript,
            started_at=started_at,
            completed_at=completed_at,
            duration_seconds=duration_seconds,
            component1_output=component1_output,
            component2_output=component2_output,
            component3_output=component3_output,
            component4_output=component4_output
        )
