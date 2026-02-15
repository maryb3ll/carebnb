"""
Test the Pipeline API with audio and text inputs
"""

from pipeline_api import PipelineAPI
from pathlib import Path

def test_audio_input():
    """Test API with audio file"""
    print("=" * 70)
    print("TEST 1: Audio Input (test_recording.m4a)")
    print("=" * 70)
    print()

    # Initialize API
    api = PipelineAPI()

    # Load test audio
    audio_path = Path('data/testing/test_recording.m4a')
    with open(audio_path, 'rb') as f:
        audio_bytes = f.read()

    print(f"Audio file size: {len(audio_bytes) / 1024:.1f} KB")
    print()

    # Process audio
    print("Processing audio through pipeline...")
    print()
    result = api.process_audio(audio_bytes, format='m4a')

    # Display results
    print()
    print("=" * 70)
    print("AUDIO TEST RESULTS")
    print("=" * 70)
    print(f"Session ID: {result.session_id}")
    print(f"Status: {result.status}")

    if result.status == 'completed':
        print(f"Keywords: {result.keywords}")
        print(f"Description: {result.description[:200]}...")
        print(f"Transcript: {result.transcript[:200]}...")
        print()
        print(f"Summary PDF path: {result.summary_pdf_path}")
        print(f"Summary PDF size: {len(result.summary_pdf_data) / 1024:.1f} KB")
        print(f"Final ZIP path: {result.final_zip_path}")
        print(f"Final ZIP size: {len(result.final_zip_data) / 1024:.1f} KB")
        print(f"Highlighted sources: {len(result.highlighted_sources_paths)} files")
        print()
        print(f"Duration: {result.duration_seconds:.1f} seconds")
        print()
        print("✓ AUDIO TEST PASSED")
    else:
        print(f"✗ AUDIO TEST FAILED: {result.error}")

    return result


def test_text_input():
    """Test API with text file"""
    print()
    print("=" * 70)
    print("TEST 2: Text Input (test_text.txt)")
    print("=" * 70)
    print()

    # Initialize API
    api = PipelineAPI()

    # Load test text
    text_path = Path('data/testing/test_text.txt')
    with open(text_path, 'r') as f:
        text = f.read()

    print(f"Text length: {len(text)} characters")
    print(f"Text content: {text[:100]}...")
    print()

    # Process text
    print("Processing text through pipeline...")
    print()
    result = api.process_text(text)

    # Display results
    print()
    print("=" * 70)
    print("TEXT TEST RESULTS")
    print("=" * 70)
    print(f"Session ID: {result.session_id}")
    print(f"Status: {result.status}")

    if result.status == 'completed':
        print(f"Keywords: {result.keywords}")
        print(f"Description: {result.description[:200]}...")
        print(f"Transcript: {result.transcript[:200]}...")
        print()
        print(f"Summary PDF path: {result.summary_pdf_path}")
        print(f"Summary PDF size: {len(result.summary_pdf_data) / 1024:.1f} KB")
        print(f"Final ZIP path: {result.final_zip_path}")
        print(f"Final ZIP size: {len(result.final_zip_data) / 1024:.1f} KB")
        print(f"Highlighted sources: {len(result.highlighted_sources_paths)} files")
        print()
        print(f"Duration: {result.duration_seconds:.1f} seconds")
        print()
        print("✓ TEXT TEST PASSED")
    else:
        print(f"✗ TEXT TEST FAILED: {result.error}")

    return result


def verify_session_storage():
    """Verify that session files were created correctly"""
    from src.models.session_manager import list_sessions

    print()
    print("=" * 70)
    print("SESSION VERIFICATION")
    print("=" * 70)
    print()

    sessions = list_sessions()
    print(f"Total sessions: {len(sessions)}")
    print()

    # Show last 3 sessions
    for session in sessions[:3]:
        print(f"Session: {session['session_id']}")
        print(f"  Created: {session['created_at']}")
        print(f"  Status: {session.get('status', 'unknown')}")
        print()


if __name__ == '__main__':
    print("\n🧪 TESTING PIPELINE API\n")

    try:
        # Test audio input
        audio_result = test_audio_input()

        # Test text input
        text_result = test_text_input()

        # Verify sessions
        verify_session_storage()

        print()
        print("=" * 70)
        print("ALL TESTS COMPLETE")
        print("=" * 70)
        print()
        print("Summary:")
        print(f"  Audio test: {'✓ PASSED' if audio_result.status == 'completed' else '✗ FAILED'}")
        print(f"  Text test:  {'✓ PASSED' if text_result.status == 'completed' else '✗ FAILED'}")
        print()

    except Exception as e:
        print(f"\n✗ TEST FAILED WITH ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
