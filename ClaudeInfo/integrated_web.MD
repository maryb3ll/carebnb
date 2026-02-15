# Web Integration: Plug-and-Play Pipeline API

## Overview

Make the AI pipeline easy to use from any web backend without tight coupling. The pipeline should accept data (audio bytes or text) programmatically and return PDF outputs, while maintaining the existing folder structure for debugging and persistence.

## Goals

1. ✅ **Easy Input**: Accept audio bytes or text strings (not just file paths)
2. ✅ **Easy Output**: Return PDF data that web frameworks can serve directly
3. ✅ **Session-Based**: Use UUIDs instead of global iteration counter
4. ✅ **Concurrent Safe**: Multiple users can run pipeline simultaneously
5. ✅ **Folder Structure**: Keep existing data/components folders working
6. ✅ **Backward Compatible**: Existing CLI still works

## What We'll Create

### 1. **Pipeline API Wrapper** (`pipeline_api.py`)

A high-level Python API that web backends can import and call:

```python
from pipeline_api import PipelineAPI

# Initialize
api = PipelineAPI()

# Option 1: Audio bytes
result = api.process_audio(
    audio_data=audio_bytes,
    format='m4a',  # or 'wav', 'mp3'
    session_id='optional-uuid'  # Auto-generated if not provided
)

# Option 2: Text string
result = api.process_text(
    text="Patient has fever and swollen lymph nodes...",
    session_id='optional-uuid'
)

# Result object
print(result.session_id)          # UUID of this processing session
print(result.status)              # 'completed' or 'failed'
print(result.summary_pdf_path)    # Path to summary PDF
print(result.summary_pdf_data)    # PDF as bytes (for serving)
print(result.final_zip_path)      # Path to final ZIP
print(result.final_zip_data)      # ZIP as bytes
print(result.keywords)            # List of keywords
print(result.description)         # Text description
print(result.error)               # Error message if failed
```

### 2. **Session Management**

Replace global iteration counter with session-based storage:

**Current Structure:**
```
data/components/
  ├── component1/0_1_output.json
  ├── component2/0_2_output.json
  ├── component3/0_3_1.pdf
  └── component4/0_4_output.pdf
```

**New Structure (both exist simultaneously):**
```
data/
  ├── components/          # Legacy iteration-based (for CLI)
  │   ├── component1/
  │   ├── component2/
  │   ├── component3/
  │   └── component4/
  └── sessions/            # New session-based (for web API)
      └── abc-123-def-456/ # UUID session ID
          ├── input/
          │   └── audio.m4a or transcript.txt
          ├── component1/
          │   └── transcript.json
          ├── component2/
          │   └── keywords.json
          ├── component3/
          │   ├── source_1.pdf
          │   ├── source_2.pdf
          │   └── source_3.pdf
          └── component4/
              ├── summary.pdf
              ├── source_1_highlighted.pdf
              ├── source_2_highlighted.pdf
              ├── source_3_highlighted.pdf
              └── final.zip
```

### 3. **Updated Component Interface**

Each component will accept either `iteration` (legacy) or `session_id` (new):

```python
# Component 1
def transcribe_audio(
    audio_path: Path = None,
    audio_data: bytes = None,
    format: str = 'm4a',
    iteration: int = None,      # Legacy mode
    session_id: str = None      # New mode
) -> Dict

# Component 2
def extract_keywords(
    iteration: int = None,      # Legacy mode
    session_id: str = None      # New mode
) -> Dict

# Similar for Components 3 & 4
```

### 4. **Result Object**

Clean result object that's easy to work with:

```python
class PipelineResult:
    # Session info
    session_id: str
    status: str  # 'completed' | 'failed'
    error: Optional[str]

    # Paths (for direct file access)
    summary_pdf_path: Path
    final_zip_path: Path
    highlighted_sources_paths: List[Path]

    # Data (for serving via web)
    summary_pdf_data: bytes
    final_zip_data: bytes

    # Extracted information
    keywords: List[str]
    description: str
    transcript: str

    # Timing
    started_at: datetime
    completed_at: datetime
    duration_seconds: float

    # Component outputs (for debugging)
    component1_output: Dict
    component2_output: Dict
    component3_output: Dict
    component4_output: Dict
```

