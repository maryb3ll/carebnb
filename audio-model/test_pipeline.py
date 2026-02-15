"""
Test Pipeline in Audio-Model Directory
"""

from pipeline_api import PipelineAPI
from pathlib import Path

def test_audio():
    """Test with audio file"""
    print("=" * 70)
    print("TEST 1: Audio Input")
    print("=" * 70)
    print()

    # Find audio test file (relative path)
    audio_path = Path('data/testing/test_recording.m4a')
    if not audio_path.exists():
        # Try alternate location
        audio_path = Path('./data/testing/test_recording.m4a')

    if not audio_path.exists():
        print("⚠ Audio test file not found, skipping")
        return None

    # Load audio
    with open(audio_path, 'rb') as f:
        audio_bytes = f.read()

    print(f"Audio file: {audio_path}")
    print(f"Size: {len(audio_bytes) / 1024:.1f} KB")
    print()

    # Process
    api = PipelineAPI()
    print("Processing audio...")
    result = api.process_audio(audio_bytes, format='m4a')

    # Results
    print()
    print("Results:")
    print(f"  Status: {result.status}")
    print(f"  Session: {result.session_id}")

    if result.status == 'completed':
        print(f"  Keywords: {result.keywords[:3]}...")
        print(f"  Summary PDF: {len(result.summary_pdf_data) / 1024:.1f} KB")
        print(f"  ZIP file: {len(result.final_zip_data) / 1024:.1f} KB")
        print(f"  Duration: {result.duration_seconds:.1f}s")
        print()
        print("✓ AUDIO TEST PASSED")
    else:
        print(f"  Error: {result.error}")
        print("✗ AUDIO TEST FAILED")

    return result


def test_text():
    """Test with text file"""
    print()
    print("=" * 70)
    print("TEST 2: Text Input")
    print("=" * 70)
    print()

    # Find text test file (relative path)
    text_path = Path('data/testing/test_text.txt')
    if not text_path.exists():
        text_path = Path('./data/testing/test_text.txt')

    if not text_path.exists():
        print("⚠ Text test file not found, skipping")
        return None

    # Load text
    with open(text_path, 'r') as f:
        text = f.read()

    print(f"Text file: {text_path}")
    print(f"Length: {len(text)} characters")
    print(f"Content: {text[:100]}...")
    print()

    # Process
    api = PipelineAPI()
    print("Processing text...")
    result = api.process_text(text)

    # Results
    print()
    print("Results:")
    print(f"  Status: {result.status}")
    print(f"  Session: {result.session_id}")

    if result.status == 'completed':
        print(f"  Keywords: {result.keywords[:3]}...")
        print(f"  Summary PDF: {len(result.summary_pdf_data) / 1024:.1f} KB")
        print(f"  ZIP file: {len(result.final_zip_data) / 1024:.1f} KB")
        print(f"  Duration: {result.duration_seconds:.1f}s")
        print()
        print("✓ TEXT TEST PASSED")
    else:
        print(f"  Error: {result.error}")
        print("✗ TEXT TEST FAILED")

    return result


def verify_paths():
    """Verify all paths are correct"""
    from pipeline_config import PipelineConfig

    print()
    print("=" * 70)
    print("PATH VERIFICATION")
    print("=" * 70)
    print()
    print(f"PROJECT_ROOT: {PipelineConfig.PROJECT_ROOT}")
    print(f"DATA_DIR: {PipelineConfig.DATA_DIR}")
    print(f"SESSIONS_DIR: {PipelineConfig.SESSIONS_DIR}")
    print()

    # Check if paths end with audio-model
    if str(PipelineConfig.PROJECT_ROOT).endswith('audio-model'):
        print("✓ Paths are correct (audio-model directory)")
    else:
        print(f"⚠ PROJECT_ROOT should end with 'audio-model'")
    print()


if __name__ == '__main__':
    print("\n🧪 TESTING PIPELINE IN AUDIO-MODEL DIRECTORY\n")

    # Verify paths
    verify_paths()

    try:
        # Test audio
        audio_result = test_audio()

        # Test text
        text_result = test_text()

        # Summary
        print()
        print("=" * 70)
        print("TEST SUMMARY")
        print("=" * 70)
        print()
        if audio_result and audio_result.status == 'completed':
            print("✓ Audio test: PASSED")
        elif audio_result:
            print("✗ Audio test: FAILED")
        else:
            print("⊘ Audio test: SKIPPED")

        if text_result and text_result.status == 'completed':
            print("✓ Text test: PASSED")
        elif text_result:
            print("✗ Text test: FAILED")
        else:
            print("⊘ Text test: SKIPPED")
        print()

    except Exception as e:
        print(f"\n✗ TEST FAILED WITH ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
