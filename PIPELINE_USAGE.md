# Pipeline Runner Usage Guide

## Overview

The `run_pipeline.py` script runs the complete CareBnB Medical AI pipeline on an input file. It automatically detects the input type and runs the appropriate components.

## Quick Start

```bash
# Run on audio file (Components 1-4)
python run_pipeline.py data/testing/test_recording.m4a

# Run on text file (Components 2-4, skips transcription)
python run_pipeline.py data/testing/patient_transcript.txt
```

## Input Types

### Audio Files (Full Pipeline: Components 1→2→3→4)

**Supported formats:**
- `.m4a` - MPEG-4 Audio
- `.mp3` - MP3 Audio
- `.wav` - Wave Audio
- `.flac` - FLAC Audio
- `.aac` - AAC Audio
- `.ogg` - Ogg Vorbis
- `.wma` - Windows Media Audio
- `.aiff` - AIFF Audio

**Pipeline Flow:**
1. **Component 1**: Transcribe audio to text using Whisper
2. **Component 2**: Extract medical keywords
3. **Component 3**: Search medical literature
4. **Component 4**: Generate final summary with highlights

### Text Files (Partial Pipeline: Components 2→3→4)

**Supported formats:**
- `.txt` - Plain text transcript

**Pipeline Flow:**
1. ~~Component 1~~ (Skipped - text already provided)
2. **Component 2**: Extract medical keywords
3. **Component 3**: Search medical literature
4. **Component 4**: Generate final summary with highlights

## Usage Examples

### Example 1: Audio Recording
```bash
python run_pipeline.py patient_interview.m4a
```

**Output:**
```
======================================================================
CareBnB Medical AI Pipeline
======================================================================
Input file: patient_interview.m4a
File type: .m4a

Current iteration: 5

✓ Detected: Audio file
Pipeline: Components 1 → 2 → 3 → 4

======================================================================
COMPONENT 1: Audio Transcription
======================================================================
✓ Transcription complete

... [Components 2-4 run]

======================================================================
PIPELINE COMPLETE
======================================================================
Final ZIP: /path/to/output/5_final.zip
Summary PDF: /path/to/output/5_4_output.pdf
Next iteration: 6
```

### Example 2: Text Transcript
```bash
python run_pipeline.py patient_notes.txt
```

**Output:**
```
======================================================================
CareBnB Medical AI Pipeline
======================================================================
Input file: patient_notes.txt
File type: .txt

Current iteration: 5

✓ Detected: Text file
Pipeline: Components 2 → 3 → 4 (skipping Component 1)

Reading transcript from patient_notes.txt...
✓ Loaded transcript (523 characters)

Creating transcript output file...
✓ Created: data/components/component1/5_1_output.json

... [Components 2-4 run]

======================================================================
PIPELINE COMPLETE
======================================================================
Final ZIP: /path/to/output/5_final.zip
Summary PDF: /path/to/output/5_4_output.pdf
Next iteration: 6
```

## Output Files

The pipeline generates files in the following locations:

### Component Outputs
- `data/components/component1/{iteration}_1_output.json` - Transcript
- `data/components/component2/{iteration}_2_output.json` - Keywords
- `data/components/component3/{iteration}_3_1.pdf` - Source PDF 1
- `data/components/component3/{iteration}_3_2.pdf` - Source PDF 2
- `data/components/component3/{iteration}_3_3.pdf` - Source PDF 3
- `data/components/component4/{iteration}_4_output.pdf` - Summary PDF
- `data/components/component4/{iteration}_4_source_*.pdf` - Highlighted sources

### Final Output
- `output/{iteration}_final.zip` - **Main deliverable** containing:
  - Summary PDF (patient evaluation)
  - 3 highlighted source PDFs

## Text File Format

When using a text file as input, it should contain the patient's symptoms/complaint as spoken text:

**Example `patient_transcript.txt`:**
```
I've been having severe headaches for the past week. They usually start in the
morning and get worse throughout the day. I also feel nauseous and have sensitivity
to light. The pain is mostly on the right side of my head. I've tried taking ibuprofen
but it doesn't seem to help much.
```

**Note:** The text should be written as if it's a transcription of the patient speaking, not clinical notes.

## Error Handling

### File Not Found
```bash
$ python run_pipeline.py nonexistent.m4a
✗ Error: File not found: nonexistent.m4a
```

### Unsupported File Type
```bash
$ python run_pipeline.py document.pdf
✗ Error: Unsupported file type '.pdf'

Supported formats:
  Audio: .aac, .aiff, .flac, .m4a, .m4p, .mp3, .ogg, .wav, .wma
  Text:  .txt
```

### Pipeline Interruption
Press `Ctrl+C` to stop the pipeline:
```
^C
✗ Pipeline interrupted by user
```

## Integration with Existing Components

The pipeline runner uses the same component functions that can be run individually:

```python
# Individual component usage (still works)
from src.models.component1 import transcribe_audio
from src.models.component2 import extract_keywords
from src.models.component3 import run_medical_rag
from src.models.component4 import run_cot_summarizer

# Or use the pipeline runner
# python run_pipeline.py input_file
```

## Iteration Management

The pipeline automatically:
1. Reads the current iteration number
2. Creates output files with the current iteration prefix
3. Increments the iteration after Component 4 completes

**Iteration tracking file:** `data/components/iteration_tracker.txt`

```
iteration=4
```

This ensures each pipeline run creates unique output files without overwriting previous results.