## Implementation Plan

### File 1: `pipeline_api.py` (Main API Wrapper)

**Location:** `/home/kitte/CareBnB/pipeline_api.py`

**Features:**
- `PipelineAPI` class with `process_audio()` and `process_text()` methods
- Session ID generation and management
- Input validation (file size, format)
- Error handling with detailed messages
- Returns `PipelineResult` object

**Example Usage:**
```python
# From Flask/FastAPI/Django
from pipeline_api import PipelineAPI

@app.route('/analyze', methods=['POST'])
def analyze():
    file = request.files['audio']
    audio_bytes = file.read()

    api = PipelineAPI()
    result = api.process_audio(audio_bytes, format='m4a')

    if result.status == 'completed':
        return {
            'sessionId': result.session_id,
            'summaryPdf': base64.b64encode(result.summary_pdf_data),
            'keywords': result.keywords
        }
    else:
        return {'error': result.error}, 500
```

### File 2: `session_manager.py` (Session Utilities)

**Location:** `/home/kitte/CareBnB/src/models/session_manager.py`

**Features:**
- Create session directories
- Clean up old sessions
- Get session paths
- List active sessions
- Session metadata storage

**Functions:**
```python
def create_session(session_id: str = None) -> str:
    """Create new session directory, return session_id"""

def get_session_path(session_id: str, component: int = None) -> Path:
    """Get path for session's component output"""

def cleanup_session(session_id: str):
    """Delete all session files"""

def cleanup_old_sessions(days: int = 7):
    """Delete sessions older than N days"""

def get_session_metadata(session_id: str) -> Dict:
    """Get session info (status, created_at, etc.)"""
```

### File 3: Updated Components (Backward Compatible)

**Modify these files:**
- `src/models/component1/transcriber.py`
- `src/models/component2/extractor.py`
- `src/models/component3/agent.py`
- `src/models/component4/cot_agent.py`

**Changes:**
- Add optional `session_id` parameter
- If `session_id` provided, use session-based paths
- If `iteration` provided, use legacy paths (existing behavior)
- No breaking changes to existing code

**Example:**
```python
# component1/transcriber.py
def transcribe_audio(
    audio_path: Path = None,
    audio_data: bytes = None,
    format: str = 'm4a',
    iteration: int = None,
    session_id: str = None
) -> Dict:
    # Determine mode
    if session_id:
        # New mode: session-based
        from src.models.session_manager import get_session_path
        output_path = get_session_path(session_id, component=1) / "transcript.json"

        # If audio_data provided, save to session input
        if audio_data:
            input_path = get_session_path(session_id) / "input" / f"audio.{format}"
            input_path.parent.mkdir(exist_ok=True)
            with open(input_path, 'wb') as f:
                f.write(audio_data)
            audio_path = input_path

    else:
        # Legacy mode: iteration-based (existing code)
        if iteration is None:
            iteration = get_current_iteration()
        output_path = config.OUTPUT_DIR / f"{iteration}_1_output.json"

    # Rest of existing code...
```

### File 4: `examples/web_api_example.py` (Usage Examples)

**Location:** `/home/kitte/CareBnB/examples/web_api_example.py`

**Contents:**
- Flask example
- FastAPI example
- Simple function call example
- Error handling examples

### File 5: Updated `run_pipeline.py` (CLI Backward Compatibility)

**Keep existing CLI working while adding API mode:**

```python
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('input_file', nargs='?')  # Optional now
    parser.add_argument('--mode', choices=['cli', 'api'], default='cli')
    parser.add_argument('--session-id')

    args = parser.parse_args()

    if args.mode == 'cli':
        # Existing behavior (iteration-based)
        run_pipeline_cli(args.input_file)
    else:
        # New API mode (session-based)
        from pipeline_api import PipelineAPI
        api = PipelineAPI()
        # ...
```

