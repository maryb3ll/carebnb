# Component 1: Audio to Text Transcription

## Overview
Convert patient audio files describing symptoms into text transcripts using OpenAI Whisper API.

## Input/Output
- **Input**: Audio file (various formats: mp3, wav, m4a, etc.)
- **Output**: JSON file containing transcript
- **Output Location**: `data/components/component1/`
- **Output Naming Convention**: `[iteration]_1_output.json` (e.g., `1_1_output.json`, `2_1_output.json`)

## Implementation Plan

### 1. Setup
- Install OpenAI Python SDK: `pip install openai` (add to requirements.txt)
- Configure API key in environment variables (.env file)
- Create output directory structure if not exists

### 2. Global Iteration Tracking
- **IMPORTANT**: All components share a single global iteration number
- Read current iteration from `data/components/iteration_tracker.txt`
- File format: `iteration=0` (single line, single global counter)
- **Component 1 does NOT increment** - only reads the current iteration
- All components (1, 2, 3, 4) use the SAME iteration number for a pipeline run
- **Only Component 4** increments the iteration after successful pipeline completion

### 3. Core Functionality
- **Function**: `transcribe_audio(audio_file_path)`
  - Read global iteration tracker: `iteration=[N]`
  - Use current iteration as-is (do NOT increment)
  - Load audio file
  - Call OpenAI Whisper API: `gpt-4o-mini-transcribe`
  - Handle API response
  - Format output as JSON
  - Save to `data/components/component1/[N]_1_output.json`
  - Log any errors to `ClaudeInfo/errors_fixes.MD` under Component 1 section

### 4. JSON Output Format
```json
{
  "iteration": 1,
  "component": 1,
  "audio_file": "original_filename.mp3",
  "timestamp": "2026-02-14T10:30:00",
  "transcript": "full text transcription here",
  "metadata": {
    "duration": "120 seconds",
    "model": "gpt-4o-mini-transcribe",
    "language": "en"
  }
}
```

### 5. Error Handling
- File not found errors
- Unsupported audio format
- API rate limiting
- Network errors
- Invalid API key
- **All errors logged to**: `ClaudeInfo/errors_fixes.MD` with component label

### 6. File Structure
```
src/models/component1/
├── __init__.py
├── transcriber.py       # Main transcription logic
├── config.py            # Configuration and API setup
└── utils.py             # Helper functions (iteration tracking, error logging)
```

### 7. Iteration Tracker Integration
```python
# Example utils.py functions
def get_current_iteration():
    """Read global iteration from tracker file"""
    # Read data/components/iteration_tracker.txt
    # Parse: iteration=[N]
    # Return N as integer

def log_error(component_num, error_msg):
    """Log error to ClaudeInfo/errors_fixes.MD"""
    # Append to file under Component [num] section

# NOTE: Component 1 does NOT increment iteration
# Only Component 4 has increment_and_save_iteration()
```

## Testing Plan

### Unit Tests
1. **Test API Connection**
   - Verify API key is valid
   - Test connection to OpenAI API

2. **Test Audio File Loading**
   - Test with valid audio files (.mp3, .wav, .m4a)
   - Test with invalid file formats
   - Test with corrupted files
   - Test with missing files

3. **Test Transcription Function**
   - Mock API calls for consistent testing
   - Verify JSON output format
   - Test error handling for API failures

4. **Test Global Iteration Tracking**
   - Verify iteration read from tracker file (format: `iteration=N`)
   - Test iteration increment
   - Verify tracker file updated correctly (format: `iteration=N+1`)
   - Test output filename includes iteration number: `[N]_1_output.json`

5. **Test File Saving**
   - Verify output directory creation
   - Check JSON file is properly formatted with iteration
   - Verify correct filename: `[iteration]_1_output.json`

6. **Test Error Logging**
   - Verify errors logged to ClaudeInfo/errors_fixes.MD
   - Check Component 1 section is used

### Integration Tests
1. **End-to-End Test**
   - Verify tracker starts at: `iteration=0`
   - Use sample audio file from `data/medical-speech/`
   - Run full transcription pipeline
   - Verify tracker updated to: `iteration=1`
   - Verify output JSON exists: `data/components/component1/1_1_output.json`
   - Validate JSON structure includes iteration field

2. **Multiple File Test**
   - Process multiple audio files sequentially
   - Verify iteration increments globally: `1_1_output.json`, `2_1_output.json`, `3_1_output.json`
   - Verify tracker shows correct iteration after each run

3. **Cross-Component Iteration Test**
   - Verify tracker starts at `iteration=0`
   - Run Component 1 (creates `0_1_output.json`, tracker stays `iteration=0`)
   - Verify iteration does NOT change (Component 1 doesn't increment)
   - Components 2, 3, 4 will all use iteration=0
   - Only after Component 4 completes will tracker update to `iteration=1`

### Performance Tests
1. **Audio Length Test**
   - Test with short audio (< 30 seconds)
   - Test with medium audio (1-5 minutes)
   - Test with long audio (> 10 minutes)

2. **API Rate Limiting**
   - Test behavior when rate limited
   - Verify retry logic
   - Ensure error logged

### Manual Testing Checklist
- [ ] Verify tracker file starts at `iteration=0`
- [ ] Upload a sample patient audio file
- [ ] Verify transcription accuracy
- [ ] Check output JSON format matches specification
- [ ] Verify file saved as `0_1_output.json` in `data/components/component1/`
- [ ] Verify tracker file STILL shows `iteration=0` (unchanged by Component 1)
- [ ] Test with different audio formats
- [ ] Trigger an error and verify it's logged to errors_fixes.MD
- [ ] NOTE: Iteration will only increment when Component 4 completes

## Success Criteria
- Successfully transcribes audio files to text
- Outputs properly formatted JSON with iteration tracking
- Handles errors gracefully and logs them
- Saves to correct directory with correct naming
- Does NOT modify global iteration tracker (Component 1 only reads it)
- Processing time < 2 minutes for 5-minute audio
- Iteration number shared across all components (only Component 4 increments it)
