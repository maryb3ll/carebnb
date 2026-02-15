import json
from datetime import datetime
from typing import Optional
from openai import OpenAI
from .config_handler import get_model_id
from . import config
from .utils import get_current_iteration, get_component1_output, log_error

def extract_keywords(iteration: int = None, session_id: str = None) -> dict:
    """
    Extract keywords from Component 1 transcript.

    Args:
        iteration: Iteration number (for CLI mode)
        session_id: Session ID (for API mode)

    Returns:
        dict: Keywords and description
    """
    try:
        # Determine mode and setup paths
        if session_id:
            # API mode: session-based
            from src.models.session_manager import get_session_path

            input_path = get_session_path(session_id, component=1) / 'transcript.json'
            output_path = get_session_path(session_id, component=2) / 'keywords.json'
            current_iteration = None  # Not used in session mode
        else:
            # CLI mode: iteration-based
            if iteration is None:
                current_iteration = get_current_iteration()
            else:
                current_iteration = iteration

            input_path = get_component1_output(current_iteration)
            output_filename = f"{current_iteration}_2_output.json"
            output_path = config.OUTPUT_DIR / output_filename

        # Load Component 1 output
        with open(input_path, 'r') as f:
            component1_data = json.load(f)

        transcript = component1_data['transcript']

        # Get fine-tuned model ID
        model_id = get_model_id()
        if not model_id:
            raise ValueError("No fine-tuned model found. Run fine-tuning first.")

        # Initialize OpenAI client
        client = OpenAI(api_key=config.OPENAI_API_KEY)

        # Call fine-tuned model
        response = client.chat.completions.create(
            model=model_id,
            messages=[
                {"role": "system", "content": "You are a medical transcription analyzer that extracts keywords and creates concise descriptions."},
                {"role": "user", "content": transcript}
            ]
        )

        # Parse response
        content = response.choices[0].message.content

        # Extract keywords and description
        lines = content.split('\n')
        keywords_line = next((l for l in lines if l.startswith('Keywords:')), '')
        description_line = next((l for l in lines if l.startswith('Description:')), '')

        keywords_raw = keywords_line.replace('Keywords:', '').strip()
        keywords = [k.strip() for k in keywords_raw.split(',') if k.strip()]
        description = description_line.replace('Description:', '').strip()

        # Format output
        result = {
            'component': 2,
            'source_transcript': input_path.name,
            'timestamp': datetime.now().isoformat(),
            'keywords': keywords,
            'description': description,
            'metadata': {
                'model': model_id,
                'confidence': 0.95  # Placeholder
            }
        }

        # Add mode-specific fields
        if session_id:
            result['session_id'] = session_id
        else:
            result['iteration'] = current_iteration

        # Save output
        with open(output_path, 'w') as f:
            json.dump(result, f, indent=2)

        if session_id:
            print(f"✓ Keyword extraction complete: session {session_id}")
        else:
            print(f"✓ Keyword extraction complete: {output_path.name}")
        print(f"✓ Keywords: {', '.join(keywords[:5])}...")
        print(f"✓ Description: {description[:100]}...")

        return result

    except Exception as e:
        error_msg = f"Keyword extraction failed: {str(e)}"
        log_error(2, error_msg)
        raise