## Folder Structure After Changes

```
CareBnB/
├── pipeline_api.py              # NEW: Main API wrapper
├── run_pipeline.py              # UPDATED: Now supports both CLI and API modes
├── examples/
│   └── web_api_example.py       # NEW: Usage examples
├── src/models/
│   ├── session_manager.py       # NEW: Session utilities
│   ├── component1/
│   │   └── transcriber.py       # UPDATED: Accepts session_id or iteration
│   ├── component2/
│   │   └── extractor.py         # UPDATED: Accepts session_id or iteration
│   ├── component3/
│   │   └── agent.py             # UPDATED: Accepts session_id or iteration
│   └── component4/
│       └── cot_agent.py         # UPDATED: Accepts session_id or iteration
└── data/
    ├── components/              # EXISTING: Legacy iteration-based
    │   ├── component1/
    │   ├── component2/
    │   ├── component3/
    │   └── component4/
    └── sessions/                # NEW: Session-based storage
        └── {session-id}/
            ├── input/
            ├── component1/
            ├── component2/
            ├── component3/
            └── component4/
```

## API Usage Examples

### Example 1: Flask Integration

```python
from flask import Flask, request, send_file
from pipeline_api import PipelineAPI
import io

app = Flask(__name__)
api = PipelineAPI()

@app.route('/analyze', methods=['POST'])
def analyze():
    # Get audio file
    file = request.files['audio']
    audio_bytes = file.read()

    # Process
    result = api.process_audio(audio_bytes, format='m4a')

    if result.status == 'completed':
        return {
            'sessionId': result.session_id,
            'keywords': result.keywords,
            'description': result.description,
            'summaryUrl': f'/download/{result.session_id}/summary',
            'zipUrl': f'/download/{result.session_id}/zip'
        }
    else:
        return {'error': result.error}, 500

@app.route('/download/<session_id>/<file_type>')
def download(session_id, file_type):
    api = PipelineAPI()
    result = api.get_result(session_id)

    if file_type == 'summary':
        return send_file(
            io.BytesIO(result.summary_pdf_data),
            mimetype='application/pdf',
            as_attachment=True,
            download_name='summary.pdf'
        )
    elif file_type == 'zip':
        return send_file(
            io.BytesIO(result.final_zip_data),
            mimetype='application/zip',
            as_attachment=True,
            download_name='analysis.zip'
        )
```

### Example 2: FastAPI Integration

```python
from fastapi import FastAPI, UploadFile, File
from pipeline_api import PipelineAPI
from fastapi.responses import StreamingResponse
import io

app = FastAPI()
api = PipelineAPI()

@app.post('/analyze')
async def analyze(file: UploadFile = File(...)):
    audio_bytes = await file.read()

    result = api.process_audio(audio_bytes, format='m4a')

    return {
        'sessionId': result.session_id,
        'status': result.status,
        'keywords': result.keywords,
        'description': result.description
    }

@app.get('/download/{session_id}/summary')
async def download_summary(session_id: str):
    api = PipelineAPI()
    result = api.get_result(session_id)

    return StreamingResponse(
        io.BytesIO(result.summary_pdf_data),
        media_type='application/pdf',
        headers={'Content-Disposition': 'attachment; filename=summary.pdf'}
    )
```

### Example 3: Direct Function Call

```python
from pipeline_api import PipelineAPI

# Initialize API
api = PipelineAPI()

# Process audio file
with open('patient_recording.m4a', 'rb') as f:
    audio_data = f.read()

result = api.process_audio(audio_data, format='m4a')

# Check result
if result.status == 'completed':
    print(f"Session: {result.session_id}")
    print(f"Keywords: {result.keywords}")
    print(f"Description: {result.description}")

    # Save PDF somewhere
    with open('output_summary.pdf', 'wb') as f:
        f.write(result.summary_pdf_data)

    # Or get the path
    print(f"PDF saved at: {result.summary_pdf_path}")
else:
    print(f"Error: {result.error}")
```

