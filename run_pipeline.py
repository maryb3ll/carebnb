#!/usr/bin/env python3
"""
CareBnB Medical AI Pipeline Runner

This script runs the complete 4-component medical AI pipeline on an input file.

Usage:
    python run_pipeline.py <input_file>

Supported Input Types:
    - Audio files (.m4a, .wav, .mp3, .flac, .aac, .ogg, .wma) → Runs Components 1-4
    - Text files (.txt) → Skips Component 1, runs Components 2-4
"""

import sys
import json
from pathlib import Path
from datetime import datetime

# Add project root to path
PROJECT_ROOT = Path(__file__).parent
sys.path.insert(0, str(PROJECT_ROOT))

# Audio file extensions
AUDIO_EXTENSIONS = {'.m4a', '.wav', '.mp3', '.flac', '.aac', '.ogg', '.wma', '.m4p', '.aiff'}
TEXT_EXTENSIONS = {'.txt'}

def get_current_iteration() -> int:
    """Get the current iteration number."""
    iteration_tracker = PROJECT_ROOT / 'data' / 'components' / 'iteration_tracker.txt'
    try:
        with open(iteration_tracker, 'r') as f:
            content = f.read().strip()
            if '=' in content:
                return int(content.split('=')[1])
            return 0
    except (FileNotFoundError, ValueError):
        return 0

def create_transcript_output(text: str, iteration: int) -> Path:
    """
    Create a Component 1-style output file from text input.

    Args:
        text: The transcript text
        iteration: Current iteration number

    Returns:
        Path to created output file
    """
    output_dir = PROJECT_ROOT / 'data' / 'components' / 'component1'
    output_dir.mkdir(parents=True, exist_ok=True)

    output_path = output_dir / f"{iteration}_1_output.json"

    # Create Component 1-style output
    output = {
        "iteration": iteration,
        "component": 1,
        "transcript": text,
        "timestamp": datetime.now().isoformat(),
        "source": "text_file",
        "metadata": {
            "source_type": "text_file"
        }
    }

    with open(output_path, 'w') as f:
        json.dump(output, f, indent=2)

    return output_path

def run_pipeline(input_file: Path):
    """
    Run the complete medical AI pipeline on an input file.

    Args:
        input_file: Path to input file (audio or text)
    """
    # Validate input file exists
    if not input_file.exists():
        print(f"✗ Error: File not found: {input_file}")
        sys.exit(1)

    # Get file extension
    ext = input_file.suffix.lower()

    print("=" * 70)
    print("CareBnB Medical AI Pipeline")
    print("=" * 70)
    print(f"Input file: {input_file}")
    print(f"File type: {ext}")
    print()

    # Get current iteration
    iteration = get_current_iteration()
    print(f"Current iteration: {iteration}")
    print()

    # Determine pipeline start point based on file type
    if ext in AUDIO_EXTENSIONS:
        print("✓ Detected: Audio file")
        print("Pipeline: Components 1 → 2 → 3 → 4")
        print()

        # Import components
        from src.models.component1 import transcribe_audio
        from src.models.component2 import extract_keywords
        from src.models.component3 import run_medical_rag
        from src.models.component4 import run_cot_summarizer

        # Run Component 1: Audio Transcription
        print("=" * 70)
        print("COMPONENT 1: Audio Transcription")
        print("=" * 70)
        result1 = transcribe_audio(input_file)
        print(f"✓ Transcription complete")
        print()

        # Run Component 2: Keyword Extraction
        print("=" * 70)
        print("COMPONENT 2: Keyword Extraction")
        print("=" * 70)
        result2 = extract_keywords()
        print(f"✓ Keyword extraction complete")
        print()

        # Run Component 3: Medical Literature Search
        print("=" * 70)
        print("COMPONENT 3: Medical Literature Search")
        print("=" * 70)
        result3 = run_medical_rag()
        print(f"✓ Literature search complete")
        print()

        # Run Component 4: Final Summary
        print("=" * 70)
        print("COMPONENT 4: Final Summary Generation")
        print("=" * 70)
        result4 = run_cot_summarizer()
        print(f"✓ Final summary complete")
        print()

        # Print final results
        print("=" * 70)
        print("PIPELINE COMPLETE")
        print("=" * 70)
        print(f"Final ZIP: {result4['final_zip']}")
        print(f"Summary PDF: {result4['summary_pdf']}")
        print(f"Highlighted sources: {len(result4['highlighted_sources'])} files")
        print(f"Next iteration: {result4['next_iteration']}")
        print()

    elif ext in TEXT_EXTENSIONS:
        print("✓ Detected: Text file")
        print("Pipeline: Components 2 → 3 → 4 (skipping Component 1)")
        print()

        # Read text file
        print(f"Reading transcript from {input_file.name}...")
        with open(input_file, 'r', encoding='utf-8') as f:
            transcript_text = f.read()

        print(f"✓ Loaded transcript ({len(transcript_text)} characters)")
        print()

        # Create Component 1 output from text
        print("Creating transcript output file...")
        output_path = create_transcript_output(transcript_text, iteration)
        print(f"✓ Created: {output_path}")
        print()

        # Import components
        from src.models.component2 import extract_keywords
        from src.models.component3 import run_medical_rag
        from src.models.component4 import run_cot_summarizer

        # Run Component 2: Keyword Extraction
        print("=" * 70)
        print("COMPONENT 2: Keyword Extraction")
        print("=" * 70)
        result2 = extract_keywords()
        print(f"✓ Keyword extraction complete")
        print()

        # Run Component 3: Medical Literature Search
        print("=" * 70)
        print("COMPONENT 3: Medical Literature Search")
        print("=" * 70)
        result3 = run_medical_rag()
        print(f"✓ Literature search complete")
        print()

        # Run Component 4: Final Summary
        print("=" * 70)
        print("COMPONENT 4: Final Summary Generation")
        print("=" * 70)
        result4 = run_cot_summarizer()
        print(f"✓ Final summary complete")
        print()

        # Print final results
        print("=" * 70)
        print("PIPELINE COMPLETE")
        print("=" * 70)
        print(f"Final ZIP: {result4['final_zip']}")
        print(f"Summary PDF: {result4['summary_pdf']}")
        print(f"Highlighted sources: {len(result4['highlighted_sources'])} files")
        print(f"Next iteration: {result4['next_iteration']}")
        print()

    else:
        print(f"✗ Error: Unsupported file type '{ext}'")
        print()
        print("Supported formats:")
        print("  Audio: " + ", ".join(sorted(AUDIO_EXTENSIONS)))
        print("  Text:  " + ", ".join(sorted(TEXT_EXTENSIONS)))
        sys.exit(1)

def main():
    """Main entry point."""
    if len(sys.argv) != 2:
        print("Usage: python run_pipeline.py <input_file>")
        print()
        print("Examples:")
        print("  python run_pipeline.py data/testing/patient_recording.m4a")
        print("  python run_pipeline.py data/testing/patient_transcript.txt")
        sys.exit(1)

    input_file = Path(sys.argv[1])

    try:
        run_pipeline(input_file)
    except KeyboardInterrupt:
        print("\n\n✗ Pipeline interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n✗ Pipeline failed with error:")
        print(f"  {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
