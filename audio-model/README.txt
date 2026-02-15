================================================================================
AUDIO-MODEL PIPELINE - AI Medical Analysis
================================================================================

This directory contains a complete AI pipeline for processing patient audio
recordings or text transcripts into comprehensive medical evaluations.

--------------------------------------------------------------------------------
QUICK START
--------------------------------------------------------------------------------

1. Install Dependencies
   $ cd audio-model
   $ pip install -r requirements.txt

2. Set Up API Keys
   $ cp .env.example .env
   # Edit .env and add your OpenAI and Anthropic API keys

3. Fine-Tune Model (ONE TIME ONLY, 10-30 minutes)
   $ python -c "from src.models.component2 import fine_tune_model; fine_tune_model()"

4. Run the Pipeline
   Python:
   >>> from pipeline_api import PipelineAPI
   >>> api = PipelineAPI()
   >>> result = api.process_audio(audio_bytes, format='m4a')
   >>> # Or: result = api.process_text("Patient has fever...")
   >>> print(result.status, result.session_id)

   HTTP server (for CareBnB app):
   $ python server.py
   # Listens on http://localhost:5001 (5001 to avoid macOS AirPlay on 5000). Next.js proxies /api/intake/analyze to this URL.

--------------------------------------------------------------------------------
WHAT IT DOES
--------------------------------------------------------------------------------

INPUT:  Audio file (m4a, wav, mp3, etc.) OR text transcript
OUTPUT: ZIP file containing:
        - Summary PDF with patient evaluation
        - 3 research articles (highlighted with relevant passages)

PROCESS:
1. Component 1: Transcribes audio to text (OpenAI Whisper)
2. Component 2: Extracts medical keywords (fine-tuned GPT-4o-mini)
3. Component 3: Finds relevant research from PubMed Central (Claude AI)
4. Component 4: Creates clinical evaluation with highlighted sources (GPT-4o)

--------------------------------------------------------------------------------
WEB INTEGRATION
--------------------------------------------------------------------------------

from flask import Flask, request
from pipeline_api import PipelineAPI

app = Flask(__name__)
api = PipelineAPI()

@app.route('/analyze', methods=['POST'])
def analyze():
    audio_bytes = request.files['audio'].read()
    result = api.process_audio(audio_bytes, format='m4a')

    return {
        'sessionId': result.session_id,
        'keywords': result.keywords,
        'pdfData': result.summary_pdf_data,  # Serve this
        'zipData': result.final_zip_data     # Or this
    }

--------------------------------------------------------------------------------
FILE STRUCTURE
--------------------------------------------------------------------------------

audio-model/
├── pipeline_api.py          - Main API for web integration
├── pipeline_config.py       - Configuration settings
├── requirements.txt         - Python dependencies
├── .env.example            - API key template
├── src/
│   └── models/
│       ├── component1/     - Audio transcription
│       ├── component2/     - Keyword extraction
│       ├── component3/     - Medical research retrieval
│       ├── component4/     - Clinical analysis & PDF generation
│       └── session_manager.py - Session storage
└── data/
    ├── medical-transcriptions/ - Training data for fine-tuning
    ├── sessions/              - Generated sessions (auto-created)
    └── components/            - Legacy outputs (auto-created)

--------------------------------------------------------------------------------
REQUIREMENTS
--------------------------------------------------------------------------------

- Python 3.8+
- OpenAI API key (for Whisper transcription and GPT-4o analysis)
- Anthropic API key (for Claude AI research selection)
- ~17MB for training dataset
- Internet connection (for PubMed access)

--------------------------------------------------------------------------------
OUTPUT FILES
--------------------------------------------------------------------------------

Each session creates a directory: data/sessions/{uuid}/

Session contents:
├── component1/transcript.json           - Transcription
├── component2/keywords.json             - Extracted keywords
├── component3/
│   ├── source_1.pdf                     - Research article 1
│   ├── source_2.pdf                     - Research article 2
│   └── source_3.pdf                     - Research article 3
└── component4/
    ├── summary.pdf                      - Main clinical evaluation
    ├── source_1_highlighted.pdf         - Highlighted article 1
    ├── source_2_highlighted.pdf         - Highlighted article 2
    ├── source_3_highlighted.pdf         - Highlighted article 3
    └── final.zip                        - Complete package

--------------------------------------------------------------------------------
CONFIGURATION
--------------------------------------------------------------------------------

Edit pipeline_config.py to customize:
- SESSION_RETENTION_DAYS = 7      # Auto-cleanup old sessions
- MAX_AUDIO_SIZE_MB = 100         # Maximum audio file size
- MAX_TEXT_LENGTH = 50000         # Maximum text input length

--------------------------------------------------------------------------------
NOTES
--------------------------------------------------------------------------------

- Sessions are auto-cleaned after 7 days
- All intermediate files are preserved for debugging
- Concurrent processing is supported (session-based isolation)
- No global state - each session is independent

================================================================================