### Example 4: Text Input

```python
from pipeline_api import PipelineAPI

api = PipelineAPI()

# Process text directly
result = api.process_text(
    text="Patient has had high fever for 5 days, swollen lymph nodes, joint pain."
)

if result.status == 'completed':
    # Get results
    summary_pdf = result.summary_pdf_data
    keywords = result.keywords

    # Use in your application
    save_to_database(result.session_id, keywords, summary_pdf)
```

## Configuration

### File 6: `pipeline_config.py` (NEW)

**Location:** `/home/kitte/CareBnB/pipeline_config.py`

**Settings:**
```python
class PipelineConfig:
    # Paths
    PROJECT_ROOT = Path(__file__).parent
    DATA_DIR = PROJECT_ROOT / 'data'
    SESSIONS_DIR = DATA_DIR / 'sessions'
    COMPONENTS_DIR = DATA_DIR / 'components'  # Legacy

    # Session settings
    SESSION_RETENTION_DAYS = 7  # Auto-cleanup after 7 days
    MAX_AUDIO_SIZE_MB = 50      # Reject files larger than 50MB
    MAX_TEXT_LENGTH = 10000     # Reject text longer than 10k chars

    # Supported formats
    AUDIO_FORMATS = ['m4a', 'wav', 'mp3', 'flac', 'aac']
    TEXT_FORMATS = ['txt']

    # Mode
    USE_SESSIONS = True  # If False, use legacy iteration mode
```

## Testing

### File 7: `tests/test_pipeline_api.py`

**Location:** `/home/kitte/CareBnB/tests/test_pipeline_api.py`

**Tests:**
```python
def test_process_audio():
    api = PipelineAPI()
    with open('test_audio.m4a', 'rb') as f:
        result = api.process_audio(f.read(), format='m4a')

    assert result.status == 'completed'
    assert result.session_id is not None
    assert len(result.keywords) > 0
    assert result.summary_pdf_data is not None

def test_process_text():
    api = PipelineAPI()
    result = api.process_text("Patient has fever")

    assert result.status == 'completed'
    assert result.description is not None

def test_concurrent_sessions():
    api = PipelineAPI()

    # Run 3 analyses simultaneously
    results = []
    for i in range(3):
        result = api.process_text(f"Patient {i} has symptoms")
        results.append(result)

    # Each should have unique session_id
    session_ids = [r.session_id for r in results]
    assert len(set(session_ids)) == 3
```

## Migration Path

### For Existing CLI Users:
1. No changes needed - `run_pipeline.py` still works the same way
2. Files still saved to `data/components/` with iteration numbers
3. Iteration tracker still increments

### For New Web Users:
1. Import `pipeline_api` module
2. Call `process_audio()` or `process_text()`
3. Get `PipelineResult` object with all data
4. Files saved to `data/sessions/{uuid}/`

### Both Can Coexist:
- CLI mode uses iteration-based storage
- API mode uses session-based storage
- No conflicts between the two

## Benefits

✅ **Easy to integrate** - Single import, two functions
✅ **Framework agnostic** - Works with Flask, FastAPI, Django, etc.
✅ **Backward compatible** - Existing CLI still works
✅ **Concurrent safe** - Multiple sessions don't conflict
✅ **Debugging friendly** - All intermediate files preserved
✅ **Clean API** - Returns structured result objects
✅ **File + Data** - Get both file paths and bytes
✅ **Session management** - Built-in cleanup and metadata

## Next Steps

Once you approve this plan, I will:

1. Create `pipeline_api.py` with PipelineAPI class
2. Create `session_manager.py` with session utilities
3. Update Component 1-4 to accept session_id parameter
4. Create `examples/web_api_example.py` with usage examples
5. Create `pipeline_config.py` with configuration
6. Update `run_pipeline.py` to support both modes
7. Test both CLI and API modes work correctly
8. Verify concurrent sessions work without conflicts

This gives you a clean, plug-and-play API that any web backend can use while keeping all existing functionality intact!
