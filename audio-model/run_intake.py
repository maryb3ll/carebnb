#!/usr/bin/env python3
"""
Script to run the audio-model pipeline for intake processing
"""
import sys
import json
from pathlib import Path

# Add current directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from pipeline_api import PipelineAPI

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: run_intake.py <audio|text> <input_path_or_text>"}))
        sys.exit(1)

    input_type = sys.argv[1]
    input_data = sys.argv[2]

    try:
        api = PipelineAPI()

        if input_type == "audio":
            # Read audio file and pass as bytes
            audio_path = Path(input_data)
            if not audio_path.exists():
                print(json.dumps({"error": f"Audio file not found: {input_data}", "success": False}))
                sys.exit(1)

            with open(audio_path, 'rb') as f:
                audio_bytes = f.read()

            # Get format from file extension
            audio_format = audio_path.suffix.lstrip('.')
            result = api.process_audio(audio_bytes, format=audio_format)

        elif input_type == "text":
            # Direct text input
            result = api.process_text(input_data)

        elif input_type == "text-file":
            # Read text from file
            text_path = Path(input_data)
            if not text_path.exists():
                print(json.dumps({"error": f"Text file not found: {input_data}", "success": False}))
                sys.exit(1)

            with open(text_path, 'r', encoding='utf-8') as f:
                text_content = f.read()

            result = api.process_text(text_content)

        else:
            print(json.dumps({"error": "Invalid input type. Use 'audio', 'text', or 'text-file'"}))
            sys.exit(1)

        if result.status != 'completed':
            print(json.dumps({
                "error": result.error or "Pipeline failed",
                "success": False
            }))
            sys.exit(1)

        # Output result as JSON - convert Path objects to strings
        output = {
            "session_id": result.session_id,
            "final_zip_path": str(result.final_zip_path) if result.final_zip_path else None,
            "summary_pdf_path": str(result.summary_pdf_path) if result.summary_pdf_path else None,
            "success": True,
            "status": result.status
        }
        print(json.dumps(output))

    except Exception as e:
        import traceback
        print(json.dumps({
            "error": str(e),
            "traceback": traceback.format_exc(),
            "success": False
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()
